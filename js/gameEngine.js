import {
  CONFIG,
  getTavernUpgradeCost,
  getAvailableRarities,
  getTavernRarityWeights,
  getTeamSlotsForTavern,
  getInterest,
  getStreakBonus,
  getTurnBaseGold,
  getStageDamage,
} from './config.js';
import { CARD_TEMPLATES, createCard, recalculateCardStats } from './cards.js';
import { BattleEngine } from './battleEngine.js';
import { runAIDecisions } from './ai.js';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createEmptyTeam(playerId, maxSize = getTeamSlotsForTavern(CONFIG.INITIAL_TAVERN_TIER)) {
  return { playerId, maxSize, cards: Array(7).fill(null) };
}

function createPlayer(id, name, isHuman = false) {
  return {
    id,
    name,
    isHuman,
    isAI: false,
    hp: CONFIG.BASE_HP,
    maxHp: CONFIG.BASE_HP,
    gold: 0,
    tavernTier: CONFIG.INITIAL_TAVERN_TIER,
    team: createEmptyTeam(id),
    bench: [],
    shop: { cards: [], frozen: false, refreshCost: CONFIG.REFRESH_COST },
    winStreak: 0,
    lossStreak: 0,
    recentOpponents: [],
    lastFoughtMirror: false,
    lastRoundTeam: null,
    lastIncome: null,
    eliminated: false,
    rank: 0,
  };
}

export class GameEngine {
  constructor(onStateChange, onBattleEvent) {
    this.onStateChange = onStateChange;
    this.onBattleEvent = onBattleEvent;
    this.phase = 'INIT';
    this.turn = 0;
    this.players = [];
    this.humanId = 'player_0';
    this.poolRemaining = {};
    this.matchPairs = [];
    this.battleResults = [];
    this.currentBattle = null;
    this.lastHumanResult = null;
    this.opponentPreview = null;
    this.skipBattleAnim = false;
    this.gameModeId = 'ranked';
    this.isRanked = false;
    this.gameOptions = {};
    this.onGameEnd = null;
    this.prepareTimeLeft = 0;
    this.prepareTimeTotal = 0;
    this.prepareTimedOut = false;
    this._prepareTimer = null;
    this._endingPrepare = false;
    this.initPool();
  }

  getPrepareTimeSeconds() {
    const t = this.gameOptions?.prepareTime;
    if (typeof t === 'number' && t > 0) return t;
    return CONFIG.PREPARE_TIME;
  }

  clearPrepareTimer() {
    if (this._prepareTimer) {
      clearInterval(this._prepareTimer);
      this._prepareTimer = null;
    }
  }

  startPrepareTimer() {
    this.clearPrepareTimer();
    this._endingPrepare = false;
    this.prepareTimedOut = false;
    this.prepareTimeTotal = this.getPrepareTimeSeconds();
    this.prepareTimeLeft = this.prepareTimeTotal;

    this._prepareTimer = setInterval(() => {
      if (this.phase !== 'PREPARE') {
        this.clearPrepareTimer();
        return;
      }
      this.prepareTimeLeft = Math.max(0, this.prepareTimeLeft - 1);
      this.notify();
      if (this.prepareTimeLeft <= 0) {
        this.clearPrepareTimer();
        this.endPreparePhase(true);
      }
    }, 1000);
  }

  initPool() {
    this.poolRemaining = {};
    for (const tpl of CARD_TEMPLATES) {
      this.poolRemaining[tpl.id] = CONFIG.CARD_POOL_LIMITS[tpl.rarity];
    }
  }

