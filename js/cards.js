import { CONFIG, getStarMultiplier } from './config.js';
import { CARD_TEMPLATES as BASE_TEMPLATES } from './cardData.js';
import { CARD_DATA_EXTRA } from './cardDataExtra.js';

export const CARD_TEMPLATES = [...BASE_TEMPLATES, ...CARD_DATA_EXTRA];

let cardIdCounter = 0;

export function getTemplate(templateId) {
  return CARD_TEMPLATES.find(t => t.id === templateId);
}

function cloneSkillEffects(effects) {
  return effects.map(e => ({ ...e }));
}

function cloneSkill(skill) {
  return {
    ...skill,
    effects: cloneSkillEffects(skill.effects),
    currentCooldown: 0,
    usedThisBattle: false,
  };
}

function patchEffects(effects, evo) {
  for (const e of effects) {
    if (evo.damageBonus && e.type === 'DEAL_DAMAGE') e.amount = (e.amount || 0) + evo.damageBonus;
    if (evo.healBonus && e.type === 'HEAL') e.amount = (e.amount || 0) + evo.healBonus;
    if (evo.shieldBonus && e.type === 'SHIELD') e.amount = (e.amount || 0) + evo.shieldBonus;
    if (evo.burnValue && e.type === 'APPLY_STATUS') e.value = (e.value || 0) + evo.burnValue;
    if (evo.statusValueBonus && e.type === 'APPLY_STATUS') e.value = (e.value || 0) + evo.statusValueBonus;
    if (evo.durationBonus && e.type === 'APPLY_STATUS') e.duration = (e.duration || 0) + evo.durationBonus;
    if (evo.defBuffBonus && e.type === 'BUFF' && e.stat === 'defense') e.value = (e.value || 0) + evo.defBuffBonus;
    if (evo.atkBuffBonus && e.type === 'BUFF' && e.stat === 'attack') e.value = (e.value || 0) + evo.atkBuffBonus;
    if (evo.spdBuffBonus && e.type === 'BUFF' && e.stat === 'speed') e.value = (e.value || 0) + evo.spdBuffBonus;
    if (evo.debuffBonus && e.type === 'DEBUFF') e.value = (e.value || 0) + evo.debuffBonus;
    if (evo.replaceDamage && e.type === 'DEAL_DAMAGE') e.amount = evo.replaceDamage;
  }
}

function primarySkillNumericBonus(skill) {
  const dmg = skill.effects.find(e => e.type === 'DEAL_DAMAGE')?.amount || 0;
  const heal = skill.effects.find(e => e.type === 'HEAL')?.amount || 0;
  const shield = skill.effects.find(e => e.type === 'SHIELD')?.amount || 0;
  const status = skill.effects.find(e => e.type === 'APPLY_STATUS')?.value || 0;
  return {
    damageBonus: Math.round(dmg * 0.35),
    healBonus: Math.round(heal * 0.35),
    shieldBonus: Math.round(shield * 0.35),
    statusValueBonus: Math.round(status * 0.3),
  };
}

function applyStar2Enhancement(skills, tpl) {
  const list = skills.map(cloneSkill);
  if (!list.length) return list;

  const primary = list[0];
  patchEffects(primary.effects, primarySkillNumericBonus(primary));
  if (primary.cooldown > 1) primary.cooldown -= 1;
  primary.description = `${primary.description || primary.name}（★2强化）`;

  if (list.length > 1 && tpl?.upgradeEvolution?.skillId) {
    const second = list.find(s => s.id === tpl.upgradeEvolution.skillId) || list[1];
    if (second && second !== primary) {
      patchEffects(second.effects, {
        damageBonus: Math.round((second.effects.find(e => e.type === 'DEAL_DAMAGE')?.amount || 0) * 0.2),
        shieldBonus: Math.round((second.effects.find(e => e.type === 'SHIELD')?.amount || 0) * 0.2),
      });
      second.description = `${second.description || second.name}（★2强化）`;
    }
  }

  return list;
}

