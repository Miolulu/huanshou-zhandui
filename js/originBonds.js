/** 起源羁绊：跨元素组合（创新羁绊层） */
import { ELEMENT_NAMES } from './config.js';

export const ORIGIN_BONDS = [
  {
    id: 'origin_storm',
    name: '星火起源',
    elements: ['fire', 'electric'],
    thresholds: [2, 4],
    desc: '火+雷属性幻兽',
    getEffect(tier) {
      const s = tier >= 4;
      return {
        teamAtkPct: s ? 0.14 : 0.08,
        mageSkillRate: s ? 0.10 : 0.05,
        teamCrit: s ? 0.08 : 0,
      };
    },
  },
  {
    id: 'origin_tide',
    name: '潮汐起源',
    elements: ['water', 'wind'],
    thresholds: [2, 4],
    desc: '水+风属性幻兽',
    getEffect(tier) {
      const s = tier >= 4;
      return {
        teamDefPct: s ? 0.12 : 0.06,
        teamHealPct: s ? 0.10 : 0.05,
      };
    },
  },
  {
    id: 'origin_nature',
    name: '森土起源',
    elements: ['grass', 'earth'],
    thresholds: [2, 4],
    desc: '草+土属性幻兽',
    getEffect(tier) {
      const s = tier >= 4;
      return {
        teamShieldPct: s ? 0.14 : 0.08,
        supportSkillMul: s ? 0.12 : 0.06,
      };
    },
  },
  {
    id: 'origin_void',
    name: '影光起源',
    elements: ['dark', 'light'],
    thresholds: [2, 3],
    desc: '暗+光属性幻兽（对立共鸣）',
    getEffect(tier) {
      const s = tier >= 3;
      return {
        mageSkillDmg: s ? 0.18 : 0.10,
        lowHpDmgBonus: s ? 0.15 : 0.08,
      };
    },
  },
];

export function countOriginBonds(cards) {
  const counts = {};
  for (const bond of ORIGIN_BONDS) {
    counts[bond.id] = cards.filter(c => c && bond.elements.includes(c.element)).length;
  }
  return counts;
}

export function getOriginBondTier(bond, count) {
  const tiers = [...bond.thresholds].sort((a, b) => b - a);
  for (const t of tiers) {
    if (count >= t) return t;
  }
  return 0;
}

export function summarizeActiveOriginBonds(cards) {
  const list = cards.filter(Boolean);
  const active = [];
  for (const bond of ORIGIN_BONDS) {
    const count = list.filter(c => bond.elements.includes(c.element)).length;
    const tier = getOriginBondTier(bond, count);
    if (!tier) continue;
    active.push({ ...bond, count, tier, effect: bond.getEffect(tier) });
  }
  return active.sort((a, b) => b.tier - a.tier || b.count - a.count);
}

export function formatOriginEffect(effect) {
  if (!effect) return '';
  const parts = [];
  const pct = v => `${Math.round(v * 100)}%`;
  if (effect.teamAtkPct) parts.push(`攻击+${pct(effect.teamAtkPct)}`);
  if (effect.teamDefPct) parts.push(`防御+${pct(effect.teamDefPct)}`);
  if (effect.teamShieldPct) parts.push(`护盾+${pct(effect.teamShieldPct)}`);
  if (effect.teamHealPct) parts.push(`治疗+${pct(effect.teamHealPct)}`);
  if (effect.teamCrit) parts.push(`暴击+${pct(effect.teamCrit)}`);
  if (effect.mageSkillDmg) parts.push(`法术+${pct(effect.mageSkillDmg)}`);
  if (effect.mageSkillRate) parts.push(`技能率+${pct(effect.mageSkillRate)}`);
  if (effect.supportSkillMul) parts.push(`辅助+${pct(effect.supportSkillMul)}`);
  if (effect.lowHpDmgBonus) parts.push(`斩杀+${pct(effect.lowHpDmgBonus)}`);
  return parts.join(' · ');
}

export function originBondLabel(bond) {
  const els = bond.elements.map(e => ELEMENT_NAMES[e]).join('+');
  return `${bond.name}（${els}）`;
}
