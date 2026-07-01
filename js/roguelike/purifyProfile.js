/** 净化远征 · 档案持久化（图鉴 / 阶层 / 无限记录） */
import { saveProfile } from '../playerProfile.js';

export function defaultPurifyData() {
  return {
    combatTutorialCompleted: false,
    compendium: {},
    tier: { bestFloor: 0, cleared: false, attempts: 0 },
    infinite: { bestFloor: 0, totalRuns: 0 },
    expedition: { wins: 0 },
  };
}

export function ensurePurifyProfile(profile) {
  if (!profile.purify) profile.purify = defaultPurifyData();
  profile.purify = { ...defaultPurifyData(), ...profile.purify };
  if (!profile.purify.compendium) profile.purify.compendium = {};
  if (!profile.purify.tier) profile.purify.tier = { bestFloor: 0, cleared: false, attempts: 0 };
  if (!profile.purify.infinite) profile.purify.infinite = { bestFloor: 0, totalRuns: 0 };
  return profile;
}

export function markEnemiesSeen(profile, enemyIds) {
  ensurePurifyProfile(profile);
  const now = Date.now();
  for (const id of enemyIds) {
    if (!id) continue;
    const entry = profile.purify.compendium[id] || { seen: false, defeated: false };
    if (!entry.seen) {
      entry.seen = true;
      entry.firstSeenAt = entry.firstSeenAt || now;
    }
    profile.purify.compendium[id] = entry;
  }
  saveProfile(profile);
  return profile;
}

export function markEnemiesDefeated(profile, enemyIds) {
  ensurePurifyProfile(profile);
  for (const id of enemyIds) {
    if (!id) continue;
    const entry = profile.purify.compendium[id] || { seen: true, defeated: false };
    entry.seen = true;
    entry.defeated = true;
    profile.purify.compendium[id] = entry;
  }
  saveProfile(profile);
  return profile;
}

export function completeCombatTutorial(profile) {
  ensurePurifyProfile(profile);
  profile.purify.combatTutorialCompleted = true;
  saveProfile(profile);
  return profile;
}

export function isCombatTutorialDone(profile) {
  ensurePurifyProfile(profile);
  return !!profile.purify.combatTutorialCompleted;
}

export function recordRunEnd(profile, { mode, floor, victory, stats }) {
  ensurePurifyProfile(profile);
  if (mode === 'tier') {
    profile.purify.tier.attempts = (profile.purify.tier.attempts || 0) + 1;
    if (floor > (profile.purify.tier.bestFloor || 0)) {
      profile.purify.tier.bestFloor = floor;
    }
    if (victory) profile.purify.tier.cleared = true;
  } else if (mode === 'infinite') {
    profile.purify.infinite.totalRuns = (profile.purify.infinite.totalRuns || 0) + 1;
    if (floor > (profile.purify.infinite.bestFloor || 0)) {
      profile.purify.infinite.bestFloor = floor;
    }
  } else if (mode === 'expedition' && victory) {
    profile.purify.expedition.wins = (profile.purify.expedition.wins || 0) + 1;
  }
  saveProfile(profile);
  return profile;
}

export function getCompendiumEntry(profile, enemyId) {
  ensurePurifyProfile(profile);
  return profile.purify.compendium[enemyId] || null;
}