function applyUpgradeEvolution(skills, evo) {
  const list = skills.map(cloneSkill);
  if (!list.length) return list;

  if (!evo) {
    const first = list[0];
    patchEffects(first.effects, {
      damageBonus: Math.round((first.effects.find(e => e.type === 'DEAL_DAMAGE')?.amount || 0) * 0.5),
      healBonus: Math.round((first.effects.find(e => e.type === 'HEAL')?.amount || 0) * 0.5),
      shieldBonus: Math.round((first.effects.find(e => e.type === 'SHIELD')?.amount || 0) * 0.5),
      statusValueBonus: Math.round((first.effects.find(e => e.type === 'APPLY_STATUS')?.value || 0) * 0.3),
    });
    first.description = `${first.description || first.name}（★3究极）`;
    first.evolved = true;
    return list;
  }

  const targetSkill = list.find(s => s.id === evo.skillId) || list[0];
  patchEffects(targetSkill.effects, evo);

  if (evo.addEffects?.length) {
    targetSkill.effects.push(...cloneSkillEffects(evo.addEffects));
  }

  if (evo.tauntBonus) {
    for (const skill of list) {
      for (const e of skill.effects) {
        if (e.type === 'APPLY_STATUS' && e.status === 'TAUNT') e.duration += evo.tauntBonus;
      }
    }
  }

  if (evo.secondSkillId) {
    const second = list.find(s => s.id === evo.secondSkillId);
    if (second) {
      patchEffects(second.effects, evo.secondPatch || evo);
      if (evo.secondAddEffects?.length) {
        second.effects.push(...cloneSkillEffects(evo.secondAddEffects));
      }
    }
  }

  if (evo.relaxCondition) targetSkill.condition = evo.relaxCondition;
  if (evo.cooldownReduce && targetSkill.cooldown > 0) {
    targetSkill.cooldown = Math.max(0, targetSkill.cooldown - evo.cooldownReduce);
  }

  if (evo.extraHits > 0) {
    const dmgFx = targetSkill.effects.find(e => e.type === 'DEAL_DAMAGE');
    if (dmgFx) {
      const hit = { ...dmgFx, amount: evo.hitDamage || dmgFx.amount };
      for (let i = 0; i < evo.extraHits; i++) targetSkill.effects.push({ ...hit });
    }
  }

  if (evo.addSkills?.length) {
    for (const sk of evo.addSkills) list.push(cloneSkill(sk));
  }

  targetSkill.description = evo.desc || `${targetSkill.description || targetSkill.name}（★3究极）`;
  targetSkill.evolved = true;
  return list;
}

/** 按星级构建技能：1星基础 · 2星强化 · 3星究极进化 */
function buildSkills(tpl, star) {
  const base = tpl.skills.map(cloneSkill);
  if (star >= 3) return applyUpgradeEvolution(base, tpl.upgradeEvolution);
  if (star >= 2) return applyStar2Enhancement(base, tpl);
  return base;
}

/** @param {number} star 星级 1-3 */
export function createCard(templateId, star = 1, playerId = '', position = 0) {
  const tpl = getTemplate(templateId);
  if (!tpl) throw new Error(`Unknown template: ${templateId}`);

  const tierMul = getStarMultiplier(tpl.rarity, star, tpl.costTier);

  const maxHp = Math.round(tpl.baseHp * tierMul);
  const attack = Math.round(tpl.baseAttack * tierMul);
  const speed = Math.round(tpl.baseSpeed * tierMul);
  const defense = Math.round(tpl.baseDefense * tierMul);

  return {
    id: `card_${++cardIdCounter}`,
    templateId: tpl.id,
    name: tpl.name,
    rarity: tpl.rarity,
    element: tpl.element,
    cardClass: tpl.class,
    description: tpl.description || '',
    hp: maxHp,
    maxHp,
    attack,
    speed,
    defense,
    critRate: tpl.baseCritRate ?? CONFIG.BASE_CRIT_RATE,
    critDamage: tpl.baseCritDamage ?? CONFIG.BASE_CRIT_DAMAGE,
    shield: 0,
    star,
    upgradeTier: star,
    skills: buildSkills(tpl, star),
    statusEffects: [],
    bondMods: {},
    position,
    playerId,
    isAlive: true,
  };
}

export function cloneCardForBattle(card, playerId) {
  const c = createCard(card.templateId, card.star ?? card.upgradeTier, playerId, card.position);
  c.id = card.id + '_battle';
  return c;
}

export function resetCardIdCounter() {
  cardIdCounter = 0;
}

export function recalculateCardStats(card, fullHeal = true) {
  const tpl = getTemplate(card.templateId);
  if (!tpl) return;
  const star = card.star ?? card.upgradeTier ?? 1;
  card.star = star;
  card.upgradeTier = star;
  const tierMul = getStarMultiplier(tpl.rarity, star, tpl.costTier);
  const ratio = card.maxHp > 0 ? card.hp / card.maxHp : 1;

  card.maxHp = Math.round(tpl.baseHp * tierMul);
  card.attack = Math.round(tpl.baseAttack * tierMul);
  card.speed = Math.round(tpl.baseSpeed * tierMul);
  card.defense = Math.round(tpl.baseDefense * tierMul);
  card.critRate = tpl.baseCritRate ?? CONFIG.BASE_CRIT_RATE;
  card.critDamage = tpl.baseCritDamage ?? CONFIG.BASE_CRIT_DAMAGE;
  card.hp = fullHeal ? card.maxHp : Math.max(1, Math.round(card.maxHp * ratio));
  card.skills = buildSkills(tpl, star);
}

export function getStarLabel(star) {
  return `★${star}`;
}