  startGame(playerConfigs, options = {}) {
    this.gameModeId = options.modeId || 'ranked';
    this.isRanked = options.isRanked === true;
    this.gameOptions = options;
    const configs = playerConfigs || [];
    this.players = configs.map((cfg, i) => {
      const p = createPlayer(cfg.id || `player_${i}`, cfg.name, cfg.isHuman === true);
      p.isAI = cfg.isAI === true;
      p.aiDifficulty = cfg.aiDifficulty || options.aiDifficulty || 'normal';
      return p;
    });
    if (this.players.length === 0) {
      this.players = [
        createPlayer('player_0', '你', true),
        ...['AI·赤焰', 'AI·苍蓝', 'AI·翠风', 'AI·紫电', 'AI·金光', 'AI·暗影', 'AI·虚空'].map((n, i) => {
          const p = createPlayer(`player_${i + 1}`, n, false);
          p.isAI = true;
          return p;
        }),
      ];
    }
    const human = this.players.find(p => p.isHuman);
    if (human) this.humanId = human.id;

    this.turn = 1;
    this.phase = 'PREPARE';
    this.initPool();
    for (const p of this.players) this.syncTeamSlots(p);
    this.beginPreparePhase();
    this.notify();
  }

  getHuman() {
    return this.players.find(p => p.id === this.humanId);
  }

  getAlivePlayers() {
    return this.players.filter(p => !p.eliminated && p.hp > 0);
  }

  notify() {
    this.onStateChange?.(this.getState());
  }

  getState() {
    return {
      phase: this.phase,
      turn: this.turn,
      players: this.players,
      human: this.getHuman(),
      aliveCount: this.getAlivePlayers().length,
      opponentPreview: this.opponentPreview,
      lastHumanResult: this.lastHumanResult,
      matchPairs: this.matchPairs,
      prepareTimeLeft: this.prepareTimeLeft,
      prepareTimeTotal: this.prepareTimeTotal,
      prepareTimedOut: this.prepareTimedOut,
    };
  }

  /** 计算本回合金币收入（利息基于上回合结束时持有金币，发放后金币重置为收入总额） */
  calculateGoldIncome(player) {
    const base = getTurnBaseGold(this.turn);
    let streakBonus = 0;
    let streakLabel = '';
    if (player.winStreak >= 2) {
      streakBonus = getStreakBonus(player.winStreak);
      streakLabel = '连胜';
    } else if (player.lossStreak >= 2) {
      streakBonus = getStreakBonus(player.lossStreak);
      streakLabel = '连败';
    }

    const goldBeforeIncome = player.gold;
    const interest = getInterest(goldBeforeIncome);

    let skillGold = 0;
    for (const card of player.team.cards) {
      if (!card) continue;
      for (const skill of card.skills) {
        if (skill.trigger === 'PREPARE_PHASE') {
          for (const eff of skill.effects) {
            if (eff.type === 'GAIN_GOLD') skillGold += eff.amount;
          }
        }
      }
    }

    const total = base + streakBonus + interest + skillGold;
    return { base, streakBonus, streakLabel, interest, skillGold, total, goldBeforeIncome };
  }

