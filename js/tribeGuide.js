import { TRIBES, TRIBE_LIST } from './tribes.js';
import { CARD_TRIBE_MAP } from './tribeAssignment.js';
import { CARD_TEMPLATES as BASE_TEMPLATES } from './cardData.js';
import { CARD_DATA_EXTRA } from './cardDataExtra.js';

const ALL_CARD_TEMPLATES = [...BASE_TEMPLATES, ...CARD_DATA_EXTRA];

const ARCHETYPE_GUIDE = [
  {
    title: '跳蛙流（野兽）',
    icon: '🐾',
    cards: ['charge_rabbit', 'storm_eagle', 'dark_lord', 'leaf_wolf'],
    desc: '跳蛙兽死亡传承攻击与亡语；巨喙鹦鹉攻击触发亡语；瑞文戴尔使亡语翻倍；配合鼠群召唤衍生物滚雪球。',
  },
  {
    title: '海盗流',
    icon: '🏴‍☠️',
    cards: ['wave_shark', 'storm_ranger', 'wind_blade'],
    desc: '骄傲私掠战斗开始强化海盗；击杀后全队增益。后期靠战吼与资源滚经济（简化版）。',
  },
  {
    title: '野猪人流',
    icon: '🐗',
    cards: ['vine_shaman', 'brute_bull', 'stone_bulwark', 'cactus'],
    desc: '血宝石式开战全队+1/+2；叠高身材后碾压。研究如何尽早拿到萨满与野猪核心。',
  },
  {
    title: '亡灵流',
    icon: '💀',
    cards: ['shadow_wind_cat', 'dark_lord', 'void_sovereign', 'abyss_horror'],
    desc: '复生拖延战线；亡语领主双倍触发；永久成长型亡灵可越打越强。',
  },
  {
    title: '鱼人军团',
    icon: '🐟',
    cards: ['ice_crab', 'frost_fish', 'tide_guardian', 'coral_guard'],
    desc: '开战鱼人集结+1/+1；人海战术配合战吼（各卡独特技能）。',
  },
  {
    title: '龙族后期',
    icon: '🐉',
    cards: ['ice_dragon', 'sky_dragon', 'thunder_titan', 'phoenix_bow'],
    desc: '龙鳞成长每回合+2/+2；高费龙族为核心，前期苟活升酒馆。',
  },
];

export function renderTribeGuideHTML() {
  const tribeRows = TRIBE_LIST.filter((t) => t.id !== 'neutral').map((t) => {
    const cards = ALL_CARD_TEMPLATES.filter((c) => CARD_TRIBE_MAP[c.id] === t.id);
    const names = cards.slice(0, 6).map((c) => c.name).join('、');
    const more = cards.length > 6 ? ` 等${cards.length}张` : '';
    return `<div class="tribe-guide-row">
      <span class="tribe-guide-icon">${t.icon}</span>
      <div>
        <strong>${t.name}</strong>
        <p class="hint">${t.playstyle}</p>
        <p class="tribe-card-list">${names || '—'}${more}</p>
      </div>
    </div>`;
  }).join('');

  const archetypes = ARCHETYPE_GUIDE.map((a) => {
    const cardNames = a.cards.map((id) => ALL_CARD_TEMPLATES.find((c) => c.id === id)?.name || id).join(' → ');
    return `<div class="archetype-card">
      <h4>${a.icon} ${a.title}</h4>
      <p>${a.desc}</p>
      <p class="hint">核心链：${cardNames}</p>
    </div>`;
  }).join('');

  return `
    <h2>种族图鉴</h2>
    <p class="hint">参照炉石酒馆战棋：无羁绊条加成，靠单卡技能自行研究搭配。</p>
    <section class="tribe-guide-list">${tribeRows}</section>
    <h3 style="margin-top:16px">经典流派思路</h3>
    <section class="archetype-list">${archetypes}</section>`;
}

export function renderTeamTribeSummary(cards) {
  const counts = {};
  for (const c of cards) {
    if (!c) continue;
    const tribe = c.tribe || 'neutral';
    counts[tribe] = (counts[tribe] || 0) + 1;
  }
  const rows = Object.entries(counts)
    .filter(([id]) => id !== 'neutral')
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const t = TRIBES[id];
      return `<div class="bg-tribe-row" title="${t.playstyle}">
        <span class="bg-tribe-icon">${t.icon}</span>
        <span>${t.name}</span>
        <span class="bg-tribe-count">×${count}</span>
      </div>`;
    });
  return rows.length
    ? rows.join('')
    : '<p class="hint" style="font-size:0.72rem">上阵幻兽后显示种族构成（仅展示，无羁绊加成）</p>';
}
