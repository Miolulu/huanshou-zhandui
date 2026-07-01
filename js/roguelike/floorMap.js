/** 阶层 / 无限模式 · 按层生成路线选择 */
import { NODE_LORE } from './lore.js';

export const RUN_MODES = {
  EXPEDITION: 'expedition',
  TIER: 'tier',
  INFINITE: 'infinite',
};

export const TIER_MAX_FLOOR = 100;

export function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** 生成当前层的路线选项（遭遇 / 深渊 / 驿站） */
export function generateFloorChoices(floor, mode, rng = Math.random) {
  if (mode === RUN_MODES.TIER && floor >= TIER_MAX_FLOOR) {
    return [{
      id: `f${floor}_boss`,
      type: 'boss',
      floor,
      label: NODE_LORE.boss.label,
      icon: NODE_LORE.boss.icon,
    }];
  }

  const choices = [];
  const battleId = `f${floor}_battle_a`;
  choices.push({
    id: battleId,
    type: 'battle',
    floor,
    label: NODE_LORE.battle.label,
    icon: NODE_LORE.battle.icon,
  });

  if (floor % 5 === 0 || floor % 7 === 0) {
    choices.push({
      id: `f${floor}_elite`,
      type: 'elite',
      floor,
      label: NODE_LORE.elite.label,
      icon: NODE_LORE.elite.icon,
    });
  }

  if (floor % 4 === 0) {
    choices.push({
      id: `f${floor}_rest`,
      type: 'rest',
      floor,
      label: NODE_LORE.rest.label,
      icon: NODE_LORE.rest.icon,
    });
  } else {
    choices.push({
      id: `f${floor}_battle_b`,
      type: 'battle',
      floor,
      label: NODE_LORE.battle.label,
      icon: NODE_LORE.battle.icon,
    });
  }

  return choices.slice(0, 3);
}

export function nodeTier(type) {
  if (type === 'elite') return 'elite';
  if (type === 'boss') return 'boss';
  return 'normal';
}

export function modeLabel(mode) {
  if (mode === RUN_MODES.TIER) return '阶层挑战';
  if (mode === RUN_MODES.INFINITE) return '无限模式';
  return '净化远征';
}

export function modeMaxFloor(mode) {
  if (mode === RUN_MODES.TIER) return TIER_MAX_FLOOR;
  return null;
}
