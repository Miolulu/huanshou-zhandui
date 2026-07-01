/**
 * 净化远征 · 拖拽出牌（参照 Slay the Web dragdrop.js）
 * 依赖 index.html 中加载的全局 gsap / Draggable
 */
import { combatSounds } from './combatSounds.js';

/** @type {import('gsap').Draggable[]} */
let dragInstances = [];

function cardNeedsEnemyTarget(cardType) {
  return cardType === 'attack';
}

function canDropOn(cardEl, targetEl) {
  if (!targetEl || !cardEl) return false;
  const type = cardEl.dataset.cardType;
  if (cardNeedsEnemyTarget(type)) {
    return targetEl.classList.contains('Target')
      && targetEl.dataset.type === 'enemy'
      && !targetEl.classList.contains('Target--isDead');
  }
  return targetEl.dataset.type === 'player'
    || targetEl.classList.contains('Target--player')
    || targetEl.classList.contains('purify-play-zone')
    || targetEl.classList.contains('StwCombat');
}

function resolveTargetIndex(targetEl, fallbackIndex) {
  if (targetEl?.dataset?.target != null) return Number(targetEl.dataset.target);
  return fallbackIndex;
}

export function destroyCardDrag() {
  const gsap = window.gsap;
  dragInstances.forEach((d) => {
    if (gsap && d.target) gsap.set(d.target, { x: 0, y: 0, clearProps: 'transform' });
    d.kill();
  });
  dragInstances = [];
  document.querySelectorAll('.is-dragOver').forEach((el) => el.classList.remove('is-dragOver'));
  document.querySelectorAll('#spire-hand .is-dragging').forEach((el) => el.classList.remove('is-dragging'));
}

/**
 * @param {HTMLElement} root - .purify-battle
 * @param {object} opts
 * @param {() => number} opts.getTargetIndex
 * @param {(cardEl: HTMLElement, targetIndex: number) => void} opts.onPlay
 */
export function enableCardDrag(root, { getTargetIndex, onPlay }) {
  const gsap = window.gsap;
  const Draggable = window.Draggable;
  if (!gsap || !Draggable || !root) return;

  destroyCardDrag();

  const dropTargets = root.querySelectorAll('.Target[data-type], .purify-play-zone, .StwCombat');
  const cards = root.querySelectorAll('#spire-hand .Card:not(.disabled)');

  cards.forEach((card) => {
    const draggable = Draggable.create(card, {
      type: 'x,y',
      zIndexBoost: true,
      dragClickables: true,
      allowEventDefault: true,

      onPress() {
        combatSounds.selectCard();
      },

      onDragStart() {
        gsap.killTweensOf(this.target);
        this.startX = this.x;
        this.startY = this.y;
        card.classList.add('is-dragging');
      },

      onDrag() {
        if (card.disabled) {
          this.endDrag();
          return;
        }
        dropTargets.forEach((targetEl) => {
          if (this.hitTest(targetEl, '40%') && canDropOn(card, targetEl)) {
            targetEl.classList.add('is-dragOver');
          } else {
            targetEl.classList.remove('is-dragOver');
          }
        });
      },

      onRelease() {
        card.classList.remove('is-dragging');
        let hitEl = null;
        for (const targetEl of dropTargets) {
          if (this.hitTest(targetEl, '40%')) {
            hitEl = targetEl;
            break;
          }
        }
        dropTargets.forEach((t) => t.classList.remove('is-dragOver'));

        if (canDropOn(card, hitEl)) {
          const targetIndex = resolveTargetIndex(hitEl, getTargetIndex?.() ?? 0);
          gsap.to(card, {
            duration: 0.35,
            scale: 0.6,
            opacity: 0,
            y: '-=40',
            ease: 'power2.in',
            onComplete: () => {
              gsap.set(card, { x: 0, y: 0, scale: 1, opacity: 1 });
              onPlay?.(card, targetIndex);
            },
          });
        } else {
          gsap.to(card, {
            x: this.startX,
            y: this.startY,
            duration: 0.28,
            ease: 'power2.out',
          });
          combatSounds.cardToHand();
        }
      },
    })[0];

    dragInstances.push(draggable);
  });
}
