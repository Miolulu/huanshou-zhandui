/** 幻兽净化师 · 可打出卡牌池 */

import { TERMS } from './lore.js';

export const CARD_TYPES = { ATTACK: 'attack', SKILL: 'skill', POWER: 'power' };

const uid = () => `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function cloneCard(def) {
  return { ...def, uid: uid() };
}

export const STARTER_DECK = [
  { id: 'purify_strike', name: '净化冲击', type: CARD_TYPES.ATTACK, cost: 1, damage: 6, desc: '对污化幻兽造成 6 点净化伤害', element: 'light' },
  { id: 'purify_strike', name: '净化冲击', type: CARD_TYPES.ATTACK, cost: 1, damage: 6, desc: '对污化幻兽造成 6 点净化伤害', element: 'light' },
  { id: 'purify_strike', name: '净化冲击', type: CARD_TYPES.ATTACK, cost: 1, damage: 6, desc: '对污化幻兽造成 6 点净化伤害', element: 'light' },
  { id: 'purify_strike', name: '净化冲击', type: CARD_TYPES.ATTACK, cost: 1, damage: 6, desc: '对污化幻兽造成 6 点净化伤害', element: 'light' },
  { id: 'purify_strike', name: '净化冲击', type: CARD_TYPES.ATTACK, cost: 1, damage: 6, desc: '对污化幻兽造成 6 点净化伤害', element: 'light' },
  { id: 'holy_barrier', name: '圣光护幕', type: CARD_TYPES.SKILL, cost: 1, block: 5, desc: '获得 5 点护幕，抵御污秽反噬', element: 'light' },
  { id: 'holy_barrier', name: '圣光护幕', type: CARD_TYPES.SKILL, cost: 1, block: 5, desc: '获得 5 点护幕，抵御污秽反噬', element: 'light' },
  { id: 'holy_barrier', name: '圣光护幕', type: CARD_TYPES.SKILL, cost: 1, block: 5, desc: '获得 5 点护幕，抵御污秽反噬', element: 'light' },
  { id: 'holy_barrier', name: '圣光护幕', type: CARD_TYPES.SKILL, cost: 1, block: 5, desc: '获得 5 点护幕，抵御污秽反噬', element: 'light' },
  { id: 'beast_pact', name: '破秽重击', type: CARD_TYPES.ATTACK, cost: 2, damage: 8, applyVulnerable: 2, desc: '造成 8 点伤害，施加剧化破绽 2 层', element: 'light' },
];

export const REWARD_POOL = [
  { id: 'flame_purify', name: '净炎爪', type: CARD_TYPES.ATTACK, cost: 1, damage: 9, desc: '烈焰净化，造成 9 点伤害', element: 'fire' },
  { id: 'ice_shell', name: '冰晶护幕', type: CARD_TYPES.SKILL, cost: 1, block: 8, desc: '冰晶屏障，获得 8 点护幕', element: 'water' },
  { id: 'vine_lash', name: '藤缚净化', type: CARD_TYPES.ATTACK, cost: 1, damage: 4, hits: 2, desc: '藤鞭连击，造成 4×2 点伤害', element: 'grass' },
  { id: 'thunder_purify', name: '雷罚', type: CARD_TYPES.ATTACK, cost: 2, damage: 18, desc: '天雷驱散污秽，造成 18 点伤害', element: 'electric' },
  { id: 'heal_bloom', name: '灵泉复苏', type: CARD_TYPES.SKILL, cost: 1, heal: 8, desc: '恢复 8 点心神', element: 'grass' },
  { id: 'iron_aegis', name: '大地庇护', type: CARD_TYPES.SKILL, cost: 2, block: 14, desc: '大地之力，获得 14 点护幕', element: 'earth' },
  { id: 'wind_cut', name: '风刃', type: CARD_TYPES.ATTACK, cost: 0, damage: 5, desc: '迅捷风刃，造成 5 点伤害', element: 'wind' },
  { id: 'meditate', name: '凝神', type: CARD_TYPES.SKILL, cost: 0, draw: 2, desc: '从待启中感通 2 张技法', element: 'light' },
  { id: 'twin_purify', name: '连击净化', type: CARD_TYPES.ATTACK, cost: 1, damage: 5, hits: 2, desc: '双重冲击，造成 5×2 点伤害', element: 'neutral' },
  { id: 'life_drain', name: '生命回流', type: CARD_TYPES.ATTACK, cost: 2, damage: 10, heal: 5, desc: '造成 10 点伤害，恢复 5 心神', element: 'dark' },
  { id: 'barrier', name: '常驻护幕', type: CARD_TYPES.POWER, cost: 2, power: 'barrier', desc: '秘法：每次调息开始获得 3 护幕', element: 'earth' },
  { id: 'rage', name: '净化之怒', type: CARD_TYPES.POWER, cost: 1, power: 'rage', desc: '秘法：每打出攻型技法 +1 净化力', element: 'fire' },
  { id: 'heavy_purify', name: '重锤净化', type: CARD_TYPES.ATTACK, cost: 2, damage: 20, desc: '重击污化幻兽，造成 20 点伤害', element: 'neutral' },
  { id: 'quick_guard', name: '瞬步护幕', type: CARD_TYPES.SKILL, cost: 0, block: 4, desc: '获得 4 点护幕', element: 'wind' },
  { id: 'poison_fang', name: '以毒攻毒', type: CARD_TYPES.ATTACK, cost: 1, damage: 6, applyPoison: 3, desc: '造成 6 点伤害，叠加 3 层污秽', element: 'dark' },
];

export function buildStarterDeck() {
  return STARTER_DECK.map(cloneCard);
}

export function pickRewardOptions(count = 3, rng = Math.random) {
  const pool = [...REWARD_POOL];
  const picks = [];
  while (picks.length < count && pool.length) {
    const i = Math.floor(rng() * pool.length);
    picks.push(cloneCard(pool.splice(i, 1)[0]));
  }
  return picks;
}

export function cardTypeLabel(type) {
  return {
    attack: TERMS.cardAttack,
    skill: TERMS.cardSkill,
    power: TERMS.cardPower,
  }[type] || type;
}

export function cardTypeClass(type) {
  return { attack: 'card-attack', skill: 'card-skill', power: 'card-power' }[type] || '';
}
