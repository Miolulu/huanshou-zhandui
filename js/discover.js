import { CONFIG, getCardBuyCost } from './config.js';
import { getTemplate, getTemplateCostTier, CARD_TEMPLATES } from './cards.js';
import { getTribe } from './tribes.js';
import { isTemplateInLobby } from './lobbyTribes.js';

/**
 * 野性邂逅 — 融合觉醒后从野外选择稀有个体
 */
export function getDiscoverTier(player, newStar) {
  const bonus = newStar >= 3 ? 2 : 1;
  return Math.min(CONFIG.MAX_TAVERN_TIER, player.tavernTier + bonus);
}

export function rollDiscoverOptions(game, player, discoverTier, count = 3) {
  const inPool = (tpl) => (game.poolRemaining[tpl.id] || 0) > 0;
  const lobbyTribes = game.lobbyTribes;

  let candidates = CARD_TEMPLATES.filter(
    (t) => getTemplateCostTier(t) === discoverTier && inPool(t) && isTemplateInLobby(t, lobbyTribes),
  );
  if (candidates.length < count) {
    candidates = CARD_TEMPLATES.filter(
      (t) => getTemplateCostTier(t) <= discoverTier && inPool(t) && isTemplateInLobby(t, lobbyTribes),
    );
  }
  if (!candidates.length) return [];

  const picked = [];
  const pool = [...candidates];
  while (picked.length < count && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function scoreDiscoverOption(templateId, player) {
  const tpl = getTemplate(templateId);
  if (!tpl) return 0;
  const tribe = tpl.tribe || 'neutral';
  let score = getTemplateCostTier(tpl) * 10;
  const tribeCount = player.team.cards.filter((c) => c && c.tribe === tribe).length;
  score += tribeCount * 15;
  const sameCount = player.team.cards.filter((c) => c && c.templateId === templateId).length;
  score += sameCount * 25;
  return score;
}

export function pickBestDiscoverOption(discover, player) {
  let bestId = discover.options[0];
  let bestScore = -Infinity;
  for (const id of discover.options) {
    const s = scoreDiscoverOption(id, player);
    if (s > bestScore) {
      bestScore = s;
      bestId = id;
    }
  }
  return bestId;
}

export function queueDiscover(game, player, newStar) {
  const tier = getDiscoverTier(player, newStar);
  const options = rollDiscoverOptions(game, player, tier, 3);
  if (!options.length) return false;

  const discover = {
    playerId: player.id,
    newStar,
    discoverTier: tier,
    options: options.map((t) => t.id),
  };

  if (player.isHuman) {
    game.pendingDiscover = discover;
    return true;
  }

  game.grantDiscoverCard(player, pickBestDiscoverOption(discover, player));
  return true;
}

export function formatDiscoverOption(templateId) {
  const tpl = getTemplate(templateId);
  if (!tpl) return { id: templateId, name: '?', tribe: 'neutral', costTier: 1 };
  const tribe = tpl.tribe || 'neutral';
  return {
    id: templateId,
    name: tpl.name,
    tribe,
    tribeLabel: getTribe(tribe).name,
    tribeIcon: getTribe(tribe).icon,
    costTier: getTemplateCostTier(tpl),
    cost: getCardBuyCost(tpl.rarity, tpl.costTier),
    description: tpl.description || '',
  };
}
