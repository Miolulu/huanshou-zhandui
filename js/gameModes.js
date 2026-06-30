/** 游戏模式配置（文档第三章） */
import { CONFIG } from './config.js';

export const GAME_MODES = {
  ranked: {
    id: 'ranked', name: '经典排位', desc: '标准8人对战，争夺段位',
    minPlayers: 1, maxPlayers: 8, aiCount: 2, aiDifficulty: 'normal',
    isRanked: true, features: [],
    unlock: { type: 'none' },
    prepareTime: 999, turnInterval: CONFIG.TURN_INTERVAL,
    economy: null,
  },
  casual: {
    id: 'casual', name: '经典休闲', desc: '轻松对战，练习阵容',
    minPlayers: 1, maxPlayers: 8, aiCount: 4, aiDifficulty: 'easy',
    isRanked: false, features: [],
    unlock: { type: 'none' },
    prepareTime: 999, turnInterval: CONFIG.TURN_INTERVAL,
    economy: null,
  },
  ai_battle: {
    id: 'ai_battle', name: '人机对战', desc: '1人对战7 AI，难度可选',
    minPlayers: 1, maxPlayers: 1, aiCount: 7, aiDifficulty: 'selectable',
    isRanked: false, features: [],
    unlock: { type: 'none' },
    prepareTime: 999, turnInterval: CONFIG.TURN_INTERVAL,
    economy: null,
  },
  quick: {
    id: 'quick', name: '快速对战', desc: '节奏更快，准备时间缩短',
    minPlayers: 1, maxPlayers: 8, aiCount: 2, aiDifficulty: 'hard',
    isRanked: false, features: ['faster'],
    unlock: { type: 'rank', tier: 'silver' },
    prepareTime: 15, turnInterval: 250,
    economy: { refreshCost: 1 },
  },
  custom: {
    id: 'custom', name: '自定义房间', desc: '房主可调规则',
    minPlayers: 2, maxPlayers: 8, aiCount: 0, aiDifficulty: 'normal',
    isRanked: false, features: [],
    unlock: { type: 'none' },
    prepareTime: 999, turnInterval: CONFIG.TURN_INTERVAL,
    economy: null,
  },
};

export const MODE_LIST = ['ranked', 'casual', 'ai_battle', 'quick', 'custom'];

export function getGameMode(id) {
  return GAME_MODES[id] || GAME_MODES.ranked;
}

export function isModeUnlocked(mode, profile) {
  const m = getGameMode(mode);
  if (m.unlock.type === 'none') return true;
  if (m.unlock.type === 'rank') {
    const order = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'];
    const playerIdx = order.indexOf(profile?.rank?.tier || 'iron');
    const needIdx = order.indexOf(m.unlock.tier);
    return playerIdx >= needIdx;
  }
  if (m.unlock.type === 'level') return (profile?.level || 1) >= (m.unlock.level || 1);
  return true;
}

export function buildPlayerConfigsForMode(modeId, humanName, aiDifficulty = 'normal') {
  const mode = getGameMode(modeId);
  const configs = [{
    id: 'player_0', name: humanName || '训练师', isHuman: true, isAI: false, aiDifficulty: null,
  }];
  const aiNames = ['AI·赤焰', 'AI·苍蓝', 'AI·翠风', 'AI·紫电', 'AI·金光', 'AI·暗影', 'AI·虚空'];
  const diff = mode.aiDifficulty === 'selectable' ? aiDifficulty : mode.aiDifficulty;
  for (let i = 0; i < mode.aiCount; i++) {
    configs.push({
      id: `player_${i + 1}`, name: aiNames[i] || `AI·${i}`, isHuman: false, isAI: true,
      aiDifficulty: diff,
    });
  }
  while (configs.length < 8 && modeId !== 'ai_battle') {
    const i = configs.length;
    configs.push({
      id: `player_${i}`, name: aiNames[i - 1] || `AI·${i}`, isHuman: false, isAI: true,
      aiDifficulty: diff,
    });
  }
  return configs.slice(0, 8);
}
