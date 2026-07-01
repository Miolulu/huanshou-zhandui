/** 净化远征 · Slay the Web 战斗 Target DOM（保留幻兽战队名词） */
import { cardTypeLabel } from './cardPool.js';
import { intentIcon, intentLabel } from './enemies.js';
import { TERMS } from './lore.js';
import { PLAYER_SPRITE, enemySpriteUrl } from './assetPaths.js';

export function healthBarStw(current, max, block = 0) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const blockPct = max > 0 && block > 0 ? Math.min(100 - pct, (block / max) * 100) : 0;
  const blockWidth = Math.min(100, pct + blockPct);
  return `<div class="Healthbar ${block > 0 ? 'Healthbar--hasBlock' : ''}" role="progressbar" aria-valuenow="${current}" aria-valuemax="${max}">
    <p class="Healthbar-label"><span>${current}/${max}</span></p>
    <div class="Healthbar-bar" style="width:${pct}%"></div>
    <div class="Healthbar-bar Healthbar-blockBar" style="width:${blockWidth}%">${block > 0 ? block : ''}</div>
  </div>`;
}

function renderPowers(combat, enemy = null) {
  const chips = [];
  if (enemy) {
    if (enemy.strength) chips.push(`<span>${TERMS.purifyPower} ${enemy.strength}</span>`);
    if (enemy.poison) chips.push(`<span>${TERMS.taintStack} ${enemy.poison}</span>`);
  } else if (combat) {
    if (combat.strength) chips.push(`<span>${TERMS.purifyPower} ${combat.strength}</span>`);
    if (combat.weak) chips.push(`<span>${TERMS.miasma} ${combat.weak}</span>`);
    if (combat.powers?.barrier) chips.push(`<span>${TERMS.cardPower}·护幕</span>`);
    if (combat.powers?.rage) chips.push(`<span>净化之怒</span>`);
  }
  if (!chips.length) return '';
  return `<div class="Target-powers">${chips.join('')}</div>`;
}

export function renderPlayerTarget(combat) {
  const p = combat.player;
  return `<div class="Target Target--player purify-self-zone" data-type="player">
    <header class="Target-header">
      <div class="Target-sprite" aria-hidden="true"><img src="${PLAYER_SPRITE}" alt=""></div>
      <h3 class="Target-intents">
        <span class="Target-name">${TERMS.playerRole}</span>
      </h3>
    </header>
    ${healthBarStw(p.hp, p.maxHp, p.block || 0)}
    ${renderPowers(combat)}
    <div class="Target-combatText Split" aria-hidden="true"></div>
    <p class="Target-stat-label">${TERMS.mind}</p>
  </div>`;
}

export function renderEnemyTarget(enemy, index, { targeted, showDesc }) {
  const dead = enemy.hp <= 0;
  const cls = [
    'Target',
    'Target--enemy',
    dead ? 'Target--isDead' : '',
    targeted ? 'Target--selected is-targeted' : '',
  ].filter(Boolean).join(' ');

  const intentHtml = dead
    ? `<span class="Target-intent Target-intent--dead">已净化</span>`
    : `<span class="Target-intent">${intentIcon(enemy.intent)} ${intentLabel(enemy.intent)}</span>`;

  const spriteSrc = enemySpriteUrl(enemy.id);
  const spriteHtml = spriteSrc
    ? `<img src="${spriteSrc}" alt="">`
    : (enemy.icon || '👹');

  return `<div class="${cls}" data-type="enemy" data-target="${index}" role="button" tabindex="${dead ? -1 : 0}" ${dead ? 'aria-disabled="true"' : ''}>
    <header class="Target-header">
      <div class="Target-sprite Target-sprite--enemy" aria-hidden="true">${spriteHtml}</div>
      <h3 class="Target-intents">
        <span class="Target-name">${enemy.name}</span>
        ${intentHtml}
      </h3>
    </header>
    ${showDesc && enemy.desc ? `<p class="Target-desc">${enemy.desc}</p>` : ''}
    ${healthBarStw(enemy.hp, enemy.maxHp, enemy.block || 0)}
    ${renderPowers(null, enemy)}
    <div class="Target-combatText Split" aria-hidden="true"></div>
    <p class="Target-stat-label">${TERMS.taint}</p>
  </div>`;
}

export function renderEnergyBadge(current, max) {
  return `<div class="EnergyBadge StwCombat-energy" title="${TERMS.spirit}">
    <span>${current}/${max}</span>
  </div>`;
}

export function renderEndTurnButton(label = TERMS.endTurn) {
  const u = label.charAt(0);
  const rest = label.slice(1);
  return `<button type="button" id="btn-spire-end-turn" class="Button EndTurn purify-end-turn"><u>${u}</u>${rest}</button>`;
}
