/** 净化远征 · 驿站商店（参照 Slay the Web / StS 商店逻辑） */
import { REWARD_POOL, cloneCard } from './cardPool.js';
import { SPECIAL_CARD_POOL } from './specialCards.js';

export const REMOVE_CARD_PRICE = 75;
export const SHOP_SIZE = 3;

export function cardShopPrice(def) {
  const base = (def.cost || 1) * 22 + 28;
  if (def.special) return base + 45;
  if (def.type === 'power') return base + 35;
  if (def.damage && def.damage >= 15) return base + 20;
  return base;
}

/** @returns {{ card: object, price: number, sold: boolean }[]} */
export function generateShopInventory(rng = Math.random, count = SHOP_SIZE) {
  const normalPool = [...REWARD_POOL];
  const specialPool = [...SPECIAL_CARD_POOL];
  const items = [];
  while (items.length < count && (normalPool.length || specialPool.length)) {
    const useSpecial = specialPool.length > 0 && rng() < 0.45;
    const pool = useSpecial ? specialPool : normalPool;
    if (!pool.length) continue;
    const i = Math.floor(rng() * pool.length);
    const def = pool.splice(i, 1)[0];
    items.push({
      card: cloneCard(def),
      price: cardShopPrice(def),
      sold: false,
    });
  }
  return items;
}
