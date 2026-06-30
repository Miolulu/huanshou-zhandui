/** Hero Card 纯展示组件（无业务逻辑） */
const STATUS_ICONS = {
  BURN: '🔥', POISON: '☠', STUN: '💫', SILENCE: '🤐',
  TAUNT: '🛡', SHIELD: '🔰', FREEZE: '❄', REGEN: '💚',
  BLIND: '🌀', INVINCIBLE: '✨', LIFESTEAL: '🩸',
};

/**
 * @param {object} card - 战斗或备战卡牌数据
 * @param {'player'|'enemy'} side
 * @returns {string}
 */
export function renderHeroCard(card, side = 'player') {
  if (!card) return '';

  const alive = card.isAlive !== false && card.hp > 0;
  const star = card.star ?? card.upgradeTier ?? 1;
  const hpPct = card.maxHp ? Math.max(0, Math.round((card.hp / card.maxHp) * 100)) : 0;
  const initial = (card.name || '?').charAt(0);

  const statusHtml = (card.statusEffects || [])
    .filter(s => s.duration > 0)
    .slice(0, 4)
    .map(s => `<span class="buff" title="${s.type}">${STATUS_ICONS[s.type] || '✦'}</span>`)
    .join('');

  const skillPct = card.skills?.length
    ? Math.min(100, Math.round((card.skills.filter(sk => sk.cooldown === 0).length / card.skills.length) * 100))
    : 60;

  return `<div class="hero-card ${side} ${alive ? '' : 'dead'}" data-card-id="${card.id}">
    <div class="rarity ${card.rarity || 'common'}"></div>
    <div class="portrait el-${card.element}">${initial}</div>
    <div class="hero-name">${card.name}</div>
    <div class="hp"><div class="fill" style="width:${hpPct}%"></div></div>
    <div class="mana" title="技能就绪"><div class="fill" style="width:${skillPct}%"></div></div>
    <div class="hp-text">${card.hp}/${card.maxHp}${card.shield ? ` · 🛡${card.shield}` : ''}</div>
    <div class="hero-stats">
      <span>⚔ ${card.attack}</span>
      <span>🛡 ${card.defense}</span>
    </div>
    <div class="star-row">${'★'.repeat(star)}${'☆'.repeat(3 - star)}</div>
    ${statusHtml ? `<div class="status">${statusHtml}</div>` : ''}
  </div>`;
}

export function renderHeroCardRow(cards, side = 'player', label = '') {
  const labelHtml = label ? `<span class="area-label">${label}</span>` : '';
  const cardsHtml = cards.length
    ? cards.map(c => renderHeroCard(c, side)).join('')
    : '<span class="hint">无阵容</span>';
  return labelHtml + cardsHtml;
}
