/**
 * 净化远征 · 拖拽出牌
 * pointer 事件 + 固定代理，按下时代理卡牌中心立即移动到鼠标位置
 */
import { combatSounds } from './combatSounds.js';

/** @type {Array<{ cleanup: () => void }>} */
let dragBindings = [];

const OVER_CLASS = 'is-dragOver';

function gsap() {
  return window.gsap;
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
  if (targetEl?.dataset?.target != null) {
    const targetIndex = Number(targetEl.dataset.target);
    if (Number.isFinite(targetIndex)) return targetIndex;
  }
  return fallbackIndex;
}

function hideProxy(proxy) {
  if (!proxy) return;
  const g = gsap();
  if (g) {
    g.killTweensOf(proxy);
    g.set(proxy, {
      visibility: 'hidden',
      opacity: 0,
      scale: 1,
      rotation: 0,
      left: 0,
      top: 0,
      x: 0,
      y: 0,
    });
  } else {
    Object.assign(proxy.style, {
      visibility: 'hidden',
      opacity: '0',
      left: '0px',
      top: '0px',
      transform: '',
    });
  }
}

function moveProxy(proxy, clientX, clientY, offsetX, offsetY) {
  if (!proxy) return;
  const left = clientX - offsetX;
  const top = clientY - offsetY;
  const g = gsap();
  if (g) {
    g.set(proxy, { left, top, x: 0, y: 0 });
  } else {
    proxy.style.left = `${left}px`;
    proxy.style.top = `${top}px`;
  }
}

function proxyHitsTarget(proxy, targetEl, threshold = 0.4) {
  const pr = proxy.getBoundingClientRect();
  const tr = targetEl.getBoundingClientRect();
  const overlapX = Math.max(0, Math.min(pr.right, tr.right) - Math.max(pr.left, tr.left));
  const overlapY = Math.max(0, Math.min(pr.bottom, tr.bottom) - Math.max(pr.top, tr.top));
  const overlapArea = overlapX * overlapY;
  const proxyArea = Math.max(1, pr.width * pr.height);
  return overlapArea >= proxyArea * threshold;
}

export function destroyCardDrag() {
  dragBindings.forEach((b) => b.cleanup());
  dragBindings = [];
  document.querySelectorAll('.Card-drag-proxy').forEach((el) => el.remove());
  document.querySelectorAll('.is-dragOver').forEach((el) => el.classList.remove('is-dragOver'));
  document.querySelectorAll('#spire-hand .card-drag-source').forEach((el) => {
    el.classList.remove('card-drag-source', 'is-dragging');
  });
}

function updateDropHighlights(card, targets, proxy) {
  targets.forEach((targetEl) => {
    if (proxyHitsTarget(proxy, targetEl) && canDropOnTarget(card, targetEl)) {
      targetEl.classList.add(OVER_CLASS);
    } else {
      targetEl.classList.remove(OVER_CLASS);
    }
  });
}

function findDropTarget(card, targets, proxy) {
  for (const targetEl of targets) {
    if (proxyHitsTarget(proxy, targetEl) && canDropOnTarget(card, targetEl)) {
      return targetEl;
    }
  }
  return null;
}

/**
 * @param {HTMLElement} root - .purify-battle
 */
