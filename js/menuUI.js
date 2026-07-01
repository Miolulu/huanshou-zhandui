import { peekRoom } from './roomManager.js';
import { showScreen, getNickname, setMenuError, showToast } from './appShell.js';
import { LEGACY_MODE_LIST, getGameMode, isModeUnlocked, buildPlayerConfigsForMode } from './gameModes.js';
import { loadProfile, saveProfile, checkDailyLogin, claimLoginReward, DAILY_TASKS, expForLevel, signOut } from './playerProfile.js';
import { getCurrentUsername } from './auth.js';
import { formatRank } from './rank.js';
import { startTutorial, shouldAutoStartTutorial } from './tutorial.js';
import { hasRecoverableSession } from './session.js';
import { renderCompendiumPanel, renderPurifyRecords } from './compendiumUI.js';
import { ensurePurifyProfile } from './roguelike/purifyProfile.js';

let selectedModeId = 'ai_battle';
let callbacks = {};

export function initMenu(onCreateRoom, onJoinRoom, onQuickStart, onRecoverSession, onSpireStart, onSpireTier, onSpireInfinite) {
  callbacks = {
    onCreateRoom, onJoinRoom, onQuickStart, onRecoverSession,
    onSpireStart, onSpireTier, onSpireInfinite,
  };
  renderProfilePanel();
  renderModeGrid();
  renderPurifyRecords(document.getElementById('purify-records'));
  bindProfileEvents();
  bindModeEvents();

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

  document.getElementById('btn-legacy-start')?.addEventListener('click', () => {
    setMenuError('');
    startLegacyQuick();
  });

  const btnCreateRoom = document.getElementById('btn-create-room');
  if (btnCreateRoom) {
    btnCreateRoom.onclick = () => {
      setMenuError('');
      if (selectedModeId === 'ai_battle') {
        setMenuError('人机对战请使用「立即开始」');
        return;
      }
      try {
        onCreateRoom(getNickname(), {
          modeId: selectedModeId,
          aiDifficulty: document.getElementById('select-ai-difficulty').value,
        });
      } catch (e) {
        setMenuError(e.message);
      }
    };
  }

  document.getElementById('btn-show-join').onclick = () => {
    document.getElementById('join-panel').classList.toggle('hidden');
  };

  document.getElementById('btn-join-room').onclick = () => {
    setMenuError('');
    const code = document.getElementById('input-room-code').value.trim();
    if (!code) { setMenuError('请输入房间号'); return; }
    try {
      onJoinRoom(code, getNickname());
    } catch (e) {
      setMenuError(e.message);
    }
  };

  const params = new URLSearchParams(location.search);
  const roomCode = params.get('room');
  if (roomCode) {
    document.getElementById('legacy-modes')?.setAttribute('open', '');
    document.getElementById('join-panel').classList.remove('hidden');
    document.getElementById('input-room-code').value = roomCode;
    if (peekRoom(roomCode)) {
      showToast(`检测到房间 ${roomCode.toUpperCase()}，点击加入`);
    }
  }

  if (hasRecoverableSession()) {
    const hint = document.getElementById('session-recover-hint');
    hint.classList.remove('hidden');
    hint.innerHTML = '检测到未结束的自走棋对局。<button type="button" id="btn-recover-session" class="btn-small btn-accent">继续对局</button>';
    document.getElementById('btn-recover-session').onclick = () => {
      callbacks.onRecoverSession?.();
    };
  }

  if (shouldAutoStartTutorial()) {
    setTimeout(() => startTutorial(), 600);
  }
}

export function refreshMenuProfile() {
  renderProfilePanel();
  renderModeGrid();
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

function renderModeGrid() {
  const profile = loadProfile();
  const grid = document.getElementById('mode-grid');
  if (!grid) return;
  grid.innerHTML = LEGACY_MODE_LIST.map(id => {
    const m = getGameMode(id);
    const locked = !isModeUnlocked(id, profile);
    const active = id === selectedModeId ? 'active' : '';
    return `<button type="button" class="mode-card ${active} ${locked ? 'locked' : ''}" data-mode="${id}" ${locked ? 'disabled' : ''}>
      <strong>${m.name}</strong>
      <span>${locked ? '🔒 未解锁' : m.desc}</span>
    </button>`;
  }).join('');

  grid.querySelectorAll('.mode-card:not(.locked)').forEach(btn => {
    btn.onclick = () => selectMode(btn.dataset.mode);
  });
}

function selectMode(modeId) {
  selectedModeId = modeId;
  renderModeGrid();
  updateModeUI();
}

function updateModeUI() {
  const mode = getGameMode(selectedModeId);
  const isSolo = selectedModeId === 'ai_battle' || selectedModeId === 'quick';
  document.getElementById('ai-difficulty-row').classList.toggle('hidden', !isSolo && mode.aiDifficulty !== 'selectable');
  document.getElementById('btn-legacy-start').classList.toggle('hidden', !isSolo);
  document.getElementById('btn-create-room').classList.toggle('hidden', isSolo);
  document.getElementById('btn-show-join').classList.remove('hidden');
  const diffSelect = document.getElementById('select-ai-difficulty');
  if (mode.aiDifficulty !== 'selectable') {
    diffSelect.value = mode.aiDifficulty === 'selectable' ? 'normal' : (mode.aiDifficulty || 'normal');
  }
}

function startLegacyQuick() {
  const diff = document.getElementById('select-ai-difficulty').value;
  const configs = buildPlayerConfigsForMode(selectedModeId, getNickname(), diff);
  const mode = getGameMode(selectedModeId);
  callbacks.onQuickStart?.(configs, {
    modeId: selectedModeId,
    isRanked: mode.isRanked,
    aiDifficulty: diff,
    economy: mode.economy,
    turnInterval: mode.turnInterval,
    prepareTime: mode.prepareTime,
  });
}

function bindModeEvents() {
  updateModeUI();
}

function bindProfileEvents() {
  document.getElementById('btn-daily-login').onclick = () => {
    const { profile, reward } = claimLoginReward(loadProfile());
    if (!reward) { showToast('今日已签到'); return; }
    saveProfile(profile);
    renderProfilePanel();
    showToast(`签到成功！+${reward.gold} 金币${reward.gems ? ` +${reward.gems} 宝石` : ''}`);
  };

  document.getElementById('btn-show-tasks').onclick = () => {
    const panel = document.getElementById('tasks-panel');
    panel.classList.toggle('hidden');
    if (panel.classList.contains('hidden')) return;
    const p = loadProfile();
    panel.innerHTML = '<h4>每日任务</h4>' + DAILY_TASKS.map(t => {
      const prog = p.tasks.dailyProgress[t.id] || 0;
      const done = prog >= t.target;
      return `<div class="task-row ${done ? 'done' : ''}">${t.name} (${prog}/${t.target}) ${done ? '✓' : ''}</div>`;
    }).join('');
  };

  document.getElementById('btn-tutorial').onclick = () => startTutorial(true);

  document.getElementById('btn-logout').onclick = () => {
    if (confirm('确定退出登录？成长数据已保存在本账号下。')) {
      signOut();
      location.reload();
    }
  };
}

export function getSelectedModeId() {
  return selectedModeId;
}
