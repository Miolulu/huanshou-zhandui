import { CONFIG, getCardBuyCost } from './config.js';
import { getTemplate, getTemplateCostTier, CARD_TEMPLATES } from './cards.js';
import { getTribe } from './tribes.js';
import { isTemplateInLobby } from './lobbyTribes.js';

/**
 * 野性邂逅 — 融合觉醒后从野外选择稀有个体，或二选一：潜能激发 vs 新种邂逅
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
  if (discover.type === 'branch') {
    const beast = discover.branches?.find((b) => b.kind === 'beast');
    if (beast?.options?.length) return { branch: 'beast', templateId: pickBestFromIds(beast.options, player) };
    return { branch: 'boost', position: pickBestBoostTarget(player) };
  }
  return { templateId: pickBestFromIds(discover.options, player) };
}

function pickBestFromIds(ids, player) {
  let bestId = ids[0];
  let bestScore = -Infinity;
  for (const id of ids) {
    const s = scoreDiscoverOption(id, player);
    if (s > bestScore) {
      bestScore = s;
      bestId = id;
    }
  }
  return bestId;
}

function pickBestBoostTarget(player) {
  let bestPos = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < player.team.maxSize; i++) {
    const c = player.team.cards[i];
    if (!c) continue;
    const score = (c.star ?? 1) * 10 + (c.attack || 0);
    if (score > bestScore) {
      bestScore = score;
      bestPos = i;
    }
  }
  return bestPos;
}

function rollBoostBranch(player) {
  const pos = pickBestBoostTarget(player);
  if (pos < 0) return null;
  const card = player.team.cards[pos];
  return {
    kind: 'boost',
    position: pos,
    cardName: card.name,
    preview: '+3攻 +2防 · 主技能强化',
  };
}

function rollBeastBranch(game, player, tier) {
  const options = rollDiscoverOptions(game, player, tier, 3);
  if (!options.length) return null;
  return {
    kind: 'beast',
    options: options.map((t) => t.id),
  };
}

export function queueDiscover(game, player, newStar) {
  const tier = getDiscoverTier(player, newStar);
  const useBranch = newStar >= 2 && Math.random() < (CONFIG.DISCOVER_BRANCH_CHANCE ?? 0.45);

  if (useBranch) {
    const boost = rollBoostBranch(player);
    const beast = rollBeastBranch(game, player, tier);
    if (boost && beast) {
      const discover = {
        type: 'branch',
        playerId: player.id,
        newStar,
        discoverTier: tier,
        branches: [boost, beast],
      };
      if (player.isHuman) {
        game.pendingDiscover = discover;
        return true;
      }
      const pick = pickBestDiscoverOption(discover, player);
      if (pick.branch === 'boost') game.grantDiscoverBoost(player, pick.position);
      else game.grantDiscoverCard(player, pick.templateId);
      return true;
    }
  }

  const options = rollDiscoverOptions(game, player, tier, 3);
  if (!options.length) return false;

  const discover = {
    type: 'cards',
    playerId: player.id,
    newStar,
    discoverTier: tier,
    options: options.map((t) => t.id),
  };

  if (player.isHuman) {
    game.pendingDiscover = discover;
    return true;
  }

  game.grantDiscoverCard(player, pickBestFromIds(discover.options, player));
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
