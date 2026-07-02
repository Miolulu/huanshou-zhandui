/** 像素美术资源路径（由 scripts/slice-art.mjs 生成） */

/** 素材版本：抠图/换图后递增，避免浏览器缓存旧 PNG */
export const ASSET_VER = '20260726';

export const INTENT_ICONS = {
  damage: 'assets/intents/damage.png',
  block: 'assets/intents/block.png',
  buff: 'assets/intents/buff.png',
  debuff: 'assets/intents/debuff.png',
  unknown: 'assets/intents/unknown.png',
};

export const ELEMENT_ICONS = {
  light: 'assets/elements/light.png',
  fire: 'assets/elements/fire.png',
  water: 'assets/elements/water.png',
  grass: 'assets/elements/grass.png',
  electric: 'assets/elements/electric.png',
  earth: 'assets/elements/earth.png',
  wind: 'assets/elements/wind.png',
  dark: 'assets/elements/dark.png',
  neutral: 'assets/elements/neutral.png',
};

const ATTACK_FX = {
  light: 'assets/fx/attack_light.png',
  fire: 'assets/fx/attack_fire.png',
  water: 'assets/fx/attack_water.png',
  grass: 'assets/fx/attack_grass.png',
  electric: 'assets/fx/attack_electric.png',
  earth: 'assets/fx/attack_earth.png',
  wind: 'assets/fx/attack_wind.png',
  dark: 'assets/fx/attack_dark.png',
  neutral: 'assets/fx/attack_slash.png',
  slash: 'assets/fx/attack_slash.png',
};

function withVer(path) {
  return path ? `${path}?v=${ASSET_VER}` : null;
}

export const CARD_ART = {
  purify_strike: 'assets/cards/purify_strike.png',
  holy_barrier: 'assets/cards/holy_barrier.png',
  beast_pact: 'assets/cards/beast_pact.png',
  flame_purify: 'assets/cards/flame_purify.png',
  thunder_purify: 'assets/cards/thunder_purify.png',
  vine_lash: 'assets/cards/vine_lash.png',
  twin_purify: 'assets/cards/twin_purify.png',
  life_drain: 'assets/cards/life_drain.png',
  heavy_purify: 'assets/cards/heavy_purify.png',
  poison_fang: 'assets/cards/poison_fang.png',
  wind_cut: 'assets/cards/wind_cut.png',
  ice_shell: 'assets/cards/ice_shell.png',
  heal_bloom: 'assets/cards/heal_bloom.png',
  iron_aegis: 'assets/cards/iron_aegis.png',
  meditate: 'assets/cards/meditate.png',
  quick_guard: 'assets/cards/quick_guard.png',
  barrier: 'assets/cards/barrier.png',
  rage: 'assets/cards/rage.png',
};

export const ENEMY_SPRITES = {
  corrupted_mushroom: 'assets/enemies/corrupted_mushroom.png',
  corrupted_wolf: 'assets/enemies/corrupted_wolf.png',
  corrupted_turtle: 'assets/enemies/corrupted_turtle.png',
  corrupted_cat: 'assets/enemies/corrupted_cat.png',
  corrupted_crab: 'assets/enemies/corrupted_crab.png',
  corrupted_shadow: 'assets/enemies/corrupted_shadow.png',
  boss_dragon: 'assets/enemies/boss_dragon.png',
};

export const PLAYER_SPRITE = 'assets/player/purifier_battle.png';
export const PLAYER_PORTRAIT = 'assets/player/purifier_portrait.png';

export const SCENE_BACKGROUNDS = [
  'assets/scenes/scene-0.jpg',
  'assets/scenes/scene-1.jpg',
  'assets/scenes/scene-2.jpg',
  'assets/scenes/scene-3.jpg',
  'assets/scenes/scene-4.jpg',
];

export const MAIN_BACKGROUND = 'assets/scenes/main-bg.jpg';

export function cardArtUrl(cardId) {
  return withVer(CARD_ART[cardId] || null);
}

export function enemySpriteUrl(enemyId) {
  return withVer(ENEMY_SPRITES[enemyId] || null);
}

export function playerSpriteUrl() {
  return withVer(PLAYER_SPRITE);
}

export function playerPortraitUrl() {
  return withVer(PLAYER_PORTRAIT);
}

export function sceneBackgroundUrl(index) {
  const i = Math.max(0, Math.min(SCENE_BACKGROUNDS.length - 1, index));
  return withVer(SCENE_BACKGROUNDS[i]);
}

export function mainBackgroundUrl() {
  return withVer(MAIN_BACKGROUND);
}

export function intentIconUrl(name) {
  return withVer(INTENT_ICONS[name] || INTENT_ICONS.unknown);
}

export function elementIconUrl(element) {
  return withVer(ELEMENT_ICONS[element] || ELEMENT_ICONS.neutral);
}

export function attackFxUrl(element) {
  return withVer(ATTACK_FX[element] || ATTACK_FX.neutral);
}

const STATUS_ICONS = {
  strength: 'assets/status/strength.png',
  vulnerable: 'assets/status/vulnerable.png',
  poison: 'assets/status/poison.png',
  weak: 'assets/status/weak.png',
  block: 'assets/status/block.png',
};

const CARD_VFX = {
  purify_strike_double: 'assets/fx/purify_strike_double.png',
  purify_strike_triple: 'assets/fx/purify_strike_triple.png',
};

const DEFEAT_FX = {
  corrupted_mushroom: 'assets/fx/defeat_corrupted_mushroom.png',
  corrupted_wolf: 'assets/fx/defeat_corrupted_wolf.png',
  corrupted_turtle: 'assets/fx/defeat_corrupted_turtle.png',
  corrupted_cat: 'assets/fx/defeat_corrupted_cat.png',
  corrupted_crab: 'assets/fx/defeat_corrupted_crab.png',
  corrupted_shadow: 'assets/fx/defeat_corrupted_shadow.png',
  boss_dragon: 'assets/fx/defeat_boss_dragon.png',
};

export function statusIconUrl(name) {
  return withVer(STATUS_ICONS[name] || STATUS_ICONS.strength);
}

export function cardVfxUrl(variant) {
  return withVer(CARD_VFX[variant] || null);
}

export function defeatFxUrl(enemyId) {
  return withVer(DEFEAT_FX[enemyId] || DEFEAT_FX.corrupted_shadow);
}
