/** 净化远征 · 战斗视觉反馈（飘字 / 震屏 / 卡牌动效） */
import { combatSounds } from './combatSounds.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export class PurifyBattleEffects {
  /**
   * @param {object} refs
   * @param {HTMLElement|null} refs.stage - .purify-stage
   * @param {HTMLElement|null} refs.effectLayer - #spire-effect-layer
   * @param {HTMLElement|null} refs.enemyArea - #spire-enemy
   * @param {HTMLElement|null} refs.playerArea - #spire-player
   * @param {HTMLElement|null} refs.hand - #spire-hand
   */
  constructor(refs = {}) {
    this.stage = refs.stage || null;
    this.layer = refs.effectLayer || null;
    this.enemyArea = refs.enemyArea || null;
    this.playerArea = refs.playerArea || null;
    this.hand = refs.hand || null;
  }

  bind(refs) {
    Object.assign(this, refs);
  }

  async playSequence(events = []) {
    for (const event of events) {
      await this.playEvent(event);
    }
  }

  async playEvent(event) {
    if (!event?.type) return;

    switch (event.type) {
      case 'CARD_PLAYED':
        combatSounds.playCard();
        break;
      case 'BLOCK_GAIN':
        combatSounds.blockGain();
        if (event.target === 'player') {
          this.floatOnPlayer(`+${event.amount}`, 'block');
          this.pulsePlayerBarrier();
        } else {
          this.floatOnFoe(event.enemyIndex, `+${event.amount}`, 'block');
        }
        await delay(280);
        break;
      case 'HEAL':
        combatSounds.heal();
        this.floatOnPlayer(`+${event.amount}`, 'heal');
        this.flashPlayer('heal-flash');
        await delay(320);
        break;
      case 'DRAW':
        this.pulseHand();
        await delay(200);
        break;
      case 'DAMAGE':
        if (event.target === 'player') {
          if (event.blocked > 0 && event.amount === 0) {
            this.floatOnPlayer(`🛡${event.blocked}`, 'block');
            combatSounds.blockGain();
          } else {
            combatSounds.hitPlayer();
            if (event.amount > 0) this.floatOnPlayer(`-${event.amount}`, 'damage');
            if (event.blocked > 0) this.floatOnPlayer(`🛡${event.blocked}`, 'block');
            this.flashPlayer('hit-flash');
            this.shakeStage();
          }
          await delay(480);
        } else {
          combatSounds.hitEnemy();
          if (event.amount > 0) {
            this.floatOnFoe(event.enemyIndex, `-${event.amount}`, 'damage');
            this.shakeFoe(event.enemyIndex);
            this.flashFoe(event.enemyIndex, 'hit-flash');
          }
          if (event.blocked > 0) {
            this.floatOnFoe(event.enemyIndex, `🛡${event.blocked}`, 'block');
          }
          await delay(360);
        }
        break;
      case 'POISON':
        this.floatOnFoe(event.enemyIndex, `-${event.amount}`, 'poison');
        await delay(300);
        break;
      case 'ENEMY_ACTION':
        this.highlightFoe(event.enemyIndex);
        await delay(420);
        break;
      case 'BUFF':
        this.floatOnFoe(event.enemyIndex, `+${event.amount}`, 'buff');
        await delay(280);
        break;
      case 'DEBUFF':
        this.floatOnPlayer(`虚弱+${event.amount}`, 'debuff');
        await delay(320);
        break;
      case 'TURN_END':
        combatSounds.endTurn();
        await delay(200);
        break;
      case 'TURN_START':
        combatSounds.startTurn();
        this.pulseHand();
        await delay(240);
        break;
      case 'HAND_DISCARDED':
        break;
      case 'COMBAT_WON':
        this.flashStage('combat-win-flash');
        await delay(400);
        break;
      case 'COMBAT_LOST':
        this.flashStage('combat-loss-flash');
        this.shakeStage();
        await delay(500);
        break;
      default:
        break;
    }
  }

  animateCardPlay(cardEl) {
    if (!cardEl) return Promise.resolve();
    combatSounds.selectCard();
    const rect = cardEl.getBoundingClientRect();
    const clone = cardEl.cloneNode(true);
    clone.classList.add('Card-clone', 'card-play-fly');
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('id');
    if (clone.tagName === 'BUTTON') {
      clone.disabled = true;
      clone.tabIndex = -1;
    }
    clone.style.cssText = `
      position:fixed;left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;height:${rect.height}px;
      margin:0;z-index:9999;pointer-events:none;`;
    document.body.appendChild(clone);
    cardEl.classList.add('card-playing');
    return new Promise((resolve) => {
      clone.addEventListener('animationend', () => {
        clone.remove();
        cardEl.classList.remove('card-playing');
        resolve();
      }, { once: true });
      setTimeout(() => {
        clone.remove();
        cardEl.classList.remove('card-playing');
        resolve();
      }, 900);
    });
  }

  async animateHandDiscard() {
    const cards = this.hand?.querySelectorAll('.purify-card') || [];
    cards.forEach((c) => c.classList.add('card-discard-out'));
    await delay(380);
  }

  floatAt(el, text, kind) {
    if (!el || !text || !this.layer) return;
    const rect = el.getBoundingClientRect();
    const layerRect = this.layer.getBoundingClientRect();
    const node = document.createElement('div');
    node.className = `FCT FCT--${kind}`;
    node.textContent = text;
    node.style.left = `${rect.left - layerRect.left + rect.width / 2}px`;
    node.style.top = `${rect.top - layerRect.top + rect.height * 0.35}px`;
    this.layer.appendChild(node);
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }

  floatOnFoe(index, text, kind) {
    const card = this.enemyArea?.querySelector(`.Target[data-target="${index}"]`);
    const anchor = card?.querySelector('.Target-combatText') || card?.querySelector('.Healthbar') || card;
    this.floatAt(anchor, text, kind);
  }

  floatOnPlayer(text, kind) {
    const card = this.playerArea?.querySelector('.Target--player') || this.playerArea;
    const anchor = card?.querySelector('.Target-combatText') || card?.querySelector('.Healthbar') || card;
    this.floatAt(anchor, text, kind);
  }

  shakeFoe(index) {
    const card = this.enemyArea?.querySelector(`.Target[data-target="${index}"]`);
    card?.classList.add('foe-hit');
    setTimeout(() => card?.classList.remove('foe-hit'), 450);
  }

  shakeStage() {
    this.stage?.classList.add('battle-shake');
    setTimeout(() => this.stage?.classList.remove('battle-shake'), 320);
  }

  flashFoe(index, cls) {
    const card = this.enemyArea?.querySelector(`.Target[data-target="${index}"]`);
    if (!card) return;
    card.classList.add(cls);
    setTimeout(() => card.classList.remove(cls), 380);
  }

  flashPlayer(cls) {
    const target = this.playerArea?.querySelector('.Target--player') || this.playerArea;
    if (!target) return;
    target.classList.add(cls);
    setTimeout(() => target.classList.remove(cls), 380);
  }

  flashStage(cls) {
    this.stage?.classList.add(cls);
    setTimeout(() => this.stage?.classList.remove(cls), 500);
  }

  highlightFoe(index) {
    const card = this.enemyArea?.querySelector(`.Target[data-target="${index}"]`);
    if (!card) return;
    card.classList.add('foe-acting');
    setTimeout(() => card?.classList.remove('foe-acting'), 520);
  }

  pulseHand() {
    this.hand?.classList.add('hand-deal-pulse');
    setTimeout(() => this.hand?.classList.remove('hand-deal-pulse'), 400);
  }

  pulsePlayerBarrier() {
    const bar = this.playerArea?.querySelector('.Healthbar-blockBar')
      || this.playerArea?.querySelector('.Healthbar');
    bar?.classList.add('stat-pulse');
    setTimeout(() => bar?.classList.remove('stat-pulse'), 400);
  }
}
