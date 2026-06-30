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
  TURN_INTERVAL: 1600,
  ACTION_INTERVAL_MS: 800,
  ATTACK_LUNGE_MS: 650,
  BATTLE_START_PAUSE_MS: 1000,
  BATTLE_SPEED_OPTIONS: [1, 2, 3],
  DAMAGE_VARIANCE: 0.1,
  MIN_DAMAGE: 1,
  /** 金铲铲式公共卡池：按费用档计数（每张英雄独立） */
  CARD_POOL_LIMITS_BY_COST: { 1: 30, 2: 25, 3: 18, 4: 12, 5: 9 },
  /** @deprecated 兼容旧逻辑，优先用 CARD_POOL_LIMITS_BY_COST */
  CARD_POOL_LIMITS: { common: 30, rare: 25, epic: 18, legendary: 9 },
  /** 费用 = 购买金币（1/2/3/4/5 费） */
  CARD_BUY_COST: { common: 1, rare: 2, epic: 3, epic4: 4, legendary: 5 },
  /** 稀有度 → 费用档 */
  RARITY_COST_TIER: { common: 1, rare: 2, epic: 3, legendary: 5 },
  /** 三星倍率随费用升高；3星5费为最强档 */
  STAR_MULTIPLIER_BY_COST: {
    1: { 1: 1.0, 2: 1.8, 3: 2.8 },
    2: { 1: 1.0, 2: 1.9, 3: 3.2 },
    3: { 1: 1.0, 2: 2.0, 3: 3.8 },
    4: { 1: 1.0, 2: 2.1, 3: 4.2 },
    5: { 1: 1.0, 2: 2.3, 3: 5.5 },
  },
  TIER_MULTIPLIER: { 1: 1.0, 2: 2.0, 3: 3.5 },
  BASE_CRIT_RATE: 0.05,
  BASE_CRIT_DAMAGE: 2.0,
  MAX_CARD_LEVEL: 5,
  MAX_TAVERN_TIER: 6,
  INITIAL_TAVERN_TIER: 1,
  /** 酒馆等级 → 出战栏位（炉石酒馆：最高7人） */
  TAVERN_TEAM_SLOTS: [3, 4, 5, 6, 7, 7],
  /** 酒馆等级 → 商店稀有度权重（兼容展示） */
  TAVERN_RARITY_WEIGHTS: {
    1: { common: 100 },
    2: { common: 72, rare: 28 },
    3: { common: 55, rare: 35, epic: 10 },
    4: { common: 42, rare: 36, epic: 18, legendary: 4 },
    5: { common: 32, rare: 34, epic: 26, legendary: 8 },
    6: { common: 22, rare: 30, epic: 32, legendary: 16 },
  },
  /** 酒馆等级 → 费用档刷新权重（金铲铲：3费/4费史诗分池） */
  TAVERN_COST_WEIGHTS: {
    1: { 1: 100 },
    2: { 1: 75, 2: 25 },
    3: { 1: 55, 2: 35, 3: 10 },
    4: { 1: 42, 2: 36, 3: 18, 4: 4 },
    5: { 1: 32, 2: 34, 3: 26, 4: 8 },
    6: { 1: 15, 2: 25, 3: 30, 4: 22, 5: 8 },
  },
  /** 每回合固定基础金币（炉石酒馆规则） */
  BASE_GOLD: 10,
  /** 升级酒馆费用（当前等级 → 下一级，炉石6级酒馆） */
  TAVERN_UPGRADE_COST: [0, 5, 7, 8, 9, 11],
  /** 卡牌升级费用：当前等级 × 此系数 */
  CARD_UPGRADE_GOLD_PER_LEVEL: 2,
  /** 搭档连携：相邻同属性/同族群加成（非羁绊条） */
  PARTNER_SYNERGY: {
    element: { attack: 2, defense: 1 },
    tribe: { attack: 1, speed: 1 },
  },
  /** 足迹侦查等级上限 */
  SCOUT_MAX_LEVEL: 3,
  SCOUT_DEFAULT_LEVEL: 1,
  /** 野性邂逅二选一触发概率（成体及以上融合） */
  DISCOVER_BRANCH_CHANCE: 0.45,
  /** 训练师指令 */
  TRAINER_RALLY_ATK: 4,
  TRAINER_INSPIRE_ATK: 8,
  TRAINER_BATTLE_COMMAND_TIMEOUT_MS: 12000,
  /** 开局每人赠送的幼体数量（避免空战队秒结束） */
  STARTER_CARD_COUNT: 2,
};

export const ELEMENT_NAMES = {
  fire: '火', water: '水', grass: '草', electric: '电',
  wind: '风', earth: '土', light: '光', dark: '暗',
};

export const RARITY_NAMES = {
  common: '普通', rare: '稀有', epic: '史诗', legendary: '传说',
};

/** 酒馆等级对应出战栏位 */
export function getTeamSlotsForTavern(tavernTier) {
  const idx = Math.min(Math.max(tavernTier, 1), CONFIG.TAVERN_TEAM_SLOTS.length) - 1;
  return CONFIG.TAVERN_TEAM_SLOTS[idx] ?? CONFIG.MAX_TEAM_SIZE;
}

export function getTavernRarityWeights(tavernTier) {
  const tier = Math.min(Math.max(tavernTier, 1), CONFIG.MAX_TAVERN_TIER);
  return CONFIG.TAVERN_RARITY_WEIGHTS[tier] || CONFIG.TAVERN_RARITY_WEIGHTS[1];
}

export function getTavernCostWeights(tavernTier) {
  const tier = Math.min(Math.max(tavernTier, 1), CONFIG.MAX_TAVERN_TIER);
  return CONFIG.TAVERN_COST_WEIGHTS[tier] || CONFIG.TAVERN_COST_WEIGHTS[1];
}

export function getPoolLimitForCost(costTier) {
  return CONFIG.CARD_POOL_LIMITS_BY_COST[costTier]
    ?? CONFIG.CARD_POOL_LIMITS_BY_COST[1];
}

export function getCardBuyCost(rarity, costTier) {
  if (costTier) return costTier;
  return CONFIG.RARITY_COST_TIER[rarity] ?? CONFIG.BUY_COST;
}

export function getStarMultiplier(rarity, star, costTier) {
  const tier = costTier || CONFIG.RARITY_COST_TIER[rarity] || 1;
  const table = CONFIG.STAR_MULTIPLIER_BY_COST[tier] || CONFIG.STAR_MULTIPLIER_BY_COST[1];
  return table[star] || table[1] || 1;
}

export function formatTavernShopOdds(tavernTier) {
  const w = getTavernCostWeights(tavernTier);
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return Object.entries(w)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([cost, v]) => `${cost}费${Math.round((v / total) * 100)}%`)
    .join(' · ');
}

/** 金铲铲式：各费用档刷新概率列表 */
export function getTavernCostOddsList(tavernTier) {
  const w = getTavernCostWeights(tavernTier);
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return Object.entries(w)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([cost, v]) => ({ cost: Number(cost), percent: Math.round((v / total) * 100) }));
}

const COST_BORDER_CLASS = { 1: 'cost-1', 2: 'cost-2', 3: 'cost-3', 4: 'cost-4', 5: 'cost-5' };

export function getCostBorderClass(costTier) {
  return COST_BORDER_CLASS[costTier] || 'cost-1';
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

/** 根据酒馆等级决定商店可刷稀有度 */
export function getAvailableRarities(tavernTier) {
  const w = getTavernRarityWeights(tavernTier);
  return Object.keys(w);
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
