/** 幻兽净化师 · 世界观与游戏名词（替代杀戮尖塔术语） */

export const TERMS = {
  // 身份与模式
  playerRole: '幻兽净化师',
  runName: '净化远征',
  soloTag: '单机净化',
  modeDesc: '深入污染地带，以净化技法驱散污秽，让幻兽恢复理智',

  // 资源（替代 HP / 能量 / 金币 / 牌组）
  mind: '心神',
  spirit: '灵力',
  exploreCoin: '探索币',
  codex: '净化秘典',
  codexShort: '秘典',

  // 牌堆（替代 抽牌堆 / 弃牌堆 / 手牌 / 消耗堆）
  hand: '当前技法',
  drawPile: '待启',
  discardPile: '余韵',
  exhaustPile: '已竭',

  // 战斗数值（替代 格挡 / 力量 / 虚弱 / 中毒）
  barrier: '护幕',
  taint: '污秽',
  purifyPower: '净化力',
  miasma: '秽气',
  taintStack: '污秽层',

  // 卡牌类型（替代 攻击 / 技能 / 能力）
  cardAttack: '攻型技法',
  cardSkill: '守型技法',
  cardPower: '常驻秘法',

  // 战斗动作
  endTurn: '收势',
  turn: '调息',
  intent: '污意',
  playCost: '灵耗',

  // 地图节点（替代 战斗 / 精英 / 休息 / Boss）
  nodeStart: '启程',
  nodeBattle: '遭遇',
  nodeElite: '深渊',
  nodeRest: '驿站',
  nodeBoss: '源点',

  nodeStartIcon: '🌱',
  nodeBattleIcon: '⚔️',
  nodeEliteIcon: '❓',
  nodeRestIcon: '🔥',
  nodeBossIcon: '👹',

  // 事件界面
  mapTitle: '污染地带路线图',
  mapHint: '⚔️ 战斗 · ❓ 事件 · 🔥 休息 · 🏪 驿站奖励 · 👹 源点',
  rewardTitle: '悟道 · 择一技法入秘典',
  rewardSkip: '暂不入秘典',
  restTitle: '幻兽驿站',
  restHeal: '调息 · 恢复 20 心神',
  restUpgrade: '精研 · 强化一张秘典技法',
  restHint: '在驿站调息恢复，或精研强化已有技法',

  // 结局
  winTitle: '远征完成 · 污染源头已净化',
  loseTitle: '心神耗尽 · 远征中断',
  abandonConfirm: '放弃本次净化远征？进度将不会保存。',
  pickRewardToast: '技法已写入净化秘典',
  restHealToast: (n) => `调息恢复 ${n} 点心神`,
  restUpgradeToast: '秘典中的一张技法获得了强化',

  // 统计
  statPurified: '净化幻兽',
  statElite: '击退深渊',
  statCodex: '秘典技法',
  statCoin: '探索币',

  // 日志用语
  logTurn: (n) => `—— 第 ${n} 次调息 ——`,
  logWin: '净化成功，幻兽恢复了理智',
  logLose: '心神耗尽，你被污秽反噬',
  logShuffle: '余韵洗入待启',
  logBarrierPower: '常驻秘法：+3 护幕',
  logRagePower: '净化之怒：+1 净化力',
};

export const NODE_LORE = {
  start: { label: TERMS.nodeStart, icon: TERMS.nodeStartIcon },
  battle: { label: TERMS.nodeBattle, icon: TERMS.nodeBattleIcon },
  elite: { label: TERMS.nodeElite, icon: TERMS.nodeEliteIcon },
  rest: { label: TERMS.nodeRest, icon: TERMS.nodeRestIcon },
  boss: { label: TERMS.nodeBoss, icon: TERMS.nodeBossIcon },
};

/** @deprecated 使用 TERMS */
export const LORE = TERMS;
