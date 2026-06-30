import { GameEngine } from './gameEngine.js';
import { UI } from './ui.js';
import { RoomManager } from './roomManager.js';
import { initMenu } from './menuUI.js';
import { LobbyUI } from './lobbyUI.js';
import { showScreen, renderElementChart, showToast } from './appShell.js';

let game;
let ui;
let roomManager;
let lobbyUI;

function startGameFromRoom(playerConfigs) {
  showScreen('game');
  game.startGame(playerConfigs);
}

function enterLobby() {
  showScreen('lobby');
  lobbyUI.render(roomManager.getLobbyState());
}

function leaveLobby() {
  roomManager.leaveRoom();
  showScreen('menu');
}

function init() {
  try {
    renderElementChart(document.getElementById('menu-element-chart'));
    renderElementChart(document.getElementById('element-chart'), true);

    game = new GameEngine(
    (state) => ui?.render(state),
    (event, engine) => {
      ui.appendBattleLog(event);
      if (event.type === 'BATTLE_START') ui.onBattleStart();
      if (['DAMAGE_TAKEN', 'CARD_DEATH', 'TURN_START', 'TURN_END', 'ELEMENT_EFFECT', 'CARD_REVIVED', 'TEAM_DEFEATED'].includes(event.type)) {
        ui.render(game.getState());
      }
    }
  );
  ui = new UI(game);

  roomManager = new RoomManager((state) => lobbyUI?.render(state));
  lobbyUI = new LobbyUI(roomManager, startGameFromRoom, leaveLobby);

  if (roomManager.channel) {
    roomManager.onChannelMessage((e) => {
      if (e.data?.type === 'GAME_START' && e.data.code === roomManager.currentRoom?.code) {
        const configs = RoomManager.configsForClient(e.data.room, roomManager.playerId);
        startGameFromRoom(configs);
      } else if (e.data?.code === roomManager.currentRoom?.code && e.data.room) {
        roomManager.currentRoom = e.data.room;
        roomManager.mySlotIndex = e.data.room.slots.findIndex(s => s.id === roomManager.playerId);
        lobbyUI.render(roomManager.getLobbyState());
      }
    });
  }

  initMenu(
    (nickname) => { roomManager.createRoom(nickname); enterLobby(); },
    (code, nickname) => { roomManager.joinRoom(code, nickname); enterLobby(); }
  );

  document.getElementById('btn-back-lobby').onclick = () => {
    if (confirm('确定退出对局？')) {
      showScreen('menu');
      roomManager.leaveRoom();
    }
  };

  document.getElementById('overlay').addEventListener('click', (e) => {
    if (e.target.id === 'btn-restart') {
      showScreen('menu');
      roomManager.leaveRoom();
    }
  });
  } catch (err) {
    console.error(err);
    if (window.__showBootError) window.__showBootError(err.message || String(err));
  }
}

init();
