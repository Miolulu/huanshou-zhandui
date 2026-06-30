/** 羁绊说明与图鉴（战斗中展示） */
import { ELEMENT_NAMES } from './config.js';
import { ELEMENT_CHART } from './elements.js';
import { CLASS_NAMES } from './classes.js';
import { COMBO_BONDS, summarizeActiveComboBonds, formatComboEffect } from './comboBonds.js';
import { elementBadgeHtml, classBadgeHtml } from './appShell.js';

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
  const featured = COMBO_BONDS.filter(b =>
    ['fire_warrior', 'fire_mage', 'water_tank', 'grass_support', 'electric_assassin',
      'wind_archer', 'earth_tank', 'light_support', 'dark_mage', 'fire_assassin',
      'water_mage', 'grass_warrior'].includes(b.id)
  );

  const comboBlocks = featured.map(bond => {
    const eff2 = formatComboEffect(bond.getEffect(2));
    const eff4 = formatComboEffect(bond.getEffect(4));
    return `<div class="bond-guide-block">
      <h4>${elementBadgeHtml(bond.element)} ${classBadgeHtml(bond.class)} ${bond.name}</h4>
      <ul class="bond-tier-list">
        <li><strong>2名</strong>：${eff2}</li>
        <li><strong>4名</strong>：${eff4}</li>
      </ul>
    </div>`;
  }).join('');

  return `
    <div class="bond-guide-section">
      <h3>属性克制</h3>
      <p class="hint">克制 ×1.5 · 被克 ×0.7（战斗伤害计算，非羁绊）</p>
      <div class="element-chart compact">${renderElementCounterChart(true)}</div>
    </div>
    <div class="bond-guide-section">
      <h3>组合羁绊（主羁绊）</h3>
      <p class="hint">同属性 + 同职业 同时满足才计数。例：2名火战士激活「炽战·火战士」，4名强化。</p>
      <div class="bond-guide-grid">${comboBlocks}</div>
    </div>
    <div class="bond-guide-section">
      <h3>职业共鸣（辅助）</h3>
      <p class="hint">同职业达到 4/6 名时全队获得较弱加成（约为组合羁绊的 35%）。</p>
    </div>`;
}

export function renderActiveBondsBattle(cards) {
  const combos = summarizeActiveComboBonds(cards);
  if (!combos.length) {
    return '<p class="hint">当前阵容未激活组合羁绊（需要同属性+同职业）</p>';
  }

  const html = combos.map(b => `<div class="active-bond-card bond-combo">
      ${elementBadgeHtml(b.element)} ${classBadgeHtml(b.class)}
      <strong>${b.name}</strong> ×${b.count}
      <span class="bond-effect">${formatComboEffect(b.effect)}</span>
    </div>`).join('');

  return `<div class="active-bonds-list">${html}</div>`;
}
