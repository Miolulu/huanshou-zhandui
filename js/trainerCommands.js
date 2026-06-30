import { CONFIG } from './config.js';
import { ELEMENT_NAMES } from './config.js';
import { SCOUT_LEVEL } from './scouting.js';

export const PREPARE_COMMANDS = {
  frontline: {
    id: 'frontline',
    name: '前锋调配',
    icon: '⚡',
    desc: '将攻击最高的幻兽调到最前排',
  },
  rally: {
    id: 'rally',
    name: '战意鼓舞',
    icon: '🔥',
    desc: '指定一只幻兽，下一场战斗 +4 攻击',
    needsTarget: true,
  },
  scout: {
    id: 'scout',
    name: '足迹延伸',
    icon: '👣',
    desc: '提升一级对手情报（足迹→轮廓→全貌）',
  },
};

export const BATTLE_COMMANDS = {
  swap: {
    id: 'swap',
    name: '急令换位',
    icon: '↔',
    desc: '交换两只存活幻兽的站位',
    needsTwoTargets: true,
  },
  inspire: {
    id: 'inspire',
    name: '共鸣激励',
    icon: '✨',
    desc: '指定友方，本回合 +8 攻击',
    needsTarget: true,
  },
  insight: {
    id: 'insight',
    name: '战术洞察',
    icon: '👁',
    desc: '看清敌方全体当前生命与站位',
  },
};

export function executePrepareFrontline(player, game) {
  const cards = [];
  for (let i = 0; i < player.team.maxSize; i++) {
    const c = player.team.cards[i];
    if (c) cards.push({ card: c, pos: i });
  }
  if (!cards.length) return { ok: false, message: '战队为空' };
  const best = cards.reduce((a, b) => (b.card.attack > a.card.attack ? b : a));
  if (best.pos === 0) return { ok: true, message: '最强攻击已在最前排' };
  return game.moveCard(player, best.pos, 0)
    ? { ok: true, message: `${best.card.name} 已调至前锋` }
    : { ok: false, message: '换位失败' };
}

export function executePrepareRally(player, position) {
  const card = player.team.cards[position];
  if (!card) return { ok: false, message: '请选择战队中的幻兽' };
  card.trainerRally = { attack: CONFIG.TRAINER_RALLY_ATK || 4 };
  return { ok: true, message: `${card.name} 获得战意 +${card.trainerRally.attack} 攻击` };
}

export function executePrepareScout(game) {
  const max = CONFIG.SCOUT_MAX_LEVEL || 3;
  const next = Math.min(max, (game.scoutLevel || 1) + 1);
  if (next === game.scoutLevel) {
    return { ok: false, message: '情报已达最高等级' };
  }
  game.scoutLevel = next;
  return { ok: true, message: `足迹延伸：情报提升至「${next >= 3 ? '全貌' : next >= 2 ? '轮廓' : '足迹'}」` };
}

export function applyTrainerRallyToBattleCard(source, battleCard) {
  if (!source?.trainerRally) return;
  const atk = source.trainerRally.attack || 0;
  if (atk) {
    battleCard.attack += atk;
    battleCard._trainerRallyApplied = atk;
  }
}
