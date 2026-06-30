/** 炉石酒馆战棋式种族 — 无羁绊加成，靠单卡技能联动 */

export const TRIBES = {
  beast: {
    id: 'beast', name: '野兽', icon: '🐾', color: '#c4a35a',
    playstyle: '跳蛙传承、亡语召唤、攻击触发亡语（跳蛙流 / 狼爹流）',
  },
  murloc: {
    id: 'murloc', name: '鱼人', icon: '🐟', color: '#58a6ff',
    playstyle: '鱼人军团战吼叠攻，人海换质量',
  },
  pirate: {
    id: 'pirate', name: '海盗', icon: '🏴‍☠️', color: '#f0883e',
    playstyle: '花费金币成长、战吼悬赏、后期无限资源（海盗流）',
  },
  undead: {
    id: 'undead', name: '亡灵', icon: '💀', color: '#a371f7',
    playstyle: '复生、亡语连锁、永久成长（亡灵流）',
  },
  elemental: {
    id: 'elemental', name: '元素', icon: '⚡', color: '#79c0ff',
    playstyle: '刷新触发、法术伤害、回合末成长',
  },
  dragon: {
    id: 'dragon', name: '龙族', icon: '🐉', color: '#ff7b72',
    playstyle: '高费核心、回合结束全队成长',
  },
  mech: {
    id: 'mech', name: '机械', icon: '⚙️', color: '#8b949e',
    playstyle: '圣盾、磁力合体、护盾叠层',
  },
  quilboar: {
    id: 'quilboar', name: '野猪人', icon: '🐗', color: '#e3b341',
    playstyle: '血宝石叠属性、关键词宝石（野猪流）',
  },
  demon: {
    id: 'demon', name: '恶魔', icon: '😈', color: '#da3633',
    playstyle: '吞噬成长、卖血换力量',
  },
  naga: {
    id: 'naga', name: '纳迦', icon: '🐍', color: '#56d364',
    playstyle: '塑造法术、相邻友军强化',
  },
  neutral: {
    id: 'neutral', name: '中立', icon: '◆', color: '#b1bac4',
    playstyle: '万金油补位，可嵌入任意阵容',
  },
};

export const TRIBE_LIST = Object.values(TRIBES);

export function getTribe(id) {
  return TRIBES[id] || TRIBES.neutral;
}

export function tribeBadgeHtml(tribeId) {
  const t = getTribe(tribeId);
  return `<span class="tribe-badge tribe-${tribeId}" title="${t.playstyle}">${t.icon} ${t.name}</span>`;
}

export function countTeamTribes(cards) {
  const counts = {};
  for (const c of cards) {
    if (!c) continue;
    const tribe = c.tribe || 'neutral';
    counts[tribe] = (counts[tribe] || 0) + 1;
  }
  return counts;
}
