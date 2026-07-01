/** 被污染的幻兽 · 敌人定义、图鉴、遭遇池 */

export const INTENTS = {
  ATTACK: 'attack',
  DEFEND: 'defend',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  ATTACK_DEFEND: 'attack_defend',
  STRONG_ATTACK: 'strong_attack',
  UNKNOWN: 'unknown',
};

/** @type {Record<string, object>} */
export const ENEMIES = {
  corrupted_mushroom: {
    id: 'corrupted_mushroom',
    name: '污化·治愈菇',
    desc: '本应治愈的孢子变成了致幻毒雾',
    personality: '胆小 · 摇摆',
    story: '治愈菇本能在森林中散播安神孢子，被污染后孢子致幻，会无差别攻击靠近的生命。',
    weakness: '火焰与强光技法可驱散孢子雾，造成额外净化伤害',
    element: 'grass',
    tier: 'early',
    maxHp: 28,
    icon: '🍄',
    pattern: [
      { intent: INTENTS.ATTACK, value: 5 },
      { intent: INTENTS.ATTACK, value: 7 },
      { intent: INTENTS.DEFEND, value: 6 },
    ],
  },
  corrupted_wolf: {
    id: 'corrupted_wolf',
    name: '狂乱·电狼',
    desc: '雷电失控，在荒野中无差别撕咬',
    personality: '凶猛 · 冲动',
    story: '电狼族群以雷为信，污染让它们失去族群意识，只剩撕咬本能。',
    weakness: '守型技法可抵挡其扑击；连续净化可打断其蓄力',
    element: 'electric',
    tier: 'early',
    maxHp: 38,
    icon: '🐺',
    pattern: [
      { intent: INTENTS.ATTACK, value: 8 },
      { intent: INTENTS.ATTACK, value: 10 },
      { intent: INTENTS.BUFF, value: 2, buff: 'strength' },
    ],
  },
  corrupted_turtle: {
    id: 'corrupted_turtle',
    name: '暴走·熔岩龟',
    desc: '龟壳下岩浆翻涌，所过之处焦土一片',
    personality: '沉稳 · 顽固',
    story: '熔岩龟沉睡于地脉，污秽唤醒了壳下的岩浆，行动缓慢却极难击穿。',
    weakness: '多次小额攻击可磨穿淤壳；冰冻技法可短暂凝固岩浆',
    element: 'fire',
    tier: 'mid',
    maxHp: 32,
    icon: '🐢',
    pattern: [
      { intent: INTENTS.ATTACK, value: 6 },
      { intent: INTENTS.ATTACK_DEFEND, attack: 5, block: 5 },
      { intent: INTENTS.ATTACK, value: 9 },
    ],
  },
  corrupted_cat: {
    id: 'corrupted_cat',
    name: '堕落·焰影猫',
    desc: '影焰缠身，已认不出曾经的主人',
    personality: '狡黠 · 善变',
    story: '焰影猫曾是净化师的伙伴，污染后影焰会吞噬熟悉的气息，变得敌我不分。',
    weakness: '光属性净化技法效果显著；注意其强力冲撞前的污意',
    element: 'fire',
    tier: 'mid',
    maxHp: 42,
    icon: '🐱',
    pattern: [
      { intent: INTENTS.ATTACK, value: 10 },
      { intent: INTENTS.STRONG_ATTACK, value: 16 },
      { intent: INTENTS.DEFEND, value: 8 },
    ],
  },
  corrupted_crab: {
    id: 'corrupted_crab',
    name: '污化·冰甲蟹',
    desc: '厚重冰甲下是被污染的古老怨念',
    personality: '防御 · 记仇',
    story: '冰甲蟹栖息在古湖，湖底怨念附着于甲壳，使其成为深渊级污染的守门者。',
    weakness: '持续污秽层可绕过护甲；破壳后防御大幅下降',
    element: 'water',
    tier: 'elite',
    maxHp: 55,
    icon: '🦀',
    pattern: [
      { intent: INTENTS.DEFEND, value: 10 },
      { intent: INTENTS.ATTACK, value: 12 },
      { intent: INTENTS.STRONG_ATTACK, value: 18 },
    ],
  },
  corrupted_shadow: {
    id: 'corrupted_shadow',
    name: '深渊·影风猫',
    desc: '幽冥污秽凝聚，专门侵蚀净化师的心神',
    personality: '诡谲 · 消耗',
    story: '影风猫穿梭于污染裂隙，专门释放秽气削弱净化师的心神与灵力。',
    weakness: '尽快净化以免秽气叠加；攻型技法可打断其施秽',
    element: 'dark',
    tier: 'elite',
    maxHp: 48,
    icon: '👁',
    pattern: [
      { intent: INTENTS.DEBUFF, value: 2, debuff: 'weak' },
      { intent: INTENTS.ATTACK, value: 11 },
      { intent: INTENTS.ATTACK, value: 14 },
    ],
  },
  boss_dragon: {
    id: 'boss_dragon',
    name: '污染源·天穹龙兽',
    desc: '一切污秽的源头，远古幻兽被侵蚀后的残骸',
    personality: '威严 · 毁灭',
    story: '远古天穹龙兽守护天空结界，结界破碎后它成为污染源头，100 层污脉皆源于此。',
    weakness: '需持久消耗其护幕与冲撞节奏；净化秘法可逐步削弱龙威',
    element: 'neutral',
    tier: 'boss',
    maxHp: 120,
    icon: '🐉',
    pattern: [
      { intent: INTENTS.ATTACK, value: 12 },
      { intent: INTENTS.STRONG_ATTACK, value: 22 },
      { intent: INTENTS.DEFEND, value: 15 },
      { intent: INTENTS.ATTACK_DEFEND, attack: 10, block: 10 },
      { intent: INTENTS.STRONG_ATTACK, value: 28 },
    ],
  },
};

