/**
 * 幻兽战队 — 统一游戏术语（玩法形似自走棋，概念独立于其他作品）
 */

export const TERMS = {
  gameName: '幻兽战队',
  /** 准备阶段购物区 */
  outpost: '幻兽驿站',
  outpostHint: '野外遭遇的幻兽，点击收服加入战队',
  /** 原 tavern tier */
  exploreLevel: '探索等级',
  /** 3合1升星 */
  fusion: '融合觉醒',
  fusionHint: '3只同名同阶幻兽自动融合升阶',
  /** 三连后选卡 */
  encounter: '野性邂逅',
  encounterHint: '融合后野外出现稀有个体，选一只加入战队',
  /** 每局可用族群 */
  ecology: '本局生态',
  ecologyHint: '每场对战随机开放若干生态，驿站只刷新这些族群的幻兽',
  /** 技能触发 */
  entrySkill: '出战技',
  fallSkill: '倒下技',
  linkSkill: '连携技',
  roundSkill: '回合技',
  /** 操作 */
  release: '放生',
  keepEncounter: '留住',
  reExplore: '重新探索',
  upgradeExplore: '提升探索',
  /** 星级阶段（宝可梦式成长感） */
  starNames: { 1: '幼体', 2: '成体', 3: '觉醒体' },
  /** 左侧编队 */
  squad: '战队栏位',
  squadHint: '从左至右依次出战 · 拖拽或点击交换站位',
  /** 特色系统 */
  elementCounter: '属性克制',
  elementCounterHint: '火克草、水克火等，克制×1.5 · 被克×0.7',
  noSynergyBar: '无羁绊条，靠出战技/倒下技/站位自行研究搭配',
};

export function starStageLabel(star) {
  return TERMS.starNames[star] || `★${star}`;
}

export function formatStarDisplay(star) {
  const stage = starStageLabel(star);
  return `${'★'.repeat(star)}${'☆'.repeat(3 - star)} ${stage}`;
}
