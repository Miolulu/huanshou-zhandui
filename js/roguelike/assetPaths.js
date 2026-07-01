/** 像素美术资源路径（由 scripts/slice-art.mjs 生成） */

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
  'assets/scenes/scene-0.png',
  'assets/scenes/scene-1.png',
  'assets/scenes/scene-2.png',
  'assets/scenes/scene-3.png',
  'assets/scenes/scene-4.png',
  'assets/scenes/scene-5.png',
];

export const MAIN_BACKGROUND = 'assets/scenes/main-bg.png';

export function cardArtUrl(cardId) {
  return CARD_ART[cardId] || null;
}

export function enemySpriteUrl(enemyId) {
  return ENEMY_SPRITES[enemyId] || null;
}

export function sceneBackgroundUrl(index) {
  const i = Math.max(0, Math.min(SCENE_BACKGROUNDS.length - 1, index));
  return SCENE_BACKGROUNDS[i];
}

export function mainBackgroundUrl() {
  return MAIN_BACKGROUND;
}
