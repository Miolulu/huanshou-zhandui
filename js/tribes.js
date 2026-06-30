/**
 * 幻兽生态族群 — 按栖息地划分，无羁绊条加成，靠单卡技能与站位搭配
 */

export const TRIBES = {
  beast: {
    id: 'beast', name: '丛林族', icon: '🌲', color: '#6ab04c',
    habitat: '密林谷地',
    playstyle: '灵性接力、倒下分裂、攻击触发倒下技（接力队）',
  },
  murloc: {
    id: 'murloc', name: '潮汐族', icon: '🫧', color: '#48dbfb',
    habitat: '浅海礁湾',
    playstyle: '出战集结、人海铺场、以量换质量',
  },
  pirate: {
    id: 'pirate', name: '巡浪族', icon: '🌊', color: '#2e86de',
    habitat: '风暴航线',
    playstyle: '击杀赏励、出战强化、滚雪球推进',
  },
  undead: {
    id: 'undead', name: '幽冥族', icon: '🌑', color: '#9b59b6',
    habitat: '暮色裂隙',
    playstyle: '蜕生残响、倒下连锁、越战越强',
  },
  elemental: {
    id: 'elemental', name: '灵能族', icon: '✨', color: '#74b9ff',
    habitat: '元素涡流',
    playstyle: '法术爆发、回合成长、控场伤害',
  },
  dragon: {
    id: 'dragon', name: '天翔族', icon: '🪽', color: '#e17055',
    habitat: '苍穹峰岭',
    playstyle: '高阶核心、回合末全队成长',
  },
  mech: {
    id: 'mech', name: '机巧族', icon: '⚙️', color: '#b2bec3',
    habitat: '遗迹工坊',
    playstyle: '护盾护体、倒下零件、抗线换输出',
  },
  quilboar: {
    id: 'quilboar', name: '硬角族', icon: '🦬', color: '#f9ca24',
    habitat: '荒原丘陵',
    playstyle: '成长印记叠层、开战全队强化',
  },
  demon: {
    id: 'demon', name: '梦魇族', icon: '😶‍🌫️', color: '#c0392b',
    habitat: '深渊裂口',
    playstyle: '友方倒下吞噬、以牺牲换力量',
  },
  naga: {
    id: 'naga', name: '鳞裔族', icon: '🐍', color: '#1dd1a1',
    habitat: '蔓藤沼泽',
    playstyle: '连携塑造、相邻友方强化',
  },
  neutral: {
    id: 'neutral', name: '百变族', icon: '🔮', color: '#dfe6e9',
    habitat: '各处可见',
    playstyle: '万金油补位，可嵌入任意生态队',
  },
};

export const TRIBE_LIST = Object.values(TRIBES);

export function getTribe(id) {
  return TRIBES[id] || TRIBES.neutral;
}

export function tribeBadgeHtml(tribeId) {
  const t = getTribe(tribeId);
  return `<span class="tribe-badge tribe-${tribeId}" title="${t.habitat} · ${t.playstyle}">${t.icon} ${t.name}</span>`;
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
