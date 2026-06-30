/**
 * 本局生态 — 每场随机开放若干族群栖息地
 */
import { TRIBE_LIST } from './tribes.js';
import { resolveCardTribe } from './tribeAssignment.js';

const LOBBY_TRIBE_COUNT = 5;

export function rollLobbyTribes(count = LOBBY_TRIBE_COUNT) {
  const pool = TRIBE_LIST.filter((t) => t.id !== 'neutral').map((t) => t.id);
  const picked = [];
  const copy = [...pool];
  while (picked.length < count && copy.length) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

export function isTemplateInLobby(tpl, lobbyTribes) {
  if (!lobbyTribes?.length) return true;
  const tribe = tpl.tribe || resolveCardTribe(tpl.id, tpl.element, tpl.class);
  return tribe === 'neutral' || lobbyTribes.includes(tribe);
}

export function formatLobbyTribes(lobbyTribes) {
  if (!lobbyTribes?.length) return '';
  return TRIBE_LIST.filter((t) => lobbyTribes.includes(t.id))
    .map((t) => `${t.icon}${t.name}`)
    .join(' · ');
}
