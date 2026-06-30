/** 战斗时间轴 — Vol.2 Timeline */
export function renderBattleTimeline(cards, nextCardId = null) {
  if (!cards?.length) {
    return '<span class="timeline-empty">等待开战…</span>';
  }

  const parts = [];
  cards.forEach((card, i) => {
    if (i > 0) parts.push('<span class="timeline-arrow" aria-hidden="true">→</span>');
    const isNext = card.id === nextCardId || (i === 0 && !nextCardId);
    parts.push(`<div class="timeline-node ${isNext ? 'timeline-node--next' : ''}" data-card-id="${card.id}" title="${card.name}">
      <span class="timeline-portrait el-${card.element}">${(card.name || '?').charAt(0)}</span>
    </div>`);
  });
  return parts.join('');
}

export function getTimelineOrder(engine) {
  if (!engine) return [];
  return [...engine.getAllCards()]
    .filter((c) => c.isAlive && c.hp > 0)
    .sort((a, b) => b.speed - a.speed || a.position - b.position);
}
