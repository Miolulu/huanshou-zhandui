/**
 * 净化远征 · 拖拽出牌（参照 Slay the Web dragdrop.js）
 * 依赖 index.html 中加载的全局 gsap / Draggable
 */
import { combatSounds } from './combatSounds.js';

/** @type {import('gsap').Draggable[]} */
let dragInstances = [];

const OVER_CLASS = 'is-dragOver';

function cardTargetType(cardType) {
  if (cardType === 'attack') return 'enemy';
  return 'player';
}

function getTargetStringFromElement(el) {
  if (!el?.dataset?.type) return '';
  const idx = el.dataset.target ?? '0';
  return `${el.dataset.type}${idx}`;
}

function cardHasValidTarget(cardTarget, targetQuery) {
  return (
    (cardTarget === 'player' && targetQuery.includes('player'))
    || (cardTarget === 'enemy' && targetQuery.includes('enemy'))
  );
}

function canDropOnTarget(cardEl, targetEl) {
  if (!targetEl || !cardEl) return false;
  const cardTarget = cardEl.dataset.cardTarget || cardTargetType(cardEl.dataset.cardType);
  const targetQuery = getTargetStringFromElement(targetEl);
  const targetIsDead = targetEl.classList.contains('Target--isDead');
  return cardHasValidTarget(cardTarget, targetQuery) && !targetIsDead;
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

  const targets = root.querySelectorAll('.Target[data-type]');
  const cards = root.querySelectorAll('#spire-hand .Card:not(.disabled)');

  cards.forEach((card) => {
    const draggable = Draggable.create(card, {
      type: 'x,y',
      zIndexBoost: true,
      dragClickables: true,
      allowEventDefault: true,
      minimumMovement: 6,

      onDragStart() {
        gsap.killTweensOf(this.target);
        this.startX = 0;
        this.startY = 0;
        card.classList.add('is-dragging');
        combatSounds.selectCard();
      },

      onDrag() {
        if (card.disabled || card.classList.contains('disabled')) {
          this.endDrag();
          return;
        }
        targets.forEach((targetEl) => {
          if (this.hitTest(targetEl, '40%') && canDropOnTarget(card, targetEl)) {
            targetEl.classList.add(OVER_CLASS);
          } else {
            targetEl.classList.remove(OVER_CLASS);
          }
        });
      },

      onRelease() {
        card.classList.remove('is-dragging');
        let hitEl = null;
        for (const targetEl of targets) {
          if (this.hitTest(targetEl, '40%')) {
            hitEl = targetEl;
            break;
          }
        }
        targets.forEach((t) => t.classList.remove(OVER_CLASS));

        if (canDropOnTarget(card, hitEl)) {
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
