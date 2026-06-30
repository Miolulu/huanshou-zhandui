/** 羁绊说明与图鉴（战斗中展示） */
import { ELEMENT_NAMES } from './config.js';
import { ELEMENT_CHART } from './elements.js';
import {
  CLASS_NAMES, CLASS_BOND_NAMES, CLASS_BOND_EFFECTS,
  summarizeActiveClassBonds,
} from './classes.js';
import { COMBO_BONDS, summarizeActiveComboBonds, formatComboEffect } from './comboBonds.js';
import { ORIGIN_BONDS, summarizeActiveOriginBonds, formatOriginEffect, originBondLabel } from './originBonds.js';
import { elementBadgeHtml, classBadgeHtml } from './appShell.js';

const CLASS_RESONANCE_SCALE = 0.35;

function scaleEffect(effect, scale = 1) {
  const out = {};
  for (const [k, v] of Object.entries(effect || {})) {
    out[k] = typeof v === 'number' ? v * scale : v;
  }
  return out;
}

function formatClassResonance(cls, tier) {
  const raw = CLASS_BOND_EFFECTS[cls]?.[tier];
  if (!raw) return '无加成';
  return formatComboEffect(scaleEffect(raw, CLASS_RESONANCE_SCALE));
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

function renderComboBondBlock(bond) {
  const eff2 = formatComboEffect(bond.getEffect(2));
  const eff4 = formatComboEffect(bond.getEffect(4));
  return `<div class="bond-guide-block bond-guide-combo">
    <h4>${elementBadgeHtml(bond.element)} ${classBadgeHtml(bond.class)} ${bond.name}</h4>
    <ul class="bond-tier-list">
      <li><strong>2名</strong>：${eff2 || '—'}</li>
      <li><strong>4名</strong>：${eff4 || '—'}</li>
    </ul>
  </div>`;
}

export function renderBondGuideHTML() {
  const elementGroups = Object.keys(ELEMENT_NAMES).map(element => {
    const bonds = COMBO_BONDS.filter(b => b.element === element);
    const blocks = bonds.map(renderComboBondBlock).join('');
    return `<div class="bond-guide-element-group">
      <h4 class="bond-element-title">${elementBadgeHtml(element)} ${ELEMENT_NAMES[element]}系组合</h4>
      <div class="bond-guide-grid">${blocks}</div>
    </div>`;
  }).join('');

  const classBlocks = Object.entries(CLASS_BOND_NAMES).map(([cls, bondName]) => {
    const eff4 = formatClassResonance(cls, 4);
    const eff6 = formatClassResonance(cls, 6);
    return `<div class="bond-guide-block">
      <h4>${classBadgeHtml(cls)} ${CLASS_NAMES[cls]} · ${bondName}</h4>
      <ul class="bond-tier-list">
        <li><strong>4名</strong>：${eff4}</li>
        <li><strong>6名</strong>：${eff6}</li>
      </ul>
    </div>`;
  }).join('');

  return `
    <div class="bond-guide-section">
      <h3>属性克制</h3>
      <p class="hint">克制 ×1.5 · 被克 ×0.7（仅影响战斗伤害，不属于羁绊加成）</p>
      <div class="element-chart compact">${renderElementCounterChart(true)}</div>
    </div>
    <div class="bond-guide-section">
      <h3>组合羁绊（主羁绊）</h3>
      <p class="hint">必须<strong>同属性 + 同职业</strong>才计入。例：场上 2 名「火属性战士」激活「炽战·火战士」；凑满 4 名同组合则强化。</p>
      <p class="hint bond-guide-note">共 8 属性 × 8 职业组合羁绊；5费传说三星为最强单体。</p>
      ${elementGroups}
    </div>
    <div class="bond-guide-section">
      <h3>起源羁绊（跨元素创新）</h3>
      <p class="hint">星火(火+雷) · 潮汐(水+风) · 森土(草+土) · 影光(暗+光)。双属性计数，2/4（影光2/3）激活。</p>
      <div class="bond-guide-grid">${ORIGIN_BONDS.map(b => `<div class="bond-guide-block">
        <h4>${b.name}</h4>
        <ul class="bond-tier-list">${b.thresholds.map(t => `<li><strong>${t}名</strong>：${formatOriginEffect(b.getEffect(t))}</li>`).join('')}</ul>
      </div>`).join('')}</div>
    </div>
    <div class="bond-guide-section">
      <h3>职业共鸣（辅助羁绊）</h3>
      <p class="hint">仅统计同职业数量（不限属性）。4/6 名时全队获得较弱加成，约为组合羁绊强度的 35%。</p>
      <div class="bond-guide-grid">${classBlocks}</div>
    </div>`;
}

export function renderActiveBondsBattle(cards) {
  const combos = summarizeActiveComboBonds(cards);
  const origins = summarizeActiveOriginBonds(cards);
  const classBonds = summarizeActiveClassBonds(cards).filter(b => b.tier >= 4);

  if (!combos.length && !origins.length && !classBonds.length) {
    return '<p class="hint">当前阵容未激活羁绊。主羁绊需同属性+同职业（2/4）；起源看跨元素组合。</p>';
  }

  const comboHtml = combos.map(b => `<div class="active-bond-card bond-combo">
      ${elementBadgeHtml(b.element)} ${classBadgeHtml(b.class)}
      <strong>${b.name}</strong> ×${b.count}
      <span class="bond-effect">${formatComboEffect(b.effect)}</span>
    </div>`).join('');

  const originHtml = origins.map(b => `<div class="active-bond-card bond-origin">
      <strong>${originBondLabel(b)}</strong> ×${b.count}
      <span class="bond-effect">${formatOriginEffect(b.effect)}</span>
    </div>`).join('');

  const classHtml = classBonds.map(b => {
    const raw = CLASS_BOND_EFFECTS[b.class]?.[b.tier];
    const detail = formatComboEffect(scaleEffect(raw, CLASS_RESONANCE_SCALE));
    return `<div class="active-bond-card bond-class">
      ${classBadgeHtml(b.class)}
      <strong>${b.name}</strong> ×${b.count} <span class="bond-sub">职业共鸣</span>
      <span class="bond-effect">${detail}</span>
    </div>`;
  }).join('');

  return `<div class="active-bonds-list">${comboHtml}${originHtml}${classHtml}</div>`;
}
