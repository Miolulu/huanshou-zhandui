/** 段位与排位系统（文档第二章） */

export const TIER_NAMES = {
  iron: '黑铁', bronze: '青铜', silver: '白银', gold: '黄金',
  platinum: '铂金', diamond: '钻石', master: '大师', grandmaster: '宗师', challenger: '王者',
};

export const TIER_ORDER = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'challenger'];

const STAR_TABLE = {
  iron: [2, 1, 1, 1, 0, -1, -1, -1],
  bronze: [2, 1, 1, 0, -1, -1, -2, -2],
  silver: [2, 1, 1, 0, -1, -2, -2, -2],
  gold: [2, 1, 0, -1, -1, -2, -2, -2],
  platinum: [2, 1, 0, -1, -2, -2, -3, -3],
  diamond: [1, 0, -1, -1, -2, -2, -3, -3],
};

const LP_TABLE = [50, 30, 10, -10, -20, -30, -40, -50];

const TIER_MAX_STARS = { iron: 3, bronze: 6, silver: 9, gold: 12, platinum: 15, diamond: 18, master: 999 };
const TIER_NEXT = { iron: 'bronze', bronze: 'silver', silver: 'gold', gold: 'platinum', platinum: 'diamond', diamond: 'master', master: 'master' };
const TIER_PREV = { bronze: 'iron', silver: 'bronze', gold: 'silver', platinum: 'gold', diamond: 'platinum', master: 'diamond' };

export function createDefaultRank() {
  return { tier: 'iron', division: 3, stars: 0, lp: 0, mmr: 1000, totalGames: 0, top1Count: 0, top4Count: 0 };
}

export function formatRank(rank) {
  if (!rank) return '黑铁 III';
  const name = TIER_NAMES[rank.tier] || rank.tier;
  if (rank.tier === 'master' || rank.tier === 'grandmaster' || rank.tier === 'challenger') {
    return `${name} ${rank.lp} LP`;
  }
  const div = ['', 'I', 'II', 'III'][rank.division] || 'III';
  return `${name} ${div} ★${rank.stars}`;
}

export function calculateRankChange(rank, finalRank) {
  const idx = Math.max(0, Math.min(7, finalRank - 1));
  if (['master', 'grandmaster', 'challenger'].includes(rank.tier)) {
    return { starsChange: 0, lpChange: LP_TABLE[idx] };
  }
  return { starsChange: STAR_TABLE[rank.tier]?.[idx] ?? 0, lpChange: 0 };
}

export function applyRankChange(rank, finalRank) {
  const r = { ...rank };
  const { starsChange, lpChange } = calculateRankChange(r, finalRank);
  r.totalGames = (r.totalGames || 0) + 1;
  if (finalRank === 1) r.top1Count = (r.top1Count || 0) + 1;
  if (finalRank <= 4) r.top4Count = (r.top4Count || 0) + 1;

  if (['master', 'grandmaster', 'challenger'].includes(r.tier)) {
    r.lp = Math.max(0, (r.lp || 0) + lpChange);
    r.mmr = Math.max(0, (r.mmr || 1000) + lpChange);
    return { rank: r, promoted: false, demoted: false, starsChange: 0, lpChange };
  }

  r.stars = (r.stars || 0) + starsChange;
  let promoted = false;
  let demoted = false;
  const maxStars = TIER_MAX_STARS[r.tier] || 3;

  while (r.stars >= maxStars && r.tier !== 'master') {
    r.stars -= maxStars;
    r.tier = TIER_NEXT[r.tier] || r.tier;
    r.division = 3;
    promoted = true;
  }

  while (r.stars < 0) {
    if (r.division > 1) {
      r.division -= 1;
      r.stars = maxStars - 1;
      demoted = true;
    } else if (TIER_PREV[r.tier]) {
      r.tier = TIER_PREV[r.tier];
      r.division = 1;
      r.stars = (TIER_MAX_STARS[r.tier] || 3) - 1;
      demoted = true;
    } else {
      r.stars = 0;
      break;
    }
  }

  r.mmr = Math.max(800, (r.mmr || 1000) + starsChange * 15);
  return { rank: r, promoted, demoted, starsChange, lpChange: 0 };
}
