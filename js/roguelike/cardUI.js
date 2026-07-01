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

export function renderPurifyCardHtml(card, { playable = true, extraClass = '', tag = 'button' } = {}) {
  const el = ELEMENT_ART_CLASS[card.element] || ELEMENT_ART_CLASS.neutral;
  const disabled = playable ? '' : 'disabled';
  const typeAttr = tag === 'button' ? 'type="button"' : '';
  const disabledAttr = tag === 'button' && !playable ? 'disabled' : '';
  return `<${tag} ${typeAttr}
    class="purify-card Card ${cardTypeClass(card.type)} ${el} ${extraClass} ${playable ? '' : 'disabled'}"
    data-uid="${card.uid}" data-card-id="${card.id}" data-card-type="${card.type}" ${disabledAttr}>
    <div class="Card-inner">
      <p class="Card-energy EnergyBadge" title="灵耗"><span>${card.cost}</span></p>
      <figure class="Card-media">
        <div class="Card-art ${el}" role="img" aria-label="${card.name}"></div>
      </figure>
      <p class="Card-type">${cardTypeLabel(card.type)}</p>
      <h3 class="Card-name">${card.name}</h3>
      <p class="Card-description">${card.desc || ''}</p>
    </div>
  </${tag}>`;
}

export function renderShopOfferHtml(item, index, { gold = 0 } = {}) {
  if (item.sold) {
    return `<div class="Shop-offer Shop-offer--sold" data-shop-index="${index}">
      <div class="Shop-sold-label">已售出</div>
      ${renderPurifyCardHtml(item.card, { playable: false, extraClass: 'Shop-card', tag: 'div' })}
    </div>`;
  }
  const canBuy = gold >= item.price;
  return `<button type="button" class="Shop-offer ${canBuy ? '' : 'Shop-offer--cant-afford'}" data-shop-buy="${index}">
    ${renderPurifyCardHtml(item.card, { playable: canBuy, extraClass: 'Shop-card', tag: 'div' })}
    <span class="Shop-price">💰 ${item.price}</span>
  </button>`;
}
