export const CARD_TEMPLATES = [
  {
    "id": "lava_turtle",
    "name": "熔岩龟",
    "element": "fire",
    "class": "tank",
    "rarity": "common",
    "description": "沉睡火山深处的古老龟兽，背壳由熔岩凝固而成",
    "baseHp": 55,
    "baseAttack": 4,
    "baseSpeed": 5,
    "baseDefense": 6,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "lava_turtle_s1",
        "name": "熔岩护盾",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "战斗开始获得15护盾",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "SELF",
            "amount": 15
          }
        ]
      },
      {
        "id": "lava_turtle_s2",
        "name": "铁壁嘲讽",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "战斗开始获得2回合嘲讽",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "APPLY_STATUS",
            "target": "SELF",
            "status": "TAUNT",
            "duration": 2,
            "value": 0
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "lava_turtle_s1",
      "shieldBonus": 10,
      "tauntBonus": 1,
      "desc": "护盾25点，嘲讽3回合 ★3"
    }
  },
  {
    "id": "flame_lion",
    "name": "烈焰狮",
    "element": "fire",
    "class": "warrior",
    "rarity": "common",
    "description": "火焰草原上的百兽之王，鬃毛如同燃烧的火焰",
    "baseHp": 38,
    "baseAttack": 9,
    "baseSpeed": 10,
    "baseDefense": 2,
    "baseCritRate": 0.08,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "flame_lion_s1",
        "name": "烈焰爪击",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "15点火伤+灼烧",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 15,
            "damageType": "fire"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "BURN",
            "duration": 2,
            "value": 5
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "flame_lion_s1",
      "burnValue": 3,
      "desc": "灼烧8伤/回合 ★3"
    }
  },
  {
    "id": "flame_cat",
    "name": "焰影猫",
    "element": "fire",
    "class": "assassin",
    "rarity": "common",
    "description": "潜伏于火焰阴影中的灵巧猫兽",
    "baseHp": 25,
    "baseAttack": 10,
    "baseSpeed": 16,
    "baseDefense": 1,
    "baseCritRate": 0.15,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "flame_cat_s1",
        "name": "火焰突袭",
        "trigger": "BEFORE_ATTACK",
        "target": "LOWEST_HP_ENEMY",
        "description": "对低血敌18点火伤",
        "cooldown": 2,
        "condition": "lowHp50",
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "LOWEST_HP_ENEMY",
            "amount": 18,
            "damageType": "fire"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "flame_cat_s1",
      "damageBonus": 7,
      "desc": "25点火伤，击杀+3攻 ★3",
      "addSkills": [
        {
          "id": "flame_cat_kill",
          "name": "猎焰",
          "trigger": "ON_KILL",
          "target": "SELF",
          "description": "击杀后永久+3攻击",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "BUFF",
              "target": "SELF",
              "stat": "attack",
              "value": 3,
              "duration": 99
            }
          ]
        }
      ]
    }
  },
  {
    "id": "ice_crab",
    "name": "冰甲蟹",
    "element": "water",
    "class": "tank",
    "rarity": "common",
    "description": "冰海深处的甲壳幻兽，甲壳坚不可摧",
    "baseHp": 50,
    "baseAttack": 5,
    "baseSpeed": 6,
    "baseDefense": 5,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "ice_crab_s1",
        "name": "冰霜护甲",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "10护盾+2防",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "SELF",
            "amount": 10
          },
          {
            "type": "BUFF",
            "target": "SELF",
            "stat": "defense",
            "value": 2,
            "duration": 2
          }
        ]
      },
      {
        "id": "ice_crab_s2",
        "name": "冰冻反击",
        "trigger": "ON_HIT",
        "target": "ATTACKER",
        "description": "被攻击时冰冻并反击10伤",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "APPLY_STATUS",
            "target": "ATTACKER",
            "status": "FREEZE",
            "duration": 1,
            "value": 0
          },
          {
            "type": "DEAL_DAMAGE",
            "target": "ATTACKER",
            "amount": 5,
            "damageType": "water"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "ice_crab_s2",
      "secondSkillId": "ice_crab_s2",
      "damageBonus": 5,
      "desc": "80%冰冻+反击10伤 ★3",
      "secondAddEffects": [
        {
          "type": "DEAL_DAMAGE",
          "target": "ATTACKER",
          "amount": 5,
          "damageType": "water"
        }
      ]
    }
  },
  {
    "id": "wave_shark",
    "name": "巨浪鲨",
    "element": "water",
    "class": "warrior",
    "rarity": "common",
    "description": "深海中的凶猛猎手，浪潮是它的武器",
    "baseHp": 40,
    "baseAttack": 8,
    "baseSpeed": 9,
    "baseDefense": 3,
    "baseCritRate": 0.06,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "wave_shark_s1",
        "name": "海浪冲击",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "12点水伤+降防",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 12,
            "damageType": "water"
          },
          {
            "type": "DEBUFF",
            "target": "FRONT_ENEMY",
            "stat": "defense",
            "value": 2,
            "duration": 2
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "wave_shark_s1",
      "damageBonus": 6,
      "debuffBonus": 1,
      "desc": "18水伤，降防3点 ★3"
    }
  },
  {
    "id": "rain_butterfly",
    "name": "雨云蝶",
    "element": "water",
    "class": "support",
    "rarity": "common",
    "description": "由雨云凝聚而成的蝴蝶精灵",
    "baseHp": 28,
    "baseAttack": 4,
    "baseSpeed": 11,
    "baseDefense": 2,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "rain_butterfly_s1",
        "name": "雨露滋润",
        "trigger": "TURN_START",
        "target": "LOWEST_HP_ALLY",
        "description": "恢复10生命",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "LOWEST_HP_ALLY",
            "amount": 10
          }
        ]
      },
      {
        "id": "rain_butterfly_s2",
        "name": "云雨之护",
        "trigger": "BATTLE_START",
        "target": "ALL_ALLIES",
        "description": "全体5护盾",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "ALL_ALLIES",
            "amount": 5
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "rain_butterfly_s1",
      "healBonus": 5,
      "desc": "恢复15生命+2防2回合 ★3",
      "addEffects": [
        {
          "type": "BUFF",
          "target": "LOWEST_HP_ALLY",
          "stat": "defense",
          "value": 2,
          "duration": 2
        }
      ]
    }
  },
  {
    "id": "nut_bear",
    "name": "坚果熊",
    "element": "grass",
    "class": "tank",
    "rarity": "common",
    "description": "森林中的守护者，坚果壳是最可靠的盾牌",
    "baseHp": 52,
    "baseAttack": 5,
    "baseSpeed": 5,
    "baseDefense": 5,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "nut_bear_s1",
        "name": "坚果壳盾",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "12护盾+反击",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "SELF",
            "amount": 12
          },
          {
            "type": "APPLY_STATUS",
            "target": "SELF",
            "status": "COUNTER",
            "duration": 99,
            "value": 3
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "nut_bear_s1",
      "shieldBonus": 8,
      "statusValueBonus": 2,
      "desc": "20护盾，反击5伤 ★3"
    }
  },
  {
    "id": "leaf_wolf",
    "name": "叶刃狼",
    "element": "grass",
    "class": "warrior",
    "rarity": "common",
    "description": "叶刃般锋利的爪子，森林中的掠食者",
    "baseHp": 36,
    "baseAttack": 9,
    "baseSpeed": 11,
    "baseDefense": 2,
    "baseCritRate": 0.08,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "leaf_wolf_s1",
        "name": "叶刃斩",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "15草伤+中毒",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 15,
            "damageType": "grass"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "POISON",
            "duration": 3,
            "value": 4
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "leaf_wolf_s1",
      "damageBonus": 5,
      "statusValueBonus": 2,
      "desc": "20草伤，中毒6伤 ★3"
    }
  },
  {
    "id": "heal_mushroom",
    "name": "治愈蘑菇",
    "element": "grass",
    "class": "support",
    "rarity": "common",
    "description": "散发着神秘治愈光芒的蘑菇",
    "baseHp": 26,
    "baseAttack": 3,
    "baseSpeed": 8,
    "baseDefense": 2,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "heal_mushroom_s1",
        "name": "孢子治愈",
        "trigger": "TURN_START",
        "target": "ALL_ALLIES",
        "description": "全体恢复6",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "ALL_ALLIES",
            "amount": 6
          }
        ]
      },
      {
        "id": "heal_mushroom_s2",
        "name": "毒孢子",
        "trigger": "AFTER_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "前排中毒",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "POISON",
            "duration": 2,
            "value": 3
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "heal_mushroom_s1",
      "healBonus": 4,
      "desc": "恢复10+全体+2攻2回合 ★3",
      "addEffects": [
        {
          "type": "BUFF",
          "target": "ALL_ALLIES",
          "stat": "attack",
          "value": 2,
          "duration": 2
        }
      ]
    }
  },
  {
    "id": "thunder_beetle",
    "name": "雷甲虫",
    "element": "electric",
    "class": "tank",
    "rarity": "common",
    "description": "甲壳上跳跃着静电的甲虫",
    "baseHp": 48,
    "baseAttack": 6,
    "baseSpeed": 7,
    "baseDefense": 4,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "thunder_beetle_s1",
        "name": "静电护甲",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "10护盾",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "SELF",
            "amount": 10
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "thunder_beetle_s1",
      "shieldBonus": 8,
      "desc": "18护盾，受击50%麻痹 ★3",
      "addSkills": [
        {
          "id": "thunder_beetle_evo",
          "name": "静电反制",
          "trigger": "ON_HIT",
          "target": "ATTACKER",
          "description": "50%麻痹攻击者",
          "cooldown": 0,
          "condition": "chance50",
          "effects": [
            {
              "type": "APPLY_STATUS",
              "target": "ATTACKER",
              "status": "PARALYZE",
              "duration": 1,
              "value": 0
            }
          ]
        }
      ]
    }
  },
  {
    "id": "electric_wolf",
    "name": "电狼",
    "element": "electric",
    "class": "warrior",
    "rarity": "common",
    "description": "在闪电中诞生的狼，速度极快",
    "baseHp": 38,
    "baseAttack": 9,
    "baseSpeed": 13,
    "baseDefense": 2,
    "baseCritRate": 0.1,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "electric_wolf_s1",
        "name": "闪电突袭",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "15电伤+麻痹",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 15,
            "damageType": "electric"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "PARALYZE",
            "duration": 1,
            "value": 0
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "electric_wolf_s1",
      "damageBonus": 5,
      "durationBonus": 0,
      "desc": "20电伤，50%追加攻击 ★3",
      "addSkills": [
        {
          "id": "electric_wolf_evo",
          "name": "雷光连击",
          "trigger": "AFTER_ATTACK",
          "target": "RANDOM_ENEMY",
          "description": "50%追加10电伤",
          "cooldown": 0,
          "condition": "chance50",
          "effects": [
            {
              "type": "DEAL_DAMAGE",
              "target": "RANDOM_ENEMY",
              "amount": 10,
              "damageType": "electric"
            }
          ]
        }
      ]
    }
  },
  {
    "id": "charge_rabbit",
    "name": "电荷兔",
    "element": "electric",
    "class": "support",
    "rarity": "common",
    "description": "浑身充满电荷的小兔子",
    "baseHp": 24,
    "baseAttack": 5,
    "baseSpeed": 12,
    "baseDefense": 1,
    "baseCritRate": 0.06,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "charge_rabbit_s1",
        "name": "电荷加速",
        "trigger": "BATTLE_START",
        "target": "ALL_ALLIES",
        "description": "全体速度+2",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "BUFF",
            "target": "ALL_ALLIES",
            "stat": "speed",
            "value": 2,
            "duration": 2
          }
        ]
      },
      {
        "id": "charge_rabbit_s2",
        "name": "电光护盾",
        "trigger": "TURN_START",
        "target": "RANDOM_ALLY",
        "description": "随机友方8护盾",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "RANDOM_ALLY",
            "amount": 8
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "charge_rabbit_s1",
      "spdBuffBonus": 2,
      "desc": "速度+4，攻击+10%3回合 ★3",
      "addEffects": [
        {
          "type": "BUFF",
          "target": "ALL_ALLIES",
          "stat": "attack",
          "value": 0.1,
          "duration": 3
        }
      ]
    }
  },
  {
    "id": "wind_pigeon",
    "name": "风盾鸽",
    "element": "wind",
    "class": "tank",
    "rarity": "common",
    "description": "天空之城的守护者，羽翼如风",
    "baseHp": 46,
    "baseAttack": 5,
    "baseSpeed": 8,
    "baseDefense": 4,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "wind_pigeon_s1",
        "name": "风之盾",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "15护盾",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "SELF",
            "amount": 15
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "wind_pigeon_s1",
      "shieldBonus": 10,
      "desc": "25护盾，20%闪避+嘲讽 ★3",
      "addEffects": [
        {
          "type": "APPLY_STATUS",
          "target": "SELF",
          "status": "DODGE",
          "duration": 99,
          "value": 0.2
        },
        {
          "type": "APPLY_STATUS",
          "target": "SELF",
          "status": "TAUNT",
          "duration": 1,
          "value": 0
        }
      ]
    }
  },
  {
    "id": "swift_leopard",
    "name": "疾风豹",
    "element": "wind",
    "class": "warrior",
    "rarity": "common",
    "description": "风之谷中最快的猎手",
    "baseHp": 34,
    "baseAttack": 10,
    "baseSpeed": 15,
    "baseDefense": 2,
    "baseCritRate": 0.12,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "swift_leopard_s1",
        "name": "风刃连击",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "10风伤+加速",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 10,
            "damageType": "wind"
          },
          {
            "type": "BUFF",
            "target": "SELF",
            "stat": "speed",
            "value": 2,
            "duration": 2
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "swift_leopard_s1",
      "damageBonus": 5,
      "desc": "15风伤，50%追加攻击 ★3",
      "addSkills": [
        {
          "id": "swift_leopard_evo",
          "name": "风影追击",
          "trigger": "AFTER_ATTACK",
          "target": "RANDOM_ENEMY",
          "description": "50%追加10风伤",
          "cooldown": 0,
          "condition": "chance50",
          "effects": [
            {
              "type": "DEAL_DAMAGE",
              "target": "RANDOM_ENEMY",
              "amount": 10,
              "damageType": "wind"
            }
          ]
        }
      ]
    }
  },
  {
    "id": "wind_arrow_bird",
    "name": "风箭鸟",
    "element": "wind",
    "class": "archer",
    "rarity": "common",
    "description": "精准的风之射手",
    "baseHp": 28,
    "baseAttack": 10,
    "baseSpeed": 12,
    "baseDefense": 1,
    "baseCritRate": 0.12,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "wind_arrow_bird_s1",
        "name": "穿风箭",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "18风伤",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 18,
            "damageType": "wind"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "wind_arrow_bird_s1",
      "damageBonus": 7,
      "desc": "25风伤 ★3"
    }
  },
  {
    "id": "rock_armor",
    "name": "岩石甲",
    "element": "earth",
    "class": "tank",
    "rarity": "common",
    "description": "被岩石包裹的远古生物",
    "baseHp": 58,
    "baseAttack": 4,
    "baseSpeed": 4,
    "baseDefense": 7,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "rock_armor_s1",
        "name": "岩石硬化",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "永久+3防+10盾",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "BUFF",
            "target": "SELF",
            "stat": "defense",
            "value": 3,
            "duration": 99
          },
          {
            "type": "SHIELD",
            "target": "SELF",
            "amount": 10
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "rock_armor_s1",
      "defBuffBonus": 2,
      "shieldBonus": 10,
      "desc": "防+5，20护盾，嘲讽2回合 ★3",
      "addEffects": [
        {
          "type": "APPLY_STATUS",
          "target": "SELF",
          "status": "TAUNT",
          "duration": 2,
          "value": 0
        }
      ]
    }
  },
  {
    "id": "brute_bull",
    "name": "蛮力牛",
    "element": "earth",
    "class": "warrior",
    "rarity": "common",
    "description": "平原上的巨无霸，力大无穷",
    "baseHp": 42,
    "baseAttack": 10,
    "baseSpeed": 7,
    "baseDefense": 4,
    "baseCritRate": 0.08,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "brute_bull_s1",
        "name": "野蛮冲撞",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "20土伤+眩晕",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 20,
            "damageType": "earth"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "STUN",
            "duration": 1,
            "value": 0
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "brute_bull_s1",
      "damageBonus": 8,
      "desc": "28土伤，降防3点2回合 ★3",
      "addEffects": [
        {
          "type": "DEBUFF",
          "target": "FRONT_ENEMY",
          "stat": "defense",
          "value": 3,
          "duration": 2
        }
      ]
    }
  },
  {
    "id": "cactus",
    "name": "仙人掌",
    "element": "earth",
    "class": "support",
    "rarity": "common",
    "description": "沙漠中的守护者，浑身尖刺",
    "baseHp": 32,
    "baseAttack": 5,
    "baseSpeed": 7,
    "baseDefense": 3,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "cactus_s1",
        "name": "尖刺护甲",
        "trigger": "BATTLE_START",
        "target": "ALL_ALLIES",
        "description": "全体反击2回合",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "APPLY_STATUS",
            "target": "ALL_ALLIES",
            "status": "COUNTER",
            "duration": 2,
            "value": 3
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "cactus_s1",
      "durationBonus": 1,
      "statusValueBonus": 2,
      "desc": "反击3回合，反击5伤 ★3"
    }
  },
  {
    "id": "holy_sheep",
    "name": "圣盾羊",
    "element": "light",
    "class": "tank",
    "rarity": "common",
    "description": "神圣牧场的守护者",
    "baseHp": 48,
    "baseAttack": 5,
    "baseSpeed": 6,
    "baseDefense": 4,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "holy_sheep_s1",
        "name": "圣光护盾",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "15护盾",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "SELF",
            "amount": 15
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "holy_sheep_s1",
      "shieldBonus": 10,
      "desc": "25护盾，受击恢复10，嘲讽2回合 ★3",
      "addEffects": [
        {
          "type": "APPLY_STATUS",
          "target": "SELF",
          "status": "TAUNT",
          "duration": 2,
          "value": 0
        }
      ],
      "addSkills": [
        {
          "id": "holy_sheep_evo",
          "name": "圣光回馈",
          "trigger": "ON_HIT",
          "target": "SELF",
          "description": "受击恢复10生命",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "HEAL",
              "target": "SELF",
              "amount": 10
            }
          ]
        }
      ]
    }
  },
  {
    "id": "heal_star",
    "name": "治愈星",
    "element": "light",
    "class": "support",
    "rarity": "common",
    "description": "来自星空的治愈精灵",
    "baseHp": 26,
    "baseAttack": 4,
    "baseSpeed": 10,
    "baseDefense": 2,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.2,
      1.5,
      2,
      2.5
    ],
    "skills": [
      {
        "id": "heal_star_s1",
        "name": "星光治愈",
        "trigger": "TURN_START",
        "target": "ALL_ALLIES",
        "description": "全体恢复8",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "ALL_ALLIES",
            "amount": 8
          }
        ]
      },
      {
        "id": "heal_star_s2",
        "name": "净化之光",
        "trigger": "BATTLE_START",
        "target": "ALL_ALLIES",
        "description": "清除负面",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "CLEANSE",
            "target": "ALL_ALLIES"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "heal_star_s1",
      "healBonus": 4,
      "desc": "恢复12+全体+2攻2回合 ★3",
      "addEffects": [
        {
          "type": "BUFF",
          "target": "ALL_ALLIES",
          "stat": "attack",
          "value": 2,
          "duration": 2
        }
      ]
    }
  },
  {
    "id": "flame_bird",
    "name": "火焰鸟",
    "element": "fire",
    "class": "mage",
    "rarity": "rare",
    "description": "火山深处的凤凰雏鸟",
    "baseHp": 35,
    "baseAttack": 12,
    "baseSpeed": 11,
    "baseDefense": 2,
    "baseCritRate": 0.1,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "flame_bird_s1",
        "name": "烈焰风暴",
        "trigger": "BEFORE_ATTACK",
        "target": "ALL_ENEMIES",
        "description": "全体15火伤",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 15,
            "damageType": "fire"
          },
          {
            "type": "APPLY_STATUS",
            "target": "ALL_ENEMIES",
            "status": "BURN",
            "duration": 2,
            "value": 5
          }
        ]
      },
      {
        "id": "flame_bird_s2",
        "name": "火焰之舞",
        "trigger": "BATTLE_START",
        "target": "SELF",
        "description": "永久+5攻",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "BUFF",
            "target": "SELF",
            "stat": "attack",
            "value": 5,
            "duration": 99
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "flame_bird_s1",
      "damageBonus": 7,
      "burnValue": 3,
      "desc": "22火伤，灼烧8伤 ★3"
    }
  },
  {
    "id": "warm_sprite",
    "name": "暖焰精灵",
    "element": "fire",
    "class": "support",
    "rarity": "rare",
    "description": "壁炉中诞生的小火精灵",
    "baseHp": 30,
    "baseAttack": 6,
    "baseSpeed": 10,
    "baseDefense": 2,
    "baseCritRate": 0.05,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "warm_sprite_s1",
        "name": "温暖拥抱",
        "trigger": "TURN_START",
        "target": "ALL_ALLIES",
        "description": "恢复10+5%攻",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "ALL_ALLIES",
            "amount": 10
          },
          {
            "type": "BUFF",
            "target": "ALL_ALLIES",
            "stat": "attack",
            "value": 0.05,
            "duration": 2
          }
        ]
      },
      {
        "id": "warm_sprite_s2",
        "name": "火焰庇护",
        "trigger": "BATTLE_START",
        "target": "ALL_ALLIES",
        "description": "全体10护盾",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "SHIELD",
            "target": "ALL_ALLIES",
            "amount": 10
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "warm_sprite_s1",
      "healBonus": 5,
      "atkBuffBonus": 0.05,
      "desc": "恢复15，攻+10%3回合，净化 ★3",
      "addEffects": [
        {
          "type": "CLEANSE",
          "target": "ALL_ALLIES"
        }
      ]
    }
  },
  {
    "id": "frost_fish",
    "name": "霜影鱼",
    "element": "water",
    "class": "assassin",
    "rarity": "rare",
    "description": "深海中的幽灵鱼，来去无踪",
    "baseHp": 28,
    "baseAttack": 13,
    "baseSpeed": 17,
    "baseDefense": 1,
    "baseCritRate": 0.18,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "frost_fish_s1",
        "name": "冰刃突袭",
        "trigger": "BEFORE_ATTACK",
        "target": "LOWEST_HP_ENEMY",
        "description": "20水伤低血必暴",
        "cooldown": 2,
        "condition": "lowHp40",
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "LOWEST_HP_ENEMY",
            "amount": 20,
            "damageType": "water"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "frost_fish_s1",
      "damageBonus": 8,
      "relaxCondition": "lowHp50",
      "desc": "28水伤HP<50%，击杀+5攻 ★3",
      "addSkills": [
        {
          "id": "frost_fish_kill",
          "name": "冰刃收割",
          "trigger": "ON_KILL",
          "target": "SELF",
          "description": "击杀后永久+5攻击",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "BUFF",
              "target": "SELF",
              "stat": "attack",
              "value": 5,
              "duration": 99
            }
          ]
        }
      ]
    }
  },
  {
    "id": "ice_dragon",
    "name": "冰晶龙",
    "element": "water",
    "class": "mage",
    "rarity": "rare",
    "description": "雪山之巅的冰龙",
    "baseHp": 38,
    "baseAttack": 14,
    "baseSpeed": 9,
    "baseDefense": 3,
    "baseCritRate": 0.08,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "ice_dragon_s1",
        "name": "冰封千里",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "18水伤+冰冻",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 18,
            "damageType": "water"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "FREEZE",
            "duration": 1,
            "value": 0
          }
        ]
      },
      {
        "id": "ice_dragon_s2",
        "name": "冰龙吐息",
        "trigger": "BATTLE_START",
        "target": "ALL_ENEMIES",
        "description": "全体8水伤",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 8,
            "damageType": "water"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "ice_dragon_s1",
      "damageBonus": 7,
      "desc": "25水伤，降速3点2回合 ★3",
      "addEffects": [
        {
          "type": "DEBUFF",
          "target": "FRONT_ENEMY",
          "stat": "speed",
          "value": 3,
          "duration": 2
        }
      ]
    }
  },
  {
    "id": "poison_bee",
    "name": "毒刺蜂",
    "element": "grass",
    "class": "assassin",
    "rarity": "rare",
    "description": "花丛中的致命猎手",
    "baseHp": 26,
    "baseAttack": 12,
    "baseSpeed": 16,
    "baseDefense": 1,
    "baseCritRate": 0.15,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "poison_bee_s1",
        "name": "剧毒刺击",
        "trigger": "BEFORE_ATTACK",
        "target": "RANDOM_ENEMY",
        "description": "15草伤+中毒",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "RANDOM_ENEMY",
            "amount": 15,
            "damageType": "grass"
          },
          {
            "type": "APPLY_STATUS",
            "target": "RANDOM_ENEMY",
            "status": "POISON",
            "duration": 3,
            "value": 8
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "poison_bee_s1",
      "damageBonus": 7,
      "statusValueBonus": 2,
      "durationBonus": 1,
      "desc": "22草伤，中毒4回合10伤 ★3",
      "addEffects": [
        {
          "type": "DEBUFF",
          "target": "RANDOM_ENEMY",
          "stat": "attack",
          "value": 3,
          "duration": 2
        }
      ]
    }
  },
  {
    "id": "flower_fairy",
    "name": "花妖",
    "element": "grass",
    "class": "mage",
    "rarity": "rare",
    "description": "千年花丛中诞生的精灵",
    "baseHp": 34,
    "baseAttack": 12,
    "baseSpeed": 10,
    "baseDefense": 2,
    "baseCritRate": 0.08,
    "baseCritDamage": 2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "flower_fairy_s1",
        "name": "花粉迷障",
        "trigger": "BEFORE_ATTACK",
        "target": "ALL_ENEMIES",
        "description": "全体10草伤",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 10,
            "damageType": "grass"
          },
          {
            "type": "APPLY_STATUS",
            "target": "ALL_ENEMIES",
            "status": "SILENCE",
            "duration": 1,
            "value": 0
          }
        ]
      },
      {
        "id": "flower_fairy_s2",
        "name": "生命之舞",
        "trigger": "TURN_START",
        "target": "ALL_ALLIES",
        "description": "恢复6+5%攻",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "ALL_ALLIES",
            "amount": 6
          },
          {
            "type": "BUFF",
            "target": "ALL_ALLIES",
            "stat": "attack",
            "value": 0.05,
            "duration": 2
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "flower_fairy_s1",
      "damageBonus": 5,
      "durationBonus": 1,
      "desc": "15草伤，沉默2回合，降速 ★3",
      "addEffects": [
        {
          "type": "DEBUFF",
          "target": "ALL_ENEMIES",
          "stat": "speed",
          "value": 2,
          "duration": 2
        }
      ]
    }
  },
  {
    "id": "flash_fox",
    "name": "闪影狐",
    "element": "electric",
    "class": "assassin",
    "rarity": "rare",
    "description": "闪电中的幻影狐",
    "baseHp": 28,
    "baseAttack": 13,
    "baseSpeed": 19,
    "baseDefense": 1,
    "baseCritRate": 0.15,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "flash_fox_s1",
        "name": "闪电突袭",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "18电伤+麻痹",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 18,
            "damageType": "electric"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "PARALYZE",
            "duration": 1,
            "value": 0
          }
        ]
      },
      {
        "id": "flash_fox_s2",
        "name": "残影",
        "trigger": "ON_HIT",
        "target": "SELF",
        "description": "30%闪避",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "APPLY_STATUS",
            "target": "SELF",
            "status": "DODGE",
            "duration": 99,
            "value": 0.3
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "flash_fox_s1",
      "damageBonus": 7,
      "desc": "25电伤，攻击后速度+5 ★3",
      "addSkills": [
        {
          "id": "flash_fox_evo",
          "name": "电光残影",
          "trigger": "AFTER_ATTACK",
          "target": "SELF",
          "description": "速度+5",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "BUFF",
              "target": "SELF",
              "stat": "speed",
              "value": 5,
              "duration": 2
            }
          ]
        }
      ]
    }
  },
  {
    "id": "thunder_cloud",
    "name": "雷云兽",
    "element": "electric",
    "class": "mage",
    "rarity": "rare",
    "description": "雷云中诞生的神秘幻兽",
    "baseHp": 36,
    "baseAttack": 14,
    "baseSpeed": 10,
    "baseDefense": 2,
    "baseCritRate": 0.08,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "thunder_cloud_s1",
        "name": "雷电风暴",
        "trigger": "BEFORE_ATTACK",
        "target": "ALL_ENEMIES",
        "description": "全体12电伤",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 12,
            "damageType": "electric"
          },
          {
            "type": "APPLY_STATUS",
            "target": "RANDOM_ENEMY",
            "status": "PARALYZE",
            "duration": 1,
            "value": 0
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "thunder_cloud_s1",
      "damageBonus": 6,
      "durationBonus": 1,
      "desc": "18电伤，麻痹2回合，永久+5攻 ★3",
      "addSkills": [
        {
          "id": "thunder_cloud_evo",
          "name": "雷云凝聚",
          "trigger": "BATTLE_START",
          "target": "SELF",
          "description": "永久+5攻",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "BUFF",
              "target": "SELF",
              "stat": "attack",
              "value": 5,
              "duration": 99
            }
          ]
        }
      ]
    }
  },
  {
    "id": "shadow_wind_cat",
    "name": "影风猫",
    "element": "wind",
    "class": "assassin",
    "rarity": "rare",
    "description": "风之谷中的幽灵猫",
    "baseHp": 26,
    "baseAttack": 14,
    "baseSpeed": 18,
    "baseDefense": 1,
    "baseCritRate": 0.18,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "shadow_wind_cat_s1",
        "name": "风影刺杀",
        "trigger": "BEFORE_ATTACK",
        "target": "OPPOSING",
        "description": "20风伤",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "OPPOSING",
            "amount": 20,
            "damageType": "wind"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "shadow_wind_cat_s1",
      "damageBonus": 8,
      "desc": "28风伤，击杀+5速，隐身1回合 ★3",
      "addSkills": [
        {
          "id": "shadow_wind_cat_spd",
          "name": "风影",
          "trigger": "ON_KILL",
          "target": "SELF",
          "description": "击杀后永久+5速度",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "BUFF",
              "target": "SELF",
              "stat": "speed",
              "value": 5,
              "duration": 99
            }
          ]
        },
        {
          "id": "shadow_wind_cat_stealth",
          "name": "影遁",
          "trigger": "AFTER_ATTACK",
          "target": "SELF",
          "description": "隐身1回合",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "APPLY_STATUS",
              "target": "SELF",
              "status": "STEALTH",
              "duration": 1,
              "value": 0
            }
          ]
        }
      ]
    }
  },
  {
    "id": "storm_eagle",
    "name": "风暴鹰",
    "element": "wind",
    "class": "mage",
    "rarity": "rare",
    "description": "天空中的霸主，掌控风暴",
    "baseHp": 36,
    "baseAttack": 13,
    "baseSpeed": 12,
    "baseDefense": 2,
    "baseCritRate": 0.1,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "storm_eagle_s1",
        "name": "风暴之眼",
        "trigger": "BEFORE_ATTACK",
        "target": "ALL_ENEMIES",
        "description": "全体12风伤",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 12,
            "damageType": "wind"
          },
          {
            "type": "DEBUFF",
            "target": "ALL_ENEMIES",
            "stat": "speed",
            "value": 2,
            "duration": 2
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "storm_eagle_s1",
      "damageBonus": 6,
      "debuffBonus": 1,
      "desc": "18风伤，降速3回合，30%沉默 ★3",
      "addSkills": [
        {
          "id": "storm_eagle_evo",
          "name": "风啸",
          "trigger": "BEFORE_ATTACK",
          "target": "RANDOM_ENEMY",
          "description": "30%沉默1回合",
          "cooldown": 0,
          "condition": "chance30",
          "effects": [
            {
              "type": "APPLY_STATUS",
              "target": "RANDOM_ENEMY",
              "status": "SILENCE",
              "duration": 1,
              "value": 0
            }
          ]
        }
      ]
    }
  },
  {
    "id": "sand_scorpion",
    "name": "沙影蝎",
    "element": "earth",
    "class": "assassin",
    "rarity": "rare",
    "description": "沙漠中的暗杀者",
    "baseHp": 30,
    "baseAttack": 12,
    "baseSpeed": 15,
    "baseDefense": 2,
    "baseCritRate": 0.12,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "sand_scorpion_s1",
        "name": "沙隐毒针",
        "trigger": "BEFORE_ATTACK",
        "target": "RANDOM_ENEMY",
        "description": "15土伤+中毒",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "RANDOM_ENEMY",
            "amount": 15,
            "damageType": "earth"
          },
          {
            "type": "APPLY_STATUS",
            "target": "RANDOM_ENEMY",
            "status": "POISON",
            "duration": 3,
            "value": 6
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "sand_scorpion_s1",
      "damageBonus": 7,
      "statusValueBonus": 2,
      "durationBonus": 1,
      "desc": "22土伤，中毒8伤，致盲+闪避 ★3",
      "addEffects": [
        {
          "type": "APPLY_STATUS",
          "target": "RANDOM_ENEMY",
          "status": "BLIND",
          "duration": 3,
          "value": 0
        }
      ],
      "addSkills": [
        {
          "id": "sand_scorpion_evo",
          "name": "沙隐",
          "trigger": "BATTLE_START",
          "target": "SELF",
          "description": "闪避+20%",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "APPLY_STATUS",
              "target": "SELF",
              "status": "DODGE",
              "duration": 2,
              "value": 0.2
            }
          ]
        }
      ]
    }
  },
  {
    "id": "rock_bow_lizard",
    "name": "岩弓蜥",
    "element": "earth",
    "class": "archer",
    "rarity": "rare",
    "description": "岩石峡谷中的猎人",
    "baseHp": 32,
    "baseAttack": 13,
    "baseSpeed": 11,
    "baseDefense": 2,
    "baseCritRate": 0.12,
    "baseCritDamage": 2.2,
    "levelMultipliers": [
      1,
      1.3,
      1.7,
      2.2,
      2.8
    ],
    "skills": [
      {
        "id": "rock_bow_lizard_s1",
        "name": "岩石箭雨",
        "trigger": "BEFORE_ATTACK",
        "target": "ALL_ENEMIES",
        "description": "全体10土伤",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 10,
            "damageType": "earth"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "rock_bow_lizard_s1",
      "damageBonus": 5,
      "desc": "15土伤，降防3点，30%眩晕 ★3",
      "addEffects": [
        {
          "type": "DEBUFF",
          "target": "ALL_ENEMIES",
          "stat": "defense",
          "value": 3,
          "duration": 3
        }
      ],
      "addSkills": [
        {
          "id": "rock_bow_evo",
          "name": "岩震",
          "trigger": "BEFORE_ATTACK",
          "target": "RANDOM_ENEMY",
          "description": "30%眩晕",
          "cooldown": 0,
          "condition": "chance30",
          "effects": [
            {
              "type": "APPLY_STATUS",
              "target": "RANDOM_ENEMY",
              "status": "STUN",
              "duration": 1,
              "value": 0
            }
          ]
        }
      ]
    }
  },
  {
    "id": "phoenix_bow",
    "name": "凤凰弓",
    "element": "fire",
    "class": "archer",
    "rarity": "epic",
    "description": "凤凰羽毛制成的神弓",
    "baseHp": 38,
    "baseAttack": 16,
    "baseSpeed": 12,
    "baseDefense": 2,
    "baseCritRate": 0.15,
    "baseCritDamage": 2.5,
    "levelMultipliers": [
      1,
      1.4,
      1.9,
      2.5,
      3.2
    ],
    "skills": [
      {
        "id": "phoenix_bow_s1",
        "name": "凤凰箭",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "25火伤+灼烧",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 25,
            "damageType": "fire"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "BURN",
            "duration": 3,
            "value": 8
          }
        ]
      },
      {
        "id": "phoenix_bow_s2",
        "name": "不灭之焰",
        "trigger": "ON_KILL",
        "target": "SELF",
        "description": "击杀恢复15+3攻",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "SELF",
            "amount": 15
          },
          {
            "type": "BUFF",
            "target": "SELF",
            "stat": "attack",
            "value": 3,
            "duration": 99
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "phoenix_bow_s1",
      "damageBonus": 10,
      "burnValue": 4,
      "durationBonus": 1,
      "desc": "35火伤，灼烧4回合12伤 ★3"
    }
  },
  {
    "id": "water_arrow_frog",
    "name": "水箭蛙",
    "element": "water",
    "class": "archer",
    "rarity": "epic",
    "description": "沼泽中的神射手",
    "baseHp": 36,
    "baseAttack": 15,
    "baseSpeed": 13,
    "baseDefense": 2,
    "baseCritRate": 0.12,
    "baseCritDamage": 2.3,
    "levelMultipliers": [
      1,
      1.4,
      1.9,
      2.5,
      3.2
    ],
    "skills": [
      {
        "id": "water_arrow_frog_s1",
        "name": "水箭连发",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "12水伤×2",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 12,
            "damageType": "water"
          },
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 12,
            "damageType": "water"
          }
        ]
      },
      {
        "id": "water_arrow_frog_s2",
        "name": "蛙跳",
        "trigger": "ON_HIT",
        "target": "SELF",
        "description": "40%闪避",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "APPLY_STATUS",
            "target": "SELF",
            "status": "DODGE",
            "duration": 99,
            "value": 0.4
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "water_arrow_frog_s1",
      "replaceDamage": 18,
      "extraHits": 1,
      "desc": "18水伤×3，攻击后恢复10 ★3",
      "addSkills": [
        {
          "id": "water_frog_heal",
          "name": "蛙鸣回春",
          "trigger": "AFTER_ATTACK",
          "target": "SELF",
          "description": "恢复10生命",
          "cooldown": 0,
          "condition": null,
          "effects": [
            {
              "type": "HEAL",
              "target": "SELF",
              "amount": 10
            }
          ]
        }
      ]
    }
  },
  {
    "id": "vine_snake",
    "name": "藤蔓蛇",
    "element": "grass",
    "class": "archer",
    "rarity": "epic",
    "description": "藤蔓丛中的猎手",
    "baseHp": 38,
    "baseAttack": 16,
    "baseSpeed": 11,
    "baseDefense": 2,
    "baseCritRate": 0.12,
    "baseCritDamage": 2.3,
    "levelMultipliers": [
      1,
      1.4,
      1.9,
      2.5,
      3.2
    ],
    "skills": [
      {
        "id": "vine_snake_s1",
        "name": "藤蔓绞杀",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "20草伤+缠绕",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 20,
            "damageType": "grass"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "ENTANGLE",
            "duration": 2,
            "value": 0
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "vine_snake_s1",
      "damageBonus": 8,
      "durationBonus": 1,
      "desc": "28草伤，缠绕3回合，降防5 ★3",
      "addEffects": [
        {
          "type": "DEBUFF",
          "target": "FRONT_ENEMY",
          "stat": "defense",
          "value": 5,
          "duration": 3
        }
      ]
    }
  },
  {
    "id": "thunder_hawk",
    "name": "雷电鹰",
    "element": "electric",
    "class": "archer",
    "rarity": "epic",
    "description": "雷云中的霸主",
    "baseHp": 38,
    "baseAttack": 17,
    "baseSpeed": 14,
    "baseDefense": 2,
    "baseCritRate": 0.15,
    "baseCritDamage": 2.5,
    "levelMultipliers": [
      1,
      1.4,
      1.9,
      2.5,
      3.2
    ],
    "skills": [
      {
        "id": "thunder_hawk_s1",
        "name": "雷电俯冲",
        "trigger": "BEFORE_ATTACK",
        "target": "ALL_ENEMIES",
        "description": "15电伤+麻痹",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 15,
            "damageType": "electric"
          },
          {
            "type": "APPLY_STATUS",
            "target": "ALL_ENEMIES",
            "status": "PARALYZE",
            "duration": 1,
            "value": 0
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "thunder_hawk_s1",
      "damageBonus": 7,
      "durationBonus": 1,
      "desc": "22电伤，麻痹2回合，全体降速 ★3",
      "addEffects": [
        {
          "type": "DEBUFF",
          "target": "ALL_ENEMIES",
          "stat": "speed",
          "value": 3,
          "duration": 2
        }
      ]
    }
  },
  {
    "id": "light_arrow_angel",
    "name": "光箭天使",
    "element": "light",
    "class": "archer",
    "rarity": "epic",
    "description": "天堂派来的使者",
    "baseHp": 38,
    "baseAttack": 16,
    "baseSpeed": 13,
    "baseDefense": 2,
    "baseCritRate": 0.15,
    "baseCritDamage": 2.5,
    "levelMultipliers": [
      1,
      1.4,
      1.9,
      2.5,
      3.2
    ],
    "skills": [
      {
        "id": "light_arrow_angel_s1",
        "name": "圣光箭",
        "trigger": "BEFORE_ATTACK",
        "target": "FRONT_ENEMY",
        "description": "22光伤+眩晕",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "FRONT_ENEMY",
            "amount": 22,
            "damageType": "light"
          },
          {
            "type": "APPLY_STATUS",
            "target": "FRONT_ENEMY",
            "status": "STUN",
            "duration": 1,
            "value": 0
          }
        ]
      },
      {
        "id": "light_arrow_angel_s2",
        "name": "光之审判",
        "trigger": "BATTLE_START",
        "target": "ALL_ENEMIES",
        "description": "暗系10光伤",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 10,
            "damageType": "light"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "light_arrow_angel_s1",
      "damageBonus": 8,
      "durationBonus": 1,
      "desc": "30光伤，眩晕2回合，友方恢复8 ★3",
      "addEffects": [
        {
          "type": "HEAL",
          "target": "ALL_ALLIES",
          "amount": 8
        }
      ]
    }
  },
  {
    "id": "dark_arrow",
    "name": "暗箭",
    "element": "dark",
    "class": "archer",
    "rarity": "epic",
    "description": "暗影中的致命猎手",
    "baseHp": 36,
    "baseAttack": 18,
    "baseSpeed": 12,
    "baseDefense": 1,
    "baseCritRate": 0.15,
    "baseCritDamage": 2.5,
    "levelMultipliers": [
      1,
      1.4,
      1.9,
      2.5,
      3.2
    ],
    "skills": [
      {
        "id": "dark_arrow_s1",
        "name": "暗影箭",
        "trigger": "BEFORE_ATTACK",
        "target": "LOWEST_HP_ENEMY",
        "description": "20暗伤",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "LOWEST_HP_ENEMY",
            "amount": 20,
            "damageType": "dark"
          },
          {
            "type": "APPLY_STATUS",
            "target": "LOWEST_HP_ENEMY",
            "status": "POISON",
            "duration": 2,
            "value": 6
          }
        ]
      },
      {
        "id": "dark_arrow_s2",
        "name": "暗之侵蚀",
        "trigger": "ON_KILL",
        "target": "ALL_ENEMIES",
        "description": "击杀全体10暗伤",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 10,
            "damageType": "dark"
          }
        ]
      }
    ],
    "upgradeEvolution": {
      "skillId": "dark_arrow_s1",
      "damageBonus": 8,
      "statusValueBonus": 2,
      "durationBonus": 1,
      "desc": "28暗伤，中毒8伤，30%斩杀 ★3",
      "addEffects": [
        {
          "type": "EXECUTE",
          "target": "LOWEST_HP_ENEMY",
          "threshold": 0.2,
          "chance": 0.3
        }
      ]
    }
  },
  {
    "id": "creator_god",
    "name": "创世神",
    "element": "light",
    "class": "mage",
    "rarity": "legendary",
    "description": "创世的至高神明",
    "baseHp": 80,
    "baseAttack": 25,
    "baseSpeed": 12,
    "baseDefense": 5,
    "baseCritRate": 0.1,
    "baseCritDamage": 2.5,
    "levelMultipliers": [
      1,
      1.5,
      2,
      2.8,
      3.5
    ],
    "skills": [
      {
        "id": "creator_god_s1",
        "name": "创世之光",
        "trigger": "BATTLE_START",
        "target": "ALL_ALLIES",
        "description": "全体恢复20+10攻+15盾",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "ALL_ALLIES",
            "amount": 20
          },
          {
            "type": "BUFF",
            "target": "ALL_ALLIES",
            "stat": "attack",
            "value": 10,
            "duration": 99
          },
          {
            "type": "SHIELD",
            "target": "ALL_ALLIES",
            "amount": 15
          }
        ]
      },
      {
        "id": "creator_god_s2",
        "name": "神之裁决",
        "trigger": "BEFORE_ATTACK",
        "target": "ALL_ENEMIES",
        "description": "30光伤+眩晕",
        "cooldown": 3,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 30,
            "damageType": "light"
          },
          {
            "type": "APPLY_STATUS",
            "target": "ALL_ENEMIES",
            "status": "STUN",
            "duration": 1,
            "value": 0
          }
        ]
      },
      {
        "id": "creator_god_s3",
        "name": "不灭神体",
        "trigger": "ON_DEATH",
        "target": "SELF",
        "description": "死亡复活",
        "cooldown": 99,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "SELF",
            "amount": 9999
          },
          {
            "type": "BUFF",
            "target": "SELF",
            "stat": "attack",
            "value": 20,
            "duration": 99
          }
        ],
        "oncePerBattle": true
      }
    ],
    "upgradeEvolution": {
      "skillId": "creator_god_s1",
      "healBonus": 10,
      "atkBuffBonus": 5,
      "shieldBonus": 5,
      "desc": "恢复30，+15攻，20护盾，净化 ★3",
      "addEffects": [
        {
          "type": "CLEANSE",
          "target": "ALL_ALLIES"
        }
      ]
    }
  },
  {
    "id": "dark_lord",
    "name": "暗黑魔王",
    "element": "dark",
    "class": "mage",
    "rarity": "legendary",
    "description": "黑暗深渊的主宰",
    "baseHp": 75,
    "baseAttack": 30,
    "baseSpeed": 10,
    "baseDefense": 4,
    "baseCritRate": 0.12,
    "baseCritDamage": 2.5,
    "levelMultipliers": [
      1,
      1.5,
      2,
      2.8,
      3.5
    ],
    "skills": [
      {
        "id": "dark_lord_s1",
        "name": "黑暗吞噬",
        "trigger": "BEFORE_ATTACK",
        "target": "ALL_ENEMIES",
        "description": "20暗伤+吸血",
        "cooldown": 2,
        "condition": null,
        "effects": [
          {
            "type": "DEAL_DAMAGE",
            "target": "ALL_ENEMIES",
            "amount": 20,
            "damageType": "dark"
          },
          {
            "type": "HEAL",
            "target": "SELF",
            "amount": 15
          }
        ]
      },
      {
        "id": "dark_lord_s2",
        "name": "恐惧光环",
        "trigger": "BATTLE_START",
        "target": "ALL_ENEMIES",
        "description": "敌方-15%攻-2速",
        "cooldown": 0,
        "condition": null,
        "effects": [
          {
            "type": "DEBUFF",
            "target": "ALL_ENEMIES",
            "stat": "attack",
            "value": 0.15,
            "duration": 99
          },
          {
            "type": "DEBUFF",
            "target": "ALL_ENEMIES",
            "stat": "speed",
            "value": 2,
            "duration": 99
          }
        ]
      },
      {
        "id": "dark_lord_s3",
        "name": "暗影重生",
        "trigger": "ON_DEATH",
        "target": "SELF",
        "description": "死亡复活",
        "cooldown": 99,
        "condition": null,
        "effects": [
          {
            "type": "HEAL",
            "target": "SELF",
            "amount": 9999
          },
          {
            "type": "BUFF",
            "target": "SELF",
            "stat": "attack",
            "value": 15,
            "duration": 99
          }
        ],
        "oncePerBattle": true
      }
    ],
    "upgradeEvolution": {
      "skillId": "dark_lord_s1",
      "damageBonus": 10,
      "healBonus": 10,
      "desc": "30暗伤，吸血25，50%沉默2回合 ★3",
      "addEffects": [
        {
          "type": "APPLY_STATUS",
          "target": "ALL_ENEMIES",
          "status": "SILENCE",
          "duration": 2,
          "value": 0
        }
      ]
    }
  }
];