  rollRarity(tavernTier) {
    const weights = getTavernRarityWeights(tavernTier);
    const available = Object.keys(weights);
    const vals = available.map(r => weights[r]);
    const total = vals.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < available.length; i++) {
      roll -= vals[i];
      if (roll <= 0) return available[i];
    }
    return 'common';
  }

  refreshShop(player) {
    if (player.shop.frozen && player.shop.cards.length > 0) {
      return;
    }
    player.shop.cards = [];

    for (let i = 0; i < CONFIG.SHOP_SIZE; i++) {
      const rarity = this.rollRarity(player.tavernTier);
      let candidates = CARD_TEMPLATES.filter(t => t.rarity === rarity && (this.poolRemaining[t.id] || 0) > 0);
      if (!candidates.length) {
        candidates = CARD_TEMPLATES.filter(t => t.rarity === 'common' && (this.poolRemaining[t.id] || 0) > 0);
      }
      if (!candidates.length) continue;

      const tpl = candidates[Math.floor(Math.random() * candidates.length)];
      player.shop.cards.push({
        shopIndex: i,
        cardTemplateId: tpl.id,
        name: tpl.name,
        rarity: tpl.rarity,
        element: tpl.element,
        cardClass: tpl.class,
        cost: CONFIG.BUY_COST,
        star: 1,
      });
    }
    if (!player.shop.frozen) player.shop.frozen = false;
  }

  beginPreparePhase() {
    this.phase = 'PREPARE';
    for (const player of this.getAlivePlayers()) {
      const income = this.calculateGoldIncome(player);
      player.lastIncome = income;
      // 每回合重置金币：未花费的不保留，仅发放本回合收入（利息按清零前持有量结算）
      player.gold = income.total;

      if (!player.shop.frozen || !player.shop.cards.length) {
        this.refreshShop(player);
      }
    }
    for (const player of this.players) {
      if (player.isHuman) continue;
      if (!player.eliminated) {
        runAIDecisions(player, this);
      }
    }
    this.startPrepareTimer();
    this.notify();
  }

  buyCard(player, shopIndex) {
    const shopCard = player.shop.cards[shopIndex];
    if (!shopCard || player.gold < shopCard.cost) return false;

    const emptyPos = this.findEmptyTeamSlot(player);
    if (emptyPos === -1) return false;

    player.gold -= shopCard.cost;
    const card = createCard(shopCard.cardTemplateId, 1, player.id, emptyPos);
    player.team.cards[emptyPos] = card;
    this.poolRemaining[shopCard.cardTemplateId]--;
    player.shop.cards.splice(shopIndex, 1);
    this.checkStarMerge(player);
    this.notify();
    return true;
  }

  findEmptyTeamSlot(player) {
    for (let i = 0; i < player.team.maxSize; i++) {
      if (!player.team.cards[i]) return i;
    }
    return -1;
  }

  sellCard(player, position) {
    const card = player.team.cards[position];
    if (!card) return false;
    player.gold += card.star ?? card.upgradeTier;
    player.team.cards[position] = null;
    this.poolRemaining[card.templateId]++;
    this.notify();
    return true;
  }

  refreshShopManual(player) {
    if (player.gold < CONFIG.REFRESH_COST) return false;
    player.gold -= CONFIG.REFRESH_COST;
    player.shop.frozen = false;
    this.refreshShop(player);
    this.notify();
    return true;
  }

  toggleFreeze(player) {
    player.shop.frozen = !player.shop.frozen;
    this.notify();
  }

  syncTeamSlots(player) {
    const slots = getTeamSlotsForTavern(player.tavernTier);
    player.team.maxSize = Math.min(CONFIG.MAX_TEAM_SIZE, slots);
  }

  upgradeTavern(player) {
    const cost = getTavernUpgradeCost(player.tavernTier);
    if (player.gold < cost || player.tavernTier >= CONFIG.MAX_TAVERN_TIER) return false;
    player.gold -= cost;
    player.tavernTier++;
    this.syncTeamSlots(player);
    if (!player.shop.frozen) this.refreshShop(player);
    this.notify();
    return true;
  }

  moveCard(player, fromPos, toPos) {
    if (fromPos === toPos) return false;
    if (toPos >= player.team.maxSize) return false;
    const from = player.team.cards[fromPos];
    const to = player.team.cards[toPos];
    if (!from) return false;
    player.team.cards[fromPos] = to;
    player.team.cards[toPos] = from;
    if (from) from.position = toPos;
    if (to) to.position = fromPos;
    this.notify();
    return true;
  }

  /** 3张同名同星自动合成下一星（最高3星） */
  checkStarMerge(player) {
    let merged = true;
    while (merged) {
      merged = false;
      const groups = {};
      for (let i = 0; i < player.team.maxSize; i++) {
        const c = player.team.cards[i];
        if (!c) continue;
        const star = c.star ?? c.upgradeTier ?? 1;
        const key = `${c.templateId}_${star}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push({ card: c, pos: i, star });
      }

      for (const [, cards] of Object.entries(groups)) {
        if (cards.length < 3 || cards[0].star >= 3) continue;
        const toMerge = cards.slice(0, 3);
        const pos = toMerge[0].pos;
        const templateId = toMerge[0].card.templateId;
        const newStar = toMerge[0].star + 1;

        for (const { pos: p } of toMerge) {
          player.team.cards[p] = null;
        }
        // 合成消耗2张副本，剩余2张回到公共卡池
        this.poolRemaining[templateId] = (this.poolRemaining[templateId] || 0) + 2;

        const newCard = createCard(templateId, newStar, player.id, pos);
        player.team.cards[pos] = newCard;
        merged = true;
        break;
      }
    }
  }

  matchPlayers() {
    const alive = [...this.getAlivePlayers()];
    const pairs = [];
    const used = new Set();

    if (alive.length % 2 === 1) {
      const candidates = alive.filter(p => !p.lastFoughtMirror);
      const mirrorPlayer = candidates.length
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : alive[Math.floor(Math.random() * alive.length)];
      const source = alive[Math.floor(Math.random() * alive.length)];
      const mirror = {
        ...createPlayer('mirror_' + source.id, source.name + '的镜像'),
        team: deepClone(source.lastRoundTeam || source.team),
        hp: 999,
        isMirror: true,
      };
      pairs.push({ playerA: mirrorPlayer, playerB: mirror, isMirror: true, mirrorSource: source });
      used.add(mirrorPlayer.id);
      mirrorPlayer.lastFoughtMirror = true;
      alive.forEach(p => { if (p.id !== mirrorPlayer.id) p.lastFoughtMirror = false; });
    }

    const remaining = alive.filter(p => !used.has(p.id));

    while (remaining.length >= 2) {
      const playerA = remaining.shift();
      let bestIdx = 0;
      let bestScore = -Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const playerB = remaining[i];
        const recentlyFought = playerA.recentOpponents.includes(playerB.id);
        const score = recentlyFought ? -1 : 1;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      const playerB = remaining.splice(bestIdx, 1)[0];
      pairs.push({ playerA, playerB, isMirror: false });
      playerA.recentOpponents.push(playerB.id);
      playerB.recentOpponents.push(playerA.id);
      playerA.recentOpponents = playerA.recentOpponents.slice(-3);
      playerB.recentOpponents = playerB.recentOpponents.slice(-3);
    }

    this.matchPairs = pairs;
    const humanPair = pairs.find(p => p.playerA.isHuman || p.playerB.isHuman);
    if (humanPair) {
      const opp = humanPair.playerA.isHuman ? humanPair.playerB : humanPair.playerA;
      this.opponentPreview = opp;
    }
    return pairs;
  }

  settleBattlePair(pair, result) {
    if (!result) return;

    if (pair.isMirror) {
      const realPlayer = pair.playerA;
      if (result.type === 'DRAW') {
        realPlayer.hp -= getStageDamage(this.turn);
        realPlayer.winStreak = 0;
        realPlayer.lossStreak = 0;
      } else if (result.winner?.id === realPlayer.id) {
        realPlayer.winStreak = Math.min(realPlayer.winStreak + 1, 10);
        realPlayer.lossStreak = 0;
      } else {
        realPlayer.hp -= result.damage;
        realPlayer.winStreak = 0;
        realPlayer.lossStreak = Math.min(realPlayer.lossStreak + 1, 10);
      }
      return;
    }

    if (result.type === 'DRAW') {
      const dmg = getStageDamage(this.turn);
      pair.playerA.hp -= dmg;
      pair.playerB.hp -= dmg;
      pair.playerA.winStreak = 0;
      pair.playerA.lossStreak = 0;
      pair.playerB.winStreak = 0;
      pair.playerB.lossStreak = 0;
    } else if (result.loser) {
      result.loser.hp -= result.damage;
      if (result.winner) {
        result.winner.winStreak = Math.min(result.winner.winStreak + 1, 10);
        result.winner.lossStreak = 0;
      }
      result.loser.winStreak = 0;
      result.loser.lossStreak = Math.min(result.loser.lossStreak + 1, 10);
    }
  }

  async endPreparePhase(fromTimer = false) {
    if (this.phase !== 'PREPARE' || this._endingPrepare) return;
    this._endingPrepare = true;
    this.clearPrepareTimer();
    if (fromTimer) this.prepareTimedOut = true;

    this.phase = 'MATCH';
    this.notify();

    for (const p of this.getAlivePlayers()) {
      p.lastRoundTeam = deepClone(p.team);
    }

    await this.delay(800);
    this.matchPlayers();
    this.notify();

    await this.delay(800);
    await this.runBattles();
  }

  async runBattles() {
    this.phase = 'BATTLE';
    this.battleResults = [];
    this.notify();

    for (const pair of this.matchPairs) {
      const isHumanBattle = pair.playerA.id === this.humanId || pair.playerB.id === this.humanId;
      const engine = new BattleEngine(pair.playerA, pair.playerB, (evt) => {
        if (isHumanBattle) this.onBattleEvent?.(evt, engine);
      });

      if (isHumanBattle) this.currentBattle = engine;
      const delay = isHumanBattle && !this.skipBattleAnim ? CONFIG.TURN_INTERVAL : 0;
      const result = await engine.runBattle(delay);
      this.battleResults.push({ pair, result });

      if (isHumanBattle) {
        this.lastHumanResult = result;
        this.skipBattleAnim = false;
      }
    }

    await this.settlePhase();
  }

  async settlePhase() {
    this.phase = 'SETTLE';
    this.notify();
    await this.delay(1000);

    for (const { pair, result } of this.battleResults) {
      this.settleBattlePair(pair, result);
    }

    let rank = this.getAlivePlayers().length;
    for (const player of this.players) {
      if (!player.eliminated && player.hp <= 0) {
        player.eliminated = true;
        player.rank = rank--;
      }
    }

    if (this.getAlivePlayers().length <= 1) {
      this.phase = 'ENDED';
      const winner = this.getAlivePlayers()[0];
      if (winner) winner.rank = 1;
      const human = this.players.find(p => p.isHuman);
      if (human?.rank) {
        this.onGameEnd?.({
          finalRank: human.rank,
          isRanked: this.isRanked,
          modeId: this.gameModeId,
          players: this.players,
        });
      }
      this.notify();
      return;
    }

    this.turn++;
    this.beginPreparePhase();
  }

  skipBattle() {
    this.skipBattleAnim = true;
  }

  delay(ms) {
    const interval = this.gameOptions?.turnInterval;
    if (interval != null && ms === CONFIG.TURN_INTERVAL) return new Promise(r => setTimeout(r, interval));
    return new Promise(r => setTimeout(r, ms));
  }

  restoreFromSession(data) {
    if (!data?.players?.length) return false;
    this.turn = data.turn || 1;
    this.phase = data.phase || 'PREPARE';
    this.humanId = data.humanId || 'player_0';
    this.gameModeId = data.gameModeId || 'ranked';
    this.isRanked = data.isRanked === true;
    this.gameOptions = data.meta || {};
    this.players = data.players.map(p => ({
      ...createPlayer(p.id, p.name, p.isHuman),
      isAI: p.isAI,
      aiDifficulty: p.aiDifficulty || 'normal',
      hp: p.hp, gold: p.gold, tavernTier: p.tavernTier,
      winStreak: p.winStreak, lossStreak: p.lossStreak,
      eliminated: p.eliminated, rank: p.rank,
      team: p.team, bench: p.bench || [],
      shop: { ...p.shop, refreshCost: CONFIG.REFRESH_COST, frozen: p.shop?.frozen || false },
      maxHp: CONFIG.BASE_HP,
    }));
    this.poolRemaining = data.poolRemaining || {};
    this.prepareTimeTotal = data.prepareTimeTotal || this.getPrepareTimeSeconds();
    this.prepareTimeLeft = data.prepareTimeLeft ?? this.prepareTimeTotal;
    for (const p of this.players) {
      this.syncTeamSlots(p);
      for (const c of p.team.cards) {
        if (!c) continue;
        if (!c.star) c.star = c.upgradeTier ?? 1;
        c.upgradeTier = c.star;
        recalculateCardStats(c, true);
      }
    }
    if (this.phase === 'PREPARE') {
      this.startPrepareTimer();
    } else {
      this.clearPrepareTimer();
    }
    this.notify();
    return true;
  }
}
