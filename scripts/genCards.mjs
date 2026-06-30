import fs from 'fs';

const LM = {
  common: [1, 1.2, 1.5, 2, 2.5],
  rare: [1, 1.3, 1.7, 2.2, 2.8],
  epic: [1, 1.4, 1.9, 2.5, 3.2],
  legendary: [1, 1.5, 2, 2.8, 3.5],
};

function C(id, name, el, cls, rar, hp, atk, spd, def, cr, cd, desc, skills, evo) {
  return {
    id, name, element: el, class: cls, rarity: rar, description: desc,
    baseHp: hp, baseAttack: atk, baseSpeed: spd, baseDefense: def,
    baseCritRate: cr, baseCritDamage: cd,
    levelMultipliers: LM[rar], skills, upgradeEvolution: evo || null,
  };
}
function S(id, name, trig, tgt, desc, cool, cond, fx, extra = {}) {
  return { id, name, trigger: trig, target: tgt, description: desc, cooldown: cool, condition: cond, effects: fx, ...extra };
}
const D = (t, a, dt) => [{ type: 'DEAL_DAMAGE', target: t, amount: a, damageType: dt }];
const H = (t, a) => [{ type: 'HEAL', target: t, amount: a }];
const SH = (t, a) => [{ type: 'SHIELD', target: t, amount: a }];
const ST = (t, s, d, v = 0) => [{ type: 'APPLY_STATUS', target: t, status: s, duration: d, value: v }];
const BF = (t, st, v, d) => [{ type: 'BUFF', target: t, stat: st, value: v, duration: d }];
const DB = (t, st, v, d) => [{ type: 'DEBUFF', target: t, stat: st, value: v, duration: d }];
const CL = (t) => [{ type: 'CLEANSE', target: t }];
const EX = (t, th = 0.2, ch = 0.3) => [{ type: 'EXECUTE', target: t, threshold: th, chance: ch }];

const killBuff = (id, name, stat, val, desc) => ({
  id, name, trigger: 'ON_KILL', target: 'SELF', description: desc, cooldown: 0, condition: null,
  effects: [{ type: 'BUFF', target: 'SELF', stat, value: val, duration: 99 }],
});

