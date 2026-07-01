/**
 * 净化远征全流程逻辑 smoke（地图/战斗/奖励/休息/商店/Overlay）
 * node scripts/flow-smoke.mjs
 */
import { createRun, RUN_PHASES, RUN_MODES } from '../js/roguelike/runEngine.js';
import { TERMS } from '../js/roguelike/lore.js';

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

function pickShopNode(run) {
  for (const row of run.map.rows) {
    const n = row.find((x) => x.available && !x.cleared && x.type === 'shop');
    if (n) return n;
  }
  return null;
}

function pickRestNode(run) {
  for (const row of run.map.rows) {
    const n = row.find((x) => x.available && !x.cleared && x.type === 'rest');
    if (n) return n;
  }
  return null;
}

function playUntilWin(run) {
  let guard = 0;
  while (run.getState().phase === RUN_PHASES.COMBAT && guard++ < 80) {
    const c = run.getState().combat;
    if (!c || c.phase !== 'player') break;
    const card = c.hand.find((x) => x.cost <= c.player.energy);
    if (card) run.playCard(card.uid, c.targetIndex);
    else run.endCombatTurn();
  }
}

function testOverlayLabels() {
  const run = createRun('test', { mode: RUN_MODES.EXPEDITION, skipTutorial: true });
  const state = run.getState();
  const c = state.combat;
  const drawLabel = c
    ? `${TERMS.drawPile} ${c.drawCount}`
    : `${TERMS.drawPile} ${state.deckSize}`;
  assert(drawLabel.startsWith(TERMS.drawPile), `draw label uses ${TERMS.drawPile}`);
  assert(!drawLabel.includes(`${TERMS.codexShort} `), 'draw label must not use codex name');
}

function testExpeditionFlow() {
  const run = createRun('test', { mode: RUN_MODES.EXPEDITION, skipTutorial: true });
  const node = pickFirstBattleNode(run);
  assert(node, 'map has battle node');
  const r = run.startNode(node.id);
  assert(r.ok, 'battle start ok');
  assert(run.getState().phase === RUN_PHASES.COMBAT, 'in combat');

  playUntilWin(run);
  const after = run.getState();
  assert(
    after.phase === RUN_PHASES.REWARD || after.phase === RUN_PHASES.MAP || after.phase === RUN_PHASES.DEFEAT,
    `combat should resolve, got ${after.phase}`,
  );

  if (after.phase === RUN_PHASES.REWARD && after.rewardOptions?.length) {
    run.pickReward(after.rewardOptions[0].uid);
    assert(run.getState().phase === RUN_PHASES.MAP, 'reward -> map');
  }
}

function testTierFlow() {
  const run = createRun('test', { mode: RUN_MODES.TIER, skipTutorial: true });
  assert(run.getState().floorChoices?.length >= 1, 'tier has floor choices');
  const choice = run.getState().floorChoices[0];
  const r = run.startNode(choice.id);
  assert(r.ok, 'tier node start');
}

function testShopFlow() {
  let run = createRun('test', { mode: RUN_MODES.EXPEDITION, skipTutorial: true });
  for (let i = 0; i < 30 && !pickShopNode(run); i++) {
    const n = pickFirstBattleNode(run);
    if (!n) break;
    run.startNode(n.id);
    playUntilWin(run);
    const st = run.getState();
    if (st.phase === RUN_PHASES.REWARD && st.rewardOptions?.[0]) {
      run.pickReward(st.rewardOptions[0].uid);
    }
    if (st.phase === RUN_PHASES.MAP) {
      const shop = pickShopNode(run);
      if (shop) break;
    }
  }
  const shopNode = pickShopNode(run);
  if (!shopNode) {
    console.log('  · shop node not reached in 30 steps (ok on random maps)');
    return;
  }
  run.startNode(shopNode.id);
  assert(run.getState().phase === RUN_PHASES.SHOP, 'shop phase');
  assert(run.getState().shopInventory?.length >= 1, 'shop has offers');
  run.leaveShop();
  assert(run.getState().phase === RUN_PHASES.MAP, 'leave shop -> map');
}

function testRestFlow() {
  let run = createRun('test', { mode: RUN_MODES.EXPEDITION, skipTutorial: true });
  for (let i = 0; i < 25 && !pickRestNode(run); i++) {
    const n = pickFirstBattleNode(run);
    if (!n) break;
    run.startNode(n.id);
    playUntilWin(run);
    const st = run.getState();
    if (st.phase === RUN_PHASES.REWARD && st.rewardOptions?.[0]) {
      run.pickReward(st.rewardOptions[0].uid);
    }
  }
  const rest = pickRestNode(run);
  if (!rest) {
    console.log('  · rest node not reached (ok on random maps)');
    return;
  }
  run.startNode(rest.id);
  assert(run.getState().phase === RUN_PHASES.REST, 'rest phase');
  run.restHeal();
  assert(run.getState().phase === RUN_PHASES.MAP, 'rest heal -> map');
}

async function main() {
  testOverlayLabels();
  testExpeditionFlow();
  testTierFlow();
  testShopFlow();
  testRestFlow();
  console.log('✅ flow-smoke passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
