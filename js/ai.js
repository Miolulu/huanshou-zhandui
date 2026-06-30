import { CONFIG, getTeamSlotUpgradeCost, getTavernUpgradeCost, getCardUpgradeCost, getMaxCardLevelForPlayer } from './config.js';
import { getTemplate } from './cards.js';

export const AI_CONFIG = {
  easy: {
    economyAggressiveness: 0.3, synergyFocus: 0.2, riskTolerance: 0.1,
    positionOptimization: 0.1, upgradePriority: 0.2, adaptability: 0.0,
    refreshRate: 0.1, sellThreshold: 0.1, comboAwareness: 0.0,
  },
  normal: {
    economyAggressiveness: 0.6, synergyFocus: 0.6, riskTolerance: 0.4,
    positionOptimization: 0.5, upgradePriority: 0.5, adaptability: 0.2,
    refreshRate: 0.4, sellThreshold: 0.4, comboAwareness: 0.3,
  },
  hard: {
    economyAggressiveness: 0.8, synergyFocus: 0.8, riskTolerance: 0.6,
    positionOptimization: 0.8, upgradePriority: 0.7, adaptability: 0.5,
    refreshRate: 0.6, sellThreshold: 0.6, comboAwareness: 0.6,
  },
  nightmare: {
    economyAggressiveness: 0.9, synergyFocus: 0.95, riskTolerance: 0.8,
    positionOptimization: 0.95, upgradePriority: 0.85, adaptability: 0.9,
    refreshRate: 0.8, sellThreshold: 0.8, comboAwareness: 0.9,
  },
};

const RARITY_WEIGHT = { common: 0, rare: 10, epic: 20, legendary: 40 };
const CLASS_ORDER = { tank: 0, warrior: 1, assassin: 2, mage: 3, archer: 4, support: 5 };

function getParams(difficulty) {
  return AI_CONFIG[difficulty] || AI_CONFIG.normal;
}

function analyzeTeam(player) {
  const elementCount = {};
  const classCount = {};
  const cardCount = {};
  const cards = player.team.cards.filter(Boolean);
  for (const c of cards) {
    elementCount[c.element] = (elementCount[c.element] || 0) + 1;
    const cls = c.cardClass || c.class;
    if (cls) classCount[cls] = (classCount[cls] || 0) + 1;
    cardCount[c.templateId || c.cardTemplateId] = (cardCount[c.templateId || c.cardTemplateId] || 0) + 1;
  }
  return { elementCount, classCount, cardCount, size: cards.length };
}

function evaluateCard(shopCard, analysis, params, playerGold) {
  let score = 50;
  const tpl = getTemplate(shopCard.cardTemplateId);
  if (!tpl) return 0;

  score += (RARITY_WEIGHT[tpl.rarity] || 0) * params.riskTolerance;

  const elCount = analysis.elementCount[tpl.element] || 0;
  if (elCount > 0) {
    score += 15 * params.synergyFocus;
    if (elCount >= 2) score += 10 * params.synergyFocus;
    if (elCount >= 4) score += 15 * params.synergyFocus;
  }

  const existing = analysis.cardCount[tpl.id] || 0;
  if (existing === 2) score += 50 * params.comboAwareness;
  if (existing === 1) score += 20 * params.comboAwareness;

  const cls = tpl.cardClass || tpl.class;
  if (cls && (analysis.classCount[cls] || 0) > 0) score += 12 * params.synergyFocus;

  if (playerGold - shopCard.cost < 3) score -= 15 * (1 - params.economyAggressiveness);
  if (params.economyAggressiveness > 0.85 && playerGold > 50) score -= 5;

  return score + Math.random() * 10 * params.riskTolerance;
}

function targetTavernTier(turn, params) {
  const base = Math.min(5, 1 + Math.floor(turn / 2));
  if (params.economyAggressiveness < 0.4) return Math.min(base, 3);
  if (params.economyAggressiveness > 0.85) return Math.min(5, base + 1);
  return base;
}

