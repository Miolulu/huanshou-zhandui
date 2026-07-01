/** 净化技法卡 · Slay the Web 风格卡牌 DOM */
import { cardTypeClass, cardTypeLabel } from './cardPool.js';

const ELEMENT_ART_CLASS = {
  fire: 'el-fire',
  water: 'el-water',
  grass: 'el-grass',
  electric: 'el-electric',
  earth: 'el-earth',
  wind: 'el-wind',
  light: 'el-light',
  dark: 'el-dark',
  neutral: 'el-neutral',
};

export function renderPurifyCardHtml(card, { playable = true, extraClass = '' } = {}) {
  const el = ELEMENT_ART_CLASS[card.element] || ELEMENT_ART_CLASS.neutral;
  const disabled = playable ? '' : 'disabled';
  return `<button type="button"
    class="purify-card Card ${cardTypeClass(card.type)} ${el} ${extraClass} ${playable ? '' : 'disabled'}"
    data-uid="${card.uid}" data-card-id="${card.id}" data-card-type="${card.type}" ${disabled}>
    <div class="Card-inner">
      <p class="Card-energy EnergyBadge" title="灵耗"><span>${card.cost}</span></p>
      <figure class="Card-media">
        <div class="Card-art ${el}" role="img" aria-label="${card.name}"></div>
      </figure>
      <p class="Card-type">${cardTypeLabel(card.type)}</p>
      <h3 class="Card-name">${card.name}</h3>
      <p class="Card-description">${card.desc || ''}</p>
    </div>
  </button>`;
}