const cards = [
  // ===== 普通 · 火 =====
  C('lava_turtle', '熔岩龟', 'fire', 'tank', 'common', 55, 4, 5, 6, 0.05, 2,
    '沉睡火山深处的古老龟兽，背壳由熔岩凝固而成',
    [
      S('lava_turtle_s1', '熔岩护盾', 'BATTLE_START', 'SELF', '战斗开始获得15护盾', 0, null, SH('SELF', 15)),
      S('lava_turtle_s2', '铁壁嘲讽', 'BATTLE_START', 'SELF', '战斗开始获得2回合嘲讽', 0, null, ST('SELF', 'TAUNT', 2)),
    ],
    { skillId: 'lava_turtle_s1', shieldBonus: 10, tauntBonus: 1, desc: '护盾25点，嘲讽3回合 ★3' }),

  C('flame_lion', '烈焰狮', 'fire', 'warrior', 'common', 38, 9, 10, 2, 0.08, 2,
    '火焰草原上的百兽之王，鬃毛如同燃烧的火焰',
    [S('flame_lion_s1', '烈焰爪击', 'BEFORE_ATTACK', 'FRONT_ENEMY', '15点火伤+灼烧', 2, null,
      [...D('FRONT_ENEMY', 15, 'fire'), ...ST('FRONT_ENEMY', 'BURN', 2, 5)])],
    { skillId: 'flame_lion_s1', burnValue: 3, desc: '灼烧8伤/回合 ★3' }),

  C('flame_cat', '焰影猫', 'fire', 'assassin', 'common', 25, 10, 16, 1, 0.15, 2.2,
    '潜伏于火焰阴影中的灵巧猫兽',
    [S('flame_cat_s1', '火焰突袭', 'BEFORE_ATTACK', 'LOWEST_HP_ENEMY', '对低血敌18点火伤', 2, 'lowHp50', D('LOWEST_HP_ENEMY', 18, 'fire'))],
    {
      skillId: 'flame_cat_s1', damageBonus: 7, desc: '25点火伤，击杀+3攻 ★3',
      addSkills: [killBuff('flame_cat_kill', '猎焰', 'attack', 3, '击杀后永久+3攻击')],
    }),

  // ===== 普通 · 水 =====
  C('ice_crab', '冰甲蟹', 'water', 'tank', 'common', 50, 5, 6, 5, 0.05, 2,
    '冰海深处的甲壳幻兽，甲壳坚不可摧',
    [
      S('ice_crab_s1', '冰霜护甲', 'BATTLE_START', 'SELF', '10护盾+2防', 0, null, [...SH('SELF', 10), ...BF('SELF', 'defense', 2, 2)]),
      S('ice_crab_s2', '冰冻反击', 'ON_HIT', 'ATTACKER', '被攻击时冰冻并反击10伤', 3, null,
        [...ST('ATTACKER', 'FREEZE', 1), ...D('ATTACKER', 5, 'water')]),
    ],
    {
      skillId: 'ice_crab_s2', secondSkillId: 'ice_crab_s2', damageBonus: 5, desc: '80%冰冻+反击10伤 ★3',
      secondAddEffects: D('ATTACKER', 5, 'water'),
    }),

  C('wave_shark', '巨浪鲨', 'water', 'warrior', 'common', 40, 8, 9, 3, 0.06, 2,
    '深海中的凶猛猎手，浪潮是它的武器',
    [S('wave_shark_s1', '海浪冲击', 'BEFORE_ATTACK', 'FRONT_ENEMY', '12点水伤+降防', 2, null,
      [...D('FRONT_ENEMY', 12, 'water'), ...DB('FRONT_ENEMY', 'defense', 2, 2)])],
    { skillId: 'wave_shark_s1', damageBonus: 6, debuffBonus: 1, desc: '18水伤，降防3点 ★3' }),

  C('rain_butterfly', '雨云蝶', 'water', 'support', 'common', 28, 4, 11, 2, 0.05, 2,
    '由雨云凝聚而成的蝴蝶精灵',
    [
      S('rain_butterfly_s1', '雨露滋润', 'TURN_START', 'LOWEST_HP_ALLY', '恢复10生命', 2, null, H('LOWEST_HP_ALLY', 10)),
      S('rain_butterfly_s2', '云雨之护', 'BATTLE_START', 'ALL_ALLIES', '全体5护盾', 0, null, SH('ALL_ALLIES', 5)),
    ],
    {
      skillId: 'rain_butterfly_s1', healBonus: 5, desc: '恢复15生命+2防2回合 ★3',
      addEffects: BF('LOWEST_HP_ALLY', 'defense', 2, 2),
    }),

  // ===== 普通 · 草 =====
  C('nut_bear', '坚果熊', 'grass', 'tank', 'common', 52, 5, 5, 5, 0.05, 2,
    '森林中的守护者，坚果壳是最可靠的盾牌',
    [S('nut_bear_s1', '坚果壳盾', 'BATTLE_START', 'SELF', '12护盾+反击', 0, null,
      [...SH('SELF', 12), ...ST('SELF', 'COUNTER', 99, 3)])],
    { skillId: 'nut_bear_s1', shieldBonus: 8, statusValueBonus: 2, desc: '20护盾，反击5伤 ★3' }),

  C('leaf_wolf', '叶刃狼', 'grass', 'warrior', 'common', 36, 9, 11, 2, 0.08, 2,
    '叶刃般锋利的爪子，森林中的掠食者',
    [S('leaf_wolf_s1', '叶刃斩', 'BEFORE_ATTACK', 'FRONT_ENEMY', '15草伤+中毒', 2, null,
      [...D('FRONT_ENEMY', 15, 'grass'), ...ST('FRONT_ENEMY', 'POISON', 3, 4)])],
    { skillId: 'leaf_wolf_s1', damageBonus: 5, statusValueBonus: 2, desc: '20草伤，中毒6伤 ★3' }),

  C('heal_mushroom', '治愈蘑菇', 'grass', 'support', 'common', 26, 3, 8, 2, 0.05, 2,
    '散发着神秘治愈光芒的蘑菇',
    [
      S('heal_mushroom_s1', '孢子治愈', 'TURN_START', 'ALL_ALLIES', '全体恢复6', 2, null, H('ALL_ALLIES', 6)),
      S('heal_mushroom_s2', '毒孢子', 'AFTER_ATTACK', 'FRONT_ENEMY', '前排中毒', 3, null, ST('FRONT_ENEMY', 'POISON', 2, 3)),
    ],
    {
      skillId: 'heal_mushroom_s1', healBonus: 4, desc: '恢复10+全体+2攻2回合 ★3',
      addEffects: BF('ALL_ALLIES', 'attack', 2, 2),
    }),

  // ===== 普通 · 电 =====
  C('thunder_beetle', '雷甲虫', 'electric', 'tank', 'common', 48, 6, 7, 4, 0.05, 2,
    '甲壳上跳跃着静电的甲虫',
    [S('thunder_beetle_s1', '静电护甲', 'BATTLE_START', 'SELF', '10护盾', 0, null, SH('SELF', 10))],
    {
      skillId: 'thunder_beetle_s1', shieldBonus: 8, desc: '18护盾，受击50%麻痹 ★3',
      addSkills: [S('thunder_beetle_evo', '静电反制', 'ON_HIT', 'ATTACKER', '50%麻痹攻击者', 0, 'chance50',
        ST('ATTACKER', 'PARALYZE', 1))],
    }),

  C('electric_wolf', '电狼', 'electric', 'warrior', 'common', 38, 9, 13, 2, 0.10, 2,
    '在闪电中诞生的狼，速度极快',
    [S('electric_wolf_s1', '闪电突袭', 'BEFORE_ATTACK', 'FRONT_ENEMY', '15电伤+麻痹', 2, null,
      [...D('FRONT_ENEMY', 15, 'electric'), ...ST('FRONT_ENEMY', 'PARALYZE', 1)])],
    {
      skillId: 'electric_wolf_s1', damageBonus: 5, durationBonus: 0, desc: '20电伤，50%追加攻击 ★3',
      addSkills: [S('electric_wolf_evo', '雷光连击', 'AFTER_ATTACK', 'RANDOM_ENEMY', '50%追加10电伤', 0, 'chance50',
        D('RANDOM_ENEMY', 10, 'electric'))],
    }),

  C('charge_rabbit', '电荷兔', 'electric', 'support', 'common', 24, 5, 12, 1, 0.06, 2,
    '浑身充满电荷的小兔子',
    [
      S('charge_rabbit_s1', '电荷加速', 'BATTLE_START', 'ALL_ALLIES', '全体速度+2', 0, null, BF('ALL_ALLIES', 'speed', 2, 2)),
      S('charge_rabbit_s2', '电光护盾', 'TURN_START', 'RANDOM_ALLY', '随机友方8护盾', 2, null, SH('RANDOM_ALLY', 8)),
    ],
    {
      skillId: 'charge_rabbit_s1', spdBuffBonus: 2, desc: '速度+4，攻击+10%3回合 ★3',
      addEffects: BF('ALL_ALLIES', 'attack', 0.10, 3),
    }),

  // ===== 普通 · 风 =====
  C('wind_pigeon', '风盾鸽', 'wind', 'tank', 'common', 46, 5, 8, 4, 0.05, 2,
    '天空之城的守护者，羽翼如风',
    [S('wind_pigeon_s1', '风之盾', 'BATTLE_START', 'SELF', '15护盾', 0, null, SH('SELF', 15))],
    {
      skillId: 'wind_pigeon_s1', shieldBonus: 10, desc: '25护盾，20%闪避+嘲讽 ★3',
      addEffects: [...ST('SELF', 'DODGE', 99, 0.2), ...ST('SELF', 'TAUNT', 1)],
    }),

  C('swift_leopard', '疾风豹', 'wind', 'warrior', 'common', 34, 10, 15, 2, 0.12, 2,
    '风之谷中最快的猎手',
    [S('swift_leopard_s1', '风刃连击', 'BEFORE_ATTACK', 'FRONT_ENEMY', '10风伤+加速', 2, null,
      [...D('FRONT_ENEMY', 10, 'wind'), ...BF('SELF', 'speed', 2, 2)])],
    {
      skillId: 'swift_leopard_s1', damageBonus: 5, desc: '15风伤，50%追加攻击 ★3',
      addSkills: [S('swift_leopard_evo', '风影追击', 'AFTER_ATTACK', 'RANDOM_ENEMY', '50%追加10风伤', 0, 'chance50',
        D('RANDOM_ENEMY', 10, 'wind'))],
    }),

  C('wind_arrow_bird', '风箭鸟', 'wind', 'archer', 'common', 28, 10, 12, 1, 0.12, 2.2,
    '精准的风之射手',
    [S('wind_arrow_bird_s1', '穿风箭', 'BEFORE_ATTACK', 'FRONT_ENEMY', '18风伤', 2, null, D('FRONT_ENEMY', 18, 'wind'))],
    { skillId: 'wind_arrow_bird_s1', damageBonus: 7, desc: '25风伤 ★3' }),

  // ===== 普通 · 土 =====
  C('rock_armor', '岩石甲', 'earth', 'tank', 'common', 58, 4, 4, 7, 0.05, 2,
    '被岩石包裹的远古生物',
    [S('rock_armor_s1', '岩石硬化', 'BATTLE_START', 'SELF', '永久+3防+10盾', 0, null,
      [...BF('SELF', 'defense', 3, 99), ...SH('SELF', 10)])],
    {
      skillId: 'rock_armor_s1', defBuffBonus: 2, shieldBonus: 10, desc: '防+5，20护盾，嘲讽2回合 ★3',
      addEffects: ST('SELF', 'TAUNT', 2),
    }),

  C('brute_bull', '蛮力牛', 'earth', 'warrior', 'common', 42, 10, 7, 4, 0.08, 2,
    '平原上的巨无霸，力大无穷',
    [S('brute_bull_s1', '野蛮冲撞', 'BEFORE_ATTACK', 'FRONT_ENEMY', '20土伤+眩晕', 3, null,
      [...D('FRONT_ENEMY', 20, 'earth'), ...ST('FRONT_ENEMY', 'STUN', 1)])],
    {
      skillId: 'brute_bull_s1', damageBonus: 8, desc: '28土伤，降防3点2回合 ★3',
      addEffects: DB('FRONT_ENEMY', 'defense', 3, 2),
    }),

  C('cactus', '仙人掌', 'earth', 'support', 'common', 32, 5, 7, 3, 0.05, 2,
    '沙漠中的守护者，浑身尖刺',
    [S('cactus_s1', '尖刺护甲', 'BATTLE_START', 'ALL_ALLIES', '全体反击2回合', 0, null, ST('ALL_ALLIES', 'COUNTER', 2, 3))],
    { skillId: 'cactus_s1', durationBonus: 1, statusValueBonus: 2, desc: '反击3回合，反击5伤 ★3' }),

  // ===== 普通 · 光 =====
  C('holy_sheep', '圣盾羊', 'light', 'tank', 'common', 48, 5, 6, 4, 0.05, 2,
    '神圣牧场的守护者',
    [S('holy_sheep_s1', '圣光护盾', 'BATTLE_START', 'SELF', '15护盾', 0, null, SH('SELF', 15))],
    {
      skillId: 'holy_sheep_s1', shieldBonus: 10, desc: '25护盾，受击恢复10，嘲讽2回合 ★3',
      addEffects: ST('SELF', 'TAUNT', 2),
      addSkills: [S('holy_sheep_evo', '圣光回馈', 'ON_HIT', 'SELF', '受击恢复10生命', 0, null, H('SELF', 10))],
    }),

  C('heal_star', '治愈星', 'light', 'support', 'common', 26, 4, 10, 2, 0.05, 2,
    '来自星空的治愈精灵',
    [
      S('heal_star_s1', '星光治愈', 'TURN_START', 'ALL_ALLIES', '全体恢复8', 2, null, H('ALL_ALLIES', 8)),
      S('heal_star_s2', '净化之光', 'BATTLE_START', 'ALL_ALLIES', '清除负面', 0, null, CL('ALL_ALLIES')),
    ],
    {
      skillId: 'heal_star_s1', healBonus: 4, desc: '恢复12+全体+2攻2回合 ★3',
      addEffects: BF('ALL_ALLIES', 'attack', 2, 2),
    }),

  // ===== 稀有 =====
  C('flame_bird', '火焰鸟', 'fire', 'mage', 'rare', 35, 12, 11, 2, 0.10, 2.2,
    '火山深处的凤凰雏鸟',
    [
      S('flame_bird_s1', '烈焰风暴', 'BEFORE_ATTACK', 'ALL_ENEMIES', '全体15火伤', 3, null,
        [...D('ALL_ENEMIES', 15, 'fire'), ...ST('ALL_ENEMIES', 'BURN', 2, 5)]),
      S('flame_bird_s2', '火焰之舞', 'BATTLE_START', 'SELF', '永久+5攻', 0, null, BF('SELF', 'attack', 5, 99)),
    ],
    { skillId: 'flame_bird_s1', damageBonus: 7, burnValue: 3, desc: '22火伤，灼烧8伤 ★3' }),

  C('warm_sprite', '暖焰精灵', 'fire', 'support', 'rare', 30, 6, 10, 2, 0.05, 2,
    '壁炉中诞生的小火精灵',
    [
      S('warm_sprite_s1', '温暖拥抱', 'TURN_START', 'ALL_ALLIES', '恢复10+5%攻', 2, null,
        [...H('ALL_ALLIES', 10), ...BF('ALL_ALLIES', 'attack', 0.05, 2)]),
      S('warm_sprite_s2', '火焰庇护', 'BATTLE_START', 'ALL_ALLIES', '全体10护盾', 0, null, SH('ALL_ALLIES', 10)),
    ],
    {
      skillId: 'warm_sprite_s1', healBonus: 5, atkBuffBonus: 0.05, desc: '恢复15，攻+10%3回合，净化 ★3',
      addEffects: CL('ALL_ALLIES'),
    }),

  C('frost_fish', '霜影鱼', 'water', 'assassin', 'rare', 28, 13, 17, 1, 0.18, 2.2,
    '深海中的幽灵鱼，来去无踪',
    [S('frost_fish_s1', '冰刃突袭', 'BEFORE_ATTACK', 'LOWEST_HP_ENEMY', '20水伤低血必暴', 2, 'lowHp40', D('LOWEST_HP_ENEMY', 20, 'water'))],
    {
      skillId: 'frost_fish_s1', damageBonus: 8, relaxCondition: 'lowHp50', desc: '28水伤HP<50%，击杀+5攻 ★3',
      addSkills: [killBuff('frost_fish_kill', '冰刃收割', 'attack', 5, '击杀后永久+5攻击')],
    }),

  C('ice_dragon', '冰晶龙', 'water', 'mage', 'rare', 38, 14, 9, 3, 0.08, 2.2,
    '雪山之巅的冰龙',
    [
      S('ice_dragon_s1', '冰封千里', 'BEFORE_ATTACK', 'FRONT_ENEMY', '18水伤+冰冻', 2, null,
        [...D('FRONT_ENEMY', 18, 'water'), ...ST('FRONT_ENEMY', 'FREEZE', 1)]),
      S('ice_dragon_s2', '冰龙吐息', 'BATTLE_START', 'ALL_ENEMIES', '全体8水伤', 3, null, D('ALL_ENEMIES', 8, 'water')),
    ],
    {
      skillId: 'ice_dragon_s1', damageBonus: 7, desc: '25水伤，降速3点2回合 ★3',
      addEffects: DB('FRONT_ENEMY', 'speed', 3, 2),
    }),

  C('poison_bee', '毒刺蜂', 'grass', 'assassin', 'rare', 26, 12, 16, 1, 0.15, 2.2,
    '花丛中的致命猎手',
    [S('poison_bee_s1', '剧毒刺击', 'BEFORE_ATTACK', 'RANDOM_ENEMY', '15草伤+中毒', 2, null,
      [...D('RANDOM_ENEMY', 15, 'grass'), ...ST('RANDOM_ENEMY', 'POISON', 3, 8)])],
    {
      skillId: 'poison_bee_s1', damageBonus: 7, statusValueBonus: 2, durationBonus: 1, desc: '22草伤，中毒4回合10伤 ★3',
      addEffects: DB('RANDOM_ENEMY', 'attack', 3, 2),
    }),

  C('flower_fairy', '花妖', 'grass', 'mage', 'rare', 34, 12, 10, 2, 0.08, 2,
    '千年花丛中诞生的精灵',
    [
      S('flower_fairy_s1', '花粉迷障', 'BEFORE_ATTACK', 'ALL_ENEMIES', '全体10草伤', 3, null,
        [...D('ALL_ENEMIES', 10, 'grass'), ...ST('ALL_ENEMIES', 'SILENCE', 1)]),
      S('flower_fairy_s2', '生命之舞', 'TURN_START', 'ALL_ALLIES', '恢复6+5%攻', 2, null,
        [...H('ALL_ALLIES', 6), ...BF('ALL_ALLIES', 'attack', 0.05, 2)]),
    ],
    {
      skillId: 'flower_fairy_s1', damageBonus: 5, durationBonus: 1, desc: '15草伤，沉默2回合，降速 ★3',
      addEffects: DB('ALL_ENEMIES', 'speed', 2, 2),
    }),

  C('flash_fox', '闪影狐', 'electric', 'assassin', 'rare', 28, 13, 19, 1, 0.15, 2.2,
    '闪电中的幻影狐',
    [
      S('flash_fox_s1', '闪电突袭', 'BEFORE_ATTACK', 'FRONT_ENEMY', '18电伤+麻痹', 2, null,
        [...D('FRONT_ENEMY', 18, 'electric'), ...ST('FRONT_ENEMY', 'PARALYZE', 1)]),
      S('flash_fox_s2', '残影', 'ON_HIT', 'SELF', '30%闪避', 0, null, ST('SELF', 'DODGE', 99, 0.3)),
    ],
    {
      skillId: 'flash_fox_s1', damageBonus: 7, desc: '25电伤，攻击后速度+5 ★3',
      addSkills: [S('flash_fox_evo', '电光残影', 'AFTER_ATTACK', 'SELF', '速度+5', 0, null, BF('SELF', 'speed', 5, 2))],
    }),

  C('thunder_cloud', '雷云兽', 'electric', 'mage', 'rare', 36, 14, 10, 2, 0.08, 2.2,
    '雷云中诞生的神秘幻兽',
    [S('thunder_cloud_s1', '雷电风暴', 'BEFORE_ATTACK', 'ALL_ENEMIES', '全体12电伤', 3, null,
      [...D('ALL_ENEMIES', 12, 'electric'), ...ST('RANDOM_ENEMY', 'PARALYZE', 1)])],
    {
      skillId: 'thunder_cloud_s1', damageBonus: 6, durationBonus: 1, desc: '18电伤，麻痹2回合，永久+5攻 ★3',
      addSkills: [S('thunder_cloud_evo', '雷云凝聚', 'BATTLE_START', 'SELF', '永久+5攻', 0, null, BF('SELF', 'attack', 5, 99))],
    }),

  C('shadow_wind_cat', '影风猫', 'wind', 'assassin', 'rare', 26, 14, 18, 1, 0.18, 2.2,
    '风之谷中的幽灵猫',
    [S('shadow_wind_cat_s1', '风影刺杀', 'BEFORE_ATTACK', 'OPPOSING', '20风伤', 2, null, D('OPPOSING', 20, 'wind'))],
    {
      skillId: 'shadow_wind_cat_s1', damageBonus: 8, desc: '28风伤，击杀+5速，隐身1回合 ★3',
      addSkills: [
        killBuff('shadow_wind_cat_spd', '风影', 'speed', 5, '击杀后永久+5速度'),
        S('shadow_wind_cat_stealth', '影遁', 'AFTER_ATTACK', 'SELF', '隐身1回合', 0, null, ST('SELF', 'STEALTH', 1)),
      ],
    }),

  C('storm_eagle', '风暴鹰', 'wind', 'mage', 'rare', 36, 13, 12, 2, 0.10, 2.2,
    '天空中的霸主，掌控风暴',
    [S('storm_eagle_s1', '风暴之眼', 'BEFORE_ATTACK', 'ALL_ENEMIES', '全体12风伤', 3, null,
      [...D('ALL_ENEMIES', 12, 'wind'), ...DB('ALL_ENEMIES', 'speed', 2, 2)])],
    {
      skillId: 'storm_eagle_s1', damageBonus: 6, debuffBonus: 1, desc: '18风伤，降速3回合，30%沉默 ★3',
      addSkills: [S('storm_eagle_evo', '风啸', 'BEFORE_ATTACK', 'RANDOM_ENEMY', '30%沉默1回合', 0, 'chance30',
        ST('RANDOM_ENEMY', 'SILENCE', 1))],
    }),

  C('sand_scorpion', '沙影蝎', 'earth', 'assassin', 'rare', 30, 12, 15, 2, 0.12, 2.2,
    '沙漠中的暗杀者',
    [S('sand_scorpion_s1', '沙隐毒针', 'BEFORE_ATTACK', 'RANDOM_ENEMY', '15土伤+中毒', 2, null,
      [...D('RANDOM_ENEMY', 15, 'earth'), ...ST('RANDOM_ENEMY', 'POISON', 3, 6)])],
    {
      skillId: 'sand_scorpion_s1', damageBonus: 7, statusValueBonus: 2, durationBonus: 1, desc: '22土伤，中毒8伤，致盲+闪避 ★3',
      addEffects: ST('RANDOM_ENEMY', 'BLIND', 3),
      addSkills: [S('sand_scorpion_evo', '沙隐', 'BATTLE_START', 'SELF', '闪避+20%', 0, null, ST('SELF', 'DODGE', 2, 0.2))],
    }),

  C('rock_bow_lizard', '岩弓蜥', 'earth', 'archer', 'rare', 32, 13, 11, 2, 0.12, 2.2,
    '岩石峡谷中的猎人',
    [S('rock_bow_lizard_s1', '岩石箭雨', 'BEFORE_ATTACK', 'ALL_ENEMIES', '全体10土伤', 3, null, D('ALL_ENEMIES', 10, 'earth'))],
    {
      skillId: 'rock_bow_lizard_s1', damageBonus: 5, desc: '15土伤，降防3点，30%眩晕 ★3',
      addEffects: DB('ALL_ENEMIES', 'defense', 3, 3),
      addSkills: [S('rock_bow_evo', '岩震', 'BEFORE_ATTACK', 'RANDOM_ENEMY', '30%眩晕', 0, 'chance30',
        ST('RANDOM_ENEMY', 'STUN', 1))],
    }),

  // ===== 史诗 =====
  C('phoenix_bow', '凤凰弓', 'fire', 'archer', 'epic', 38, 16, 12, 2, 0.15, 2.5,
    '凤凰羽毛制成的神弓',
    [
      S('phoenix_bow_s1', '凤凰箭', 'BEFORE_ATTACK', 'FRONT_ENEMY', '25火伤+灼烧', 2, null,
        [...D('FRONT_ENEMY', 25, 'fire'), ...ST('FRONT_ENEMY', 'BURN', 3, 8)]),
      S('phoenix_bow_s2', '不灭之焰', 'ON_KILL', 'SELF', '击杀恢复15+3攻', 0, null,
        [...H('SELF', 15), ...BF('SELF', 'attack', 3, 99)]),
    ],
    { skillId: 'phoenix_bow_s1', damageBonus: 10, burnValue: 4, durationBonus: 1, desc: '35火伤，灼烧4回合12伤 ★3' }),

  C('water_arrow_frog', '水箭蛙', 'water', 'archer', 'epic', 36, 15, 13, 2, 0.12, 2.3,
    '沼泽中的神射手',
    [
      S('water_arrow_frog_s1', '水箭连发', 'BEFORE_ATTACK', 'FRONT_ENEMY', '12水伤×2', 2, null,
        [...D('FRONT_ENEMY', 12, 'water'), ...D('FRONT_ENEMY', 12, 'water')]),
      S('water_arrow_frog_s2', '蛙跳', 'ON_HIT', 'SELF', '40%闪避', 0, null, ST('SELF', 'DODGE', 99, 0.4)),
    ],
    {
      skillId: 'water_arrow_frog_s1', replaceDamage: 18, extraHits: 1, desc: '18水伤×3，攻击后恢复10 ★3',
      addSkills: [S('water_frog_heal', '蛙鸣回春', 'AFTER_ATTACK', 'SELF', '恢复10生命', 0, null, H('SELF', 10))],
    }),

  C('vine_snake', '藤蔓蛇', 'grass', 'archer', 'epic', 38, 16, 11, 2, 0.12, 2.3,
    '藤蔓丛中的猎手',
    [S('vine_snake_s1', '藤蔓绞杀', 'BEFORE_ATTACK', 'FRONT_ENEMY', '20草伤+缠绕', 3, null,
      [...D('FRONT_ENEMY', 20, 'grass'), ...ST('FRONT_ENEMY', 'ENTANGLE', 2)])],
    {
      skillId: 'vine_snake_s1', damageBonus: 8, durationBonus: 1, desc: '28草伤，缠绕3回合，降防5 ★3',
      addEffects: DB('FRONT_ENEMY', 'defense', 5, 3),
    }),

  C('thunder_hawk', '雷电鹰', 'electric', 'archer', 'epic', 38, 17, 14, 2, 0.15, 2.5,
    '雷云中的霸主',
    [S('thunder_hawk_s1', '雷电俯冲', 'BEFORE_ATTACK', 'ALL_ENEMIES', '15电伤+麻痹', 3, null,
      [...D('ALL_ENEMIES', 15, 'electric'), ...ST('ALL_ENEMIES', 'PARALYZE', 1)])],
    {
      skillId: 'thunder_hawk_s1', damageBonus: 7, durationBonus: 1, desc: '22电伤，麻痹2回合，全体降速 ★3',
      addEffects: DB('ALL_ENEMIES', 'speed', 3, 2),
    }),

  C('light_arrow_angel', '光箭天使', 'light', 'archer', 'epic', 38, 16, 13, 2, 0.15, 2.5,
    '天堂派来的使者',
    [
      S('light_arrow_angel_s1', '圣光箭', 'BEFORE_ATTACK', 'FRONT_ENEMY', '22光伤+眩晕', 2, null,
        [...D('FRONT_ENEMY', 22, 'light'), ...ST('FRONT_ENEMY', 'STUN', 1)]),
      S('light_arrow_angel_s2', '光之审判', 'BATTLE_START', 'ALL_ENEMIES', '暗系10光伤', 0, null, D('ALL_ENEMIES', 10, 'light')),
    ],
    {
      skillId: 'light_arrow_angel_s1', damageBonus: 8, durationBonus: 1, desc: '30光伤，眩晕2回合，友方恢复8 ★3',
      addEffects: H('ALL_ALLIES', 8),
    }),

  C('dark_arrow', '暗箭', 'dark', 'archer', 'epic', 36, 18, 12, 1, 0.15, 2.5,
    '暗影中的致命猎手',
    [
      S('dark_arrow_s1', '暗影箭', 'BEFORE_ATTACK', 'LOWEST_HP_ENEMY', '20暗伤', 2, null,
        [...D('LOWEST_HP_ENEMY', 20, 'dark'), ...ST('LOWEST_HP_ENEMY', 'POISON', 2, 6)]),
      S('dark_arrow_s2', '暗之侵蚀', 'ON_KILL', 'ALL_ENEMIES', '击杀全体10暗伤', 0, null, D('ALL_ENEMIES', 10, 'dark')),
    ],
    {
      skillId: 'dark_arrow_s1', damageBonus: 8, statusValueBonus: 2, durationBonus: 1, desc: '28暗伤，中毒8伤，30%斩杀 ★3',
      addEffects: EX('LOWEST_HP_ENEMY', 0.2, 0.3),
    }),

  // ===== 传说 =====
  C('creator_god', '创世神', 'light', 'mage', 'legendary', 80, 25, 12, 5, 0.10, 2.5,
    '创世的至高神明',
    [
      S('creator_god_s1', '创世之光', 'BATTLE_START', 'ALL_ALLIES', '全体恢复20+10攻+15盾', 0, null,
        [...H('ALL_ALLIES', 20), ...BF('ALL_ALLIES', 'attack', 10, 99), ...SH('ALL_ALLIES', 15)]),
      S('creator_god_s2', '神之裁决', 'BEFORE_ATTACK', 'ALL_ENEMIES', '30光伤+眩晕', 3, null,
        [...D('ALL_ENEMIES', 30, 'light'), ...ST('ALL_ENEMIES', 'STUN', 1)]),
      S('creator_god_s3', '不灭神体', 'ON_DEATH', 'SELF', '死亡复活', 99, null,
        [...H('SELF', 9999), ...BF('SELF', 'attack', 20, 99)], { oncePerBattle: true }),
    ],
    {
      skillId: 'creator_god_s1', healBonus: 10, atkBuffBonus: 5, shieldBonus: 5, desc: '恢复30，+15攻，20护盾，净化 ★3',
      addEffects: CL('ALL_ALLIES'),
    }),

  C('dark_lord', '暗黑魔王', 'dark', 'mage', 'legendary', 75, 30, 10, 4, 0.12, 2.5,
    '黑暗深渊的主宰',
    [
      S('dark_lord_s1', '黑暗吞噬', 'BEFORE_ATTACK', 'ALL_ENEMIES', '20暗伤+吸血', 2, null,
        [...D('ALL_ENEMIES', 20, 'dark'), ...H('SELF', 15)]),
      S('dark_lord_s2', '恐惧光环', 'BATTLE_START', 'ALL_ENEMIES', '敌方-15%攻-2速', 0, null,
        [...DB('ALL_ENEMIES', 'attack', 0.15, 99), ...DB('ALL_ENEMIES', 'speed', 2, 99)]),
      S('dark_lord_s3', '暗影重生', 'ON_DEATH', 'SELF', '死亡复活', 99, null,
        [...H('SELF', 9999), ...BF('SELF', 'attack', 15, 99)], { oncePerBattle: true }),
    ],
    {
      skillId: 'dark_lord_s1', damageBonus: 10, healBonus: 10, desc: '30暗伤，吸血25，50%沉默2回合 ★3',
      addEffects: ST('ALL_ENEMIES', 'SILENCE', 2),
    }),
];

const withEvo = cards.filter(c => c.upgradeEvolution).length;
fs.writeFileSync(new URL('../js/cardData.js', import.meta.url), `export const CARD_TEMPLATES = ${JSON.stringify(cards, null, 2)};\n`);
console.log('Generated', cards.length, 'cards,', withEvo, 'with 3-star evolution');
