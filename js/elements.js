/** 元素克制与羁绊 */

export const ELEMENTS = ['fire', 'water', 'grass', 'electric', 'wind', 'earth', 'light', 'dark'];

/** 8×8 克制伤害倍率表（文档第三章） */
export const ELEMENT_DAMAGE_MATRIX = {
  fire:   { fire: 1.0, water: 0.7, grass: 1.5, electric: 1.0, wind: 1.5, earth: 0.7, light: 1.0, dark: 1.0 },
  water:  { fire: 1.5, water: 1.0, grass: 0.7, electric: 1.5, wind: 1.0, earth: 1.0, light: 1.0, dark: 1.0 },
  grass:  { fire: 0.7, water: 1.5, grass: 1.0, electric: 1.0, wind: 0.7, earth: 1.5, light: 1.0, dark: 1.0 },
  electric:{ fire: 1.0, water: 1.5, grass: 1.0, electric: 1.0, wind: 1.0, earth: 1.5, light: 1.0, dark: 1.0 },
  wind:   { fire: 1.5, water: 1.0, grass: 1.5, electric: 1.0, wind: 1.0, earth: 0.7, light: 1.0, dark: 1.0 },
  earth:  { fire: 1.5, water: 1.0, grass: 0.7, electric: 0.7, wind: 1.5, earth: 1.0, light: 1.0, dark: 1.0 },
  light:  { fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, wind: 1.0, earth: 1.0, light: 1.0, dark: 1.5 },
  dark:   { fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, wind: 1.0, earth: 1.0, light: 1.5, dark: 1.0 },
};

export const ELEMENT_CHART = [
  { from: 'fire', to: 'grass', label: '火 → 草' },
  { from: 'fire', to: 'wind', label: '火 → 风' },
  { from: 'water', to: 'fire', label: '水 → 火' },
  { from: 'water', to: 'electric', label: '水 → 电' },
  { from: 'grass', to: 'water', label: '草 → 水' },
  { from: 'grass', to: 'earth', label: '草 → 土' },
  { from: 'electric', to: 'water', label: '电 → 水' },
  { from: 'electric', to: 'earth', label: '电 → 土' },
  { from: 'wind', to: 'fire', label: '风 → 火' },
  { from: 'wind', to: 'earth', label: '风 → 土' },
  { from: 'earth', to: 'wind', label: '土 → 风' },
  { from: 'earth', to: 'electric', label: '土 → 电' },
  { from: 'light', to: 'dark', label: '光 ↔ 暗' },
  { from: 'dark', to: 'light', label: '暗 ↔ 光' },
];

/** 元素羁绊阈值（2/3/5/7） */
export const ELEMENT_BOND_TIERS = [
  { count: 7, atk: 0.40, hp: 0.25, def: 0, spd: 0.10, crit: 0.20 },
  { count: 5, atk: 0.30, hp: 0.20, def: 0.15, spd: 0, crit: 0.10 },
  { count: 3, atk: 0.20, hp: 0.10, def: 0, spd: 0, crit: 0 },
  { count: 2, atk: 0.10, hp: 0, def: 0, spd: 0, crit: 0 },
];

export function getElementBondTier(count) {
  if (count >= 7) return ELEMENT_BOND_TIERS[0];
  if (count >= 5) return ELEMENT_BOND_TIERS[1];
  if (count >= 3) return ELEMENT_BOND_TIERS[2];
  if (count >= 2) return ELEMENT_BOND_TIERS[3];
  return null;
}

export const PASSIVE_TRIGGERS = new Set([
  'BATTLE_START', 'TURN_START', 'PREPARE_PHASE',
  'ON_DEATH', 'ON_ALLY_DEATH', 'ON_BUY', 'ON_UPGRADE', 'ON_SHOP_REFRESH',
]);

export const TRIGGER_NAMES = {
  BATTLE_START: '战斗开始', TURN_START: '回合开始', BEFORE_ATTACK: '攻击前',
  AFTER_ATTACK: '攻击后', ON_HIT: '受击时', ON_KILL: '击杀时', ON_DEATH: '死亡时',
  ON_ALLY_DEATH: '友方死亡', PREPARE_PHASE: '准备阶段', ON_BUY: '购买时',
  ON_UPGRADE: '合成升星', ON_SHOP_REFRESH: '刷新商店',
};

export function getSkillType(trigger) {
  return PASSIVE_TRIGGERS.has(trigger) ? 'passive' : 'active';
}

export function getElementMultiplier(attackerElement, defenderElement) {
  return ELEMENT_DAMAGE_MATRIX[attackerElement]?.[defenderElement] ?? 1.0;
}

export function getElementRelation(attackerElement, defenderElement) {
  const mul = getElementMultiplier(attackerElement, defenderElement);
  if (mul > 1.0) return 'strong';
  if (mul < 1.0) return 'weak';
  return 'neutral';
}

export function getElementRelationText(attackerElement, defenderElement, elementNames) {
  const mul = getElementMultiplier(attackerElement, defenderElement);
  const atk = elementNames[attackerElement] || attackerElement;
  const def = elementNames[defenderElement] || defenderElement;
  if (mul > 1.0) return `${atk} 克制 ${def}（×${mul}）`;
  if (mul < 1.0) return `${atk} 被 ${def} 克制（×${mul}）`;
  return `${atk} vs ${def}（无克制）`;
}

export const ELEMENT_BOND_NAMES = {
  fire: '火之热情', water: '水之宁静', grass: '草之生长', electric: '电之疾驰',
  wind: '风之自由', earth: '土之坚韧', light: '光之祝福', dark: '暗之诅咒',
};

export function countTeamElements(cards) {
  const counts = {};
  for (const c of cards.filter(Boolean)) {
    counts[c.element] = (counts[c.element] || 0) + 1;
  }
  return counts;
}

export function summarizeActiveElementBonds(cards) {
  const counts = countTeamElements(cards);
  const active = [];
  for (const [element, count] of Object.entries(counts)) {
    const tier = getElementBondTier(count);
    if (tier) {
      active.push({ element, name: ELEMENT_BOND_NAMES[element], count, tier });
    }
  }
  return active.sort((a, b) => b.count - a.count);
}
