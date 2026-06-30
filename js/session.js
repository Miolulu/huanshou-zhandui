/** 断线重连 / 对局会话缓存（静态页本地模拟） */
const SESSION_KEY = 'hszd_game_session';

export function saveGameSession(engine, meta = {}) {
  if (!engine || engine.phase === 'ENDED' || engine.phase === 'INIT') {
    clearGameSession();
    return;
  }
  try {
    const payload = {
      savedAt: Date.now(),
      meta,
      turn: engine.turn,
      phase: engine.phase,
      humanId: engine.humanId,
      gameModeId: engine.gameModeId,
      isRanked: engine.isRanked,
      players: engine.players.map(p => ({
        id: p.id, name: p.name, isHuman: p.isHuman, isAI: p.isAI,
        aiDifficulty: p.aiDifficulty, hp: p.hp, gold: p.gold,
        tavernTier: p.tavernTier, winStreak: p.winStreak, lossStreak: p.lossStreak,
        eliminated: p.eliminated, rank: p.rank,
        team: p.team, bench: p.bench,
        shop: { frozen: p.shop.frozen, cards: p.shop.cards },
      })),
      poolRemaining: engine.poolRemaining,
      lobbyTribes: engine.lobbyTribes,
      pendingDiscover: engine.pendingDiscover,
      prepareTimeLeft: engine.prepareTimeLeft,
      prepareTimeTotal: engine.prepareTimeTotal,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch { /* quota */ }
}

export function loadGameSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > 1800000) {
      clearGameSession();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearGameSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function hasRecoverableSession() {
  return !!loadGameSession();
}
