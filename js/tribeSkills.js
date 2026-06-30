/**
 * 炉石酒馆式流派核心技能覆盖
 * 玩家自行研究搭配，无羁绊条加成
 */

const LEAPFROG_SKILL = {
  id: 'leapfrog_dr',
  name: '跳蛙传承',
  trigger: 'ON_DEATH',
  target: 'SELF',
  description: '亡语：使一个友方野兽获得+2/+2，并继承此亡语',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'LEAPFROG_DR', target: 'RANDOM_TRIBE_ALLY', tribe: 'beast', attack: 2, defense: 2 }],
};

const MACAW_SKILL = {
  id: 'macaw_attack',
  name: '巨喙连击',
  trigger: 'AFTER_ATTACK',
  target: 'SELF',
  description: '攻击后：触发一个友方随机亡语',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'TRIGGER_ALLY_DEATHRATTLE', target: 'RANDOM_ALLY' }],
};

const BARON_AURA = {
  id: 'baron_aura',
  name: '亡语领主',
  trigger: 'BATTLE_START',
  target: 'SELF',
  description: '你的亡语触发两次',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'AURA_DOUBLE_DEATHRATTLE', target: 'SELF' }],
};

const MAMA_BEAR_SKILL = {
  id: 'mama_bear',
  name: '母熊之怒',
  trigger: 'ON_ALLY_DEATH',
  target: 'SELF',
  description: '每当一个友方野兽死亡，获得+2/+2',
  cooldown: 0,
  condition: { tribe: 'beast' },
  effects: [{ type: 'STAT_BUFF', target: 'SELF', attack: 2, defense: 2 }],
};

const PIRATE_GOLD_SKILL = {
  id: 'pirate_plunder',
  name: '海上掠夺',
  trigger: 'ON_KILL',
  target: 'SELF',
  description: '击杀后：本回合下次购买减1金（战斗内展示为全队+1攻）',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'STAT_BUFF', target: 'TEAM_ALL', attack: 1, defense: 0 }],
};

const UNDEAD_REBORN = {
  id: 'undead_reborn',
  name: '复生',
  trigger: 'ON_DEATH',
  target: 'SELF',
  description: '亡语：以1点生命复生（每场一次）',
  cooldown: 0,
  condition: null,
  oncePerBattle: true,
  effects: [{ type: 'REBORN', target: 'SELF', hp: 1 }],
};

const QUILBOAR_GEM = {
  id: 'blood_gem',
  name: '血宝石',
  trigger: 'BATTLE_START',
  target: 'TEAM_ALL',
  description: '战斗开始：所有友方野猪人+1/+2',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe: 'quilboar', attack: 1, defense: 2 }],
};

const MECH_SHIELD = {
  id: 'mech_divine',
  name: '圣盾协议',
  trigger: 'BATTLE_START',
  target: 'SELF',
  description: '战斗开始：获得圣盾（抵挡一次伤害）',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'APPLY_STATUS', target: 'SELF', status: 'INVINCIBLE', duration: 1, value: 0 }],
};

const DRAGON_SCALE = {
  id: 'dragon_end_turn',
  name: '龙鳞成长',
  trigger: 'TURN_START',
  target: 'TEAM_ALL',
  description: '回合开始：所有友方龙族+2/+2',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe: 'dragon', attack: 2, defense: 2 }],
};

const MURLOC_SWARM = {
  id: 'murloc_war_cry',
  name: '鱼人集结',
  trigger: 'BATTLE_START',
  target: 'TEAM_ALL',
  description: '战斗开始：所有友方鱼人+1/+1',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe: 'murloc', attack: 1, defense: 1 }],
};

const SUMMON_RAT = {
  id: 'rat_pack',
  name: '鼠群涌现',
  trigger: 'ON_DEATH',
  target: 'SELF',
  description: '亡语：召唤两只1/1野兽衍生物',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'SUMMON_TOKEN', target: 'SELF', name: '鼠群', attack: 1, defense: 1, hp: 1, tribe: 'beast', count: 2 }],
};

const PIRATE_BOUNTY = {
  id: 'proud_privateer',
  name: '骄傲私掠',
  trigger: 'BATTLE_START',
  target: 'TEAM_ALL',
  description: '战斗开始：所有友方海盗+2/+0',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe: 'pirate', attack: 2, defense: 0 }],
};

/** templateId → 追加/替换的核心流派技能 */
export const TRIBE_SKILL_PATCHES = {
  charge_rabbit: { replace: true, skills: [LEAPFROG_SKILL, SUMMON_RAT] },
  storm_eagle: { replace: false, add: [MACAW_SKILL] },
  dark_lord: { replace: false, add: [BARON_AURA] },
  nut_bear: { replace: false, add: [MAMA_BEAR_SKILL] },
  wave_shark: { replace: false, add: [PIRATE_BOUNTY, PIRATE_GOLD_SKILL] },
  shadow_wind_cat: { replace: false, add: [UNDEAD_REBORN] },
  vine_shaman: { replace: false, add: [QUILBOAR_GEM] },
  thunder_beetle: { replace: false, add: [MECH_SHIELD] },
  ice_dragon: { replace: false, add: [DRAGON_SCALE] },
  sky_dragon: { replace: false, add: [DRAGON_SCALE] },
  ice_crab: { replace: false, add: [MURLOC_SWARM] },
  frost_fish: { replace: false, add: [MURLOC_SWARM] },
  brute_bull: { replace: false, add: [QUILBOAR_GEM] },
  storm_ranger: { replace: false, add: [PIRATE_BOUNTY] },
  leaf_wolf: { replace: false, add: [SUMMON_RAT] },
};

export function applyTribeSkillPatch(templateId, skills) {
  const patch = TRIBE_SKILL_PATCHES[templateId];
  if (!patch) return skills;
  if (patch.replace) return patch.skills.map((s) => ({ ...s, effects: s.effects.map((e) => ({ ...e })) }));
  const list = skills.map((s) => ({ ...s, effects: s.effects.map((e) => ({ ...e })) }));
  if (patch.add?.length) {
    for (const sk of patch.add) {
      list.push({ ...sk, effects: sk.effects.map((e) => ({ ...e })) });
    }
  }
  return list;
}
