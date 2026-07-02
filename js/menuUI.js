import { setMenuError, showToast } from './appShell.js';
import { loadProfile, saveProfile, checkDailyLogin, claimLoginReward, DAILY_TASKS, expForLevel, signOut } from './playerProfile.js';
import { getCurrentUsername } from './auth.js';
import { renderCompendiumPanel, renderPurifyRecords } from './compendiumUI.js';
import { ensurePurifyProfile } from './roguelike/purifyProfile.js';
import { TERMS } from './roguelike/lore.js';

const MENU_OVERLAY_OPEN = '#screen-menu .MenuOverlay.is-open';
const MENU_CLOSE_LOCK_MS = 380;

let callbacks = {};
let menuOverlayBound = false;
let menuButtonsBound = false;
let profileEventsBound = false;
let closeLockTimer = 0;
let closeShieldEl = null;

function getMenuRoot() {
  return document.getElementById('screen-menu');
}

function isMenuOverlayOpen() {
  return !!getMenuRoot()?.querySelector(MENU_OVERLAY_OPEN);
}

function isMenuCloseLocked() {
  return getMenuRoot()?.classList.contains('menu-close-lock') ?? false;
}

function isMenuInteractionBlocked() {
  return isMenuOverlayOpen() || isMenuCloseLocked();
}

function syncMenuOverlayState() {
  const menu = getMenuRoot();
  const open = isMenuOverlayOpen();
  menu?.classList.toggle('menu-overlay-open', open);
}

export function closeMenuOverlays() {
  document.querySelectorAll(MENU_OVERLAY_OPEN).forEach((el) => el.classList.remove('is-open'));
  document.getElementById('tasks-panel')?.classList.add('hidden');
  syncMenuOverlayState();
}

function ensureCloseShield() {
  const menu = getMenuRoot();
  if (!menu) return null;
  if (!closeShieldEl) {
    closeShieldEl = document.createElement('div');
    closeShieldEl.id = 'menu-close-shield';
    closeShieldEl.className = 'menu-close-shield';
    closeShieldEl.setAttribute('aria-hidden', 'true');
    menu.appendChild(closeShieldEl);
  }
  return closeShieldEl;
}

function armMenuCloseLock() {
  const menu = getMenuRoot();
  if (!menu) return;
  menu.classList.add('menu-close-lock');
  const shield = ensureCloseShield();
  shield?.classList.add('is-active');
  clearTimeout(closeLockTimer);
  closeLockTimer = setTimeout(() => {
    menu.classList.remove('menu-close-lock');
    shield?.classList.remove('is-active');
  }, MENU_CLOSE_LOCK_MS);
}

function requestCloseMenuOverlays(e) {
  e?.preventDefault();
  e?.stopPropagation();
  if (typeof e?.stopImmediatePropagation === 'function') {
    e.stopImmediatePropagation();
  }
  closeMenuOverlays();
  armMenuCloseLock();
}

function openMenuOverlay(id) {
  document.querySelectorAll(MENU_OVERLAY_OPEN).forEach((el) => el.classList.remove('is-open'));
  document.getElementById(id)?.classList.add('is-open');
  document.getElementById('tasks-panel')?.classList.add('hidden');
  syncMenuOverlayState();
}

function toggleMenuOverlay(id, onOpen) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.classList.contains('is-open')) {
    requestCloseMenuOverlays();
    return;
  }
  onOpen?.();
  openMenuOverlay(id);
}

function bindMenuOverlayRoot() {
  if (menuOverlayBound) return;
  const menu = getMenuRoot();
  if (!menu) return;
  menuOverlayBound = true;

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

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const root = getMenuRoot();
    if (!root?.classList.contains('active')) return;
    if (!isMenuOverlayOpen()) return;
    e.preventDefault();
    requestCloseMenuOverlays(e);
  });
}

function renderManualBody() {
  const el = document.getElementById('menu-manual-body');
  if (!el) return;
  el.innerHTML = `
    <p>${TERMS.modeDesc}</p>
    <ul>
      <li><strong>路线图</strong>：按 M 打开，选择遭遇 / 秘法铺 / 驿站 / 源点</li>
      <li><strong>秘法铺</strong>：用探索币购入技法，或移除一张秘典技法</li>
      <li><strong>调息战斗</strong>：消耗 ${TERMS.spirit} 打出攻型与守型技法，按 E 或点击「收势」</li>
      <li><strong>护幕</strong>：抵御伤害，下轮 ${TERMS.endTurn} 后清零</li>
      <li><strong>污意</strong>：敌人下一 ${TERMS.turn} 的意图预告</li>
      <li><strong>悟道</strong>：净化成功后择一技法入 ${TERMS.codex}</li>
      <li><strong>待启 / 余韵</strong>：战斗开始时整副秘典洗入待启；每轮调息从待启感通 5 张；打出技法后非秘法进入余韵；收势时手牌也入余韵；待启抽空时余韵洗回待启</li>
      <li><strong>快捷键</strong>：M 路线图 · D 秘典 · A 待启 · S 余韵 · X 已竭 · J 日志 · Esc 菜单</li>
    </ul>`;
}

