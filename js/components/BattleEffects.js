/** 战斗视觉特效（飘字、技能闪光）— 与 battleEngine 解耦 */

const FX_RENDER_EVENTS = new Set([
  'DAMAGE_TAKEN', 'HEAL', 'CRIT', 'SKILL_TRIGGER',
  'STATUS_APPLIED', 'DODGE', 'EXECUTE', 'ATTACK',
]);

export class BattleEffects {
  /**
   * @param {HTMLElement|null} layer - #battle-effect-layer
   * @param {HTMLElement|null} arena - #battle
   */
  constructor(layer, arena) {
    this.layer = layer;
    this.arena = arena;
  }

  shouldPlay(event) {
    return FX_RENDER_EVENTS.has(event.type);
  }

  play(event) {
    if (!this.layer || !this.arena) return;

    switch (event.type) {
      case 'DAMAGE_TAKEN':
        this.floatOnCard(event.cardId, `-${event.damage}`, 'damage');
        this.flashCard(event.cardId, 'hit-flash', 350);
        this.shakeArena();
        break;
      case 'HEAL':
        this.floatOnCard(event.cardId, `+${event.amount}`, 'heal');
        break;
      case 'CRIT':
        this.floatOnCard(event.cardId, '暴击!', 'crit');
        break;
      case 'SKILL_TRIGGER':
        this.floatOnCard(event.cardId, event.skillName, 'skill');
        this.flashCard(event.cardId, 'skill-cast', 500);
        break;
      case 'STATUS_APPLIED':
        this.floatOnCard(event.cardId, event.status, 'buff');
        break;
      case 'DODGE':
        this.floatOnCard(event.cardId, '闪避', 'miss');
        break;
      case 'EXECUTE':
        this.floatOnCard(event.cardId, '斩杀!', 'crit');
        break;
      case 'ATTACK':
        if (event.isCrit) this.floatOnCard(event.attackerId, '暴击!', 'crit');
        break;
      default:
        break;
    }
  }

  flashCard(cardId, className, duration = 400) {
    const card = this.findCard(cardId);
    if (!card) return;
    card.classList.add(className);
    setTimeout(() => card.classList.remove(className), duration);
  }

  floatOnCard(cardId, text, kind) {
    const card = this.findCard(cardId);
    if (!card || !text) return;

    const cardRect = card.getBoundingClientRect();
    const layerRect = this.layer.getBoundingClientRect();

    const el = document.createElement('div');
    el.className = `fx-float fx-${kind}`;
    el.textContent = text;
    el.style.left = `${cardRect.left - layerRect.left + cardRect.width / 2}px`;
    el.style.top = `${cardRect.top - layerRect.top + 8}px`;
    this.layer.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  shakeArena() {
    this.arena.classList.add('battle-shake');
    setTimeout(() => this.arena.classList.remove('battle-shake'), 300);
  }

  flashArenaRed() {
    this.arena.classList.add('battle-flash-red');
    setTimeout(() => this.arena.classList.remove('battle-flash-red'), 400);
  }

  findCard(cardId) {
    if (!cardId || !this.arena) return null;
    return this.arena.querySelector(`[data-card-id="${cardId}"]`);
  }
}

/** 战斗日志行样式分类 */
export function getBattleLogClass(eventType) {
  if (['SKILL_TRIGGER', 'SYNERGY_APPLIED', 'BOND_ACTIVE'].includes(eventType)) return 'log-skill';
  if (['DAMAGE_TAKEN', 'ATTACK', 'EXECUTE', 'CARD_DEATH'].includes(eventType)) return 'log-damage';
  if (['HEAL', 'CARD_REVIVED', 'SHIELD_GAINED'].includes(eventType)) return 'log-heal';
  if (eventType === 'CRIT') return 'log-crit';
  return '';
}
