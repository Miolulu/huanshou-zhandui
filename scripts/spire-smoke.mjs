/**
 * 净化远征模式冒烟测试
 * node scripts/spire-smoke.mjs
 */
import { createRun, RUN_PHASES, RUN_MODES } from '../js/roguelike/runEngine.js';

const run = createRun('测试员', { seed: 42, skipTutorial: true, mode: RUN_MODES.EXPEDITION });
let steps = 0;
const maxSteps = 800;

function pickAvailableNode() {
  for (const row of run.map.rows) {
    const n = row.find((x) => x.available && !x.cleared);
    if (n) return n;
  }
  return null;
}

while (steps++ < maxSteps) {
  const phase = run.phase;

  if (phase === RUN_PHASES.MAP) {
    const node = pickAvailableNode();
    if (!node) break;
    run.startNode(node.id);
    if (node.type === 'rest') run.restHeal();
    continue;
  }

  if (phase === RUN_PHASES.REST) {
    run.restHeal();
    continue;
  }

  if (phase === RUN_PHASES.COMBAT) {
    const c = run.combat;
    if (!c) break;
    if (c.phase === 'player') {
      const playable = c.hand.filter((card) => card.cost <= c.player.energy);
      if (playable.length) {
        run.playCard(playable[0].uid, 0);
      } else {
        run.endCombatTurn();
      }
    }
    continue;
  }

  if (phase === RUN_PHASES.REWARD) {
    if (run.rewardOptions.length) run.pickReward(run.rewardOptions[0].uid);
    else run.skipReward();
    continue;
  }

  if (phase === RUN_PHASES.VICTORY || phase === RUN_PHASES.DEFEAT) break;
}

const end = run.getState();
const ok = end.phase === RUN_PHASES.VICTORY || end.phase === RUN_PHASES.DEFEAT;
console.log(`phase=${end.phase} battles=${end.stats.battlesWon} deck=${end.deckSize} steps=${steps}`);
console.log(ok ? '✅ spire smoke passed' : '❌ spire smoke failed');
process.exit(ok ? 0 : 1);
