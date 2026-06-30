import { CONFIG, getTeamSlotUpgradeCost, getTavernUpgradeCost, getCardUpgradeCost, getMaxCardLevelForPlayer } from './config.js';
import { getTemplate } from './cards.js';

export function runAIDecisions(player, game) {
  while (player.tavernTier < Math.min(4, 2 + Math.floor(game.turn / 2)) &&
         player.gold >= getTavernUpgradeCost(player.tavernTier)) {
    game.upgradeTavern(player);
  }

  while (player.team.maxSize < 5 && player.gold >= getTeamSlotUpgradeCost(player.team.maxSize)) {
    game.upgradeTeam(player);
  }

  const teamElements = player.team.cards.filter(Boolean).map(c => c.element);

  for (let round = 0; round < 3; round++) {
    let bought = false;
    for (let i = 0; i < player.shop.cards.length; i++) {
      const sc = player.shop.cards[i];
      if (player.gold < sc.cost) continue;
      if (game.findEmptyTeamSlot(player) === -1) break;

      const tpl = getTemplate(sc.cardTemplateId);
      const synergy = teamElements.length === 0 || teamElements.includes(tpl.element);

      if (synergy || Math.random() < 0.35) {
        game.buyCard(player, i);
        teamElements.push(tpl.element);
        bought = true;
        break;
      }
    }
    if (!bought) break;
  }

  for (let i = 0; i < player.team.maxSize; i++) {
    const card = player.team.cards[i];
    if (!card) continue;
    const maxLv = getMaxCardLevelForPlayer(player.tavernTier);
    while (card.level < maxLv && player.gold >= getCardUpgradeCost(card.level)) {
      game.upgradeCardLevel(player, i);
    }
  }

  if (player.gold >= CONFIG.REFRESH_COST && game.findEmptyTeamSlot(player) !== -1 && Math.random() < 0.35) {
    game.refreshShopManual(player);
    for (let i = 0; i < player.shop.cards.length; i++) {
      if (player.gold >= CONFIG.BUY_COST && game.findEmptyTeamSlot(player) !== -1) {
        game.buyCard(player, i);
      }
    }
  }

  const cards = [];
  for (let i = 0; i < player.team.maxSize; i++) {
    if (player.team.cards[i]) cards.push({ card: player.team.cards[i], pos: i });
  }
  cards.sort((a, b) => b.card.defense - a.card.defense || b.card.maxHp - a.card.maxHp);
  const newCards = Array(7).fill(null);
  cards.forEach(({ card }, idx) => {
    newCards[idx] = card;
    card.position = idx;
  });
  player.team.cards = newCards;
}
