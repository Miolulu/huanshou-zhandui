/** 净化远征 · StW 风格 Overlay 面板 */
export class SpireOverlays {
  constructor(root) {
    this.root = root || document.getElementById('screen-spire');
    this.openId = null;
    this.bind();
  }

  bind() {
    if (!this.root) return;

    this.root.querySelectorAll('.Overlay-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const overlay = btn.closest('.Overlay');
        if (overlay) this.toggle(overlay.id);
      });
    });

    this.root.querySelectorAll('.Overlay-bg').forEach((bg) => {
      bg.addEventListener('click', () => this.closeAll());
    });

    document.addEventListener('keydown', (e) => {
      if (!this.root.classList.contains('active')) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        if (this.openId) {
          e.preventDefault();
          this.closeAll();
        }
        return;
      }

      const key = e.key.toLowerCase();
      const map = {
        m: 'spire-overlay-map',
        d: 'spire-overlay-deck',
        a: 'spire-overlay-draw',
        s: 'spire-overlay-discard',
        x: 'spire-overlay-exhaust',
        j: 'spire-overlay-log',
      };
      if (map[key]) {
        e.preventDefault();
        this.toggle(map[key]);
      }
    });
  }

  toggle(id) {
    if (this.openId === id) {
      this.closeAll();
      return;
    }
    this.closeAll();
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('is-open');
    this.openId = id;
    this.onOpen?.(id);
  }

  closeAll() {
    this.root?.querySelectorAll('.Overlay.is-open').forEach((el) => el.classList.remove('is-open'));
    this.openId = null;
  }

  updateLabels(state) {
    const c = state.combat;
    const drawEl = document.getElementById('label-overlay-draw');
    const discardEl = document.getElementById('label-overlay-discard');
    const deckEl = document.getElementById('label-overlay-deck');
    const exhaustEl = document.getElementById('label-overlay-exhaust');
    if (drawEl) drawEl.textContent = c ? `待启 ${c.drawCount}` : `秘典 ${state.deckSize}`;
    if (discardEl) discardEl.textContent = c ? `余韵 ${c.discardCount}` : '余韵 0';
    if (deckEl) deckEl.textContent = `秘典 ${state.deckSize}`;
    if (exhaustEl) exhaustEl.textContent = c ? String(c.exhaustCount ?? 0) : '0';
  }
}
