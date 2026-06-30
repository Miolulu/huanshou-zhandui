/**
 * 全卡牌炉石式战吼/亡语目录（战吼=BATTLE_START，亡语=ON_DEATH）
 */

const bc = (id, name, desc, effects) => ({
  id, name, trigger: 'BATTLE_START', target: 'SELF', description: desc,
  cooldown: 0, condition: null, effects,
});
const dr = (id, name, desc, effects) => ({
  id, name, trigger: 'ON_DEATH', target: 'SELF', description: desc,
  cooldown: 0, condition: null, effects,
});
const aa = (id, name, desc, effects) => ({
  id, name, trigger: 'ON_ALLY_DEATH', target: 'SELF', description: desc,
  cooldown: 0, condition: null, effects,
});
const tk = (id, name, desc, effects) => ({
  id, name, trigger: 'ON_KILL', target: 'SELF', description: desc,
  cooldown: 0, condition: null, effects,
});
const ts = (id, name, desc, effects) => ({
  id, name, trigger: 'TURN_START', target: 'SELF', description: desc,
  cooldown: 0, condition: null, effects,
});

const tribeBuff = (tribe, atk, def) => ({
  type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe, attack: atk, defense: def,
});
const selfBuff = (atk, def) => ({ type: 'STAT_BUFF', target: 'SELF', attack: atk, defense: def });
const teamBuff = (atk, def) => ({ type: 'STAT_BUFF', target: 'TEAM_ALL', attack: atk, defense: def });
const shield = (amt) => ({ type: 'SHIELD', target: 'SELF', amount: amt });
const dmgAll = (amt) => ({ type: 'DEAL_DAMAGE', target: 'ENEMY_ALL', amount: amt });
const healLow = (amt) => ({ type: 'HEAL', target: 'TEAM_LOWEST_HP', amount: amt });
const taunt = () => ({ type: 'APPLY_STATUS', target: 'SELF', status: 'TAUNT', duration: 2, value: 0 });
const reborn = () => ({ type: 'REBORN', target: 'SELF', hp: 1 });
const summon = (name, atk, def, hp, tribe, count = 1) => ({
  type: 'SUMMON_TOKEN', target: 'SELF', name, attack: atk, defense: def, hp, tribe, count,
});
const adjBuff = (atk, def) => ({ type: 'BUFF_ADJACENT', target: 'SELF', attack: atk, defense: def });