/** 按阶层解锁的怪物池（固定池 + 随机组合） */
export const MONSTER_POOL = {
  early: ['corrupted_mushroom', 'corrupted_wolf'],
  mid: ['corrupted_mushroom', 'corrupted_wolf', 'corrupted_turtle', 'corrupted_cat'],
  late: ['corrupted_turtle', 'corrupted_cat', 'corrupted_wolf', 'corrupted_mushroom'],
  elite: ['corrupted_crab', 'corrupted_shadow'],
  boss: ['boss_dragon'],
};

export const COMBAT_ENCOUNTERS = {
  normal: MONSTER_POOL.mid,
  elite: MONSTER_POOL.elite,
  boss: MONSTER_POOL.boss,
};

export function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function poolForFloor(floor) {
  if (floor <= 15) return MONSTER_POOL.early;
  if (floor <= 50) return MONSTER_POOL.mid;
  return MONSTER_POOL.late;
}

export function scaleHp(baseHp, floor, tier) {
  const tierMul = tier === 'boss' ? 1 : tier === 'elite' ? 1.15 : 1;
  const floorMul = 1 + Math.max(0, floor - 1) * 0.035;
  return Math.round(baseHp * floorMul * tierMul);
}

export function createEnemy(enemyId, rng = Math.random, floor = 1, tier = 'normal') {
  const def = ENEMIES[enemyId];
  if (!def) return null;
  const pattern = def.pattern;
  const first = pattern[0];
  const maxHp = scaleHp(def.maxHp, floor, tier);
  return {
    uid: `${enemyId}_${Math.floor(rng() * 1e6)}`,
    id: def.id,
    name: def.name,
    desc: def.desc,
    icon: def.icon,
    maxHp,
    hp: maxHp,
    block: 0,
    strength: 0,
    poison: 0,
    patternIndex: 0,
    pattern,
    intent: { ...first },
  };
}

/** 从怪物池随机组合生成本层遭遇组 */
export function pickEncounter(floor, tier, rng = Math.random) {
  if (tier === 'boss') {
    return [createEnemy(MONSTER_POOL.boss[0], rng, floor, tier)];
  }

  const pool = tier === 'elite'
    ? [...MONSTER_POOL.elite]
    : [...poolForFloor(floor)];

  let count = 1;
  if (tier === 'normal') {
    const maxGroup = floor <= 10 ? 2 : floor <= 30 ? 3 : 3;
    count = 1 + Math.floor(rng() * maxGroup);
    count = Math.min(count, pool.length);
  }

  const picked = [];
  const available = [...pool];
  while (picked.length < count && available.length) {
    const i = Math.floor(rng() * available.length);
    picked.push(createEnemy(available[i], rng, floor, tier));
    available.splice(i, 1);
  }
  return picked;
}

export function pickRandomEnemy(tier, rng = Math.random, floor = 1) {
  const group = pickEncounter(floor, tier, rng);
  return group[0];
}

export function advanceIntent(enemy) {
  enemy.patternIndex = (enemy.patternIndex + 1) % enemy.pattern.length;
  enemy.intent = { ...enemy.pattern[enemy.patternIndex] };
}

export function intentLabel(intent) {
  switch (intent.intent) {
    case INTENTS.ATTACK:
      return `暴走 ${intent.value}`;
    case INTENTS.STRONG_ATTACK:
      return `污秽冲撞 ${intent.value}`;
    case INTENTS.DEFEND:
      return `淤壳 +${intent.value}`;
    case INTENTS.BUFF:
      return `污染膨胀 +${intent.value}`;
    case INTENTS.DEBUFF:
      return intent.debuff === 'weak' ? '释放秽气' : '污秽减减';
    case INTENTS.ATTACK_DEFEND:
      return `扑击${intent.attack} 淤壳${intent.block}`;
    default:
      return '???';
  }
}

export function intentIcon(intent) {
  const base = 'assets/intents';
  let file = 'unknown.svg';
  switch (intent.intent) {
    case INTENTS.ATTACK:
    case INTENTS.STRONG_ATTACK:
    case INTENTS.ATTACK_DEFEND:
      file = 'damage.svg';
      break;
    case INTENTS.DEFEND:
      file = 'block.svg';
      break;
    case INTENTS.BUFF:
      file = 'buff.svg';
      break;
    case INTENTS.DEBUFF:
      file = 'debuff.svg';
      break;
    default:
      break;
  }
  return `<img class="purify-intent-icon" src="${base}/${file}" alt="" aria-hidden="true">`;
}

export function getAllEnemyIds() {
  return Object.keys(ENEMIES);
}

export function getEnemyDef(id) {
  return ENEMIES[id] || null;
}
