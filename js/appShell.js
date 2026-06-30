import { ELEMENT_CHART } from './elements.js';
import { ELEMENT_NAMES } from './config.js';

export function renderElementChart(container, compact = false) {
  if (!container) return;
  container.innerHTML = ELEMENT_CHART.map(row => {
    const from = ELEMENT_NAMES[row.from];
    const to = ELEMENT_NAMES[row.to];
    const cls = row.from === 'light' || row.from === 'dark' ? 'mutual' : '';
    return `<div class="element-row ${cls} ${compact ? 'compact' : ''}">
      <span class="el el-${row.from}">${from}</span>
      <span class="el-arrow">→</span>
      <span class="el el-${row.to}">${to}</span>
    </div>`;
  }).join('');
}

export function elementBadgeHtml(element) {
  const name = ELEMENT_NAMES[element] || element;
  return `<span class="el el-${element} el-badge">${name}</span>`;
}

export function classBadgeHtml(cardClass) {
  const names = { tank: '坦', warrior: '战', assassin: '刺', mage: '法', archer: '射', support: '辅' };
  const label = names[cardClass] || cardClass;
  return `<span class="class-badge class-${cardClass}">${label}</span>`;
}

export function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.add('hidden'), duration);
}

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${name}`);
  if (target) target.classList.add('active');
}

export function getNickname() {
  return document.getElementById('input-nickname')?.value.trim() || '训练师';
}

export function setMenuError(msg) {
  const el = document.getElementById('menu-error');
  if (el) el.textContent = msg || '';
}