export const TRIBE_SKILL_CATALOG = {
  flame_lion: { add: [bc('lion_roar', '狮王战吼', '战吼：获得+3/+0', [selfBuff(3, 0)])] },
  flame_cat: { add: [tk('cat_pounce', '猎杀本能', '击杀后：获得+2/+1', [selfBuff(2, 1)])] },
  swift_leopard: { add: [bc('leopard_pounce', '疾扑', '战吼：对敌方前排造成6伤害', [{ type: 'DEAL_DAMAGE', target: 'FRONT_ENEMY', amount: 6 }])] },
  electric_wolf: { add: [aa('pack_hunter', '狼群本能', '友方野兽死亡：获得+1/+1', [selfBuff(1, 1)])] },
  poison_bee: { add: [dr('bee_sting', '毒刺遗愿', '亡语：对敌方最低生命造成8伤害', [{ type: 'DEAL_DAMAGE', target: 'LOWEST_HP_ENEMY', amount: 8 }])] },
  flash_fox: { add: [bc('fox_cunning', '狡狐', '战吼：获得闪避1回合', [{ type: 'APPLY_STATUS', target: 'SELF', status: 'DODGE', duration: 1, value: 0.35 }])] },
  wind_pigeon: { add: [dr('pigeon_swarm', '鸽群飞散', '亡语：召唤1/1飞禽', [summon('飞禽', 1, 1, 1, 'beast')])] },
  thunder_hawk: { add: [bc('hawk_dive', '俯冲', '战吼：获得+2/+2', [selfBuff(2, 2)])] },
  rock_bow_lizard: { add: [dr('lizard_tail', '断尾求生', '亡语：召唤2/1蜥蜴尾', [summon('蜥蜴尾', 2, 1, 1, 'beast')])] },
  flame_bird: { add: [dr('phoenix_ash', '灰烬复燃', '亡语：以1生命复生（每场一次）', [reborn()])] },
  heal_mushroom: { add: [aa('spore_cloud', '孢子云', '友方死亡：为全队最低生命+5', [healLow(5)])] },
  iron_hound: { add: [bc('hound_sniff', '猎犬嗅觉', '战吼：自身+1/+3', [selfBuff(1, 3)])] },
  spark_fox: { add: [tk('fox_feast', '猎食', '击杀后：相邻友方+1/+1', [adjBuff(1, 1)])] },
  water_arrow_frog: { add: [bc('frog_croak', '蛙鸣战吼', '战吼：所有鱼人+1/+0', [tribeBuff('murloc', 1, 0)])] },
  tide_guardian: { add: [bc('tide_wall', '潮汐壁垒', '战吼：获得12护盾', [shield(12)])] },
  coral_guard: { add: [dr('coral_burst', '珊瑚爆裂', '亡语：所有敌人受到3伤害', [dmgAll(3)])] },
  wind_arrow_bird: { add: [bc('cannon_fire', '舷炮齐射', '战吼：对敌方前排造成5伤害', [{ type: 'DEAL_DAMAGE', target: 'FRONT_ENEMY', amount: 5 }])] },
  storm_breaker: { add: [tk('plank_walk', '走跳板', '击杀后：所有海盗+1/+0', [tribeBuff('pirate', 1, 0)])] },
  wind_blade: { add: [bc('blade_duel', '决斗', '战吼：自身+4/+0', [selfBuff(4, 0)])] },
  dark_arrow: { add: [dr('bone_arrow', '骨箭', '亡语：对击杀者造成6伤害', [{ type: 'DEAL_DAMAGE', target: 'KILLER', amount: 6 }])] },
  shadow_stalker: { add: [bc('stalker_stealth', '潜影', '战吼：获得潜行1回合', [{ type: 'APPLY_STATUS', target: 'SELF', status: 'STEALTH', duration: 1, value: 0 }])] },
  abyss_horror: { add: [dr('horror_wail', '深渊哀嚎', '亡语：所有敌人-2攻（2回合）', [{ type: 'DEBUFF', target: 'ENEMY_ALL', stat: 'attack', value: 2, duration: 2 }])] },
  void_sovereign: { add: [ts('void_growth', '虚空吞噬', '回合开始：自身+2/+2', [selfBuff(2, 2)])] },
  warm_sprite: { add: [bc('sprite_spark', '火花', '战吼：对全体敌人造成4法术伤害', [dmgAll(4)])] },
  thunder_cloud: { add: [ts('cloud_burst', '雷云', '回合开始：随机敌人受到8伤害', [{ type: 'DEAL_DAMAGE', target: 'RANDOM_ENEMY', amount: 8 }])] },
  rain_butterfly: { add: [bc('rain_dance', '雨舞', '战吼：全队+0/+2', [teamBuff(0, 2)])] },
  flame_shaman: { add: [bc('flame_invoke', '唤焰', '战吼：所有元素+2/+0', [tribeBuff('elemental', 2, 0)])] },
  frost_mage: { add: [bc('frost_nova', '冰霜新星', '战吼：敌方前排冻结1回合', [{ type: 'APPLY_STATUS', target: 'FRONT_ENEMY', status: 'FREEZE', duration: 1, value: 0 }])] },
  inferno_colossus: { add: [dr('inferno_burst', '炼狱爆发', '亡语：对所有敌人造成10伤害', [dmgAll(10)])] },
  thunder_titan: { add: [bc('titan_roar', '泰坦咆哮', '战吼：所有龙族+3/+3', [tribeBuff('dragon', 3, 3)])] },
  phoenix_bow: { add: [tk('phoenix_shot', '凤焰箭', '击杀后：随机友方龙族+2/+2', [{ type: 'BUFF_TRIBE', target: 'RANDOM_TRIBE_ALLY', tribe: 'dragon', attack: 2, defense: 2 }])] },
  creator_god: { add: [bc('divine_wrath', '神怒', '战吼：敌方全体受到15伤害', [dmgAll(15)])] },
  rock_armor: { add: [bc('armor_up', '装甲升级', '战吼：获得嘲讽与8护盾', [taunt(), shield(8)])] },
  crystal_golem: { add: [dr('crystal_shatter', '水晶碎裂', '亡语：召唤1/2水晶碎片', [summon('水晶碎片', 1, 2, 2, 'mech')])] },
  volt_stalker: { add: [bc('volt_overload', '过载', '战吼：自身+0/+4并获得圣盾', [selfBuff(0, 4), { type: 'APPLY_STATUS', target: 'SELF', status: 'INVINCIBLE', duration: 1, value: 0 }])] },
  cactus: { add: [dr('cactus_spike', '仙人掌刺', '亡语：对击杀者造成8伤害', [{ type: 'DEAL_DAMAGE', target: 'KILLER', amount: 8 }])] },
  sand_scorpion: { add: [bc('scorpion_sting', '蝎刺', '战吼：敌方最低生命受到6伤害并中毒', [
    { type: 'DEAL_DAMAGE', target: 'LOWEST_HP_ENEMY', amount: 6 },
    { type: 'APPLY_STATUS', target: 'LOWEST_HP_ENEMY', status: 'POISON', duration: 2, value: 3 },
  ])] },
  stone_bulwark: { add: [bc('bulwark', '壁垒', '战吼：所有野猪人+0/+3', [tribeBuff('quilboar', 0, 3)])] },
  lava_turtle: { add: [aa('demon_feed', '恶魔进食', '友方死亡：自身+2/+2', [selfBuff(2, 2)])] },
  ember_knight: { add: [bc('ember_charge', '烬火冲锋', '战吼：自身+3/+0', [selfBuff(3, 0)])] },
  flame_dancer: { add: [tk('soul_drain', '灵魂汲取', '击杀后：恢复10生命', [{ type: 'HEAL', target: 'SELF', amount: 10 }])] },
  vine_snake: { add: [bc('naga_weave', '塑造', '战吼：相邻友方+2/+2', [adjBuff(2, 2)])] },
  thorn_assassin: { add: [bc('thorn_venom', '荆棘毒刃', '战吼：对敌方最低生命造成10伤害', [{ type: 'DEAL_DAMAGE', target: 'LOWEST_HP_ENEMY', amount: 10 }])] },
  holy_sheep: { add: [bc('blessing', '祝福', '战吼：全队+1/+1', [teamBuff(1, 1)])] },
  heal_star: { add: [bc('star_heal', '星愈', '战吼：治疗全队最低生命15点', [healLow(15)])] },
  flower_fairy: { add: [bc('fairy_charm', '花仙魅惑', '战吼：敌方前排眩晕1回合', [{ type: 'APPLY_STATUS', target: 'FRONT_ENEMY', status: 'STUN', duration: 1, value: 0 }])] },
  light_arrow_angel: { add: [bc('angel_smite', '天使惩戒', '战吼：对敌方全体造成6伤害', [dmgAll(6)])] },
  saint_unicorn: { add: [bc('unicorn_aura', '圣光光环', '战吼：全队获得8护盾', [{ type: 'SHIELD', target: 'TEAM_ALL', amount: 8 }])] },
  dawn_knight: { add: [bc('dawn_guard', '晨曦守护', '战吼：获得嘲讽', [taunt()])] },
  light_acolyte: { add: [dr('acolyte_light', '侍者之光', '亡语：为全队最低生命+8', [healLow(8)])] },
  solar_crusader: { add: [bc('crusade', '远征', '战吼：自身+2/+4', [selfBuff(2, 4)])] },
  bloom_singer: { add: [ts('encore', '安可', '回合开始：全队+1/+1', [teamBuff(1, 1)])] },
};

export function buildSkillPatches(corePatches) {
  const merged = { ...TRIBE_SKILL_CATALOG };
  for (const [id, patch] of Object.entries(corePatches)) {
    if (patch.replace) {
      merged[id] = patch;
    } else if (merged[id]) {
      merged[id] = { add: [...(merged[id].add || []), ...(patch.add || [])] };
    } else {
      merged[id] = patch;
    }
  }
  return merged;
}