function bindMenuButtons() {
  if (menuButtonsBound) return;
  menuButtonsBound = true;

  const guard = (fn) => (e) => {
    if (isMenuInteractionBlocked()) {
      e?.preventDefault();
      e?.stopPropagation();
      return;
    }
    fn();
  };

  const guardUnlessCloseLocked = (fn) => (e) => {
    if (isMenuCloseLocked()) {
      e?.preventDefault();
      e?.stopPropagation();
      return;
    }
    fn();
  };

  document.getElementById('btn-quick-start')?.addEventListener('click', guard(() => {
    setMenuError('');
    closeMenuOverlays();
    callbacks.onSpireStart?.();
  }));

  document.getElementById('btn-tier-start')?.addEventListener('click', guard(() => {
    setMenuError('');
    closeMenuOverlays();
    callbacks.onSpireTier?.();
  }));

  document.getElementById('btn-infinite-start')?.addEventListener('click', guard(() => {
    setMenuError('');
    closeMenuOverlays();
    callbacks.onSpireInfinite?.();
  }));

  document.getElementById('btn-menu-tutorial')?.addEventListener('click', guard(() => {
    setMenuError('');
    closeMenuOverlays();
    callbacks.onTutorialStart?.();
  }));

  document.getElementById('btn-show-compendium')?.addEventListener('click', guardUnlessCloseLocked(() => {
    toggleMenuOverlay('menu-overlay-compendium', () => {
      renderCompendiumPanel(document.getElementById('compendium-panel'));
    });
  }));

  document.getElementById('btn-menu-profile')?.addEventListener('click', guardUnlessCloseLocked(() => {
    toggleMenuOverlay('menu-overlay-profile', () => {
      renderProfilePanel();
      renderPurifyRecords(document.getElementById('purify-records'));
    });
  }));

  document.getElementById('btn-menu-manual')?.addEventListener('click', guardUnlessCloseLocked(() => {
    toggleMenuOverlay('menu-overlay-manual');
  }));

  document.getElementById('btn-logout')?.addEventListener('click', guard(() => {
    if (confirm('确定退出登录？成长数据已保存在本账号下。')) {
      signOut();
      location.reload();
    }
  }));
}

export function initMenu(onSpireStart, onSpireTier, onSpireInfinite, onTutorialStart) {
  callbacks = { onSpireStart, onSpireTier, onSpireInfinite, onTutorialStart };
  renderProfilePanel();
  renderPurifyRecords(document.getElementById('purify-records'));
  renderManualBody();
  bindProfileEvents();
  bindMenuOverlayRoot();
  bindMenuButtons();

  checkDailyLogin(loadProfile());
}

export function refreshMenuProfile() {
  renderProfilePanel();
  renderPurifyRecords(document.getElementById('purify-records'));
  const compendiumPanel = document.getElementById('compendium-panel');
  if (document.getElementById('menu-overlay-compendium')?.classList.contains('is-open') && compendiumPanel) {
    renderCompendiumPanel(compendiumPanel);
  }
}

function renderProfilePanel() {
  let p = loadProfile();
  if (!p.purify) {
    p = ensurePurifyProfile(p);
    saveProfile(p);
  } else {
    p = ensurePurifyProfile(p);
  }
  const usernameEl = document.getElementById('profile-username');
  const nicknameEl = document.getElementById('profile-nickname');
  const topNameEl = document.getElementById('menu-top-nickname');
  if (usernameEl) usernameEl.textContent = getCurrentUsername() || '-';
  if (nicknameEl) nicknameEl.textContent = p.nickname || '-';
  if (topNameEl) topNameEl.textContent = p.nickname || '净化师';
  const levelEl = document.getElementById('profile-level');
  const winsEl = document.getElementById('profile-wins');
  if (levelEl) levelEl.textContent = p.level;
  if (winsEl) winsEl.textContent = p.stats?.wins || 0;
  const max = expForLevel(p.level);
  const expEl = document.getElementById('profile-exp');
  const expMaxEl = document.getElementById('profile-exp-max');
  const expFillEl = document.getElementById('profile-exp-fill');
  if (expEl) expEl.textContent = p.exp;
  if (expMaxEl) expMaxEl.textContent = max;
  if (expFillEl) expFillEl.style.width = `${Math.min(100, (p.exp / max) * 100)}%`;
}

function bindProfileEvents() {
  if (profileEventsBound) return;
  profileEventsBound = true;

  document.getElementById('btn-daily-login')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const { profile, reward } = claimLoginReward(loadProfile());
    if (!reward) { showToast('今日已签到'); return; }
    saveProfile(profile);
    renderProfilePanel();
    showToast(`签到成功！+${reward.gold} 金币${reward.gems ? ` +${reward.gems} 宝石` : ''}`);
  });

  document.getElementById('btn-show-tasks')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const panel = document.getElementById('tasks-panel');
    panel?.classList.toggle('hidden');
    if (!panel || panel.classList.contains('hidden')) return;
    const p = loadProfile();
    panel.innerHTML = '<h4>每日任务</h4>' + DAILY_TASKS.map(t => {
      const prog = p.tasks.dailyProgress[t.id] || 0;
      const done = prog >= t.target;
      return `<div class="task-row ${done ? 'done' : ''}">${t.name} (${prog}/${t.target}) ${done ? '✓' : ''}</div>`;
    }).join('');
  });
}