export function enableCardDrag(root, { getTargetIndex, onPlay } = {}) {
  if (!root) return;

  destroyCardDrag();

  const targets = Array.from(root.querySelectorAll('.Target[data-type]'));
  const cards = Array.from(root.querySelectorAll('#spire-hand .Card:not(.disabled)'));

  cards.forEach((card) => {
    const proxy = card.cloneNode(true);
    proxy.classList.add('Card-drag-proxy');
    proxy.setAttribute('aria-hidden', 'true');
    proxy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    document.body.appendChild(proxy);
    hideProxy(proxy);

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let homeX = 0;
    let homeY = 0;
    let proxyW = 0;
    let proxyH = 0;
    let activePointerId = null;
    const originalTouchAction = card.style.touchAction;
    card.style.touchAction = 'none';

    const showProxyAt = (clientX, clientY, rect) => {
      homeX = rect.left;
      homeY = rect.top;
      proxyW = rect.width;
      proxyH = rect.height;
      offsetX = proxyW / 2;
      offsetY = proxyH / 2;
      const left = clientX - offsetX;
      const top = clientY - offsetY;

      const g = gsap();
      if (g) {
        g.killTweensOf(proxy);
        g.set(proxy, {
          position: 'fixed',
          left,
          top,
          margin: 0,
          width: proxyW,
          height: proxyH,
          zIndex: 10050,
          pointerEvents: 'none',
          visibility: 'visible',
          opacity: 1,
          scale: 1.04,
          rotation: 0,
          x: 0,
          y: 0,
        });
      } else {
        Object.assign(proxy.style, {
          position: 'fixed',
          left: `${left}px`,
          top: `${top}px`,
          margin: '0',
          width: `${proxyW}px`,
          height: `${proxyH}px`,
          zIndex: '10050',
          pointerEvents: 'none',
          visibility: 'visible',
          opacity: '1',
          transform: 'scale(1.04)',
          transformOrigin: 'center center',
        });
      }

      card.classList.add('card-drag-source', 'is-dragging');
      proxy.classList.add('is-dragging');
    };

    const finishDrag = () => {
      if (!dragging) return;
      dragging = false;
      activePointerId = null;

      card.classList.remove('is-dragging');
      proxy.classList.remove('is-dragging');
      targets.forEach((t) => t.classList.remove(OVER_CLASS));

      const hitEl = findDropTarget(card, targets, proxy);
      const g = gsap();

      if (canDropOnTarget(card, hitEl)) {
        const targetIndex = resolveTargetIndex(hitEl, getTargetIndex?.() ?? 0);
        const cx = window.innerWidth / 2 - proxyW / 2;
        const cy = window.innerHeight * 0.34 - proxyH / 2;
        let completed = false;
        const afterPlay = () => {
          if (completed) return;
          completed = true;
          card.classList.remove('card-drag-source');
          hideProxy(proxy);
          onPlay?.(card, targetIndex);
        };
        if (g) {
          g.killTweensOf(proxy);
          g.to(proxy, {
            left: cx,
            top: cy,
            x: 0,
            y: 0,
            scale: 0.5,
            rotation: 6,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: afterPlay,
          });
          setTimeout(afterPlay, 420);
        } else {
          afterPlay();
        }
      } else {
        let completed = false;
        const afterReturn = () => {
          if (completed) return;
          completed = true;
          card.classList.remove('card-drag-source');
          hideProxy(proxy);
        };
        if (g) {
          g.killTweensOf(proxy);
          g.to(proxy, {
            left: homeX,
            top: homeY,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.26,
            ease: 'power2.out',
            onComplete: afterReturn,
          });
          setTimeout(afterReturn, 380);
        } else {
          afterReturn();
        }
        combatSounds.cardToHand();
      }
    };

    const onWindowPointerMove = (e) => {
      if (!dragging || e.pointerId !== activePointerId) return;
      e.preventDefault();
      moveProxy(proxy, e.clientX, e.clientY, offsetX, offsetY);
      updateDropHighlights(card, targets, proxy);
    };

    const onWindowPointerUp = (e) => {
      if (!dragging || e.pointerId !== activePointerId) return;
      e.preventDefault();
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
      finishDrag();
    };

    const onPointerDown = (e) => {
      if (card.classList.contains('disabled') || dragging) return;
      if (e.button !== undefined && e.button !== 0) return;

      e.preventDefault();
      dragging = true;
      activePointerId = e.pointerId;
      combatSounds.selectCard();

      const rect = card.getBoundingClientRect();
      showProxyAt(e.clientX, e.clientY, rect);
      moveProxy(proxy, e.clientX, e.clientY, offsetX, offsetY);
      updateDropHighlights(card, targets, proxy);

      window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
      window.addEventListener('pointerup', onWindowPointerUp, { passive: false });
      window.addEventListener('pointercancel', onWindowPointerUp, { passive: false });
    };

    card.addEventListener('pointerdown', onPointerDown);

    dragBindings.push({
      cleanup: () => {
        dragging = false;
        activePointerId = null;
        card.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onWindowPointerMove);
        window.removeEventListener('pointerup', onWindowPointerUp);
        window.removeEventListener('pointercancel', onWindowPointerUp);
        card.style.touchAction = originalTouchAction;
        card.classList.remove('card-drag-source', 'is-dragging');
        targets.forEach((targetEl) => targetEl.classList.remove(OVER_CLASS));
        proxy.remove();
      },
    });
  });
}
