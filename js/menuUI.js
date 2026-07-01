import { setMenuError, showToast } from './appShell.js';
import { loadProfile, saveProfile, checkDailyLogin, claimLoginReward, DAILY_TASKS, expForLevel, signOut } from './playerProfile.js';
import { getCurrentUsername } from './auth.js';
import { renderCompendiumPanel, renderPurifyRecords } from './compendiumUI.js';
import { ensurePurifyProfile } from './roguelike/purifyProfile.js';

let callbacks = {};

function openCompendiumModal() {
  const modal = document.getElementById('compendium-modal');
  const panel = document.getElementById('compendium-panel');
  if (!modal || !panel) return;
  renderCompendiumPanel(panel);
  modal.classList.remove('hidden');
}

function closeCompendiumModal() {
  document.getElementById('compendium-modal')?.classList.add('hidden');
}

function isCompendiumOpen() {
  const modal = document.getElementById('compendium-modal');
  return modal && !modal.classList.contains('hidden');
}

export function initMenu(onSpireStart, onSpireTier, onSpireInfinite) {
  callbacks = { onSpireStart, onSpireTier, onSpireInfinite };
  renderProfilePanel();
  renderPurifyRecords(document.getElementById('purify-records'));
  bindProfileEvents();

  checkDailyLogin(loadProfile());

  document.getElementById('btn-quick-start')?.addEventListener('click', () => {
    setMenuError('');
    callbacks.onSpireStart?.();
  });

  document.getElementById('btn-tier-start')?.addEventListener('click', () => {
    setMenuError('');
    callbacks.onSpireTier?.();
  });

  document.getElementById('btn-infinite-start')?.addEventListener('click', () => {
    setMenuError('');
    callbacks.onSpireInfinite?.();
  });

  document.getElementById('btn-show-compendium')?.addEventListener('click', () => {
    if (isCompendiumOpen()) closeCompendiumModal();
    else openCompendiumModal();
  });

  document.getElementById('btn-compendium-close')?.addEventListener('click', closeCompendiumModal);
  document.getElementById('compendium-modal-backdrop')?.addEventListener('click', closeCompendiumModal);
}

export function refreshMenuProfile() {
  renderProfilePanel();
  renderPurifyRecords(document.getElementById('purify-records'));
  if (isCompendiumOpen()) {
    renderCompendiumPanel(document.getElementById('compendium-panel'));
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
    if (e.key === 'Escape' && isCompendiumOpen()) closeCompendiumModal();
  });
}
