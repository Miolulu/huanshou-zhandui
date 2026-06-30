/** 卡牌 → 种族映射（炉石酒馆式划分，非羁绊） */

export const CARD_TRIBE_MAP = {
  // —— 野兽 ——
  flame_lion: 'beast', flame_cat: 'beast', nut_bear: 'beast', leaf_wolf: 'beast',
  charge_rabbit: 'beast', swift_leopard: 'beast', electric_wolf: 'beast',
  poison_bee: 'beast', flash_fox: 'beast', wind_pigeon: 'beast', storm_eagle: 'beast',
  thunder_hawk: 'beast', rock_bow_lizard: 'beast', flame_bird: 'beast',
  heal_mushroom: 'beast', iron_hound: 'beast', spark_fox: 'beast',

  // —— 鱼人 ——
  ice_crab: 'murloc', frost_fish: 'murloc', water_arrow_frog: 'murloc',
  tide_guardian: 'murloc', coral_guard: 'murloc',

  // —— 海盗 ——
  wave_shark: 'pirate', wind_arrow_bird: 'pirate', storm_ranger: 'pirate',
  storm_breaker: 'pirate', wind_blade: 'pirate',

  // —— 亡灵 ——
  shadow_wind_cat: 'undead', dark_arrow: 'undead', dark_lord: 'undead',
  shadow_stalker: 'undead', abyss_horror: 'undead', void_sovereign: 'undead',

  // —— 元素 ——
  warm_sprite: 'elemental', thunder_cloud: 'elemental', rain_butterfly: 'elemental',
  flame_shaman: 'elemental', frost_mage: 'elemental', inferno_colossus: 'elemental',

  // —— 龙族 ——
  ice_dragon: 'dragon', sky_dragon: 'dragon', thunder_titan: 'dragon',
  phoenix_bow: 'dragon', creator_god: 'dragon',

  // —— 机械 ——
  thunder_beetle: 'mech', rock_armor: 'mech', crystal_golem: 'mech',
  volt_stalker: 'mech',

  // —— 野猪人 ——
  brute_bull: 'quilboar', cactus: 'quilboar', sand_scorpion: 'quilboar',
  vine_shaman: 'quilboar', stone_bulwark: 'quilboar',

  // —— 恶魔 ——
  lava_turtle: 'demon', ember_knight: 'demon', flame_dancer: 'demon',

  // —— 纳迦 ——
  vine_snake: 'naga', thorn_assassin: 'naga',

  // —— 中立 ——
  holy_sheep: 'neutral', heal_star: 'neutral', flower_fairy: 'neutral',
  light_arrow_angel: 'neutral', saint_unicorn: 'neutral', dawn_knight: 'neutral',
  light_acolyte: 'neutral', solar_crusader: 'neutral', bloom_singer: 'neutral',
};

export function resolveCardTribe(templateId, element, cardClass) {
  if (CARD_TRIBE_MAP[templateId]) return CARD_TRIBE_MAP[templateId];
  if (['fish', 'crab', 'frog', 'shark'].some((k) => templateId.includes(k))) return 'murloc';
  if (element === 'dark') return 'undead';
  if (element === 'electric') return 'mech';
  if (element === 'earth') return 'quilboar';
  if (element === 'wind' && cardClass === 'archer') return 'pirate';
  if (element === 'fire' && cardClass === 'warrior') return 'demon';
  return 'beast';
}
