import { GameEngine } from './gameEngine.js';
import { UI } from './ui.js';
import { RoomManager } from './roomManager.js';
import { initMenu, refreshMenuProfile } from './menuUI.js';
import { LobbyUI } from './lobbyUI.js';
import { initAuth } from './authUI.js';
import { showScreen, showToast } from './appShell.js';
import { getGameMode, buildPlayerConfigsForMode } from './gameModes.js';
import { onGameEnd, loadProfile, ensureProfileForAccount, checkDailyLogin } from './playerProfile.js';
import { saveGameSession, loadGameSession, clearGameSession } from './session.js';
import { createRun, RUN_MODES } from './roguelike/runEngine.js';
import { SpireUI } from './roguelike/spireUI.js';
import {
  isCombatTutorialDone, markEnemiesSeen, markEnemiesDefeated,
  completeCombatTutorial, recordRunEnd,
} from './roguelike/purifyProfile.js';

let game;
let ui;
let spireRun;
let spireUI;
let roomManager;
let lobbyUI;
let lastGameOptions = {};
let appReady = false;

function startGameFromRoom(playerConfigs, options = {}) {
  const room = roomManager.currentRoom;
  const mode = getGameMode(room?.modeId || options.modeId || 'ranked');
  lastGameOptions = {
    modeId: room?.modeId || options.modeId || 'ranked',
    isRanked: mode.isRanked,
    aiDifficulty: room?.aiDifficulty || options.aiDifficulty,
    economy: mode.economy,
    turnInterval: mode.turnInterval,
    prepareTime: mode.prepareTime,
  };
  showScreen('game');
  game.startGame(playerConfigs, lastGameOptions);
}

function startQuickGame(playerConfigs, options) {
  lastGameOptions = options;
  showScreen('game');
  game.startGame(playerConfigs, options);
}

function enterLobby() {
  showScreen('lobby');
  lobbyUI.render(roomManager.getLobbyState());
}

function leaveLobby() {
  roomManager.leaveRoom();
  showScreen('menu');
  refreshMenuProfile();
}

function recoverSession() {
  const data = loadGameSession();
  if (!data) { showToast('没有可恢复的对局'); return; }
  lastGameOptions = data.meta || {};
  showScreen('game');
  if (game.restoreFromSession(data)) {
    showToast('已恢复对局');
  } else {
    showToast('恢复失败');
    clearGameSession();
  }
}

function enterMainMenu() {
  ensureProfileForAccount();
  checkDailyLogin(loadProfile());
  showScreen('menu');
  if (!appReady) {
    initApp();
    appReady = true;
  } else {
    refreshMenuProfile();
  }
}

let spireRunEndRecorded = false;

function startSpireRun(mode = RUN_MODES.EXPEDITION) {
  spireRunEndRecorded = false;
  let profile = loadProfile();
  const nickname = profile.nickname || '净化师';
  const skipTutorial = isCombatTutorialDone(profile);

  spireRun = createRun(nickname, { mode, skipTutorial });
  spireRun.onCombatWonCallback = (ids) => {
    profile = markEnemiesDefeated(loadProfile(), ids);
  };
  spireUI = new SpireUI(spireRun, () => {
    spireRun = null;
    spireUI = null;
    showScreen('menu');
    refreshMenuProfile();
  }, {
    onEncounter: (ids) => {
      profile = markEnemiesSeen(loadProfile(), ids);
    },
    onTutorialComplete: () => {
      profile = completeCombatTutorial(loadProfile());
      showToast('实战引导完成！继续你的净化远征');
    },
    onRunEnd: (result) => {
      if (spireRunEndRecorded) return;
      spireRunEndRecorded = true;
      let p = loadProfile();
      if (result.encounterIds?.length) {
        if (result.victory) p = markEnemiesDefeated(p, result.encounterIds);
        else p = markEnemiesSeen(p, result.encounterIds);
      }
      recordRunEnd(p, {
        mode: result.mode,
        floor: result.floor,
        victory: result.victory,
        stats: result.stats,
      });
    },
  });
  showScreen('spire');
  spireUI.render();
}

