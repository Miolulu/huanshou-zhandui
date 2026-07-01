/**
 * 净化秘典技法 · AI 生图提示词（幻兽战队世界观）
 * 建议尺寸：512×384 或 768×512，横版插画，用于卡牌上半区
 * 统一后缀可追加：--ar 3:2 --style raw
 */

export const CARD_ART_STYLE_SUFFIX =
  'fantasy trading card art, polluted fantasy beast world, purifier light vs corruption purple mist, '
  + 'high detail illustration, soft rim light, no text, no watermark, no border, '
  + 'Chinese xianxia meets creature companion aesthetic';

export const CARD_ART_PROMPTS = {
  purify_strike: {
    name: '净化冲击',
    prompt:
      'A young beast tamer channeling a burst of golden purification energy from an open palm, '
      + 'shattering dark purple corruption shards around a shadowy monster silhouette, '
      + 'dynamic action pose, holy white-gold particles, teal forest background',
  },
  holy_barrier: {
    name: '圣光护幕',
    prompt:
      'Translucent dome of holy light protecting a beast tamer and small spirit fox companion, '
      + 'soft white-gold barrier hex pattern, corruption tendrils bouncing off, serene defensive stance',
  },
  beast_pact: {
    name: '契约占位',
    prompt:
      'Beast tamer and fire wolf phantom merging power through a glowing contract sigil, '
      + 'flame and purification light intertwining, pact runes floating, dramatic mid-battle scene',
  },
  flame_purify: {
    name: '净炎爪',
    prompt:
      'Fiery spectral claw slash purifying a corrupted mushroom creature, '
      + 'orange-red flames turning purple taint into white sparks, close combat energy trail',
  },
  ice_shell: {
    name: '冰晶护幕',
    prompt:
      'Crystalline ice barrier forming around a calm beast tamer, frost facets reflecting teal light, '
      + 'frozen corruption particles falling, defensive ice magic, cold blue palette',
  },
  vine_lash: {
    name: '藤缚净化',
    prompt:
      'Living green vines with golden tips binding a writhing corrupted beast, '
      + 'nature purification magic, forest spirits, dual whip motion blur',
  },
  thunder_purify: {
    name: '雷罚',
    prompt:
      'Lightning bolt striking down on a corrupted wolf beast, electric yellow-purple contrast, '
      + 'purifier staff raised to sky, storm over polluted wasteland, epic scale',
  },
  heal_bloom: {
    name: '灵泉复苏',
    prompt:
      'Spirit spring blooming under beast tamer feet, healing light restoring mind energy, '
      + 'lotus and teal water glow, gentle recovery moment amid dark corruption',
  },
  iron_aegis: {
    name: '大地庇护',
    prompt:
      'Earth elemental shield of stone and roots rising around protector, golden runes on rock surface, '
      + 'corruption waves crashing against earthen wall, brown-green palette',
  },
  wind_cut: {
    name: '风刃',
    prompt:
      'Swift wind blades cutting through purple fog, beast tamer in agile pose, '
      + 'feather and leaf vortex, cyan-white energy arcs, minimal motion lines',
  },
  meditate: {
    name: '凝神',
    prompt:
      'Beast tamer meditating floating cards of light around them, eyes closed, '
      + 'spiritual energy connecting to codex pages, calm teal aura in corrupted cave',
  },
  twin_purify: {
    name: '连击净化',
    prompt:
      'Double palm strike sending twin purification shockwaves, mirrored golden arcs, '
      + 'corrupted slime beast recoiling, fast combo attack illustration',
  },
  life_drain: {
    name: '生命回流',
    prompt:
      'Dark-purple corruption drained from enemy flowing back as green healing light to tamer, '
      + 'life energy exchange spiral, moral ambiguity, crimson and teal contrast',
  },
  barrier: {
    name: '常驻护幕',
    prompt:
      'Permanent glowing ward sigil orbiting beast tamer like a satellite, '
      + 'persistent holy barrier rune, codex page unfurling with ancient script, power card art',
  },
  rage: {
    name: '净化之怒',
    prompt:
      'Beast tamer eyes blazing gold with purification rage aura, companion beasts roaring, '
      + 'rising power buff effect, flames of righteous anger, intense portrait composition',
  },
  heavy_purify: {
    name: '重锤净化',
    prompt:
      'Massive hammer of condensed purification light smashing corrupted turtle shell, '
      + 'heavy impact crater, debris of purple taint, slow powerful attack moment',
  },
  quick_guard: {
    name: '瞬步护幕',
    prompt:
      'Beast tamer afterimage leaving quick defensive light trail, instant barrier flash, '
      + 'speed lines, agile dodge and shield in one motion, wind and light streaks',
  },
  poison_fang: {
    name: '以毒攻毒',
    prompt:
      'Venomous purple fang technique turning corruption against itself, toxic green-purple swirl, '
      + 'corrupted crab beast, risky alchemy purification, dark skill aesthetic',
  },
};

/** 敌人立绘提示词（怪物手册 / 战斗大图） */
export const ENEMY_ART_PROMPTS = {
  corrupted_mushroom: 'Cute healing mushroom turned corrupted, purple spore cloud, sad eyes, fantasy creature, full body, white background',
  corrupted_wolf: 'Electric wolf beast corrupted, crackling purple lightning fur, aggressive stance, polluted wilderness',
  corrupted_turtle: 'Lava turtle with magma shell cracks, purple corruption veins, slow heavy boss feel',
  corrupted_cat: 'Shadow flame cat companion turned hostile, black fire tail, tragic fallen partner aesthetic',
  corrupted_crab: 'Ice armored crab with ancient grudge aura, thick shell, elite monster illustration',
  corrupted_shadow: 'Ethereal shadow wind cat, debuff mist, creepy elite encounter, dark purple silhouette',
  boss_dragon: 'Ancient sky dragon corrupted at pollution source, massive wings, 100-layer dungeon final boss, epic scale',
};
