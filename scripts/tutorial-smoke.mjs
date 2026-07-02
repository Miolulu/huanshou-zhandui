/**
 * 实战教程已移除：确认各模式首战直接进入正常战斗
 * node scripts/tutorial-smoke.mjs
 */
import { createRun, RUN_PHASES, RUN_MODES } from '../js/roguelike/runEngine.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

for (const mode of [RUN_MODES.EXPEDITION, RUN_MODES.TIER, RUN_MODES.INFINITE]) {
  const run = createRun('test', { mode, seed: mode.length * 17 });
  if (mode === RUN_MODES.EXPEDITION) {
    const node = run.map.rows[1].find((n) => n.type === 'battle' && n.available);
    assert(node, 'expedition should have battle node');
    const start = run.startNode(node.id);
    assert(start.ok && start.phase === RUN_PHASES.COMBAT, `${mode} combat start`);
    assert(run.getState().combat, `${mode} should have combat engine`);
    continue;
  }

  const choices = run.getState().floorChoices;
  assert(choices.length >= 1, `${mode} should have floor choices`);
  const start = run.startNode(choices[0].id);
  assert(start.ok && start.phase === RUN_PHASES.COMBAT, `${mode} combat start`);
  assert(run.getState().combat, `${mode} should have combat engine`);
}

console.log('✅ tutorial-smoke passed (no tutorial combat)');
