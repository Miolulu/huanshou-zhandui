/** 幻兽战队 - 游戏配置常量 */
export const CONFIG = {
  PREPARE_TIME: 30,
  MAX_PLAYERS: 8,
  BASE_HP: 100,
  MAX_TEAM_SIZE: 7,
  INITIAL_TEAM_SIZE: 3,
  SHOP_SIZE: 5,
  REFRESH_COST: 2,
  BUY_COST: 3,
  INTEREST_RATE: 10,
  MAX_INTEREST: 5,
  STREAK_BONUS: [0, 0, 1, 1, 2, 2, 3],
  DAMAGE_PER_SURVIVOR: 2,
  STAGE_DAMAGE: [0, 0, 0, 1, 2, 3, 5, 5, 6, 7, 8],
  MAX_TURNS_PER_BATTLE: 50,
  TURN_INTERVAL: 400,
  ACTION_INTERVAL_MS: 300,
  DAMAGE_VARIANCE: 0.1,
  MIN_DAMAGE: 1,
  RARITY_WEIGHTS: { common: 60, rare: 25, epic: 12, legendary: 3 },
  CARD_POOL_LIMITS: { common: 40, rare: 25, epic: 12, legendary: 6 },
  TIER_MULTIPLIER: { 1: 1.0, 2: 2.0, 3: 3.5 },
  BASE_CRIT_RATE: 0.05,
  BASE_CRIT_DAMAGE: 2.0,
  MAX_CARD_LEVEL: 5,
  MAX_TAVERN_TIER: 6,
  INITIAL_TAVERN_TIER: 1,
  /** 每回合固定基础金币（炉石酒馆规则） */
  BASE_GOLD: 10,
  /** 升级酒馆费用（当前等级 → 下一级） */
  TAVERN_UPGRADE_COST: [0, 5, 7, 8, 9, 11],
  /** 卡牌升级费用：当前等级 × 此系数 */
  CARD_UPGRADE_GOLD_PER_LEVEL: 2,
};

export const ELEMENT_NAMES = {
  fire: '火', water: '水', grass: '草', electric: '电',
  wind: '风', earth: '土', light: '光', dark: '暗',
};

export const RARITY_NAMES = {
  common: '普通', rare: '稀有', epic: '史诗', legendary: '传说',
};

/** 战队栏位升级费用 */
export function getTeamSlotUpgradeCost(currentSize) {
  return currentSize * 5;
}

export function getInterest(gold) {
  return Math.min(Math.floor(gold / CONFIG.INTEREST_RATE), CONFIG.MAX_INTEREST);
}

export function getStreakBonus(streak) {
  const idx = Math.min(streak, CONFIG.STREAK_BONUS.length - 1);
  return CONFIG.STREAK_BONUS[idx];
}

/** 每回合固定基础金币 */
export function getTurnBaseGold(_turn) {
  return CONFIG.BASE_GOLD;
}

export function getTavernUpgradeCost(currentTier) {
  if (currentTier >= CONFIG.MAX_TAVERN_TIER) return Infinity;
  return CONFIG.TAVERN_UPGRADE_COST[currentTier] || 11;
}

export function getCardUpgradeCost(currentLevel) {
  if (currentLevel >= CONFIG.MAX_CARD_LEVEL) return Infinity;
  return currentLevel * CONFIG.CARD_UPGRADE_GOLD_PER_LEVEL;
}

/** 根据酒馆等级决定商店稀有度解锁 */
export function getAvailableRarities(tavernTier) {
  const r = ['common'];
  if (tavernTier >= 2) r.push('rare');
  if (tavernTier >= 4) r.push('epic');
  if (tavernTier >= 5) r.push('legendary');
  return r;
}

/** 商店卡牌等级范围由酒馆等级决定 */
export function getShopLevelRange(tavernTier) {
  const minLevel = Math.max(1, tavernTier - 1);
  const maxLevel = Math.min(CONFIG.MAX_CARD_LEVEL, tavernTier);
  return { minLevel, maxLevel };
}

/** 卡牌可升级到的最高等级（不超过酒馆等级） */
export function getMaxCardLevelForPlayer(tavernTier) {
  return Math.min(CONFIG.MAX_CARD_LEVEL, tavernTier);
}

/** 回合阶段额外扣血（文档 11.2） */
export function getStageDamage(turn) {
  const idx = Math.min(turn, CONFIG.STAGE_DAMAGE.length - 1);
  return CONFIG.STAGE_DAMAGE[Math.max(0, idx)];
}
