/**
 * 特殊技法 · 20 张（参照 Slay the Web 的 conditions + actions 模式）
 */
import { COMBAT_EVENT } from './combatEvents.js';

const T = { ATTACK: 'attack', SKILL: 'skill', POWER: 'power' };

export const SPECIAL_CARD_POOL = [
  {
    id: 'spectral_lance',
    name: '幻影长枪',
    type: T.ATTACK,
    cost: 1,
    damage: 7,
    element: 'wind',
    special: true,
    artId: 'wind_cut',
    desc: '造成 7 点伤害；若目标有淤壳，额外造成 5 点',
    handler: 'spectralLance',
  },
  {
    id: 'purify_cascade',
    name: '净化涟漪',
    type: T.ATTACK,
    cost: 1,
    element: 'light',
    special: true,
    artId: 'purify_strike',
    desc: '对所有污化幻兽造成 4 点净化伤害',
    handler: 'purifyCascade',
  },
  {
    id: 'soul_mirror',
    name: '灵魂镜像',
    type: T.ATTACK,
    cost: 1,
    element: 'dark',
    special: true,
    artId: 'life_drain',
    desc: '造成与本回合上一张攻型技法相同伤害（至少 6）',
    handler: 'soulMirror',
  },
  {
    id: 'ward_thorns',
    name: '荆棘咒壁',
    type: T.SKILL,
    cost: 2,
    block: 10,
    element: 'grass',
    special: true,
    artId: 'vine_lash',
    desc: '获得 10 护幕，对所有敌人叠加 2 层污秽',
    handler: 'wardThorns',
  },
  {
    id: 'mind_break',
    name: '心蚀',
    type: T.ATTACK,
    cost: 1,
    damage: 14,
    element: 'dark',
    special: true,
    artId: 'poison_fang',
    desc: '造成 14 点伤害，自身获得虚弱 2',
    handler: 'mindBreak',
  },
  {
    id: 'time_snare',
    name: '时缚',
    type: T.SKILL,
    cost: 1,
    element: 'wind',
    special: true,
    artId: 'meditate',
    desc: '使目标破绽 +3',
    handler: 'timeSnare',
  },
  {
    id: 'essence_tap',
    name: '灵髓汲取',
    type: T.ATTACK,
    cost: 2,
    damage: 8,
    heal: 5,
    element: 'grass',
    special: true,
    artId: 'heal_bloom',
    desc: '造成 8 点伤害，恢复 5 心神',
    handler: 'essenceTap',
  },
  {
    id: 'storm_blade',
    name: '风暴连斩',
    type: T.ATTACK,
    cost: 1,
    damage: 3,
    hits: 3,
    element: 'wind',
    special: true,
    artId: 'wind_cut',
    desc: '造成 3×3 点伤害',
    handler: 'stormBlade',
  },
  {
    id: 'holy_judgment',
    name: '圣裁',
    type: T.ATTACK,
    cost: 2,
    damage: 15,
    element: 'light',
    special: true,
    artId: 'heavy_purify',
    desc: '仅当目标有破绽时可用，造成 15 点伤害',
    handler: 'holyJudgment',
    requiresVulnerable: true,
  },
  {
    id: 'rite_cleanse',
    name: '净化仪式',
    type: T.SKILL,
    cost: 1,
    element: 'light',
    special: true,
    artId: 'meditate',
    desc: '驱散自身虚弱，感通 2 张技法',
    handler: 'riteCleanse',
  },
  {
    id: 'ash_burst',
    name: '灰烬爆发',
    type: T.ATTACK,
    cost: 1,
    element: 'fire',
    special: true,
    artId: 'flame_purify',
    desc: '造成等同于余韵张数的伤害（上限 20）',
    handler: 'ashBurst',
  },
  {
    id: 'phantom_step',
    name: '幻影步',
    type: T.SKILL,
    cost: 1,
    block: 6,
    element: 'wind',
    special: true,
    artId: 'quick_guard',
    desc: '获得 6 护幕，净化力 +1',
    handler: 'phantomStep',
  },
  {
    id: 'vine_prison',
    name: '缚灵藤',
    type: T.ATTACK,
    cost: 1,
    damage: 5,
    element: 'grass',
    special: true,
    artId: 'vine_lash',
    desc: '造成 5 点伤害，破绽 +2，污秽 +2',
    handler: 'vinePrison',
  },
  {
    id: 'chain_lightning',
    name: '雷链',
    type: T.ATTACK,
    cost: 2,
    damage: 12,
    element: 'electric',
    special: true,
    artId: 'thunder_purify',
    desc: '对主目标 12 点伤害，其余敌人 6 点',
    handler: 'chainLightning',
  },
  {
    id: 'iron_mind',
    name: '心如磐石',
    type: T.SKILL,
    cost: 1,
    element: 'earth',
    special: true,
    artId: 'iron_aegis',
    desc: '获得等同于已失心神一半的护幕',
    handler: 'ironMind',
  },
  {
    id: 'primal_fury',
    name: '原始之怒',
    type: T.SKILL,
    cost: 0,
    element: 'fire',
    special: true,
    artId: 'rage',
    desc: '已竭：净化力 +2（本场）',
    handler: 'primalFury',
    exhaust: true,
  },
  {
    id: 'light_well',
    name: '光泉',
    type: T.SKILL,
    cost: 1,
    heal: 8,
    element: 'light',
    special: true,
    artId: 'heal_bloom',
    desc: '恢复 8 心神',
    handler: 'lightWell',
  },
  {
    id: 'void_feast',
    name: '虚空吞噬',
    type: T.ATTACK,
    cost: 2,
    damage: 14,
    element: 'dark',
    special: true,
    artId: 'life_drain',
    desc: '造成 14 点伤害，失去 4 心神',
    handler: 'voidFeast',
  },
  {
    id: 'wind_dance',
    name: '风舞',
    type: T.ATTACK,
    cost: 2,
    damage: 4,
    hits: 2,
    element: 'wind',
    special: true,
    artId: 'twin_purify',
    desc: '造成 4×2 点伤害',
    handler: 'windDance',
  },
  {
    id: 'quake',
    name: '大地震颤',
    type: T.ATTACK,
    cost: 2,
    element: 'earth',
    special: true,
    artId: 'heavy_purify',
    desc: '对所有污化幻兽造成 7 点伤害',
    handler: 'quake',
  },
];