function initApp() {
  roomManager = new RoomManager((state) => lobbyUI?.render(state));
  lobbyUI = new LobbyUI(roomManager, startGameFromRoom, leaveLobby);

  if (roomManager.channel) {
    roomManager.onChannelMessage((e) => {
      if (e.data?.type === 'GAME_START' && e.data.code === roomManager.currentRoom?.code) {
        const configs = RoomManager.configsForClient(e.data.room, roomManager.playerId);
        startGameFromRoom(configs, { modeId: e.data.modeId, aiDifficulty: e.data.aiDifficulty });
      } else if (e.data?.code === roomManager.currentRoom?.code && e.data.room) {
        roomManager.currentRoom = e.data.room;
        roomManager.mySlotIndex = e.data.room.slots.findIndex(s => s.id === roomManager.playerId);
        lobbyUI.render(roomManager.getLobbyState());
      }
    });
  }

  initMenu(
    (nickname, opts) => { roomManager.createRoom(nickname, opts); enterLobby(); },
    (code, nickname) => { roomManager.joinRoom(code, nickname); enterLobby(); },
    startQuickGame,
    recoverSession,
    startSpireRun,
    () => startSpireRun(RUN_MODES.TIER),
    () => startSpireRun(RUN_MODES.INFINITE),
  );

  const recoverBtn = document.getElementById('btn-recover-session');
  if (recoverBtn) recoverBtn.onclick = recoverSession;

  document.getElementById('btn-back-lobby').onclick = () => {
    if (confirm('确定退出对局？')) {
      clearGameSession();
      showScreen('menu');
      roomManager.leaveRoom();
      refreshMenuProfile();
    }
  };

  document.getElementById('overlay').addEventListener('click', (e) => {
    if (e.target.id === 'btn-restart') {
      showScreen('menu');
      roomManager.leaveRoom();
      refreshMenuProfile();
    }
  });
}

function init() {
  try {
    game = new GameEngine(
      (state) => {
        ui?.render(state);
        saveGameSession(game, lastGameOptions);
        if (state.phase === 'ENDED') clearGameSession();
      },
      (event, engine) => {
        ui.appendBattleLog(event);
        if (event.type === 'BATTLE_START') ui.onBattleStart();
        if (event.type === 'BATTLE_END') {
          ui.render(game.getState());
          const hr = game.lastHumanResult;
          if (hr?.winner?.id === game.humanId) {
            showToast(`胜利！${hr.turnCount} 回合`);
          } else if (hr?.loser?.id === game.humanId) {
            showToast(`战败，-${hr.damage} HP（${hr.turnCount} 回合）`);
          } else if (hr?.type === 'DRAW') {
            showToast(`平局，-${hr.damage} HP`);
          }
        }

        const renderEvents = [
          'BATTLE_START', 'BATTLE_READY', 'BATTLE_END',
          'DAMAGE_TAKEN', 'CARD_DEATH', 'TURN_START', 'TURN_END',
          'HEAL', 'CRIT', 'SKILL_TRIGGER', 'STATUS_APPLIED',
          'ELEMENT_EFFECT', 'CARD_REVIVED', 'TEAM_DEFEATED', 'ATTACK', 'DODGE', 'EXECUTE',
          'CARD_ACTION_END', 'CARD_ACTION_START', 'ATTACK_WINDUP',
          'PARTNER_LINK', 'TRAINER_COMMAND', 'TRAINER_COMMAND_PROMPT', 'TRAINER_COMMAND_END', 'INSIGHT_REVEAL',
          'STAT_BUFF',
        ];
        if (renderEvents.includes(event.type)) {
          ui.render(game.getState());
        }
        if (event.type === 'CARD_ACTION_START' || event.type === 'ATTACK_WINDUP') {
          ui.renderBattleTimelinePanel?.(game.getState());
        }

        const fxEvents = [
          'DAMAGE_TAKEN', 'HEAL', 'CRIT', 'SKILL_TRIGGER',
          'STATUS_APPLIED', 'ATTACK', 'ATTACK_WINDUP', 'DODGE', 'EXECUTE', 'CARD_DEATH',
          'CARD_ACTION_START',
        ];
        if (fxEvents.includes(event.type)) {
          ui.handleBattleEvent(event);
        }
      }
    );

    game.onGameEnd = (result) => {
      const { profile, expGain, rankResult } = onGameEnd(loadProfile(), result.finalRank, result.isRanked);
      ui.setEndRewards({ expGain, rankResult, isRanked: result.isRanked });
      refreshMenuProfile();
    };

    ui = new UI(game);

    const debugBattle = new URLSearchParams(location.search).get('debug') === 'battle'
      && (location.hostname === '127.0.0.1' || location.hostname === 'localhost');
    const debugSpire = new URLSearchParams(location.search).get('debug') === 'spire'
      && (location.hostname === '127.0.0.1' || location.hostname === 'localhost');
    if (debugSpire) {
      initApp();
      appReady = true;
      startSpireRun(RUN_MODES.EXPEDITION);
    } else if (debugBattle) {
      runLocalBattleDebug();
    } else {
      initAuth(enterMainMenu);
    }
  } catch (err) {
    console.error(err);
    if (window.__showBootError) window.__showBootError(err.message || String(err));
  }
}

/** 本地调试：http://127.0.0.1:8888/?debug=battle 自动开战 */
function runLocalBattleDebug() {
  showScreen('game');
  const configs = buildPlayerConfigsForMode('ai_battle', '调试员', 'normal');
  lastGameOptions = { modeId: 'ai_battle', prepareTime: 999, aiDifficulty: 'normal' };
  game.startGame(configs, lastGameOptions);
  const human = game.getHuman();
  game.buyCard(human, 0);
  showToast('调试：已收服 1 只，即将开战…');
  setTimeout(() => game.endPreparePhase(), 800);
}

init();
