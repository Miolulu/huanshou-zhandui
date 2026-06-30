/**
 * 战斗流程回归测试
 * node scripts/battle-flow-test.mjs
 */
import { GameEngine } from '../js/gameEngine.js';
import { buildPlayerConfigsForMode } from '../js/gameModes.js';

const battleEvents = [];
let failed = false;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed = true;
  } else {
    console.log('OK:', msg);
  }
}

const game = new GameEngine(
  () => {},
  (evt) => {
    battleEvents.push(evt.type);
  },
);

const configs = buildPlayerConfigsForMode('ai_battle', '测试员', 'normal');
game.startGame(configs, { modeId: 'ai_battle', prepareTime: 5, aiDifficulty: 'normal', turnInterval: 0 });

const human = game.getHuman();

// 1. 开局
assert(human.team.cards.filter(Boolean).length >= 2, '开局赠送幼体');
assert(human.gold >= 10, '准备阶段有金币');
assert(game.phase === 'PREPARE', '处于准备阶段');

// 2. 收服
game.buyCard(human, 0);
assert(human.team.cards.filter(Boolean).length >= 3, '收服后战队有幻兽');

// 3. 开战
battleEvents.length = 0;
await game.endPreparePhase();

while (game.phase !== 'PREPARE' && game.phase !== 'ENDED') {
  await new Promise((r) => setTimeout(r, 30));
}

const br = game.lastHumanResult;
assert(!!br, '有战斗结果');
assert(br.turnCount >= 1, `战斗至少1回合 (实际 ${br.turnCount})`);
assert(battleEvents.includes('BATTLE_START'), '触发 BATTLE_START');
assert(battleEvents.includes('BATTLE_END'), '触发 BATTLE_END');
assert(battleEvents.includes('TURN_START'), '触发 TURN_START');
assert(battleEvents.filter((t) => t === 'ATTACK').length >= 1 || battleEvents.includes('SKILL_TRIGGER'), '有攻击或技能');

console.log('\n--- 第1轮战斗事件采样 ---');
console.log(battleEvents.filter((t) => !['TURN_END', 'CARD_ACTION_END', 'CARD_ACTION_START'].includes(t)).slice(0, 20).join(' -> '));
console.log(`\n结果: ${br.type}, ${br.turnCount}回合, HP ${human.hp}`);

// 4. 第二轮
if (game.phase === 'PREPARE' && human.hp > 0) {
  battleEvents.length = 0;
  game.buyCard(human, 0);
  await game.endPreparePhase();
  while (game.phase !== 'PREPARE' && game.phase !== 'ENDED') {
    await new Promise((r) => setTimeout(r, 30));
  }
  const br2 = game.lastHumanResult;
  assert(!!br2 && br2.turnCount >= 1, `第2轮战斗正常 (${br2?.turnCount}回合)`);
  console.log(`第2轮: ${br2.type}, ${br2.turnCount}回合, HP ${human.hp}`);
}

// 5. 空队拦截
if (game.phase === 'PREPARE') {
  for (let i = 0; i < 7; i++) {
    const c = human.team.cards[i];
    if (c) game.sellCard(human, i);
  }
  const block = await game.endPreparePhase(false);
  assert(block?.reason === 'empty_team' || block?.blocked, '空队手动开战被拦截');
  assert(game.phase === 'PREPARE', '拦截后仍在准备阶段');
}

console.log(failed ? '\n❌ 测试未全部通过' : '\n✅ 战斗流程测试通过');
process.exit(failed ? 1 : 0);
