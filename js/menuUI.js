import { setMenuError, showToast } from './appShell.js';
import { loadProfile, saveProfile, checkDailyLogin, claimLoginReward, DAILY_TASKS, expForLevel, signOut } from './playerProfile.js';
import { getCurrentUsername } from './auth.js';
import { formatRank } from './rank.js';
import { renderCompendiumPanel, renderPurifyRecords } from './compendiumUI.js';
import { ensurePurifyProfile } from './roguelike/purifyProfile.js';

let callbacks = {};

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
    const panel = document.getElementById('compendium-panel');
    panel?.classList.toggle('hidden');
    if (panel && !panel.classList.contains('hidden')) {
      renderCompendiumPanel(panel);
    }
  });
}

export function refreshMenuProfile() {
  renderProfilePanel();
  renderPurifyRecords(document.getElementById('purify-records'));
  const panel = document.getElementById('compendium-panel');
  if (panel && !panel.classList.contains('hidden')) {
    renderCompendiumPanel(panel);
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
  if (usernameEl) usernameEl.textContent = getCurrentUsername() || '-';
  if (nicknameEl) nicknameEl.textContent = p.nickname || '-';
  document.getElementById('profile-rank').textContent = formatRank(p.rank);
  document.getElementById('profile-level').textContent = p.level;
  document.getElementById('profile-wins').textContent = p.stats?.wins || 0;
  document.getElementById('profile-gold').textContent = p.gold || 0;
  document.getElementById('profile-gems').textContent = p.gems || 0;
  const max = expForLevel(p.level);
  document.getElementById('profile-exp').textContent = p.exp;
  document.getElementById('profile-exp-max').textContent = max;
  document.getElementById('profile-exp-fill').style.width = `${Math.min(100, (p.exp / max) * 100)}%`;
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
}
