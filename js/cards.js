import { CONFIG } from './config.js';
import { CARD_TEMPLATES } from './cardData.js';

export { CARD_TEMPLATES };

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
    first.description = `${first.description || first.name} ★3强化`;
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

  targetSkill.description = evo.desc || `${targetSkill.description || targetSkill.name} ★3进化`;
  targetSkill.evolved = true;
  return list;
}

function buildSkills(tpl, upgradeTier) {
  const base = tpl.skills.map(cloneSkill);
  if (upgradeTier >= 3) return applyUpgradeEvolution(base, tpl.upgradeEvolution);
  return base;
}

export function createCard(templateId, level = 1, upgradeTier = 1, playerId = '', position = 0) {
  const tpl = getTemplate(templateId);
  if (!tpl) throw new Error(`Unknown template: ${templateId}`);

  const tierMul = CONFIG.TIER_MULTIPLIER[upgradeTier];
  const levelMul = tpl.levelMultipliers[level - 1] || 1;

  const maxHp = Math.round(tpl.baseHp * levelMul * tierMul);
  const attack = Math.round(tpl.baseAttack * levelMul * tierMul);
  const speed = Math.round(tpl.baseSpeed * levelMul * tierMul);
  const defense = Math.round(tpl.baseDefense * levelMul * tierMul);

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
    level,
    upgradeTier,
    skills: buildSkills(tpl, upgradeTier),
    statusEffects: [],
    bondMods: {},
    position,
    playerId,
    isAlive: true,
  };
}

export function cloneCardForBattle(card, playerId) {
  const c = createCard(card.templateId, card.level, card.upgradeTier, playerId, card.position);
  c.id = card.id + '_battle';
  return c;
}

export function resetCardIdCounter() {
  cardIdCounter = 0;
}

export function recalculateCardStats(card, fullHeal = true) {
  const tpl = getTemplate(card.templateId);
  if (!tpl) return;
  const tierMul = CONFIG.TIER_MULTIPLIER[card.upgradeTier];
  const levelMul = tpl.levelMultipliers[card.level - 1] || 1;
  const ratio = card.maxHp > 0 ? card.hp / card.maxHp : 1;

  card.maxHp = Math.round(tpl.baseHp * levelMul * tierMul);
  card.attack = Math.round(tpl.baseAttack * levelMul * tierMul);
  card.speed = Math.round(tpl.baseSpeed * levelMul * tierMul);
  card.defense = Math.round(tpl.baseDefense * levelMul * tierMul);
  card.critRate = tpl.baseCritRate ?? CONFIG.BASE_CRIT_RATE;
  card.critDamage = tpl.baseCritDamage ?? CONFIG.BASE_CRIT_DAMAGE;
  card.hp = fullHeal ? card.maxHp : Math.max(1, Math.round(card.maxHp * ratio));
  card.skills = buildSkills(tpl, card.upgradeTier);
}
