/** Vol.3 Tooltip — 统一悬浮提示（禁止浏览器 title） */

function parseTooltipData(el) {
  const raw = el.dataset.tooltip;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { title: raw, desc: '' };
  }
}

function renderTooltipHtml(data) {
  const rows = [];
  if (data.title) rows.push(`<div class="tooltip__title">${data.title}</div>`);
  if (data.desc) rows.push(`<div class="tooltip__desc">${data.desc}</div>`);
  if (data.stats) rows.push(`<div class="tooltip__stats">${data.stats}</div>`);
  if (data.duration != null) rows.push(`<div class="tooltip__meta">持续 ${data.duration} 回合</div>`);
  if (data.cost != null) rows.push(`<div class="tooltip__meta">费用 ${data.cost} 金</div>`);
  return rows.join('');
}

export class TooltipManager {
  constructor(rootId = 'tooltip-root') {
    this.root = document.getElementById(rootId);
    if (!this.root) {
      this.root = document.createElement('div');
      this.root.id = rootId;
      this.root.className = 'tooltip-root';
      (document.getElementById('dialog-root') || document.body).appendChild(this.root);
    }
    this.el = document.createElement('div');
    this.el.className = 'tooltip hidden';
    this.el.setAttribute('role', 'tooltip');
    this.root.appendChild(this.el);
    this._target = null;
    this._onMove = this._onMove.bind(this);
  }

  bind(container) {
    if (!container) return;
    container.querySelectorAll('[data-tooltip]').forEach((node) => {
      if (node._tooltipBound) return;
      node._tooltipBound = true;
      node.removeAttribute('title');
      node.addEventListener('mouseenter', (e) => this.show(e.currentTarget));
      node.addEventListener('mouseleave', () => this.hide());
      node.addEventListener('focus', (e) => this.show(e.currentTarget));
      node.addEventListener('blur', () => this.hide());
    });
  }

  show(target) {
    const data = parseTooltipData(target);
    if (!data) return;
    this._target = target;
    this.el.innerHTML = renderTooltipHtml(data);
    this.el.classList.remove('hidden');
    this.el.classList.add('tooltip--visible');
    this._position();
    document.addEventListener('mousemove', this._onMove);
  }

  hide() {
    this._target = null;
    this.el.classList.add('hidden');
    this.el.classList.remove('tooltip--visible');
    document.removeEventListener('mousemove', this._onMove);
  }

  _onMove() {
    if (this._target) this._position();
  }

  _position() {
    if (!this._target) return;
    const rect = this._target.getBoundingClientRect();
    const tip = this.el.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tip.width / 2;
    let top = rect.top - tip.height - 10;
    if (top < 8) top = rect.bottom + 10;
    left = Math.max(8, Math.min(left, window.innerWidth - tip.width - 8));
    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  }
}
