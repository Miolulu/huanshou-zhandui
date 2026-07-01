/** 幻兽净化师 · 回合战斗引擎（支持多敌组合） */
import { cloneCard } from './cardPool.js';
import { advanceIntent, INTENTS, pickEncounter, createEnemy } from './enemies.js';
import { TERMS } from './lore.js';

const HAND_SIZE = 5;
const BASE_ENERGY = 3;

function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class CombatEngine {
  constructor(deck, tier = 'normal', options = {}) {
    const {
      rng = Math.random,
      startHp = 70,
      maxHp = 70,
      floor = 1,
      enemies = null,
      tutorial = false,
    } = options;
    this.rng = rng;
    this.tier = tier;
    this.floor = floor;
    this.tutorial = tutorial;
    this.log = [];
    this.turn = 0;
    this.phase = 'player';
    this.powers = { barrier: 0, rage: 0 };
    this.strength = 0;
    this.weak = 0;
    this.targetIndex = 0;
    this.player = {
      maxHp,
      hp: startHp,
      block: 0,
      maxEnergy: BASE_ENERGY,
      energy: BASE_ENERGY,
    };
    this.enemies = enemies || pickEncounter(floor, tier, rng);
    this.enemies.forEach((e) => {
      this.pushLog(`遭遇 ${e.name}`);
      if (e.desc) this.pushLog(e.desc);
    });
    this.drawPile = shuffle(deck.map((c) => ({ ...c })), rng);
    this.hand = [];
    this.discard = [];
    this.exhaust = [];
    this.startTurn();
  }

  get aliveEnemies() {
    return this.enemies.filter((e) => e.hp > 0);
  }

  get primaryEnemy() {
    const alive = this.aliveEnemies;
    if (!alive.length) return this.enemies[0];
    const idx = Math.min(this.targetIndex, alive.length - 1);
    return alive[idx];
  }

  enemyIndexOf(enemy) {
    return this.enemies.indexOf(enemy);
  }

  pushLog(msg) {
    this.log.unshift(msg);
    if (this.log.length > 40) this.log.length = 40;
  }

  drawCards(n) {
    for (let i = 0; i < n; i++) {
      if (!this.drawPile.length && this.discard.length) {
        this.drawPile = shuffle(this.discard, this.rng);
        this.discard = [];
        this.pushLog(TERMS.logShuffle);
      }
      if (!this.drawPile.length) break;
      this.hand.push(this.drawPile.pop());
    }
  }

  startTurn() {
    this.turn += 1;
    this.phase = 'player';
    this.player.block = 0;
    this.player.energy = this.player.maxEnergy;
    if (this.powers.barrier) {
      this.player.block += 3;
      this.pushLog(TERMS.logBarrierPower);
    }
    this.drawCards(HAND_SIZE);
    this.pushLog(TERMS.logTurn(this.turn));
    this.clampTargetIndex();
  }

  clampTargetIndex() {
    const alive = this.aliveEnemies;
    if (!alive.length) return;
    if (this.targetIndex >= alive.length) this.targetIndex = 0;
  }

  setTarget(index) {
    const alive = this.aliveEnemies;
    if (index < 0 || index >= alive.length) return { ok: false };
    this.targetIndex = index;
    return { ok: true };
  }

  canPlay(card) {
    return this.phase === 'player' && card.cost <= this.player.energy;
  }

  playCard(cardUid, targetIndex = null) {
    if (this.phase !== 'player') return { ok: false, message: '当前无法施展技法' };
    const idx = this.hand.findIndex((c) => c.uid === cardUid);
    if (idx < 0) return { ok: false, message: '技法不在当前手牌' };
    const card = this.hand[idx];
    if (card.cost > this.player.energy) return { ok: false, message: `${TERMS.spirit}不足` };

    if (targetIndex != null) this.setTarget(targetIndex);

    this.player.energy -= card.cost;
    this.hand.splice(idx, 1);

    if (card.type === 'power') {
      if (card.power === 'barrier') this.powers.barrier += 1;
      if (card.power === 'rage') this.powers.rage += 1;
      this.exhaust.push(card);
      this.pushLog(`施展 ${card.name}（${TERMS.cardPower}）`);
    } else {
      this.resolveCard(card);
      this.discard.push(card);
      if (this.powers.rage && card.type === 'attack') {
        this.strength += 1;
        this.pushLog(TERMS.logRagePower);
      }
    }

    if (!this.aliveEnemies.length) {
      this.phase = 'won';
      this.pushLog(TERMS.logWin);
    }
    return { ok: true };
  }

  resolveCard(card) {
    const hits = card.hits || 1;
    const dmgBonus = this.strength;
    const dmgMult = this.weak > 0 ? 0.75 : 1;
    const target = this.primaryEnemy;

    if (card.block) {
      this.player.block += card.block;
      this.pushLog(`${card.name}：+${card.block} ${TERMS.barrier}`);
    }
    if (card.heal) {
      const before = this.player.hp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + card.heal);
      this.pushLog(`${card.name}：恢复 ${this.player.hp - before} ${TERMS.mind}`);
    }
    if (card.draw) {
      this.drawCards(card.draw);
      this.pushLog(`${card.name}：感通 ${card.draw} 张技法`);
    }
    if (card.damage && target) {
      for (let h = 0; h < hits; h++) {
        const raw = Math.floor((card.damage + dmgBonus) * dmgMult);
        this.dealDamageToEnemy(target, raw);
      }
      this.pushLog(`${card.name} → ${target.name}：${card.damage + dmgBonus}${hits > 1 ? `×${hits}` : ''} 伤害`);
    }
    if (card.applyPoison && target) {
      target.poison = (target.poison || 0) + card.applyPoison;
      this.pushLog(`${card.name}：${target.name} 叠加 ${card.applyPoison} 层${TERMS.taintStack}`);
    }
    this.clampTargetIndex();
  }

  dealDamageToEnemy(enemy, amount) {
    let dmg = amount;
    if (enemy.block > 0) {
      const absorbed = Math.min(enemy.block, dmg);
      enemy.block -= absorbed;
      dmg -= absorbed;
    }
    enemy.hp = Math.max(0, enemy.hp - dmg);
  }

  dealDamageToPlayer(amount) {
    let dmg = amount;
    if (this.player.block > 0) {
      const absorbed = Math.min(this.player.block, dmg);
      this.player.block -= absorbed;
      dmg -= absorbed;
    }
    this.player.hp = Math.max(0, this.player.hp - dmg);
    return dmg;
  }

  endTurn() {
    if (this.phase !== 'player') return { ok: false };
    this.discard.push(...this.hand);
    this.hand = [];
    this.phase = 'enemy';
    this.enemyTurn();
    if (this.player.hp <= 0) {
      this.phase = 'lost';
      this.pushLog(TERMS.logLose);
      return { ok: true };
    }
    if (!this.aliveEnemies.length) {
      this.phase = 'won';
      return { ok: true };
    }
    this.startTurn();
    return { ok: true };
  }

  enemyTurn() {
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      this.executeEnemyIntent(e);
      if (this.player.hp <= 0) {
        this.phase = 'lost';
        return;
      }
    }
    if (this.weak > 0) this.weak -= 1;
  }

  executeEnemyIntent(e) {
    e.block = 0;
    const intent = e.intent;

    if (e.poison > 0) {
      this.dealDamageToEnemy(e, e.poison);
      this.pushLog(`${TERMS.taintStack}：${e.name} 受到 ${e.poison} 点伤害`);
      e.poison = Math.max(0, e.poison - 1);
    }

    switch (intent.intent) {
      case INTENTS.ATTACK:
      case INTENTS.STRONG_ATTACK: {
        const dmg = intent.value + (e.strength || 0);
        const taken = this.dealDamageToPlayer(dmg);
        this.pushLog(`${e.name} 暴走扑击，你受到 ${taken} 点伤害`);
        break;
      }
      case INTENTS.DEFEND:
        e.block += intent.value;
        this.pushLog(`${e.name} 缩入淤壳 +${intent.value}`);
        break;
      case INTENTS.BUFF:
        e.strength = (e.strength || 0) + intent.value;
        this.pushLog(`${e.name} 污染膨胀 +${intent.value}`);
        break;
      case INTENTS.DEBUFF:
        if (intent.debuff === 'weak') this.weak += intent.value;
        this.pushLog(`${e.name} 释放秽气，你感到虚弱`);
        break;
      case INTENTS.ATTACK_DEFEND: {
        e.block += intent.block;
        const dmg = intent.attack + (e.strength || 0);
        const taken = this.dealDamageToPlayer(dmg);
        this.pushLog(`${e.name} 攻${taken} 防${intent.block}`);
        break;
      }
      default:
        break;
    }

    advanceIntent(e);
  }

  getEncounterIds() {
    return [...new Set(this.enemies.map((e) => e.id))];
  }

  getState() {
    const alive = this.aliveEnemies;
    const primary = alive[0] || this.enemies[0];
    return {
      phase: this.phase,
      turn: this.turn,
      tier: this.tier,
      floor: this.floor,
      tutorial: this.tutorial,
      player: { ...this.player },
      enemies: this.enemies.map((e) => ({ ...e, intent: { ...e.intent } })),
      enemy: primary ? { ...primary, intent: { ...primary.intent } } : null,
      targetIndex: this.targetIndex,
      hand: this.hand.map((c) => ({ ...c })),
      drawCount: this.drawPile.length,
      discardCount: this.discard.length,
      exhaustCount: this.exhaust.length,
      log: [...this.log],
      powers: { ...this.powers },
      strength: this.strength,
      weak: this.weak,
    };
  }

  getDeckAfterCombat() {
    return [
      ...this.discard.filter((c) => c.type !== 'power'),
      ...this.hand.filter((c) => c.type !== 'power'),
      ...this.drawPile,
    ];
  }
}

