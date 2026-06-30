import { GameEngine } from '../js/gameEngine.js';

const battleEvents = [];

function makeGame() {
  return new GameEngine(
    () => {},
    (evt, engine) => {
      if (['BATTLE_START', 'BATTLE_END', 'TURN_START', 'ATTACK', 'CARD_DEATH', 'BATTLE_READY'].includes(evt.type)) {
        battleEvents.push({ type: evt.type, turn: evt.turn, extra: evt.cardName || evt.attackerName || '' });
      }
    },
  );
}

async function runRound(game, label) {
  battleEvents.length = 0;
  const human = game.getHuman();
  const humanCards = human.team.cards.filter(Boolean).length;
  console.log(`\n=== ${label} ===`);
  console.log(`Human team size: ${humanCards}, gold: ${human.gold}`);

  await game.endPreparePhase();

  const humanResult = game.lastHumanResult;
  const pair = game.battleResults.find((r) =>
    r.pair.playerA.id === human.id || r.pair.playerB.id === human.id,
  );

  const eng = pair ? 'via results' : 'n/a';
  const teamA = humanResult?.teamA?.cards?.filter((c) => c)?.length ?? '?';
  const teamB = humanResult?.teamB?.cards?.filter((c) => c)?.length ?? '?';

  console.log('Battle result:', humanResult?.type, 'turns:', humanResult?.turnCount);
  console.log('Survivors A/B:', teamA, teamB);
  console.log('Events:', battleEvents.slice(0, 15).map((e) => e.type).join(' -> '));
  console.log('Total battle events:', battleEvents.length);

  if (humanResult?.turnCount <= 1 && !battleEvents.some((e) => e.type === 'ATTACK')) {
    console.warn('WARN: Battle ended in <=1 turn with no attacks!');
  }
}

const game = makeGame();
game.startGame(
  [
    { id: 'player_0', name: 'You', isHuman: true },
    ...['AI1', 'AI2', 'AI3', 'AI4', 'AI5', 'AI6', 'AI7'].map((n, i) => ({
      id: `player_${i + 1}`,
      name: n,
      isAI: true,
    })),
  ],
  { modeId: 'quick', prepareTime: 30, aiDifficulty: 'normal' },
);

// Buy some cards for human
const human = game.getHuman();
let bought = 0;
for (let i = 0; i < game.players[0].shop.cards.length && bought < 3; i++) {
  if (game.buyCard(human, 0)) bought++;
}

await runRound(game, 'Round 1 with human cards');

// Second round
if (game.phase === 'PREPARE') {
  for (let i = 0; i < 3; i++) {
    if (!game.buyCard(human, 0)) break;
  }
  await runRound(game, 'Round 2');
}

process.exit(0);
