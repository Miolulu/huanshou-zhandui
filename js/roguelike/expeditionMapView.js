/**
 * 净化远征 · StW 风格路线图（SVG 连线 + 网格节点）
 */
import { NODE_TYPES } from './mapGenerator.js';

function getPosWithin(el, container) {
  const parent = container.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - parent.top,
    left: rect.left - parent.left,
    width: rect.width,
    height: rect.height,
  };
}

function nodeEl(container, rowIdx, colIdx) {
  const row = container.querySelector(`.SlayMap-row[data-row="${rowIdx}"]`);
  if (!row) return null;
  return row.querySelector(`.SlayMap-node[data-col="${colIdx}"]`);
}

/** 已走过的路径段 + 当前可前往的连线 */
export function buildMapSegments(map) {
  const segments = [];
  const current = map.rows.flat().find((n) => n.id === map.currentNodeId);
  if (!current) return segments;

  let node = current;
  while (node?.parentId) {
    const parent = map.rows.flat().find((n) => n.id === node.parentId);
    if (parent) {
      segments.push({ from: parent, to: node, kind: 'taken' });
      node = parent;
    } else break;
  }

  if (current.cleared || current.type === NODE_TYPES.START) {
    const nextRow = map.rows[current.row + 1];
    if (nextRow) {
      nextRow.filter((n) => n.available && !n.cleared).forEach((n) => {
        segments.push({ from: current, to: n, kind: 'available' });
      });
    }
  }

  return segments;
}

export function drawMapPaths(container, map) {
  if (!container || !map) return;
  container.querySelectorAll('svg.SlayMap-paths').forEach((el) => el.remove());

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('SlayMap-paths');
  svg.setAttribute('aria-hidden', 'true');
  container.appendChild(svg);

  const segments = buildMapSegments(map);
  segments.forEach(({ from, to, kind }) => {
    const aEl = nodeEl(container, from.row, from.col);
    const bEl = nodeEl(container, to.row, to.col);
    if (!aEl || !bEl) return;

    const aPos = getPosWithin(aEl, container);
    const bPos = getPosWithin(bEl, container);
    if (!aPos.width || !bPos.width) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(aPos.left + aPos.width / 2));
    line.setAttribute('y1', String(aPos.top + aPos.height / 2));
    line.setAttribute('x2', String(bPos.left + bPos.width / 2));
    line.setAttribute('y2', String(bPos.top + bPos.height / 2));
    line.dataset.kind = kind;
    svg.appendChild(line);

    aEl.setAttribute('data-linked', 'true');
    bEl.setAttribute('data-linked', 'true');
  });
}

/**
 * @param {object} state
 * @param {boolean} interactive
 */
export function renderExpeditionMapHtml(state, interactive = true) {
  const rows = state.map.rows;
  const maxCols = Math.max(...rows.map((r) => r.length));

  const rowHtml = rows.map((row, ri) => {
    const nodes = row.map((n) => {
      const isCurrent = n.id === state.map.currentNodeId;
      const canVisit = interactive && n.available && !n.cleared;
      const cls = [
        'SlayMap-node',
        'purify-node',
        n.type === 'boss' ? 'boss-node' : '',
        n.cleared ? 'cleared did-visit' : '',
        n.available ? 'available' : '',
        isCurrent ? 'current' : '',
        canVisit ? 'can-visit' : '',
        n.type ? 'has-type' : '',
      ].filter(Boolean).join(' ');

      const disabled = !canVisit;
      return `<button type="button" class="${cls}"
        data-type="${n.type || ''}"
        data-node="${n.id}"
        data-row="${ri}"
        data-col="${n.col}"
        ${isCurrent ? 'data-current="true"' : ''}
        ${n.cleared ? 'data-did-visit="true"' : ''}
        ${canVisit ? 'data-can-visit="true"' : ''}
        title="${n.label}"
        ${disabled ? 'disabled' : ''}>
        <span class="purify-node-icon">${n.icon}</span>
        <span class="purify-node-label">${n.label}</span>
      </button>`;
    }).join('');

    const colCount = row.length === 1 ? maxCols : maxCols;
    const single = row.length === 1 ? ' SlayMap-row--single' : '';
    return `<div class="SlayMap-row purify-path-row${single}" data-row="${ri}" style="--row-cols:${colCount}">${nodes}</div>`;
  }).join('');

  return `<div class="SlayMap purify-path" style="--rows:${rows.length};--columns:${maxCols}">${rowHtml}</div>`;
}

export function mountExpeditionMap(container, state, interactive = true) {
  container.innerHTML = renderExpeditionMapHtml(state, interactive);
  const mapEl = container.querySelector('.SlayMap');
  if (!mapEl) return;

  const redraw = () => drawMapPaths(mapEl, state.map);
  requestAnimationFrame(redraw);

  if (!mapEl._resizeObs) {
    mapEl._resizeObs = new ResizeObserver(() => redraw());
    mapEl._resizeObs.observe(mapEl);
  }
}
