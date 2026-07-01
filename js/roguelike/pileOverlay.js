/** 牌堆 Overlay · 参照 StW Cards 组件 */
import { renderPurifyCardHtml } from './cardUI.js';

export function renderPileCardsHtml(cards, { playable = false, emptyText = '暂无技法' } = {}) {
  if (!cards?.length) {
    return `<p class="PileCards-empty">${emptyText}</p>`;
  }
  return cards.map((card) => renderPurifyCardHtml(card, { playable, extraClass: 'PileCard' })).join('');
}

export function renderPileInto(container, cards, opts = {}) {
  if (!container) return;
  container.innerHTML = renderPileCardsHtml(cards, opts);
}
