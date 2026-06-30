import {
  CONFIG,
  getAvailableRarities,
  getShopLevelRange,
  getInterest,
  getStreakBonus,
  getTurnBaseGold,
  getTeamSlotUpgradeCost,
  getTavernUpgradeCost,
  getCardUpgradeCost,
  getMaxCardLevelForPlayer,
  getStageDamage,
} from './config.js';
import { CARD_TEMPLATES, createCard, recalculateCardStats } from './cards.js';
import { BattleEngine } from './battleEngine.js';
import { runAIDecisions } from './ai.js';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createEmptyTeam(playerId, maxSize = CONFIG.INITIAL_TEAM_SIZE) {
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
    this.initPool();
  }

  initPool() {
    this.poolRemaining = {};
    for (const tpl of CARD_TEMPLATES) {
      this.poolRemaining[tpl.id] = CONFIG.CARD_POOL_LIMITS[tpl.rarity];
    }
  }

  startGame(playerConfigs) {
    const configs = playerConfigs || [];
    this.players = configs.map((cfg, i) => {
      const p = createPlayer(cfg.id || `player_${i}`, cfg.name, cfg.isHuman === true);
      p.isAI = cfg.isAI === true;
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
    };
  }

  /** 计算本回合金币收入（利息基于回合开始前持有金币） */
  calculateGoldIncome(player) {
    const base = getTurnBaseGold(this.turn);
    let streakBonus = 0;
    if (player.winStreak >= 2) streakBonus = getStreakBonus(player.winStreak);
    else if (player.lossStreak >= 2) streakBonus = getStreakBonus(player.lossStreak);

    const interest = getInterest(player.gold);

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
    return { base, streakBonus, interest, skillGold, total };
  }

  rollRarity(tavernTier) {
    const available = getAvailableRarities(tavernTier);
    const weights = available.map(r => CONFIG.RARITY_WEIGHTS[r]);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < available.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return available[i];
    }
    return 'common';
  }

  refreshShop(player) {
    if (player.shop.frozen && player.shop.cards.length > 0) {
      return;
    }
    player.shop.cards = [];
    const { minLevel, maxLevel } = getShopLevelRange(player.tavernTier);

    for (let i = 0; i < CONFIG.SHOP_SIZE; i++) {
      const rarity = this.rollRarity(player.tavernTier);
      let candidates = CARD_TEMPLATES.filter(t => t.rarity === rarity && (this.poolRemaining[t.id] || 0) > 0);
      if (!candidates.length) {
        candidates = CARD_TEMPLATES.filter(t => t.rarity === 'common' && (this.poolRemaining[t.id] || 0) > 0);
      }
      if (!candidates.length) continue;

      const tpl = candidates[Math.floor(Math.random() * candidates.length)];
      const level = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
      player.shop.cards.push({
        shopIndex: i,
        cardTemplateId: tpl.id,
        name: tpl.name,
        rarity: tpl.rarity,
        element: tpl.element,
        cardClass: tpl.class,
        level,
        cost: CONFIG.BUY_COST,
        upgradeTier: 1,
      });
    }
    if (!player.shop.frozen) player.shop.frozen = false;
  }

  beginPreparePhase() {
    this.phase = 'PREPARE';
    for (const player of this.getAlivePlayers()) {
      const income = this.calculateGoldIncome(player);
      player.lastIncome = income;
      player.gold += income.total;

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
    this.notify();
  }

  buyCard(player, shopIndex) {
    const shopCard = player.shop.cards[shopIndex];
    if (!shopCard || player.gold < shopCard.cost) return false;

    const emptyPos = this.findEmptyTeamSlot(player);
    if (emptyPos === -1) return false;

    player.gold -= shopCard.cost;
    const card = createCard(shopCard.cardTemplateId, shopCard.level, 1, player.id, emptyPos);
    player.team.cards[emptyPos] = card;
    this.poolRemaining[shopCard.cardTemplateId]--;
    player.shop.cards.splice(shopIndex, 1);
    this.checkUpgrade(player);
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
    player.gold += card.upgradeTier;
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

  upgradeTeam(player) {
    const cost = getTeamSlotUpgradeCost(player.team.maxSize);
    if (player.gold < cost || player.team.maxSize >= CONFIG.MAX_TEAM_SIZE) return false;
    player.gold -= cost;
    player.team.maxSize++;
    this.notify();
    return true;
  }

  upgradeTavern(player) {
    const cost = getTavernUpgradeCost(player.tavernTier);
    if (player.gold < cost || player.tavernTier >= CONFIG.MAX_TAVERN_TIER) return false;
    player.gold -= cost;
    player.tavernTier++;
    if (!player.shop.frozen) this.refreshShop(player);
    this.notify();
    return true;
  }

  upgradeCardLevel(player, position) {
    const card = player.team.cards[position];
    if (!card) return false;
    const maxLv = getMaxCardLevelForPlayer(player.tavernTier);
    if (card.level >= maxLv) return false;

    const cost = getCardUpgradeCost(card.level);
    if (player.gold < cost) return false;

    player.gold -= cost;
    card.level++;
    recalculateCardStats(card, true);
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

  checkUpgrade(player) {
    const groups = {};
    for (let i = 0; i < player.team.maxSize; i++) {
      const c = player.team.cards[i];
      if (!c) continue;
      const key = `${c.templateId}_${c.upgradeTier}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ card: c, pos: i });
    }

    for (const [, cards] of Object.entries(groups)) {
      while (cards.length >= 3 && cards[0].card.upgradeTier < 3) {
        const toMerge = cards.splice(0, 3);
        const maxLevel = Math.max(...toMerge.map(x => x.card.level));
        const pos = toMerge[0].pos;
        for (const { card, pos: p } of toMerge) {
          player.team.cards[p] = null;
          this.poolRemaining[card.templateId]++;
        }
        const newTier = toMerge[0].card.upgradeTier + 1;
        const newCard = createCard(toMerge[0].card.templateId, maxLevel, newTier, player.id, pos);
        player.team.cards[pos] = newCard;
        cards.push({ card: newCard, pos });
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

  async endPreparePhase() {
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
    return new Promise(r => setTimeout(r, ms));
  }
}
