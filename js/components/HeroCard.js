/** Hero Card — Vol.3 / Vol.6 语义化纯展示组件 */
const STATUS_ICONS = {
  BURN: '🔥', POISON: '☠', STUN: '💫', SILENCE: '🤐',
  TAUNT: '🛡', SHIELD: '🔰', FREEZE: '❄', REGEN: '💚',
  BLIND: '🌀', INVINCIBLE: '✨', LIFESTEAL: '🩸',
};

const DEBUFF_TYPES = new Set(['BURN', 'POISON', 'STUN', 'SILENCE', 'FREEZE', 'BLIND']);

/**
 * @param {object} card
 * @param {'player'|'enemy'} side
 * @returns {string}
 */
export function renderHeroCard(card, side = 'player') {
  if (!card) return '';

  const alive = card.isAlive !== false && card.hp > 0;
  const star = card.star ?? card.upgradeTier ?? 1;
  const hpRatio = card.maxHp ? Math.max(0, card.hp / card.maxHp) : 0;
  const initial = (card.name || '?').charAt(0);

  const statuses = (card.statusEffects || []).filter((s) => s.duration > 0);
  const buffs = statuses.filter((s) => !DEBUFF_TYPES.has(s.type));
  const debuffs = statuses.filter((s) => DEBUFF_TYPES.has(s.type));

  const buffHtml = buffs.slice(0, 3).map((s) =>
    `<span class="hero-card__buff" data-status="${s.type}">${STATUS_ICONS[s.type] || '✦'}</span>`
  ).join('');

  const debuffHtml = debuffs.slice(0, 3).map((s) =>
    `<span class="hero-card__debuff" data-status="${s.type}">${STATUS_ICONS[s.type] || '✦'}</span>`
  ).join('');

  const skillPct = card.skills?.length
    ? Math.min(100, Math.round((card.skills.filter((sk) => sk.cooldown === 0).length / card.skills.length) * 100))
    : 60;

  const sideMod = side === 'enemy' ? 'hero-card--enemy' : 'hero-card--player';
  const stateMod = alive ? '' : ' hero-card--dead';
  const selectedMod = card._uiSelected ? ' hero-card--selected' : '';

  return `<article class="hero-card ${sideMod}${stateMod}${selectedMod}" data-card-id="${card.id}">
    <header class="hero-card__header">
      <div class="hero-card__debuffs">${debuffHtml}</div>
      <div class="hero-card__element hero-card__element--${card.element}" aria-hidden="true"></div>
      <div class="hero-card__buffs">${buffHtml}</div>
    </header>
    <div class="hero-card__portrait el-${card.element}" aria-hidden="true">${initial}</div>
    <h3 class="hero-card__name">${card.name}</h3>
    <div class="hero-card__bars">
      <div class="progress-bar hero-card__hp" role="progressbar" aria-valuenow="${Math.round(hpRatio * 100)}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar__fill progress-bar__fill--hp" style="transform:scaleX(${hpRatio})"></div>
      </div>
      <div class="progress-bar hero-card__mana" aria-hidden="true">
        <div class="progress-bar__fill progress-bar__fill--mana" style="transform:scaleX(${skillPct / 100})"></div>
      </div>
    </div>
    <p class="hero-card__hp-text">${card.hp}/${card.maxHp}${card.shield ? ` · 🛡${card.shield}` : ''}</p>
    <footer class="hero-card__footer">
      <span class="hero-card__stat">⚔ ${card.attack}</span>
      <span class="hero-card__stat">🛡 ${card.defense}</span>
      <span class="hero-card__stars" aria-label="${star}星">${'★'.repeat(star)}${'☆'.repeat(3 - star)}</span>
    </footer>
  </article>`;
}

export function renderHeroCardRow(cards, side = 'player', label = '') {
  const labelHtml = label ? `<span class="battle-area-label">${label}</span>` : '';
  const display = cards.slice(0, 4);
  const cardsHtml = display.length
    ? display.map((c) => renderHeroCard(c, side)).join('')
    : '<span class="hint">无阵容</span>';
  return `${labelHtml}<div class="hero-card-row">${cardsHtml}</div>`;
}
