import { TRIBES, TRIBE_LIST } from './tribes.js';
import { CARD_TRIBE_MAP } from './tribeAssignment.js';
import { CARD_TEMPLATES as BASE_TEMPLATES } from './cardData.js';
import { CARD_DATA_EXTRA } from './cardDataExtra.js';
import { TERMS } from './gameTerms.js';

const ALL_CARD_TEMPLATES = [...BASE_TEMPLATES, ...CARD_DATA_EXTRA];

const ARCHETYPE_GUIDE = [
  {
    title: '灵性接力队',
    icon: '🌲',
    tribe: '丛林族',
    cards: ['charge_rabbit', 'storm_eagle', 'dark_lord', 'leaf_wolf'],
    desc: '冲锋兔倒下后把强化传给丛林同伴；风暴鹰攻击可触发同伴倒下技；暗之主让倒下技回响两次；配合分裂幼体滚雪球。',
  },
  {
    title: '巡浪远征',
    icon: '🌊',
    tribe: '巡浪族',
    cards: ['wave_shark', 'storm_ranger', 'wind_blade'],
    desc: '浪锋出战强化巡浪同伴；击杀后全队赏励。适合快攻推进。',
  },
  {
    title: '印记成长队',
    icon: '🦬',
    tribe: '硬角族',
    cards: ['vine_shaman', 'brute_bull', 'stone_bulwark', 'cactus'],
    desc: '开战施加成长印记，硬角族身材越叠越高。尽早拿到萨满与坦克核心。',
  },
  {
    title: '幽冥残响',
    icon: '🌑',
    tribe: '幽冥族',
    cards: ['shadow_wind_cat', 'dark_lord', 'void_sovereign', 'abyss_horror'],
    desc: '蜕生拖延战线；回响核心让倒下技触发两次；虚空系幻兽回合末自我成长。',
  },
  {
    title: '潮汐人海',
    icon: '🫧',
    tribe: '潮汐族',
    cards: ['ice_crab', 'frost_fish', 'tide_guardian', 'coral_guard'],
    desc: '出战潮汐集结；铺场换质量，各卡出战技互补。',
  },
  {
    title: '天翔终局',
    icon: '🪽',
    tribe: '天翔族',
    cards: ['ice_dragon', 'sky_dragon', 'thunder_titan', 'phoenix_bow'],
    desc: '龙鳞回合成长；高探索等级抓天翔核心，前期稳住血量。',
  },
];

export function renderTribeGuideHTML() {
  const tribeRows = TRIBE_LIST.filter((t) => t.id !== 'neutral').map((t) => {
    const cards = ALL_CARD_TEMPLATES.filter((c) => CARD_TRIBE_MAP[c.id] === t.id);
    const names = cards.slice(0, 6).map((c) => c.name).join('、');
    const more = cards.length > 6 ? ` 等${cards.length}只` : '';
    return `<div class="tribe-guide-row">
      <span class="tribe-guide-icon">${t.icon}</span>
      <div>
        <strong>${t.name}</strong>
        <span class="hint"> · ${t.habitat}</span>
        <p class="hint">${t.playstyle}</p>
        <p class="tribe-card-list">${names || '—'}${more}</p>
      </div>
    </div>`;
  }).join('');

  const archetypes = ARCHETYPE_GUIDE.map((a) => {
    const cardNames = a.cards.map((id) => ALL_CARD_TEMPLATES.find((c) => c.id === id)?.name || id).join(' → ');
    return `<div class="archetype-card">
      <h4>${a.icon} ${a.title} <span class="hint">（${a.tribe}）</span></h4>
      <p>${a.desc}</p>
      <p class="hint">推荐链条：${cardNames}</p>
    </div>`;
  }).join('');

  return `
    <h2>生态族群图鉴</h2>
    <p class="hint">${TERMS.noSynergyBar}。另有 ${TERMS.elementCounter}：${TERMS.elementCounterHint}</p>
    <section class="tribe-guide-list">${tribeRows}</section>
    <h3 style="margin-top:16px">推荐搭配思路</h3>
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
      return `<div class="bg-tribe-row" title="${t.habitat} · ${t.playstyle}">
        <span class="bg-tribe-icon">${t.icon}</span>
        <span>${t.name}</span>
        <span class="bg-tribe-count">×${count}</span>
      </div>`;
    });
  return rows.length
    ? rows.join('')
    : `<p class="hint" style="font-size:0.72rem">上阵后显示生态构成（仅展示，无羁绊加成）</p>`;
}
