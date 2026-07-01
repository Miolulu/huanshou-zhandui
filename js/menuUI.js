import { setMenuError, showToast } from './appShell.js';
import { loadProfile, saveProfile, checkDailyLogin, claimLoginReward, DAILY_TASKS, expForLevel, signOut } from './playerProfile.js';
import { getCurrentUsername } from './auth.js';
import { renderCompendiumPanel, renderPurifyRecords } from './compendiumUI.js';
import { ensurePurifyProfile } from './roguelike/purifyProfile.js';
import { TERMS } from './roguelike/lore.js';

let callbacks = {};

function openMenuOverlay(id) {
  document.querySelectorAll('#screen-menu .MenuOverlay.is-open').forEach((el) => el.classList.remove('is-open'));
  document.getElementById(id)?.classList.add('is-open');
}

function closeMenuOverlays() {
  document.querySelectorAll('#screen-menu .MenuOverlay.is-open').forEach((el) => el.classList.remove('is-open'));
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
      <li><strong>快捷键</strong>：M 路线图 · D 秘典 · A 待启 · S 余韵 · X 已竭 · J 日志 · Esc 菜单</li>
    </ul>`;
}

export function initMenu(onSpireStart, onSpireTier, onSpireInfinite, onTutorialStart) {
  callbacks = { onSpireStart, onSpireTier, onSpireInfinite, onTutorialStart };
  renderProfilePanel();
  renderPurifyRecords(document.getElementById('purify-records'));
  renderManualBody();
  bindProfileEvents();

  checkDailyLogin(loadProfile());

  document.getElementById('btn-quick-start')?.addEventListener('click', () => {
    setMenuError('');
    closeMenuOverlays();
    callbacks.onSpireStart?.();
  });

  document.getElementById('btn-tier-start')?.addEventListener('click', () => {
    setMenuError('');
    closeMenuOverlays();
    callbacks.onSpireTier?.();
  });

  document.getElementById('btn-infinite-start')?.addEventListener('click', () => {
    setMenuError('');
    closeMenuOverlays();
    callbacks.onSpireInfinite?.();
  });

  document.getElementById('btn-menu-tutorial')?.addEventListener('click', () => {
    setMenuError('');
    closeMenuOverlays();
    callbacks.onTutorialStart?.();
  });

  document.getElementById('btn-show-compendium')?.addEventListener('click', () => {
    renderCompendiumPanel(document.getElementById('compendium-panel'));
    openMenuOverlay('menu-overlay-compendium');
  });

  document.getElementById('btn-menu-profile')?.addEventListener('click', () => {
    renderProfilePanel();
    renderPurifyRecords(document.getElementById('purify-records'));
    openMenuOverlay('menu-overlay-profile');
  });

  document.getElementById('btn-menu-manual')?.addEventListener('click', () => {
    openMenuOverlay('menu-overlay-manual');
  });

  document.querySelectorAll('[data-close-overlay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.closeOverlay)?.classList.remove('is-open');
    });
  });

  document.querySelectorAll('#screen-menu .MenuOverlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('is-open');
    });
  });
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
  document.getElementById('btn-daily-login')?.addEventListener('click', () => {
    const { profile, reward } = claimLoginReward(loadProfile());
    if (!reward) { showToast('今日已签到'); return; }
    saveProfile(profile);
    renderProfilePanel();
    showToast(`签到成功！+${reward.gold} 金币${reward.gems ? ` +${reward.gems} 宝石` : ''}`);
  });

  document.getElementById('btn-show-tasks')?.addEventListener('click', () => {
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

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('确定退出登录？成长数据已保存在本账号下。')) {
      signOut();
      location.reload();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenuOverlays();
  });
}
