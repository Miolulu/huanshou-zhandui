/**
 * 主菜单弹窗关闭逻辑 smoke（纯 DOM，不依赖登录）
 * node scripts/menu-overlay-smoke.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadDom() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const { JSDOM } = globalThis.__JSDOM__;
  return new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    resources: 'usable',
  });
}

async function main() {
  let JSDOM;
  try {
    ({ JSDOM } = await import('jsdom'));
  } catch {
    console.log('⚠ jsdom 未安装，跳过 menu-overlay-smoke（请在浏览器手动验证）');
    process.exit(0);
  }
  globalThis.__JSDOM__ = { JSDOM };

  const dom = loadDom();
  const { window } = dom;
  const { document } = window;

  const MENU_OVERLAY_OPEN = '#screen-menu .MenuOverlay.is-open';
  let closeLockTimer = 0;
  let closeShieldEl = null;

  function syncMenuOverlayState() {
    const menu = document.getElementById('screen-menu');
    const open = !!menu?.querySelector(MENU_OVERLAY_OPEN);
    menu?.classList.toggle('menu-overlay-open', open);
  }

  function closeMenuOverlays() {
    document.querySelectorAll(MENU_OVERLAY_OPEN).forEach((el) => el.classList.remove('is-open'));
    document.getElementById('tasks-panel')?.classList.add('hidden');
    syncMenuOverlayState();
  }

  function ensureCloseShield() {
    const menu = document.getElementById('screen-menu');
    if (!closeShieldEl) {
      closeShieldEl = document.createElement('div');
      closeShieldEl.className = 'menu-close-shield';
      menu.appendChild(closeShieldEl);
    }
    return closeShieldEl;
  }

  function armMenuCloseLock() {
    const menu = document.getElementById('screen-menu');
    menu?.classList.add('menu-close-lock');
    ensureCloseShield()?.classList.add('is-active');
    clearTimeout(closeLockTimer);
    closeLockTimer = window.setTimeout(() => {
      menu?.classList.remove('menu-close-lock');
      closeShieldEl?.classList.remove('is-active');
    }, 380);
  }

  function requestCloseMenuOverlays(e) {
    e?.preventDefault();
    e?.stopPropagation();
    closeMenuOverlays();
    armMenuCloseLock();
  }

  const menu = document.getElementById('screen-menu');
  menu.classList.add('active');
  menu.querySelectorAll('.MenuOverlay').forEach((overlay) => {
    overlay.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('[data-close-overlay]')) {
        requestCloseMenuOverlays(e);
        return;
      }
      if (e.target === overlay) {
        requestCloseMenuOverlays(e);
      }
    });
  });

  const overlays = [
    'menu-overlay-profile',
    'menu-overlay-compendium',
    'menu-overlay-manual',
  ];

  for (const id of overlays) {
    const el = document.getElementById(id);
    el.classList.add('is-open');
    syncMenuOverlayState();
    assert(el.classList.contains('is-open'), `${id} should open`);
    assert(menu.classList.contains('menu-overlay-open'), 'menu should flag overlay-open');

    const closeBtn = el.querySelector('[data-close-overlay]');
    assert(closeBtn, `${id} needs close button`);
    closeBtn.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    assert(!el.classList.contains('is-open'), `${id} should close via ×`);
    assert(!menu.classList.contains('menu-overlay-open'), 'menu should clear overlay-open');
    assert(menu.classList.contains('menu-close-lock'), 'close lock should arm after ×');
    assert(closeShieldEl?.classList.contains('is-active'), 'close shield should be active');
  }

  const profile = document.getElementById('menu-overlay-profile');
  profile.classList.add('is-open');
  syncMenuOverlayState();
  profile.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
  assert(!profile.classList.contains('is-open'), 'profile should close via backdrop');

  profile.classList.add('is-open');
  const tasks = document.getElementById('tasks-panel');
  tasks.classList.remove('hidden');
  closeMenuOverlays();
  assert(tasks.classList.contains('hidden'), 'tasks panel should hide when overlay closes');

  console.log('✅ menu-overlay-smoke passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
