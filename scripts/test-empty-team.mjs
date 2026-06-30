import { GameEngine } from '../js/gameEngine.js';

const game = new GameEngine(() => {}, (evt) => {
  if (evt.type === 'BATTLE_END') console.log('BATTLE_END', evt.turnCount, evt.type);
});

game.startGame(
  [{ id: 'player_0', name: 'You', isHuman: true }, { id: 'player_1', name: 'AI1', isAI: true }],
  { modeId: 'quick', aiDifficulty: 'normal' },
);

const human = game.getHuman();
console.log('Human cards:', human.team.cards.filter(Boolean).length);
await game.endPreparePhase();
console.log('Result:', game.lastHumanResult?.type, 'turns', game.lastHumanResult?.turnCount);
