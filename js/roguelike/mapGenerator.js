/** 净化远征 · 地图生成 */
import { NODE_LORE } from './lore.js';

export const NODE_TYPES = {
  START: 'start',
  BATTLE: 'battle',
  ELITE: 'elite',
  REST: 'rest',
  BOSS: 'boss',
};

const ROW_LAYOUT = [
  [{ type: NODE_TYPES.START }],
  [{ type: NODE_TYPES.BATTLE }, { type: NODE_TYPES.BATTLE }],
  [{ type: NODE_TYPES.BATTLE }, { type: NODE_TYPES.ELITE }],
  [{ type: NODE_TYPES.REST }, { type: NODE_TYPES.BATTLE }],
  [{ type: NODE_TYPES.ELITE }, { type: NODE_TYPES.BATTLE }],
  [{ type: NODE_TYPES.REST }, { type: NODE_TYPES.BATTLE }],
  [{ type: NODE_TYPES.BOSS }],
];

export function generateMap(seed = Date.now()) {
  let s = seed;
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  const rows = ROW_LAYOUT.map((row, rowIdx) =>
    row.map((node, colIdx) => ({
      id: `n_${rowIdx}_${colIdx}`,
      row: rowIdx,
      col: colIdx,
      type: node.type,
      cleared: node.type === NODE_TYPES.START,
      available: rowIdx === 1,
      label: nodeLabel(node.type),
      icon: nodeIcon(node.type),
    }))
  );

  return {
    seed,
    rows,
    currentRow: 0,
    currentNodeId: rows[0][0].id,
  };
}

function nodeLabel(type) {
  const map = {
    [NODE_TYPES.START]: NODE_LORE.start.label,
    [NODE_TYPES.BATTLE]: NODE_LORE.battle.label,
    [NODE_TYPES.ELITE]: NODE_LORE.elite.label,
    [NODE_TYPES.REST]: NODE_LORE.rest.label,
    [NODE_TYPES.BOSS]: NODE_LORE.boss.label,
  };
  return map[type] || type;
}

function nodeIcon(type) {
  const map = {
    [NODE_TYPES.START]: NODE_LORE.start.icon,
    [NODE_TYPES.BATTLE]: NODE_LORE.battle.icon,
    [NODE_TYPES.ELITE]: NODE_LORE.elite.icon,
    [NODE_TYPES.REST]: NODE_LORE.rest.icon,
    [NODE_TYPES.BOSS]: NODE_LORE.boss.icon,
  };
  return map[type] || '●';
}

export function getNode(map, nodeId) {
  for (const row of map.rows) {
    const n = row.find((x) => x.id === nodeId);
    if (n) return n;
  }
  return null;
}

export function getAvailableNodes(map) {
  const nextRow = map.currentRow + 1;
  if (nextRow >= map.rows.length) return [];
  return map.rows[nextRow].filter((n) => n.available);
}

export function selectNode(map, nodeId) {
  const node = getNode(map, nodeId);
  if (!node || !node.available) return false;

  map.rows[node.row].forEach((n) => {
    if (n.id !== nodeId) {
      n.available = false;
    }
  });

  node.cleared = true;
  map.currentNodeId = nodeId;
  map.currentRow = node.row;
  const nextRow = node.row + 1;
  if (nextRow < map.rows.length) {
    map.rows[nextRow].forEach((n) => { n.available = true; });
  }
  return true;
}

export function isRunComplete(map) {
  const node = getNode(map, map.currentNodeId);
  return node?.type === NODE_TYPES.BOSS && node.cleared;
}

export function nodeTier(type) {
  if (type === NODE_TYPES.ELITE) return 'elite';
  if (type === NODE_TYPES.BOSS) return 'boss';
  return 'normal';
}
