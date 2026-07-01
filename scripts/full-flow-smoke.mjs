/**
 * 净化远征全流程 smoke（多轮战斗出牌 / 奖励 / 地图 / 商店 / 休息）
 * node scripts/full-flow-smoke.mjs
 */
import { createRun, RUN_PHASES, RUN_MODES } from '../js/roguelike/runEngine.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function pickNode(run, type) {
  for (const row of run.map.rows) {
    const n = row.find((x) => x.available && !x.cleared && (!type || x.type === type));
    if (n) return n;
  }
  for (const row of run.map.rows) {
    const n = row.find((x) => x.available && !x.cleared);
    if (n) return n;
  }
  return null;
}

function playCombatTurns(run, maxPlays = 6) {
  let plays = 0;
  let guard = 0;
  while (run.getState().phase === RUN_PHASES.COMBAT && guard++ < 120) {
    const c = run.getState().combat;
    if (!c) break;
    if (c.phase === 'won' || c.phase === 'lost') break;
    if (c.phase !== 'player') {
      run.endCombatTurn();
      continue;
    }
    const card = c.hand.find((x) => x.cost <= c.player.energy);
    if (card && plays < maxPlays) {
      const r = run.playCard(card.uid, c.targetIndex);
      assert(r.ok, `playCard failed: ${r.message || 'unknown'}`);
      plays += 1;
      continue;
    }
    run.endCombatTurn();
  }
  return plays;
}

function resolvePostCombat(run) {
  let guard = 0;
  while (guard++ < 20) {
    const st = run.getState();
    if (st.phase === RUN_PHASES.MAP || st.phase === RUN_PHASES.VICTORY || st.phase === RUN_PHASES.DEFEAT) {
      return st.phase;
    }
    if (st.phase === RUN_PHASES.REWARD && st.rewardOptions?.[0]) {
      run.pickReward(st.rewardOptions[0].uid);
      continue;
    }
    break;
  }
  return run.getState().phase;
}

function testMultiCardCombat() {
  const run = createRun('full', { mode: RUN_MODES.EXPEDITION, skipTutorial: true });
  const node = pickNode(run, 'battle');
  assert(node, 'battle node missing');
  assert(run.startNode(node.id).ok, 'start battle');
  const plays = playCombatTurns(run, 4);
  assert(plays >= 2, `expected multiple card plays, got ${plays}`);
  const phase = resolvePostCombat(run);
  assert(
    phase === RUN_PHASES.MAP || phase === RUN_PHASES.REWARD || phase === RUN_PHASES.DEFEAT,
    `unexpected phase after combat: ${phase}`,
  );
}

function testMapShopRest() {
  const run = createRun('full', { mode: RUN_MODES.EXPEDITION, skipTutorial: true });
  let shopHit = false;
  let restHit = false;

  for (let step = 0; step < 40; step++) {
    const shop = pickNode(run, 'shop');
    const rest = pickNode(run, 'rest');
    if (shop) {
      const r = run.startNode(shop.id);
      if (r.ok && run.getState().phase === RUN_PHASES.SHOP) {
        assert(run.getState().shopInventory?.length >= 1, 'shop inventory');
        run.leaveShop();
        shopHit = true;
        break;
      }
      if (run.getState().phase === RUN_PHASES.COMBAT) {
        playCombatTurns(run, 8);
        resolvePostCombat(run);
      }
      continue;
    }
    if (rest) {
      const r = run.startNode(rest.id);
      if (r.ok && run.getState().phase === RUN_PHASES.REST) {
        run.restHeal();
        restHit = true;
        break;
      }
      continue;
    }

    const battle = pickNode(run, 'battle') || pickNode(run);
    if (!battle) break;
    run.startNode(battle.id);
    playCombatTurns(run, 8);
    resolvePostCombat(run);
    if (run.getState().phase === RUN_PHASES.DEFEAT) break;
  }

  if (!shopHit) console.log('  · shop not reached in 40 steps (ok on random maps)');
  if (!restHit) console.log('  · rest not reached in 40 steps (ok on random maps)');
}

function testTierAndInfiniteLabels() {
  const tier = createRun('tier', { mode: RUN_MODES.TIER, skipTutorial: true });
  assert(tier.getState().floorChoices?.length >= 1, 'tier choices');
  assert(tier.startNode(tier.getState().floorChoices[0].id).ok, 'tier start');

  const inf = createRun('inf', { mode: RUN_MODES.INFINITE, skipTutorial: true });
  assert(inf.getState().floorChoices?.length >= 1, 'infinite choices');
}

async function main() {
  testMultiCardCombat();
  testMapShopRest();
  testTierAndInfiniteLabels();
  console.log('✅ full-flow-smoke passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
