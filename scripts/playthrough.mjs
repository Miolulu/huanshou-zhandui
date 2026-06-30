/**
 * 自动化跑通一整局（人机对战 3 回合）
 * 用法: node scripts/playthrough.mjs
 */
import { GameEngine } from '../js/gameEngine.js';
import { buildPlayerConfigsForMode } from '../js/gameModes.js';

const logs = [];
const game = new GameEngine(
  (state) => {
    if (state.phase === 'PREPARE') {
      logs.push(`[R${state.turn}] PREPARE gold=${state.human?.gold} team=${state.human?.team.cards.filter(Boolean).length}`);
    }
  },
  (evt) => {
    if (['BATTLE_END', 'BATTLE_START', 'TURN_START'].includes(evt.type)) {
      logs.push(`  battle: ${evt.type} turn=${evt.turn ?? evt.turnCount ?? ''}`);
    }
  },
);

const configs = buildPlayerConfigsForMode('ai_battle', '测试员', 'normal');
game.startGame(configs, { modeId: 'ai_battle', prepareTime: 5, aiDifficulty: 'normal' });

const human = game.getHuman();
for (let round = 0; round < 3 && game.phase !== 'ENDED'; round++) {
  while (game.phase !== 'PREPARE') {
    await new Promise((r) => setTimeout(r, 20));
  }
  for (let i = 0; i < 2; i++) {
    if (game.findEmptyTeamSlot(human) === -1) break;
    game.buyCard(human, 0);
  }
  const cards = human.team.cards.filter(Boolean).length;
  if (cards === 0) throw new Error(`Round ${round + 1}: team still empty after starters`);
  await game.endPreparePhase();
  if (game.phase === 'ENDED') break;
  const br = game.lastHumanResult;
  if (!br || !br.turnCount) throw new Error(`Round ${round + 1}: no battle result`);
  if (br.turnCount < 1) throw new Error(`Round ${round + 1}: battle had 0 turns`);
  logs.push(`[R${round + 1}] result=${br.type} battleTurns=${br.turnCount} hp=${human.hp}`);
  while (game.phase !== 'PREPARE' && game.phase !== 'ENDED') {
    await new Promise((r) => setTimeout(r, 50));
  }
}

console.log(logs.join('\n'));
console.log(`\nDone: phase=${game.phase} rank=${human.rank} hp=${human.hp}`);
if (game.phase !== 'ENDED' && human.hp <= 0) console.log('(eliminated but game continues for others)');
