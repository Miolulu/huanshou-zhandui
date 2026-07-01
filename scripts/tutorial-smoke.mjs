/**
 * 新手实战引导流程测试
 * node scripts/tutorial-smoke.mjs
 */
import { createRun, RUN_PHASES, RUN_MODES } from '../js/roguelike/runEngine.js';
import { CombatTutorial, COMBAT_TUTORIAL_STEPS } from '../js/roguelike/combatTutorial.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function pickFirstBattleNode(run) {
  for (const row of run.map.rows) {
    const n = row.find((x) => x.available && !x.cleared && x.type === 'battle');
    if (n) return n;
  }
  for (const row of run.map.rows) {
    const n = row.find((x) => x.available && !x.cleared);
    if (n) return n;
  }
  return null;
}

function simulateTutorialCombat(run) {
  let tutorialCompleted = false;
  const tutorial = new CombatTutorial(() => {
    tutorialCompleted = true;
  });
  let steps = 0;
  const maxSteps = 80;

  while (run.phase === RUN_PHASES.COMBAT && steps++ < maxSteps) {
    const c = run.combat;
    if (!c) break;
    const step = tutorial.currentStep;

    if (c.phase !== 'player') continue;

    if (step?.action === 'observe') {
      tutorial.onAction('observe');
      continue;
    }

    if (step?.action === 'play_attack') {
      const card = c.hand.find((x) => x.type === 'attack' && x.cost <= c.player.energy);
      assert(card, '引导：应有可打出的攻型技法');
      const r = run.playCard(card.uid, 0);
      tutorial.onAction('play_attack');
      if (r.tutorialFinished) tutorial.onAction('win');
      continue;
    }

    if (step?.action === 'play_skill') {
      const card = c.hand.find((x) => x.type === 'skill' && x.cost <= c.player.energy);
      assert(card, '引导：应有可打出的守型技法');
      const r = run.playCard(card.uid, 0);
      tutorial.onAction('play_skill');
      if (r.tutorialFinished) tutorial.onAction('win');
      continue;
    }

    if (step?.action === 'end_turn') {
      const r = run.endCombatTurn();
      tutorial.onAction('end_turn');
      if (r.tutorialFinished) tutorial.onAction('win');
      continue;
    }

    if (step?.action === 'win') {
      const card = c.hand.find((x) => x.type === 'attack' && x.cost <= c.player.energy);
      if (card) {
        const r = run.playCard(card.uid, 0);
        if (r.tutorialFinished) tutorial.onAction('win');
      } else {
        const r = run.endCombatTurn();
        if (r.tutorialFinished) tutorial.onAction('win');
      }
      continue;
    }
  }

  return { tutorialCompleted, steps, phase: run.phase, tutorialDone: tutorial.isDone() };
}

const run1 = createRun('新手', { seed: 99, skipTutorial: false, mode: RUN_MODES.EXPEDITION });
assert(run1.pendingTutorial === true, 'first run should pending tutorial');

const node = pickFirstBattleNode(run1);
assert(node, 'map should have battle node');
const start = run1.startNode(node.id);
assert(start.tutorial, 'first combat should be tutorial');
assert(run1.isTutorialCombat, 'isTutorialCombat flag');

const r1 = simulateTutorialCombat(run1);
assert(r1.tutorialCompleted, `tutorial onComplete should fire (steps=${r1.steps}, phase=${r1.phase})`);
assert(r1.tutorialDone, 'tutorial steps should all complete');
assert(run1.phase === RUN_PHASES.MAP, `after tutorial win should return to map, got ${run1.phase}`);

assert(COMBAT_TUTORIAL_STEPS.length === 5, 'expected 5 tutorial steps');

// UI bug regression: killing enemy via playCard must allow win step
const run2 = createRun('新手2', { seed: 100, skipTutorial: false, mode: RUN_MODES.EXPEDITION });
run2.startNode(pickFirstBattleNode(run2).id);
let completedViaWinAction = false;
const tut2 = new CombatTutorial(() => { completedViaWinAction = true; });

while (tut2.currentStep && tut2.currentStep.action !== 'win') {
  const step = tut2.currentStep;
  if (step.action === 'observe') tut2.onAction('observe');
  else if (step.action === 'play_attack') {
    run2.playCard(run2.combat.hand.find((x) => x.type === 'attack').uid, 0);
    tut2.onAction('play_attack');
  } else if (step.action === 'play_skill') {
    run2.playCard(run2.combat.hand.find((x) => x.type === 'skill').uid, 0);
    tut2.onAction('play_skill');
  } else if (step.action === 'end_turn') {
    run2.endCombatTurn();
    tut2.onAction('end_turn');
  }
}

while (run2.phase === RUN_PHASES.COMBAT) {
  const atk = run2.combat.hand.find((x) => x.type === 'attack' && x.cost <= run2.combat.player.energy);
  if (atk) {
    const r = run2.playCard(atk.uid, 0);
    if (r.tutorialFinished) tut2.onAction('win');
  } else {
    run2.endCombatTurn();
  }
}

assert(run2.phase === RUN_PHASES.MAP, 'tutorial combat should end on map');
assert(completedViaWinAction, 'win step should complete tutorial when enemy dies via playCard');

console.log('✅ tutorial-smoke passed');
process.exit(0);
