/** 玩家档案：等级、任务、签到、持久化 */
import { createDefaultRank, applyRankChange } from './rank.js';

const KEY = 'hszd_player_profile_v1';

function defaultProfile() {
  return {
    nickname: '训练师',
    level: 1,
    exp: 0,
    totalExp: 0,
    gold: 500,
    gems: 0,
    rank: createDefaultRank(),
    stats: { games: 0, wins: 0, top4: 0 },
    login: { lastDate: '', streak: 0, claimedToday: false },
    tasks: { dailyProgress: {}, weeklyProgress: {}, achievements: {} },
    unlockedModes: ['ranked', 'casual', 'ai_battle', 'custom'],
    tutorialCompleted: false,
    settings: { aiDifficulty: 'normal' },
    lastGame: null,
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...JSON.parse(raw) };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function getNickname() {
  return loadProfile().nickname || '训练师';
}

export function setNickname(name) {
  const p = loadProfile();
  p.nickname = (name || '训练师').trim().slice(0, 12);
  saveProfile(p);
  return p;
}

export function expForLevel(level) {
  return Math.floor(100 * Math.pow(1.05, level - 1));
}

export function addExp(profile, amount) {
  profile.exp += amount;
  profile.totalExp += amount;
  while (profile.exp >= expForLevel(profile.level) && profile.level < 100) {
    profile.exp -= expForLevel(profile.level);
    profile.level++;
    if (profile.level >= 5) {
      profile.unlockedModes = [...new Set([...profile.unlockedModes, 'quick'])];
    }
  }
  return profile;
}

const EXP_MUL = [1.5, 1.2, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1];

export const DAILY_TASKS = [
  { id: 'play_games', name: '完成1场对战', target: 1, reward: { gold: 100, exp: 50 } },
  { id: 'win_games', name: '获得1次第一名', target: 1, reward: { gold: 200, exp: 100 } },
  { id: 'top4_games', name: '进入前4名', target: 1, reward: { gold: 150, exp: 75 } },
];

export const LOGIN_REWARDS = [
  { day: 1, gold: 100 }, { day: 2, gold: 150 }, { day: 3, gold: 200 },
  { day: 4, gold: 250 }, { day: 5, gold: 300 }, { day: 6, gold: 400 },
  { day: 7, gold: 500, gems: 10 },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function checkDailyLogin(profile) {
  const today = todayStr();
  if (profile.login.lastDate === today) return { profile, reward: null, newDay: false };
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (profile.login.lastDate === yesterday) profile.login.streak = (profile.login.streak || 0) + 1;
  else profile.login.streak = 1;
  profile.login.lastDate = today;
  profile.login.claimedToday = false;
  profile.tasks.dailyProgress = {};
  saveProfile(profile);
  return { profile, newDay: true };
}

export function claimLoginReward(profile) {
  if (profile.login.claimedToday) return { profile, reward: null };
  const day = ((profile.login.streak - 1) % 7) + 1;
  const reward = LOGIN_REWARDS[day - 1] || LOGIN_REWARDS[0];
  profile.gold = (profile.gold || 0) + (reward.gold || 0);
  profile.gems = (profile.gems || 0) + (reward.gems || 0);
  profile.login.claimedToday = true;
  saveProfile(profile);
  return { profile, reward };
}

export function onGameEnd(profile, finalRank, isRanked) {
  profile.stats.games = (profile.stats.games || 0) + 1;
  if (finalRank === 1) profile.stats.wins = (profile.stats.wins || 0) + 1;
  if (finalRank <= 4) profile.stats.top4 = (profile.stats.top4 || 0) + 1;

  const expGain = Math.round(50 * (EXP_MUL[finalRank - 1] || 0.1));
  addExp(profile, expGain);

  let rankResult = null;
  if (isRanked) {
    rankResult = applyRankChange(profile.rank, finalRank);
    profile.rank = rankResult.rank;
  }

  profile.tasks.dailyProgress.play_games = (profile.tasks.dailyProgress.play_games || 0) + 1;
  if (finalRank === 1) profile.tasks.dailyProgress.win_games = (profile.tasks.dailyProgress.win_games || 0) + 1;
  if (finalRank <= 4) profile.tasks.dailyProgress.top4_games = (profile.tasks.dailyProgress.top4_games || 0) + 1;

  saveProfile(profile);
  return { profile, expGain, rankResult };
}

export function completeTutorial(profile) {
  profile.tutorialCompleted = true;
  profile.gold = (profile.gold || 0) + 200;
  addExp(profile, 100);
  saveProfile(profile);
  return profile;
}
