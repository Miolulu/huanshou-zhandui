/** 手牌 / 奖励牌 · 扑克扇形排布 */
export function applyCardFan(container, {
  rotateStep = 7,
  liftStep = 5,
  tiltX = 10,
} = {}) {
  if (!container) return;
  const cards = [...container.querySelectorAll('.Card, .purify-card')];
  if (!cards.length) {
    container.classList.remove('Cards--fan');
    return;
  }

  const mid = (cards.length - 1) / 2;
  cards.forEach((card, i) => {
    const offset = i - mid;
    const rot = offset * rotateStep;
    const y = -Math.abs(offset) * liftStep;
    const z = 20 - Math.abs(offset);
    card.style.setProperty('--fan-rot', `${rot}deg`);
    card.style.setProperty('--fan-y', `${y}px`);
    card.style.setProperty('--fan-z', String(z));
    card.style.setProperty('--fan-tilt', `${tiltX}deg`);
  });
  container.classList.add('Cards--fan');
}
