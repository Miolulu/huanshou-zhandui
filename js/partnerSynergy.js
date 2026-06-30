import { CONFIG, ELEMENT_NAMES } from './config.js';
import { getTribe } from './tribes.js';

/** 相邻搭档连携：同属性 / 同生态族群 */
export function getPartnerLinks(team, maxSize = 7) {
  const links = [];
  const size = Math.min(maxSize, team.cards?.length ?? 0);
  for (let i = 0; i < size - 1; i++) {
    const a = team.cards[i];
    const b = team.cards[i + 1];
    if (!a || !b) continue;
    const kinds = [];
    if (a.element && a.element === b.element) kinds.push('element');
    if (a.tribe && b.tribe && a.tribe === b.tribe && a.tribe !== 'neutral') kinds.push('tribe');
    if (kinds.length) links.push({ posA: i, posB: i + 1, kinds, cardA: a, cardB: b });
  }
  return links;
}

export function getLinksAtPosition(links, position) {
  return links.filter((l) => l.posA === position || l.posB === position);
}

export function computePartnerBonus(linksAtPosition) {
  const bonus = { attack: 0, defense: 0, speed: 0 };
  const syn = CONFIG.PARTNER_SYNERGY || {};
  for (const link of linksAtPosition) {
    for (const kind of link.kinds) {
      const b = syn[kind] || {};
      bonus.attack += b.attack || 0;
      bonus.defense += b.defense || 0;
      bonus.speed += b.speed || 0;
    }
  }
  return bonus;
}

export function formatPartnerLinkLabel(link) {
  const parts = [];
  if (link.kinds.includes('element')) {
    parts.push(`${ELEMENT_NAMES[link.cardA.element] || link.cardA.element}共鸣`);
  }
  if (link.kinds.includes('tribe')) {
    parts.push(`${getTribe(link.cardA.tribe).name}搭档`);
  }
  return parts.join(' · ');
}

export function summarizePartnerLinks(team, maxSize) {
  const links = getPartnerLinks(team, maxSize);
  if (!links.length) return [];
  return links.map((l) => ({
    posA: l.posA,
    posB: l.posB,
    label: formatPartnerLinkLabel(l),
    bonus: computePartnerBonus([l]),
  }));
}