/** 实战新手引导 · 固定弱敌与手牌 */
export function createTutorialCombat(deck) {
  const mushroom = createEnemy('corrupted_mushroom', Math.random, 1, 'normal');
  mushroom.maxHp = 18;
  mushroom.hp = 18;
  mushroom.pattern = [
    { intent: INTENTS.ATTACK, value: 4 },
    { intent: INTENTS.DEFEND, value: 3 },
  ];
  mushroom.intent = { ...mushroom.pattern[0] };

  const tutorialDeck = deck.length ? deck : [];
  const engine = new CombatEngine(tutorialDeck, 'normal', {
    startHp: 50,
    maxHp: 50,
    floor: 1,
    enemies: [mushroom],
    tutorial: true,
  });
  engine.hand = [
    { uid: 'tut_strike', id: 'purify_strike', name: '净化冲击', type: 'attack', cost: 1, damage: 8, desc: '对污化幻兽造成 8 点净化伤害' },
    { uid: 'tut_barrier', id: 'holy_barrier', name: '圣光护幕', type: 'skill', cost: 1, block: 6, desc: '获得 6 点护幕' },
    { uid: 'tut_strike2', id: 'purify_strike', name: '净化冲击', type: 'attack', cost: 1, damage: 8, desc: '对污化幻兽造成 8 点净化伤害' },
  ];
  engine.drawPile = [];
  engine.discard = [];
  engine.player.energy = 3;
  engine.turn = 0;
  engine.log = [];
  engine.pushLog('【实战引导】污化·治愈菇 出现在你面前');
  engine.pushLog('按照提示完成第一次净化');
  return engine;
}

export function startCombat(deck, tier, options) {
  return new CombatEngine(deck, tier, options);
}
