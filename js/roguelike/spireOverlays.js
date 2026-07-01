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
      bg.addEventListener('click', () => {
        const overlay = bg.closest('.Overlay');
        if (overlay?.classList.contains('StwModal')) return;
        this.closeAll();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (!this.root.classList.contains('active')) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        if (this.openId) {
          e.preventDefault();
          const el = document.getElementById(this.openId);
          if (el?.classList.contains('StwModal')) return;
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
      const el = document.getElementById(id);
      if (el?.classList.contains('StwModal')) return;
      this.closeAll();
      return;
    }
    const next = document.getElementById(id);
    if (next?.classList.contains('StwModal')) {
      this.closeCornerOverlays();
      next.classList.add('is-open');
      this.openId = id;
      this.onOpen?.(id);
      return;
    }
    this.closeAll();
    if (!next) return;
    next.classList.add('is-open');
    this.openId = id;
    this.onOpen?.(id);
  }

  open(id) {
    const el = document.getElementById(id);
    if (!el || this.openId === id) return;
    if (el.classList.contains('StwModal')) {
      el.classList.add('is-open');
      this.openId = id;
      this.onOpen?.(id);
      return;
    }
    this.closeAll();
    el.classList.add('is-open');
    this.openId = id;
    this.onOpen?.(id);
  }

  close(id) {
    const el = document.getElementById(id);
    el?.classList.remove('is-open');
    if (this.openId === id) this.openId = null;
  }

  closeCornerOverlays() {
    this.root?.querySelectorAll('.Overlay.is-open:not(.StwModal)').forEach((el) => {
      el.classList.remove('is-open');
    });
    if (this.openId && !document.getElementById(this.openId)?.classList.contains('StwModal')) {
      this.openId = null;
    }
  }

  closeAll() {
    this.root?.querySelectorAll('.Overlay.is-open').forEach((el) => el.classList.remove('is-open'));
    this.openId = null;
  }

  closeModals() {
    this.root?.querySelectorAll('.StwModal.is-open').forEach((el) => el.classList.remove('is-open'));
    if (this.openId && document.getElementById(this.openId)?.classList.contains('StwModal')) {
      this.openId = null;
    }
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