function optimizePositions(player, params) {
  if (Math.random() > params.positionOptimization) return;
  const cards = [];
  for (let i = 0; i < player.team.maxSize; i++) {
    if (player.team.cards[i]) cards.push({ card: player.team.cards[i], pos: i });
  }
  cards.sort((a, b) => {
    const ca = CLASS_ORDER[a.card.cardClass || a.card.class] ?? 3;
    const cb = CLASS_ORDER[b.card.cardClass || b.card.class] ?? 3;
    if (ca !== cb) return ca - cb;
    return (b.card.defense || 0) - (a.card.defense || 0) || (b.card.maxHp || 0) - (a.card.maxHp || 0);
  });
  const newCards = Array(7).fill(null);
  cards.forEach(({ card }, idx) => {
    newCards[idx] = card;
    card.position = idx;
  });
  player.team.cards = newCards;
}

function maybeSellWeak(player, game, params, analysis) {
  if (Math.random() > params.sellThreshold) return;
  for (let i = 0; i < player.team.maxSize; i++) {
    const card = player.team.cards[i];
    if (!card || card.star >= 2) continue;
    const tpl = getTemplate(card.templateId || card.cardTemplateId);
    if (!tpl) continue;
    const elCount = analysis.elementCount[tpl.element] || 0;
    if (elCount === 1 && params.synergyFocus > 0.5 && player.team.cards.filter(Boolean).length >= 4) {
      game.sellCard(player, i);
      break;
    }
  }
}

export function runAIDecisions(player, game) {
  const params = getParams(player.aiDifficulty || 'normal');
  const analysis = analyzeTeam(player);

  const targetTier = targetTavernTier(game.turn, params);
  while (player.tavernTier < targetTier && player.gold >= getTavernUpgradeCost(player.tavernTier)) {
    if (Math.random() < params.upgradePriority + 0.2) game.upgradeTavern(player);
    else break;
  }

  const targetSlots = params.economyAggressiveness > 0.7 ? 5 : 4;
  while (player.team.maxSize < targetSlots && player.gold >= getTeamSlotUpgradeCost(player.team.maxSize)) {
    if (Math.random() < params.upgradePriority + 0.15) game.upgradeTeam(player);
    else break;
  }

  maybeSellWeak(player, game, params, analysis);

  const buyRounds = params.economyAggressiveness > 0.8 ? 5 : 3;
  for (let round = 0; round < buyRounds; round++) {
    if (game.findEmptyTeamSlot(player) === -1) break;
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < player.shop.cards.length; i++) {
      const sc = player.shop.cards[i];
      if (player.gold < sc.cost) continue;
      const score = evaluateCard(sc, analyzeTeam(player), params, player.gold);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestScore > 40 + (1 - params.synergyFocus) * 20) {
      game.buyCard(player, bestIdx);
    } else break;
  }

  for (let i = 0; i < player.team.maxSize; i++) {
    const card = player.team.cards[i];
    if (!card) continue;
    const maxLv = getMaxCardLevelForPlayer(player.tavernTier);
    while (card.level < maxLv && player.gold >= getCardUpgradeCost(card.level)) {
      if (Math.random() < params.upgradePriority + 0.3) game.upgradeCardLevel(player, i);
      else break;
    }
  }

  const refreshCost = game.gameOptions?.economy?.refreshCost ?? CONFIG.REFRESH_COST;
  if (player.gold >= refreshCost && game.findEmptyTeamSlot(player) !== -1 && Math.random() < params.refreshRate) {
    game.refreshShopManual(player);
    for (let i = 0; i < player.shop.cards.length; i++) {
      const sc = player.shop.cards[i];
      if (!sc || player.gold < sc.cost) continue;
      const score = evaluateCard(sc, analyzeTeam(player), params, player.gold);
      if (score > 55 && game.findEmptyTeamSlot(player) !== -1) game.buyCard(player, i);
    }
  }

  if (params.adaptability > 0.7 && game.opponentPreview) {
    optimizePositions(player, { ...params, positionOptimization: params.adaptability });
  } else {
    optimizePositions(player, params);
  }
}

export function getAIDifficultyLabel(d) {
  return { easy: '简单', normal: '普通', hard: '困难', nightmare: '噩梦' }[d] || d;
}
