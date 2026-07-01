/**
 * 战斗机制冒烟：双怪同回合攻击、本回合护幕挡伤
 * node scripts/combat-mechanics-smoke.mjs
 */
import { CombatEngine } from '../js/roguelike/combatEngine.js';
import { createEnemy, INTENTS } from '../js/roguelike/enemies.js';

function mkAttacker(id, atk) {
  const e = createEnemy(id, () => 0.5, 15, 'normal');
  e.pattern = [{ intent: INTENTS.ATTACK, value: atk }];
  e.intent = { ...e.pattern[0] };
  return e;
}

function testDualEnemyDamage() {
  const deck = [{ uid: '1', id: 'x', name: 'x', type: 'skill', cost: 1, block: 10 }];
  const c = new CombatEngine(deck, 'normal', {
    enemies: [mkAttacker('corrupted_wolf', 8), mkAttacker('corrupted_mushroom', 6)],
    skipStartTurn: true,
    startHp: 50,
    maxHp: 50,
  });
  c.turn = 1;
  c.player.block = 0;
  const hp0 = c.player.hp;
  const r = c.endTurn();
  if (r.needsNewTurn) c.beginPlayerTurn();
  const dmg = r.events.filter((e) => e.type === 'DAMAGE' && e.target === 'player');
  const lost = hp0 - c.player.hp;
  const ok = dmg.length === 2 && lost === 14;
  console.log('dual enemy:', ok ? '✓' : '✗', { dmg: dmg.length, lost, expected: 14 });
  return ok;
}

function testBlockAbsorbsDuringEnemyTurn() {
  const deck = [{ uid: '1', id: 'x', name: 'x', type: 'skill', cost: 1, block: 10 }];
  const c = new CombatEngine(deck, 'normal', {
    enemies: [mkAttacker('corrupted_wolf', 8), mkAttacker('corrupted_mushroom', 6)],
    skipStartTurn: true,
    startHp: 50,
    maxHp: 50,
  });
  c.turn = 1;
  c.player.block = 10;
  const hp0 = c.player.hp;
  const r = c.endTurn();
  if (r.needsNewTurn) c.beginPlayerTurn();
  const dmg = r.events.filter((e) => e.type === 'DAMAGE' && e.target === 'player');
  const lost = hp0 - c.player.hp;
  // 8 blocked fully, 6-2=4 hp lost
  const ok = dmg.length === 2 && lost === 4 && dmg[0].blocked === 8 && dmg[1].blocked === 2;
  console.log('block absorb:', ok ? '✓' : '✗', { lost, expected: 4, dmg });
  return ok;
}

function testBlockClearsNextPlayerTurnNotBeforeEnemy() {
  const deck = [{ uid: '1', id: 'x', name: 'x', type: 'skill', cost: 1, block: 5 }];
  const c = new CombatEngine(deck, 'normal', {
    enemies: [mkAttacker('corrupted_mushroom', 3)],
    skipStartTurn: true,
    startHp: 50,
    maxHp: 50,
  });
  c.turn = 1;
  c.player.block = 5;
  c.phase = 'enemy';
  c.enemyTurn();
  const blockAfterEnemy = c.player.block;
  c.startTurn();
  const blockAfterStart = c.player.block;
  const ok = blockAfterEnemy === 2 && blockAfterStart === 0;
  console.log('block timing:', ok ? '✓' : '✗', { blockAfterEnemy, blockAfterStart });
  return ok;
}

const results = [
  testDualEnemyDamage(),
  testBlockAbsorbsDuringEnemyTurn(),
  testBlockClearsNextPlayerTurnNotBeforeEnemy(),
];
const ok = results.every(Boolean);
console.log(ok ? '✅ combat mechanics smoke passed' : '❌ combat mechanics smoke failed');
process.exit(ok ? 0 : 1);
