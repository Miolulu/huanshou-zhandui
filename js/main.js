import { GameEngine } from './gameEngine.js';
import { UI } from './ui.js';
import { RoomManager } from './roomManager.js';
import { initMenu, refreshMenuProfile } from './menuUI.js';
import { LobbyUI } from './lobbyUI.js';
import { initAuth } from './authUI.js';
import { showScreen, showToast } from './appShell.js';
import { getGameMode } from './gameModes.js';
import { onGameEnd, loadProfile, ensureProfileForAccount, checkDailyLogin } from './playerProfile.js';
import { saveGameSession, loadGameSession, clearGameSession } from './session.js';

let game;
let ui;
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

        const renderEvents = [
          'DAMAGE_TAKEN', 'CARD_DEATH', 'TURN_START', 'TURN_END',
          'HEAL', 'CRIT', 'SKILL_TRIGGER', 'STATUS_APPLIED',
          'ELEMENT_EFFECT', 'CARD_REVIVED', 'TEAM_DEFEATED', 'ATTACK', 'DODGE', 'EXECUTE',
          'CARD_ACTION_END', 'CARD_ACTION_START', 'ATTACK_WINDUP',
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

    initAuth(enterMainMenu);
  } catch (err) {
    console.error(err);
    if (window.__showBootError) window.__showBootError(err.message || String(err));
  }
}

init();
