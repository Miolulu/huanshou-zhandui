/** 元素×职业 组合羁绊（主羁绊体系） */
import { ELEMENT_NAMES } from './config.js';
import { CLASS_NAMES } from './classes.js';

const ELEMENT_FLAVOR = {
  fire: '炽', water: '潮', grass: '翠', electric: '雷', wind: '岚', earth: '岩', light: '圣', dark: '影',
};

const CLASS_FLAVOR = {
  tank: '卫', warrior: '战', assassin: '刺', mage: '术', archer: '弓', support: '灵',
};

/** 组合羁绊效果：2人激活基础，4人激活强化 */
function comboEffects(element, cls, tier) {
  const strong = tier >= 4;
  const base = {
    tank: { teamShieldPct: strong ? 0.18 : 0.10, teamDefPct: strong ? 0.12 : 0.06 },
    warrior: { teamAtkPct: strong ? 0.20 : 0.12, teamCrit: strong ? 0.08 : 0 },
    assassin: { assassinCrit: strong ? 0.28 : 0.15, assassinSpdPct: strong ? 0.15 : 0.08 },
    mage: { mageSkillDmg: strong ? 0.35 : 0.18, mageSkillRate: strong ? 0.12 : 0 },
    archer: { archerAtkPct: strong ? 0.30 : 0.18 },
    support: { supportSkillMul: strong ? 0.30 : 0.18, teamHealPct: strong ? 0.12 : 0.06 },
  }[cls] || { teamAtkPct: strong ? 0.12 : 0.06 };

  const elemental = {
    fire: { teamAtkPct: strong ? 0.08 : 0.04 },
    water: { teamDefPct: strong ? 0.10 : 0.05 },
    grass: { teamHealPct: strong ? 0.10 : 0.05 },
    electric: { assassinSpdPct: strong ? 0.10 : 0.05, mageSkillRate: strong ? 0.08 : 0 },
    wind: { teamCrit: strong ? 0.10 : 0.05 },
    earth: { teamShieldPct: strong ? 0.10 : 0.05 },
    light: { supportSkillMul: strong ? 0.10 : 0.05 },
    dark: { mageSkillDmg: strong ? 0.10 : 0.05, lowHpDmgBonus: strong ? 0.15 : 0.08 },
  }[element] || {};

  return { ...base, ...elemental };
}

export const COMBO_BONDS = [];
for (const element of Object.keys(ELEMENT_FLAVOR)) {
  for (const cls of Object.keys(CLASS_FLAVOR)) {
    const id = `${element}_${cls}`;
    const elName = ELEMENT_NAMES[element] || element;
    const clsName = CLASS_NAMES[cls] || cls;
    COMBO_BONDS.push({
      id,
      element,
      class: cls,
      name: `${ELEMENT_FLAVOR[element]}${CLASS_FLAVOR[cls]}·${elName}${clsName}`,
      desc: `场上${elName}属性${clsName}达到指定数量`,
      thresholds: [2, 4],
      getEffect(tier) {
        return comboEffects(element, cls, tier);
      },
    });
  }
}

export function countComboBonds(cards) {
  const counts = {};
  for (const c of cards.filter(Boolean)) {
    const key = `${c.element}_${c.cardClass || c.class}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function getComboBondTier(count) {
  if (count >= 4) return 4;
  if (count >= 2) return 2;
  return 0;
}

export function getComboBondDefinition(element, cardClass) {
  const id = `${element}_${cardClass}`;
  return COMBO_BONDS.find(b => b.id === id);
}

export function summarizeActiveComboBonds(cards) {
  const counts = countComboBonds(cards);
  const active = [];
  for (const bond of COMBO_BONDS) {
    const count = counts[bond.id] || 0;
    const tier = getComboBondTier(count);
    if (!tier) continue;
    active.push({
      ...bond,
      count,
      tier,
      effect: bond.getEffect(tier),
    });
  }
  return active.sort((a, b) => b.tier - a.tier || b.count - a.count);
}

export function summarizeBondProgress(cards) {
  const counts = countComboBonds(cards);
  const progress = [];
  for (const [key, count] of Object.entries(counts)) {
    if (count === 0) continue;
    const bond = COMBO_BONDS.find(b => b.id === key);
    if (!bond) continue;
    const tier = getComboBondTier(count);
    const next = tier < 2 ? 2 : tier < 4 ? 4 : null;
    progress.push({ bond, count, tier, next });
  }
  return progress.sort((a, b) => (b.tier || 0) - (a.tier || 0) || b.count - a.count);
}

export function formatComboEffect(effect) {
  if (!effect) return '';
  const parts = [];
  const pct = v => `${Math.round(v * 100)}%`;
  if (effect.teamAtkPct) parts.push(`攻击+${pct(effect.teamAtkPct)}`);
  if (effect.teamDefPct) parts.push(`防御+${pct(effect.teamDefPct)}`);
  if (effect.teamShieldPct) parts.push(`护盾+${pct(effect.teamShieldPct)}`);
  if (effect.teamCrit) parts.push(`暴击+${pct(effect.teamCrit)}`);
  if (effect.teamHealPct) parts.push(`治疗+${pct(effect.teamHealPct)}`);
  if (effect.assassinCrit) parts.push(`刺客暴击+${pct(effect.assassinCrit)}`);
  if (effect.assassinSpdPct) parts.push(`刺客速度+${pct(effect.assassinSpdPct)}`);
  if (effect.mageSkillDmg) parts.push(`法术+${pct(effect.mageSkillDmg)}`);
  if (effect.mageSkillRate) parts.push(`技能率+${pct(effect.mageSkillRate)}`);
  if (effect.archerAtkPct) parts.push(`射手攻击+${pct(effect.archerAtkPct)}`);
  if (effect.supportSkillMul) parts.push(`辅助+${pct(effect.supportSkillMul)}`);
  if (effect.lowHpDmgBonus) parts.push(`斩杀+${pct(effect.lowHpDmgBonus)}`);
  return parts.join(' · ');
}
