/**
 * 快速战斗流程冒烟（无 paced 延迟）
 * node scripts/battle-smoke.mjs
 */
import { GameEngine } from '../js/gameEngine.js';
import { buildPlayerConfigsForMode } from '../js/gameModes.js';

const events = [];
const game = new GameEngine(
  () => {},
  (evt) => events.push(evt.type),
);

const configs = buildPlayerConfigsForMode('ai_battle', '测试', 'normal');
game.startGame(configs, { modeId: 'ai_battle', prepareTime: 5, aiDifficulty: 'normal' });

const human = game.getHuman();
game.buyCard(human, 0);

const orig = game.runBattles.bind(game);
game.runBattles = async function runBattlesFast() {
  this.phase = 'BATTLE';
  this.battleResults = [];
  this.notify();
  const pairs = [...this.matchPairs];
  const humanIdx = pairs.findIndex(
    (p) => p.playerA.id === this.humanId || p.playerB.id === this.humanId,
  );
  if (humanIdx > 0) pairs.unshift(pairs.splice(humanIdx, 1)[0]);

  for (const pair of pairs) {
    const isHumanBattle = pair.playerA.id === this.humanId || pair.playerB.id === this.humanId;
    const engine = new (await import('../js/battleEngine.js')).BattleEngine(
      pair.playerA, pair.playerB,
      (evt) => { if (isHumanBattle) events.push(evt.type); },
      { isHumanBattle, humanPlayerId: this.humanId },
    );
    if (isHumanBattle) {
      this.currentBattle = engine;
      this.notify();
    }
    const result = await engine.runBattle({ turnDelay: 0, actionDelay: 0, lungeDelay: 0, startPause: 0 });
    this.battleResults.push({ pair, result });
    if (isHumanBattle) this.lastHumanResult = result;
  }
  this.currentBattle = null;
  await this.settlePhase();
};

await game.endPreparePhase();

const attacks = events.filter((t) => t === 'ATTACK').length;
const ok = events.includes('BATTLE_START')
  && events.includes('BATTLE_END')
  && attacks >= 1
  && game.lastHumanResult?.turnCount >= 1;

console.log(`BATTLE_START=${events.includes('BATTLE_START')} BATTLE_END=${events.includes('BATTLE_END')}`);
console.log(`ATTACK×${attacks} turns=${game.lastHumanResult?.turnCount} phase=${game.phase}`);
console.log(ok ? '✅ smoke passed' : '❌ smoke failed');
process.exit(ok ? 0 : 1);
