/** 净化远征 · 战斗视觉反馈（飘字 / 震屏 / 卡牌动效） */
import { combatSounds } from './combatSounds.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const ATTACK_INTENTS = new Set(['attack', 'strong_attack', 'attack_defend']);

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
            if (event.amount > 0) {
              this.floatOnPlayerDamage(`-${event.amount}`);
              this.shakePlayer();
              this.flashPlayer('hit-flash');
              this.flashPlayerHealth();
            }
            if (event.blocked > 0) this.floatOnPlayer(`🛡${event.blocked}`, 'block');
            this.shakeStage();
          }
          await delay(520);
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
        if (ATTACK_INTENTS.has(event.intent)) {
          await this.animateEnemyLunge(event.enemyIndex);
        } else {
          this.highlightFoe(event.enemyIndex);
          await delay(420);
        }
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

  animateCardPlay(cardEl, { fromDrag = false } = {}) {
    if (!cardEl) return Promise.resolve();
    combatSounds.selectCard();
    const eventCard = this.showCardEvent(cardEl);

    if (fromDrag) {
      cardEl.classList.add('card-playing');
      return new Promise((resolve) => {
        const done = () => {
          eventCard?.remove();
          cardEl.classList.remove('card-playing');
          resolve();
        };
        eventCard?.addEventListener('animationend', done, { once: true });
        setTimeout(done, 920);
      });
    }

    const rect = cardEl.getBoundingClientRect();
    const clone = cardEl.cloneNode(true);
    clone.classList.add('Card-clone', 'card-play-fly');
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('id');
    clone.style.cssText = `
      position:fixed;left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;height:${rect.height}px;
      margin:0;z-index:9999;pointer-events:none;`;
    document.body.appendChild(clone);
    cardEl.classList.add('card-playing');
    return new Promise((resolve) => {
      const done = () => {
        clone.remove();
        eventCard?.remove();
        cardEl.classList.remove('card-playing');
        resolve();
      };
      clone.addEventListener('animationend', done, { once: true });
      setTimeout(done, 900);
    });
  }

  showCardEvent(cardEl) {
    const layer = this.layer || document.getElementById('spire-effect-layer');
    if (!layer || !cardEl) return null;
    const img = cardEl.querySelector('.Card-art-img');
    const name = cardEl.querySelector('.Card-name')?.textContent?.trim() || '';
    const type = cardEl.querySelector('.Card-type')?.textContent?.trim() || '';
    const artW = img?.naturalWidth > 0 ? img.naturalWidth : 10;
    const artH = img?.naturalHeight > 0 ? img.naturalHeight : 14;

    const node = document.createElement('div');
    node.className = `CardEvent CardEvent--${cardEl.dataset.cardType || 'skill'}`;
    node.innerHTML = `
      <div class="CardEvent-frame">
        <div class="CardEvent-media">
          ${img
    ? `<img class="CardEvent-art" src="${img.currentSrc || img.src}" alt="" width="${artW}" height="${artH}">`
    : '<div class="CardEvent-art CardEvent-art--fallback"></div>'}
          <div class="CardEvent-sheen" aria-hidden="true"></div>
          <div class="CardEvent-caption">
            <span class="CardEvent-type">${type}</span>
            <strong class="CardEvent-name">${name}</strong>
          </div>
        </div>
      </div>`;
    layer.appendChild(node);
    node.addEventListener('animationend', () => node.remove(), { once: true });
    return node;
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

  floatOnPlayerDamage(text) {
    const card = this.playerArea?.querySelector('.Target--player') || this.playerArea;
    const sprite = card?.querySelector('.Target-sprite');
    const anchor = sprite || card?.querySelector('.Healthbar') || card;
    if (!anchor || !text || !this.layer) return;
    const rect = anchor.getBoundingClientRect();
    const layerRect = this.layer.getBoundingClientRect();
    const node = document.createElement('div');
    node.className = 'FCT FCT--damage FCT--player-damage';
    node.textContent = text;
    node.style.left = `${rect.left - layerRect.left + rect.width / 2}px`;
    node.style.top = `${rect.top - layerRect.top + rect.height * 0.22}px`;
    this.layer.appendChild(node);
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }

  async animateEnemyLunge(index) {
    const card = this.enemyArea?.querySelector(`.Target[data-target="${index}"]`);
    const sprite = card?.querySelector('.Target-sprite');
    if (!card || !sprite) return;
    card.classList.add('foe-acting');
    sprite.classList.add('foe-lunge');
    await delay(480);
    sprite.classList.remove('foe-lunge');
    card.classList.remove('foe-acting');
  }

  shakePlayer() {
    const card = this.playerArea?.querySelector('.Target--player') || this.playerArea;
    card?.classList.add('player-hit');
    setTimeout(() => card?.classList.remove('player-hit'), 450);
  }

  flashPlayerHealth() {
    const bar = this.playerArea?.querySelector('.Healthbar');
    bar?.classList.add('healthbar-hit');
    setTimeout(() => bar?.classList.remove('healthbar-hit'), 550);
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
    const bar = this.playerArea?.querySelector('.BlockBadge')
      || this.playerArea?.querySelector('.Healthbar');
    bar?.classList.add('stat-pulse');
    setTimeout(() => bar?.classList.remove('stat-pulse'), 400);
  }
}