const HANDLERS = {
  spectralLance(engine, card) {
    const target = engine.primaryEnemy;
    if (!target) return;
    let dmg = card.damage + engine.strength;
    if (target.block > 0) dmg += 5;
    engine.dealCardDamage(target, dmg, card.name);
  },

  purifyCascade(engine, card) {
    engine.dealDamageAllEnemies(4, card.name);
  },

  soulMirror(engine, card) {
    const dmg = Math.max(6, engine.lastAttackDamage || 6);
    const target = engine.primaryEnemy;
    if (target) engine.dealCardDamage(target, dmg + engine.strength, card.name);
  },

  wardThorns(engine, card) {
    engine.gainPlayerBlock(card.block, card.name);
    engine.aliveEnemies.forEach((enemy) => {
      enemy.poison = (enemy.poison || 0) + 2;
      engine.emit({
        type: COMBAT_EVENT.POISON,
        enemyIndex: engine.enemyIndexOf(enemy),
        amount: 2,
        stacks: 2,
      });
    });
    engine.pushLog(`${card.name}：全体叠加 2 层污秽`);
  },

  mindBreak(engine, card) {
    const target = engine.primaryEnemy;
    if (target) engine.dealCardDamage(target, card.damage + engine.strength, card.name);
    engine.weak = (engine.weak || 0) + 2;
    engine.pushLog(`${card.name}：自身虚弱 +2`);
    engine.emit({ type: COMBAT_EVENT.DEBUFF, amount: 2 });
  },

  timeSnare(engine, card) {
    const target = engine.primaryEnemy;
    if (!target) return;
    target.vulnerable = (target.vulnerable || 0) + 3;
    engine.pushLog(`${card.name}：${target.name} 破绽 +3`);
    engine.emit({
      type: COMBAT_EVENT.DEBUFF,
      enemyIndex: engine.enemyIndexOf(target),
      amount: 3,
    });
  },

  essenceTap(engine, card) {
    const target = engine.primaryEnemy;
    if (target) engine.dealCardDamage(target, card.damage + engine.strength, card.name);
    engine.healPlayer(card.heal, card.name);
  },

  stormBlade(engine, card) {
    const target = engine.primaryEnemy;
    if (!target) return;
    for (let i = 0; i < (card.hits || 3); i++) {
      engine.dealCardDamage(target, card.damage + engine.strength, card.name);
    }
  },

  holyJudgment(engine, card) {
    const target = engine.primaryEnemy;
    if (!target) return;
    engine.dealCardDamage(target, card.damage + engine.strength, card.name);
  },

  riteCleanse(engine, card) {
    engine.weak = 0;
    engine.drawCards(2);
    engine.pushLog(`${card.name}：驱散虚弱，感通 2 张`);
    engine.emit({ type: COMBAT_EVENT.DRAW, amount: 2 });
  },

  ashBurst(engine, card) {
    const dmg = Math.min(20, engine.discard.length);
    const target = engine.primaryEnemy;
    if (target && dmg > 0) engine.dealCardDamage(target, dmg + engine.strength, card.name);
    else engine.pushLog(`${card.name}：余韵为空，未造成伤害`);
  },

  phantomStep(engine, card) {
    engine.gainPlayerBlock(card.block, card.name);
    engine.strength += 1;
    engine.pushLog(`${card.name}：净化力 +1`);
    engine.emit({ type: COMBAT_EVENT.BUFF, amount: 1 });
  },

  vinePrison(engine, card) {
    const target = engine.primaryEnemy;
    if (!target) return;
    engine.dealCardDamage(target, card.damage + engine.strength, card.name);
    target.vulnerable = (target.vulnerable || 0) + 2;
    target.poison = (target.poison || 0) + 2;
    const idx = engine.enemyIndexOf(target);
    engine.emit({ type: COMBAT_EVENT.DEBUFF, enemyIndex: idx, amount: 2 });
    engine.emit({ type: COMBAT_EVENT.POISON, enemyIndex: idx, amount: 2, stacks: 2 });
    engine.pushLog(`${card.name}：破绽 +2，污秽 +2`);
  },

  chainLightning(engine, card) {
    const primary = engine.primaryEnemy;
    if (!primary) return;
    engine.dealCardDamage(primary, card.damage + engine.strength, card.name);
    engine.aliveEnemies.forEach((enemy) => {
      if (enemy === primary) return;
      engine.dealCardDamage(enemy, 6 + engine.strength, card.name);
    });
  },

  ironMind(engine, card) {
    const missing = engine.player.maxHp - engine.player.hp;
    const block = Math.max(0, Math.floor(missing / 2));
    engine.gainPlayerBlock(block, card.name);
  },

  primalFury(engine, card) {
    engine.strength += 2;
    engine.pushLog(`${card.name}：净化力 +2`);
    engine.emit({ type: COMBAT_EVENT.BUFF, amount: 2 });
  },

  lightWell(engine, card) {
    engine.healPlayer(card.heal, card.name);
  },

  voidFeast(engine, card) {
    const target = engine.primaryEnemy;
    if (target) engine.dealCardDamage(target, card.damage + engine.strength, card.name);
    engine.player.hp = Math.max(0, engine.player.hp - 4);
    engine.pushLog(`${card.name}：失去 4 心神`);
    engine.emit({ type: COMBAT_EVENT.DAMAGE, target: 'player', amount: 4, blocked: 0, raw: 4 });
  },

  windDance(engine, card) {
    const target = engine.primaryEnemy;
    if (!target) return;
    for (let i = 0; i < (card.hits || 2); i++) {
      engine.dealCardDamage(target, card.damage + engine.strength, card.name);
    }
  },

  quake(engine, card) {
    engine.dealDamageAllEnemies(7, card.name);
  },
};

export function getSpecialCardDef(id) {
  return SPECIAL_CARD_POOL.find((c) => c.id === id) || null;
}

export function canPlaySpecialCard(engine, card) {
  if (!card?.special) return true;
  if (card.requiresVulnerable) {
    const target = engine.primaryEnemy;
    if (!target || !(target.vulnerable > 0)) return false;
  }
  if (card.handler === 'ashBurst' && engine.discard.length <= 0) return false;
  return true;
}

export function resolveSpecialCard(engine, card) {
  const fn = HANDLERS[card.handler];
  if (!fn) {
    engine.resolveCard(card);
    return;
  }
  fn(engine, card);
}

export function pickSpecialRewardOptions(count = 1, rng = Math.random) {
  const pool = [...SPECIAL_CARD_POOL];
  const picks = [];
  while (picks.length < count && pool.length) {
    const i = Math.floor(rng() * pool.length);
    picks.push({ ...pool.splice(i, 1)[0] });
  }
  return picks;
}
