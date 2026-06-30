/**
 * 足迹侦查 — 准备阶段预测下轮对手并分级揭示阵容
 */

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createMirrorTeam(source) {
  return {
    playerId: 'mirror_preview',
    maxSize: source.team?.maxSize ?? 7,
    cards: deepClone(source.team?.cards ?? []),
  };
}

/** 模拟匹配逻辑，返回人类玩家的预测对手（无副作用） */
export function predictNextOpponent(game, human) {
  const alive = game.getAlivePlayers().filter((p) => p.id !== human.id || !p.eliminated);
  const allAlive = game.getAlivePlayers();
  if (allAlive.length < 2) return null;

  const used = new Set();
  const pairs = [];

  if (allAlive.length % 2 === 1) {
    const candidates = allAlive.filter((p) => !p.lastFoughtMirror);
    const mirrorPlayer = candidates.length
      ? candidates[0]
      : allAlive[0];
    const source = allAlive.find((p) => p.id !== mirrorPlayer.id) || allAlive[0];
    const mirror = {
      id: 'mirror_preview',
      name: `${source.name}的镜像`,
      hp: 999,
      tavernTier: source.tavernTier,
      isMirror: true,
      team: createMirrorTeam(source.lastRoundTeam ? { team: source.lastRoundTeam } : source),
    };
    if (mirrorPlayer.id === human.id) {
      return mirror;
    }
    pairs.push({ playerA: mirrorPlayer, playerB: mirror });
    used.add(mirrorPlayer.id);
  }

  const remaining = allAlive.filter((p) => !used.has(p.id));
  const pool = [...remaining];
  const paired = new Set();

  while (pool.length >= 2) {
    const playerA = pool.shift();
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const playerB = pool[i];
      const recentlyFought = playerA.recentOpponents?.includes(playerB.id);
      const score = recentlyFought ? -1 : 1;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    const playerB = pool.splice(bestIdx, 1)[0];
    pairs.push({ playerA, playerB });
    paired.add(playerA.id);
    paired.add(playerB.id);
  }

  const humanPair = pairs.find((p) => p.playerA.id === human.id || p.playerB.id === human.id);
  if (!humanPair) {
    const others = allAlive.filter((p) => p.id !== human.id && !p.eliminated);
    return others[0] || null;
  }
  return humanPair.playerA.id === human.id ? humanPair.playerB : humanPair.playerA;
}

export const SCOUT_LEVEL = {
  NONE: 0,
  FOOTPRINT: 1,
  SILHOUETTE: 2,
  FULL: 3,
};

export function getScoutLevelLabel(level) {
  if (level >= SCOUT_LEVEL.FULL) return '全貌';
  if (level >= SCOUT_LEVEL.SILHOUETTE) return '轮廓';
  if (level >= SCOUT_LEVEL.FOOTPRINT) return '足迹';
  return '未知';
}
