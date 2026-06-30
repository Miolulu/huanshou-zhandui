/**
 * 幻兽战队 — 核心生态流派技能（出战技 / 倒下技 / 连携）
 */
import { buildSkillPatches } from './tribeSkillCatalog.js';

const LEAPFROG_SKILL = {
  id: 'spirit_relay',
  name: '灵性接力',
  trigger: 'ON_DEATH',
  target: 'SELF',
  description: '倒下技：使一名丛林族同伴+2/+2，并继承此倒下技',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'LEAPFROG_DR', target: 'RANDOM_TRIBE_ALLY', tribe: 'beast', attack: 2, defense: 2 }],
};

const MACAW_SKILL = {
  id: 'swift_echo',
  name: '迅翼回响',
  trigger: 'AFTER_ATTACK',
  target: 'SELF',
  description: '攻击后：触发一名同伴的随机倒下技',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'TRIGGER_ALLY_DEATHRATTLE', target: 'RANDOM_ALLY' }],
};

const BARON_AURA = {
  id: 'echo_core',
  name: '回响核心',
  trigger: 'BATTLE_START',
  target: 'SELF',
  description: '你的倒下技触发两次',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'AURA_DOUBLE_DEATHRATTLE', target: 'SELF' }],
};

const MAMA_BEAR_SKILL = {
  id: 'mama_bear',
  name: '族群之怒',
  trigger: 'ON_ALLY_DEATH',
  target: 'SELF',
  description: '丛林族同伴倒下时：自身+2/+2',
  cooldown: 0,
  condition: { tribe: 'beast' },
  effects: [{ type: 'STAT_BUFF', target: 'SELF', attack: 2, defense: 2 }],
};

const PIRATE_GOLD_SKILL = {
  id: 'wave_bounty',
  name: '浪锋赏励',
  trigger: 'ON_KILL',
  target: 'SELF',
  description: '击倒后：全队+1攻（巡浪族赏励）',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'STAT_BUFF', target: 'TEAM_ALL', attack: 1, defense: 0 }],
};

const UNDEAD_REBORN = {
  id: 'shed_shell',
  name: '蜕生残壳',
  trigger: 'ON_DEATH',
  target: 'SELF',
  description: '倒下技：以1点生命蜕生（每场一次）',
  cooldown: 0,
  condition: null,
  oncePerBattle: true,
  effects: [{ type: 'REBORN', target: 'SELF', hp: 1 }],
};

const QUILBOAR_GEM = {
  id: 'growth_mark',
  name: '成长印记',
  trigger: 'BATTLE_START',
  target: 'TEAM_ALL',
  description: '出战技：所有硬角族+1/+2',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe: 'quilboar', attack: 1, defense: 2 }],
};

const MECH_SHIELD = {
  id: 'mech_aegis',
  name: '护体协议',
  trigger: 'BATTLE_START',
  target: 'SELF',
  description: '出战技：获得护体（抵挡一次伤害）',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'APPLY_STATUS', target: 'SELF', status: 'INVINCIBLE', duration: 1, value: 0 }],
};

const DRAGON_SCALE = {
  id: 'sky_growth',
  name: '天鳞成长',
  trigger: 'TURN_START',
  target: 'TEAM_ALL',
  description: '回合技：所有天翔族+2/+2',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe: 'dragon', attack: 2, defense: 2 }],
};

const MURLOC_SWARM = {
  id: 'tide_rally',
  name: '潮汐集结',
  trigger: 'BATTLE_START',
  target: 'TEAM_ALL',
  description: '出战技：所有潮汐族+1/+1',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe: 'murloc', attack: 1, defense: 1 }],
};

const SUMMON_RAT = {
  id: 'split_spawn',
  name: '分裂幼体',
  trigger: 'ON_DEATH',
  target: 'SELF',
  description: '倒下技：召唤两只1/1丛林幼体',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'SUMMON_TOKEN', target: 'SELF', name: '丛林幼体', attack: 1, defense: 1, hp: 1, tribe: 'beast', count: 2 }],
};

const PIRATE_BOUNTY = {
  id: 'wave_rally',
  name: '浪锋集结',
  trigger: 'BATTLE_START',
  target: 'TEAM_ALL',
  description: '出战技：所有巡浪族+2/+0',
  cooldown: 0,
  condition: null,
  effects: [{ type: 'BUFF_TRIBE', target: 'TEAM_ALL', tribe: 'pirate', attack: 2, defense: 0 }],
};

const CORE_TRIBE_PATCHES = {
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

export const TRIBE_SKILL_PATCHES = buildSkillPatches(CORE_TRIBE_PATCHES);

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
