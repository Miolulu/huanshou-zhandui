/** 补充卡牌（金铲铲式扩展池） */
function mk(id, name, element, cls, rarity, stats, skills, extra = {}) {
  return {
    id, name, element, class: cls, rarity,
    description: extra.desc || `${name}——高阶幻兽`,
    baseHp: stats.hp, baseAttack: stats.atk, baseSpeed: stats.spd,
    baseDefense: stats.def, baseCritRate: stats.crit || 0.05, baseCritDamage: stats.cd || 2,
    levelMultipliers: [1, 1.2, 1.5, 2, 2.5],
    skills,
    costTier: extra.costTier,
    upgradeEvolution: extra.evo,
  };
}

const dmg = (amount, cd = 2) => ({
  id: `${amount}_dmg`, name: '打击', trigger: 'ON_ATTACK', target: 'ENEMY_LOWEST_HP',
  description: `造成${amount}伤害`, cooldown: cd, condition: null,
  effects: [{ type: 'DEAL_DAMAGE', target: 'ENEMY_LOWEST_HP', amount }],
});

export const CARD_DATA_EXTRA = [
  mk('sky_dragon', '天穹龙皇', 'wind', 'mage', 'legendary',
    { hp: 95, atk: 16, spd: 12, def: 4, crit: 0.12 },
    [dmg(22, 1), { id: 'sky_burst', name: '天穹裂空', trigger: 'TURN_START', target: 'ENEMY_ALL',
      description: '对所有敌人造成12法术伤害', cooldown: 3, condition: null,
      effects: [{ type: 'DEAL_DAMAGE', target: 'ENEMY_ALL', amount: 12 }] }],
    { costTier: 5, desc: '五费传说，三星后统治战场', evo: { skillId: 'sky_burst', replaceDamage: 28, desc: '天穹裂空造成28伤害 ★3' } }),

  mk('void_sovereign', '虚空主宰', 'dark', 'assassin', 'legendary',
    { hp: 78, atk: 20, spd: 16, def: 3, crit: 0.18 },
    [dmg(26, 1), { id: 'void_exec', name: '虚空处决', trigger: 'ON_KILL', target: 'SELF',
      description: '击杀后攻速提升', cooldown: 0, condition: null,
      effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', value: 4, duration: 2 }] }],
    { costTier: 5, evo: { skillId: 'void_exec', spdBuffBonus: 6, desc: '击杀后速度+10 ★3' } }),

  mk('saint_unicorn', '圣光独角兽', 'light', 'support', 'legendary',
    { hp: 88, atk: 10, spd: 11, def: 5 },
    [{ id: 'holy_wave', name: '圣愈波', trigger: 'TURN_START', target: 'TEAM_ALL',
      description: '全队回复8生命', cooldown: 2, condition: null,
      effects: [{ type: 'HEAL', target: 'TEAM_ALL', amount: 8 }] }],
    { costTier: 5, evo: { skillId: 'holy_wave', healBonus: 12, desc: '圣愈波回复20 ★3' } }),

  mk('thunder_titan', '雷霆泰坦', 'electric', 'warrior', 'legendary',
    { hp: 110, atk: 14, spd: 8, def: 8 },
    [dmg(18, 1), { id: 'thunder_roar', name: '雷霆咆哮', trigger: 'BATTLE_START', target: 'ENEMY_ALL',
      description: '开战眩晕敌人1回合', cooldown: 0, condition: null,
      effects: [{ type: 'APPLY_STATUS', target: 'ENEMY_ALL', status: 'STUN', duration: 1, value: 0 }] }],
    { costTier: 5 }),

  mk('crystal_golem', '晶岩巨像', 'earth', 'tank', 'epic',
    { hp: 100, atk: 8, spd: 5, def: 12 },
    [{ id: 'crystal_wall', name: '晶岩壁垒', trigger: 'BATTLE_START', target: 'SELF',
      description: '获得25护盾', cooldown: 0, condition: null,
      effects: [{ type: 'SHIELD', target: 'SELF', amount: 25 }] }],
    { costTier: 4 }),

  mk('storm_ranger', '风暴游侠', 'wind', 'archer', 'epic',
    { hp: 62, atk: 15, spd: 14, def: 3, crit: 0.14 },
    [dmg(16, 1), { id: 'pierce_shot', name: '穿云箭', trigger: 'ON_ATTACK', target: 'ENEMY_LOWEST_HP',
      description: '攻击附加6伤害', cooldown: 1, condition: null,
      effects: [{ type: 'DEAL_DAMAGE', target: 'ENEMY_LOWEST_HP', amount: 6 }] }],
    { costTier: 4 }),

  mk('tide_guardian', '潮汐守卫', 'water', 'guardian', 'epic',
    { hp: 92, atk: 7, spd: 7, def: 10 },
    [{ id: 'tide_shield', name: '潮盾', trigger: 'ON_HIT', target: 'SELF',
      description: '受击获得8护盾', cooldown: 2, condition: null,
      effects: [{ type: 'SHIELD', target: 'SELF', amount: 8 }] }],
    { costTier: 4 }),

  mk('flame_dancer', '烈焰舞姬', 'fire', 'ranger', 'epic',
    { hp: 58, atk: 17, spd: 15, def: 2, crit: 0.15 },
    [dmg(17, 0), { id: 'flame_dash', name: '焰步', trigger: 'TURN_START', target: 'SELF',
      description: '速度+3', cooldown: 2, condition: null,
      effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', value: 3, duration: 1 }] }],
    { costTier: 4 }),

  mk('vine_shaman', '蔓藤萨满', 'grass', 'support', 'rare',
    { hp: 52, atk: 6, spd: 9, def: 4 },
    [{ id: 'vine_heal', name: '蔓生治愈', trigger: 'TURN_START', target: 'TEAM_LOWEST_HP',
      description: '治疗最低血友方10', cooldown: 2, condition: null,
      effects: [{ type: 'HEAL', target: 'TEAM_LOWEST_HP', amount: 10 }] }]),

  mk('iron_hound', '钢铁猎犬', 'earth', 'ranger', 'rare',
    { hp: 48, atk: 11, spd: 13, def: 3, crit: 0.1 },
    [dmg(11, 1)]),

  mk('spark_fox', '闪雷狐', 'electric', 'assassin', 'rare',
    { hp: 40, atk: 12, spd: 16, def: 2, crit: 0.16 },
    [dmg(13, 0)]),

  mk('dawn_knight', '晨曦骑士', 'light', 'guardian', 'rare',
    { hp: 65, atk: 8, spd: 8, def: 7 },
    [{ id: 'dawn_aegis', name: '晨曦庇护', trigger: 'BATTLE_START', target: 'TEAM_ALL',
      description: '全队获得6护盾', cooldown: 0, condition: null,
      effects: [{ type: 'SHIELD', target: 'TEAM_ALL', amount: 6 }] }]),
];
