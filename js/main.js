import { GameEngine } from './gameEngine.js';
import { UI } from './ui.js';
import { initMenu, refreshMenuProfile } from './menuUI.js';
import { initAuth } from './authUI.js';
import { showScreen, showToast } from './appShell.js';
import { buildPlayerConfigsForMode } from './gameModes.js';
import { loadProfile, ensureProfileForAccount, checkDailyLogin } from './playerProfile.js';
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
let appReady = false;

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
  initMenu(
    startSpireRun,
    () => startSpireRun(RUN_MODES.TIER),
    () => startSpireRun(RUN_MODES.INFINITE),
  );
}

function hideBootError() {
  document.getElementById('boot-error')?.classList.add('hidden');
}

function initGameEngine() {
  if (game) return;
  game = new GameEngine(
    (state) => {
      ui?.render(state);
    },
    (event) => {
      ui.appendBattleLog(event);
      if (event.type === 'BATTLE_START') ui.onBattleStart();
      if (event.type === 'BATTLE_END') ui.render(game.getState());

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
  ui = new UI(game);
}

function init() {
  try {
    const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    const debugBattle = new URLSearchParams(location.search).get('debug') === 'battle' && isLocal;
    const debugSpire = new URLSearchParams(location.search).get('debug') === 'spire' && isLocal;

    const afterAuth = () => {
      enterMainMenu();
    };

    if (debugSpire) {
      initApp();
      appReady = true;
      startSpireRun(RUN_MODES.EXPEDITION);
      hideBootError();
      return;
    }
    if (debugBattle) {
      initGameEngine();
      runLocalBattleDebug();
      hideBootError();
      return;
    }

    initAuth(afterAuth);
    hideBootError();
  } catch (err) {
    console.error(err);
    if (window.__showBootError) window.__showBootError(err.message || String(err));
  }
}

/** 本地调试：http://127.0.0.1:8888/?debug=battle 自动开战 */
function runLocalBattleDebug() {
  showScreen('game');
  const configs = buildPlayerConfigsForMode('ai_battle', '调试员', 'normal');
  game.startGame(configs, { modeId: 'ai_battle', prepareTime: 999, aiDifficulty: 'normal' });
  const human = game.getHuman();
  game.buyCard(human, 0);
  showToast('调试：已收服 1 只，即将开战…');
  setTimeout(() => game.endPreparePhase(), 800);
}

init();
