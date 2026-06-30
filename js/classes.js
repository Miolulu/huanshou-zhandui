/** 职业体系与羁绊 */

export const CLASS_NAMES = {
  tank: '坦克',
  warrior: '战士',
  assassin: '刺客',
  mage: '法师',
  archer: '射手',
  support: '辅助',
  ranger: '游侠',
  guardian: '守护',
};

export const CLASS_BOND_NAMES = {
  tank: '铁壁防线',
  warrior: '无畏战意',
  assassin: '致命影袭',
  mage: '元素掌控',
  archer: '精准射击',
  support: '神圣庇护',
  ranger: '疾风猎手',
  guardian: '圣盾同盟',
};

export function getClassBondTier(count) {
  if (count >= 6) return 6;
  if (count >= 4) return 4;
  if (count >= 2) return 2;
  return 0;
}

/** 各职业羁绊阈值效果（文档 4.2） */
export const CLASS_BOND_EFFECTS = {
  tank: {
    2: { teamShieldPct: 0.10 },
    4: { teamShieldPct: 0.20, teamDefPct: 0.10 },
    6: { teamShieldPct: 0.30, teamDefPct: 0.20, tankTauntChance: 0.5 },
  },
  warrior: {
    2: { teamAtkPct: 0.10 },
    4: { teamAtkPct: 0.20, teamCrit: 0.10 },
    6: { teamAtkPct: 0.30, teamCrit: 0.20, warriorLifesteal: 0.20 },
  },
  assassin: {
    2: { assassinCrit: 0.20 },
    4: { assassinCrit: 0.30, assassinSpdPct: 0.20 },
    6: { assassinCrit: 0.40, assassinSpdPct: 0.30, assassinAtkPct: 0.15, lowHpDmgBonus: 0.30 },
  },
  mage: {
    2: { mageSkillDmg: 0.20 },
    4: { mageSkillDmg: 0.30, mageSkillRate: 0.20 },
    6: { mageSkillDmg: 0.40, mageSkillRate: 0.30, mageCdReduce: 0.15, mageSilenceChance: 0.20 },
  },
  archer: {
    2: { archerAtkPct: 0.20 },
    4: { archerAtkPct: 0.30 },
    6: { archerAtkPct: 0.40 },
  },
  support: {
    2: { supportSkillMul: 0.20 },
    4: { supportSkillMul: 0.30, teamHealPct: 0.10 },
    6: { supportSkillMul: 0.40, teamHealPct: 0.20, teamShieldPct: 0.15 },
  },
  ranger: {
    2: { archerAtkPct: 0.15, teamCrit: 0.05 },
    4: { archerAtkPct: 0.22, assassinSpdPct: 0.10 },
    6: { archerAtkPct: 0.30, teamCrit: 0.12, assassinSpdPct: 0.15 },
  },
  guardian: {
    2: { teamShieldPct: 0.12 },
    4: { teamShieldPct: 0.20, teamDefPct: 0.08 },
    6: { teamShieldPct: 0.28, teamDefPct: 0.15, tankTauntChance: 0.25 },
  },
};

export function getClassBondEffect(cardClass, count) {
  const tier = getClassBondTier(count);
  if (!tier) return null;
  return CLASS_BOND_EFFECTS[cardClass]?.[tier] || null;
}

export function countTeamClasses(cards) {
  const counts = {};
  for (const c of cards.filter(Boolean)) {
    const cls = c.cardClass;
    if (!cls) continue;
    counts[cls] = (counts[cls] || 0) + 1;
  }
  return counts;
}

export function summarizeActiveClassBonds(cards) {
  const counts = countTeamClasses(cards);
  const active = [];
  for (const [cls, count] of Object.entries(counts)) {
    const tier = getClassBondTier(count);
    if (tier) {
      active.push({ class: cls, name: CLASS_BOND_NAMES[cls], count, tier });
    }
  }
  return active.sort((a, b) => b.tier - a.tier || b.count - a.count);
}
