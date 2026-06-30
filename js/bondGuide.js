/** 羁绊说明与图鉴（战斗中展示） */
import { ELEMENT_NAMES } from './config.js';
import { ELEMENT_CHART, ELEMENT_BOND_TIERS, ELEMENT_BOND_NAMES, summarizeActiveElementBonds } from './elements.js';
import { CLASS_BOND_NAMES, CLASS_BOND_EFFECTS, CLASS_NAMES, summarizeActiveClassBonds } from './classes.js';
import { elementBadgeHtml } from './appShell.js';

function pct(v) {
  return `${Math.round((v || 0) * 100)}%`;
}

function formatElementTierLine(count, tier) {
  const parts = [];
  if (tier.atk) parts.push(`攻击+${pct(tier.atk)}`);
  if (tier.hp) parts.push(`生命+${pct(tier.hp)}`);
  if (tier.def) parts.push(`防御+${pct(tier.def)}`);
  if (tier.spd) parts.push(`速度+${pct(tier.spd)}`);
  if (tier.crit) parts.push(`暴击+${pct(tier.crit)}`);
  return `<li><strong>${count}只</strong>：${parts.join(' · ') || '无加成'}</li>`;
}

function formatClassEffect(cls, tier) {
  const eff = CLASS_BOND_EFFECTS[cls]?.[tier];
  if (!eff) return '无加成';
  const parts = [];
  if (eff.teamAtkPct) parts.push(`全队攻击+${pct(eff.teamAtkPct)}`);
  if (eff.teamDefPct) parts.push(`全队防御+${pct(eff.teamDefPct)}`);
  if (eff.teamShieldPct) parts.push(`护盾+${pct(eff.teamShieldPct)}`);
  if (eff.teamCrit) parts.push(`暴击+${pct(eff.teamCrit)}`);
  if (eff.teamHealPct) parts.push(`治疗+${pct(eff.teamHealPct)}`);
  if (eff.assassinCrit) parts.push(`刺客暴击+${pct(eff.assassinCrit)}`);
  if (eff.assassinSpdPct) parts.push(`刺客速度+${pct(eff.assassinSpdPct)}`);
  if (eff.assassinAtkPct) parts.push(`刺客攻击+${pct(eff.assassinAtkPct)}`);
  if (eff.lowHpDmgBonus) parts.push(`低血伤害+${pct(eff.lowHpDmgBonus)}`);
  if (eff.mageSkillDmg) parts.push(`法术伤害+${pct(eff.mageSkillDmg)}`);
  if (eff.mageSkillRate) parts.push(`技能触发+${pct(eff.mageSkillRate)}`);
  if (eff.mageCdReduce) parts.push(`冷却-${pct(eff.mageCdReduce)}`);
  if (eff.mageSilenceChance) parts.push(`沉默${pct(eff.mageSilenceChance)}`);
  if (eff.archerAtkPct) parts.push(`射手攻击+${pct(eff.archerAtkPct)}`);
  if (eff.supportSkillMul) parts.push(`辅助效果+${pct(eff.supportSkillMul)}`);
  if (eff.warriorLifesteal) parts.push(`战士吸血+${pct(eff.warriorLifesteal)}`);
  if (eff.tankTauntChance) parts.push(`嘲讽${pct(eff.tankTauntChance)}`);
  return parts.join(' · ') || '特殊效果';
}

export function renderElementCounterChart(compact = true) {
  return ELEMENT_CHART.map(row => {
    const from = ELEMENT_NAMES[row.from];
    const to = ELEMENT_NAMES[row.to];
    const cls = row.from === 'light' || row.from === 'dark' ? 'mutual' : '';
    return `<div class="element-row ${cls} ${compact ? 'compact' : ''}">
      <span class="el el-${row.from}">${from}</span>
      <span class="el-arrow">→</span>
      <span class="el el-${row.to}">${to}</span>
      <span class="el-mul">×1.5</span>
    </div>`;
  }).join('');
}

export function renderBondGuideHTML() {
  const elementBlocks = Object.entries(ELEMENT_BOND_NAMES).map(([el, name]) => {
    const tiers = [7, 5, 3, 2].map(c => {
      const tier = ELEMENT_BOND_TIERS.find(t => t.count === c);
      return formatElementTierLine(c, tier);
    }).join('');
    return `<div class="bond-guide-block">
      <h4>${elementBadgeHtml(el)} ${name}</h4>
      <ul class="bond-tier-list">${tiers}</ul>
    </div>`;
  }).join('');

  const classBlocks = Object.entries(CLASS_BOND_NAMES).map(([cls, bondName]) => {
    const tiers = [2, 4, 6].map(t => {
      return `<li><strong>${t}名${CLASS_NAMES[cls]}</strong>：${formatClassEffect(cls, t)}</li>`;
    }).join('');
    return `<div class="bond-guide-block">
      <h4><span class="class-badge class-${cls}">${CLASS_NAMES[cls]}</span> ${bondName}</h4>
      <ul class="bond-tier-list">${tiers}</ul>
    </div>`;
  }).join('');

  return `
    <div class="bond-guide-section">
      <h3>属性克制</h3>
      <p class="hint">克制 ×1.5 · 被克 ×0.7 · 同属性无克制</p>
      <div class="element-chart compact">${renderElementCounterChart(true)}</div>
    </div>
    <div class="bond-guide-section">
      <h3>元素羁绊（同元素出战数量）</h3>
      <div class="bond-guide-grid">${elementBlocks}</div>
    </div>
    <div class="bond-guide-section">
      <h3>职业羁绊（同职业出战数量）</h3>
      <div class="bond-guide-grid">${classBlocks}</div>
    </div>`;
}

export function renderActiveBondsBattle(cards) {
  const elBonds = summarizeActiveElementBonds(cards);
  const clsBonds = summarizeActiveClassBonds(cards);

  if (!elBonds.length && !clsBonds.length) {
    return '<p class="hint">当前阵容未激活羁绊</p>';
  }

  const elHtml = elBonds.map(b => {
    const tier = b.tier;
    const detail = formatElementTierLine(tier.count, tier).replace(/<\/?li>/g, '');
    return `<div class="active-bond-card bond-el">
      ${elementBadgeHtml(b.element)} <strong>${b.name}</strong> ×${b.count}
      <span class="bond-effect">${detail}</span>
    </div>`;
  }).join('');

  const clsHtml = clsBonds.map(b => {
    const detail = formatClassEffect(b.class, b.tier);
    return `<div class="active-bond-card bond-class">
      <span class="class-badge class-${b.class}">${CLASS_NAMES[b.class]}</span>
      <strong>${b.name}</strong> ×${b.count}
      <span class="bond-effect">${detail}</span>
    </div>`;
  }).join('');

  return `<div class="active-bonds-list">${elHtml}${clsHtml}</div>`;
}
