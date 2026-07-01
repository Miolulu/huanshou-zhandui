/**
 * 净化远征 · 拖拽出牌（body 固定定位代理跟随指针，避免手牌区 overflow 裁切）
 */
import { combatSounds } from './combatSounds.js';

/** @type {import('gsap').Draggable[]} */
let dragInstances = [];

const OVER_CLASS = 'is-dragOver';

function ensureDragPlugin() {
  const gsap = window.gsap;
  const Draggable = window.Draggable;
  if (gsap?.registerPlugin && Draggable) {
    gsap.registerPlugin(Draggable);
  }
  return { gsap, Draggable };
}

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

function hideProxy(gsap, proxy) {
  if (!proxy) return;
  gsap.set(proxy, { visibility: 'hidden', opacity: 0, scale: 1, rotation: 0 });
}

export function destroyCardDrag() {
  const { gsap } = ensureDragPlugin();
  document.querySelectorAll('.Card-drag-proxy').forEach((el) => el.remove());
  dragInstances.forEach((d) => d.kill());
  dragInstances = [];
  document.querySelectorAll('.is-dragOver').forEach((el) => el.classList.remove('is-dragOver'));
  document.querySelectorAll('#spire-hand .card-drag-source').forEach((el) => {
    el.classList.remove('card-drag-source', 'is-dragging');
  });
}

function updateDropHighlights(card, targets, draggable) {
  targets.forEach((targetEl) => {
    if (draggable.hitTest(targetEl, '45%') && canDropOnTarget(card, targetEl)) {
      targetEl.classList.add(OVER_CLASS);
    } else {
      targetEl.classList.remove(OVER_CLASS);
    }
  });
}

/**
 * @param {HTMLElement} root - .purify-battle
 */
export function enableCardDrag(root, { getTargetIndex, onPlay }) {
  const { gsap, Draggable } = ensureDragPlugin();
  if (!gsap || !Draggable || !root) return;

  destroyCardDrag();

  const targets = root.querySelectorAll('.Target[data-type]');
  const cards = root.querySelectorAll('#spire-hand .Card:not(.disabled)');

  cards.forEach((card) => {
    const proxy = card.cloneNode(true);
    proxy.classList.add('Card-drag-proxy');
    proxy.setAttribute('aria-hidden', 'true');
    proxy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    document.body.appendChild(proxy);
    gsap.set(proxy, {
      position: 'fixed',
      left: 0,
      top: 0,
      margin: 0,
      visibility: 'hidden',
      opacity: 0,
      zIndex: 10050,
      pointerEvents: 'none',
    });

    let homeX = 0;
    let homeY = 0;
    let proxyW = 0;
    let proxyH = 0;

    const draggable = Draggable.create(proxy, {
      type: 'x,y',
      trigger: card,
      dragClickables: true,
      allowNativeTouchScrolling: false,
      minimumMovement: 3,
      inertia: false,
      cursor: 'inherit',

      onPress() {
        if (card.classList.contains('disabled')) {
          this.endDrag();
          return;
        }
        combatSounds.selectCard();
        const rect = card.getBoundingClientRect();
        homeX = rect.left;
        homeY = rect.top;
        proxyW = rect.width;
        proxyH = rect.height;
        gsap.set(proxy, {
          x: homeX,
          y: homeY,
          width: proxyW,
          height: proxyH,
          visibility: 'visible',
          opacity: 1,
          scale: 1.04,
          rotation: 0,
        });
        card.classList.add('card-drag-source', 'is-dragging');
        proxy.classList.add('is-dragging');
      },

      onDrag() {
        if (card.classList.contains('disabled')) {
          this.endDrag();
          return;
        }
        updateDropHighlights(card, targets, this);
      },

      onRelease() {
        card.classList.remove('is-dragging');
        proxy.classList.remove('is-dragging');
        targets.forEach((t) => t.classList.remove(OVER_CLASS));

        let hitEl = null;
        for (const targetEl of targets) {
          if (this.hitTest(targetEl, '45%')) {
            hitEl = targetEl;
            break;
          }
        }

        if (canDropOnTarget(card, hitEl)) {
          const targetIndex = resolveTargetIndex(hitEl, getTargetIndex?.() ?? 0);
          const cx = window.innerWidth / 2 - proxyW / 2;
          const cy = window.innerHeight * 0.34 - proxyH / 2;
          gsap.to(proxy, {
            x: cx,
            y: cy,
            scale: 0.5,
            rotation: 6,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
              card.classList.remove('card-drag-source');
              hideProxy(gsap, proxy);
              onPlay?.(card, targetIndex);
            },
          });
        } else {
          gsap.to(proxy, {
            x: homeX,
            y: homeY,
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.26,
            ease: 'power2.out',
            onComplete: () => {
              card.classList.remove('card-drag-source');
              hideProxy(gsap, proxy);
            },
          });
          combatSounds.cardToHand();
        }
      },
    })[0];

    dragInstances.push(draggable);
  });
}
