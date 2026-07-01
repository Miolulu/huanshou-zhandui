/** 净化技法卡 · Slay the Web 风格卡牌 DOM */
import { cardTypeClass, cardTypeLabel } from './cardPool.js';
import { cardArtUrl } from './assetPaths.js';

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

function cardDragTarget(type) {
  if (type === 'attack') return 'enemy';
  return 'player';
}

export function renderPurifyCardHtml(card, {
  playable = true,
  extraClass = '',
  tag = 'button',
  handCard = false,
} = {}) {
  const el = ELEMENT_ART_CLASS[card.element] || ELEMENT_ART_CLASS.neutral;
  const useDiv = handCard || tag === 'div';
  const actualTag = useDiv ? 'div' : tag;
  const typeAttr = actualTag === 'button' ? 'type="button"' : '';
  const disabledAttr = actualTag === 'button' && !playable ? 'disabled' : '';
  const roleAttr = useDiv ? `role="button" tabindex="${playable ? 0 : -1}"` : '';
  const dragTarget = cardDragTarget(card.type);
  const artSrc = cardArtUrl(card.id);
  const artInner = artSrc
    ? `<img class="Card-art-img" src="${artSrc}" alt="" loading="lazy" draggable="false">`
    : `<div class="Card-art ${el}" role="img" aria-label="${card.name}"></div>`;
  return `<${actualTag} ${typeAttr} ${roleAttr}
    class="purify-card Card ${cardTypeClass(card.type)} ${el} ${extraClass} ${playable ? '' : 'disabled'}"
    data-uid="${card.uid}" data-card-id="${card.id}" data-card-type="${card.type}" data-card-target="${dragTarget}" ${disabledAttr}>
    <div class="Card-inner">
      <p class="Card-energy EnergyBadge" title="灵耗"><span>${card.cost}</span></p>
      <figure class="Card-media">
        ${artInner}
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
