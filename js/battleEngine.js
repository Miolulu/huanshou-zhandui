import { CONFIG } from './config.js';
import { cloneCardForBattle } from './cards.js';
import {
  getElementMultiplier as calcElementMul,
  getElementRelation,
  getElementBondTier,
  ELEMENT_BOND_NAMES,
  getSkillType,
} from './elements.js';
import {
  countTeamClasses,
  getClassBondTier,
  getClassBondEffect,
  CLASS_BOND_NAMES,
} from './classes.js';
import { ELEMENT_NAMES } from './config.js';

const NEGATIVE_STATUSES = new Set([
  'BURN', 'POISON', 'PARALYZE', 'STUN', 'FREEZE', 'SILENCE', 'DEBUFF', 'ENTANGLE', 'BLIND',
]);

const SKIP_REASONS = {
  STUN: 'STUN', FREEZE: 'FREEZE', PARALYZE: 'PARALYZE', ENTANGLE: 'ENTANGLE',
};

export class BattleEngine {
  constructor(playerA, playerB, onEvent) {
    this.playerA = playerA;
    this.playerB = playerB;
    this.onEvent = onEvent || (() => {});
    this.turn = 0;
    this.eventLog = [];
    this.teamA = this.cloneTeam(playerA);
    this.teamB = this.cloneTeam(playerB);
  }

  cloneTeam(player) {
    const cards = Array(7).fill(null);
    for (let i = 0; i < 7; i++) {
      const c = player.team.cards[i];
      if (c && i < player.team.maxSize) {
        const bc = cloneCardForBattle(c, player.id);
        bc.position = i;
        bc._deathHandled = false;
        cards[i] = bc;
      }
    }
    return { playerId: player.id, playerName: player.name, cards };
  }

  emit(event) {
    event.turn = this.turn;
    this.eventLog.push(event);
    this.onEvent(event);
  }

  sortBySpeed(cards) {
    return [...cards].sort((a, b) => b.speed - a.speed || (a.id > b.id ? 1 : -1));
  }

  getAllCards() {
    return [...this.teamA.cards, ...this.teamB.cards].filter(Boolean);
  }

  getAliveCards(team) {
    return team.cards.filter(c => c && c.isAlive && c.hp > 0);
  }

  getTeam(card) {
    return card.playerId === this.playerA.id ? this.teamA : this.teamB;
  }

  getEnemyTeam(card) {
    return card.playerId === this.playerA.id ? this.teamB : this.teamA;
  }

  getElementMul(atk, def) {
    return calcElementMul(atk, def);
  }

  applyBonds() {
    for (const team of [this.teamA, this.teamB]) {
      this.applyElementBonds(team);
      this.applyClassBonds(team);
    }
  }

  applyElementBonds(team) {
    const cards = team.cards.filter(Boolean);
    const counts = {};
    for (const c of cards) counts[c.element] = (counts[c.element] || 0) + 1;

    const emittedElements = new Set();
    for (const card of cards) {
      const tier = getElementBondTier(counts[card.element] || 0);
      if (!tier) continue;
      card.attack = Math.round(card.attack * (1 + tier.atk));
      card.maxHp = Math.round(card.maxHp * (1 + tier.hp));
      card.hp = Math.round(card.hp * (1 + tier.hp));
      card.defense = Math.round(card.defense * (1 + tier.def));
      card.speed = Math.round(card.speed * (1 + tier.spd));
      card.critRate += tier.crit;
      if (!emittedElements.has(card.element)) {
        emittedElements.add(card.element);
        this.emit({
          type: 'SYNERGY_APPLIED',
          teamName: team.playerName,
          bondType: 'element',
          bondName: ELEMENT_BOND_NAMES[card.element],
          count: counts[card.element],
        });
      }
    }
  }

  applyClassBonds(team) {
    const cards = team.cards.filter(Boolean);
    const classCounts = countTeamClasses(cards);
    const teamMods = {};

    for (const [cls, count] of Object.entries(classCounts)) {
      const tier = getClassBondTier(count);
      if (!tier) continue;
      const effect = getClassBondEffect(cls, count);
      if (!effect) continue;

      this.emit({
        type: 'SYNERGY_APPLIED',
        teamName: team.playerName,
        bondType: 'class',
        bondName: CLASS_BOND_NAMES[cls],
        tier,
        count,
      });

      for (const [key, val] of Object.entries(effect)) {
        if (typeof val === 'number' && (key.includes('Pct') || key.includes('Mul') || key.startsWith('team'))) {
          teamMods[key] = (teamMods[key] || 0) + val;
        } else {
          teamMods[key] = Math.max(teamMods[key] || 0, val);
        }
      }
    }

    for (const card of cards) {
      card.bondMods = { ...teamMods };
      if (teamMods.teamAtkPct) card.attack = Math.round(card.attack * (1 + teamMods.teamAtkPct));
      if (teamMods.teamDefPct) card.defense = Math.round(card.defense * (1 + teamMods.teamDefPct));
      if (teamMods.teamCrit) card.critRate += teamMods.teamCrit;

      const cls = card.cardClass;
      if (cls === 'assassin') {
        if (teamMods.assassinCrit) card.critRate += teamMods.assassinCrit;
        if (teamMods.assassinSpdPct) card.speed = Math.round(card.speed * (1 + teamMods.assassinSpdPct));
        if (teamMods.assassinAtkPct) card.attack = Math.round(card.attack * (1 + teamMods.assassinAtkPct));
      }
      if (cls === 'archer' && teamMods.archerAtkPct) {
        card.attack = Math.round(card.attack * (1 + teamMods.archerAtkPct));
      }
      if (cls === 'mage' && teamMods.mageCdReduce) {
        for (const skill of card.skills) {
          if (skill.cooldown > 0) skill.cooldown = Math.max(1, Math.round(skill.cooldown * (1 - teamMods.mageCdReduce)));
        }
      }
      if (cls === 'tank' && teamMods.tankTauntChance && Math.random() < teamMods.tankTauntChance) {
        this.addStatus(card, { type: 'TAUNT', value: 0, duration: 1, source: card.id });
      }
    }
  }

  isSilenced(card) {
    return this.hasStatus(card, 'SILENCE');
  }

  hasStatus(card, type) {
    return card.statusEffects.some(s => s.type === type && s.duration > 0);
  }

  getSkipReason(card) {
    if (this.hasStatus(card, 'STUN')) return 'STUN';
    if (this.hasStatus(card, 'FREEZE')) return 'FREEZE';
    if (this.hasStatus(card, 'ENTANGLE')) return 'ENTANGLE';
    if (this.hasStatus(card, 'PARALYZE') && Math.random() < 0.5) return 'PARALYZE';
    return null;
  }

  isSkipTurn(card) {
    return this.getSkipReason(card) !== null;
  }

  evaluateCondition(condition, caster, target) {
    if (condition === 'lowHp50' && target) return target.hp < target.maxHp * 0.5;
    if (condition === 'lowHp40' && target) return target.hp < target.maxHp * 0.4;
    if (condition === 'chance50') return Math.random() < 0.5;
    if (condition === 'chance30') return Math.random() < 0.3;
    if (condition === 'chance80') return Math.random() < 0.8;
    return true;
  }

  getBondSkillMul(caster) {
    let mul = 1;
    const mods = caster.bondMods || {};
    if (caster.cardClass === 'mage' && mods.mageSkillDmg) mul += mods.mageSkillDmg;
    if (caster.cardClass === 'support' && mods.supportSkillMul) mul += mods.supportSkillMul;
    return mul;
  }

  getBondHealMul(caster) {
    let mul = 1;
    const mods = caster.bondMods || {};
    if (mods.teamHealPct) mul += mods.teamHealPct;
    if (caster.cardClass === 'support' && mods.supportSkillMul) mul += mods.supportSkillMul;
    return mul;
  }

  getBondShieldMul(caster) {
    let mul = 1;
    const mods = caster.bondMods || {};
    if (mods.teamShieldPct) mul += mods.teamShieldPct;
    return mul;
  }

  resolveTargets(targetType, caster, hintTarget) {
    const myTeam = this.getTeam(caster);
    const enemyTeam = this.getEnemyTeam(caster);
    const aliveEnemies = this.getAliveCards(enemyTeam);
    const aliveAllies = this.getAliveCards(myTeam);
    const hpRatio = (c) => c.hp / (c.maxHp || 1);

    switch (targetType) {
      case 'SELF': return [caster];
      case 'ALL_ALLIES': return aliveAllies;
      case 'ALL_ENEMIES': return aliveEnemies;
      case 'RANDOM_ENEMY':
        return aliveEnemies.length ? [aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]] : [];
      case 'RANDOM_ALLY':
        return aliveAllies.length ? [aliveAllies[Math.floor(Math.random() * aliveAllies.length)]] : [];
      case 'FRONT_ENEMY': {
        const sorted = [...aliveEnemies].sort((a, b) => a.position - b.position);
        return sorted.length ? [sorted[0]] : [];
      }
      case 'LOWEST_HP_ENEMY': {
        const sorted = [...aliveEnemies].sort((a, b) => hpRatio(a) - hpRatio(b));
        return sorted.length ? [sorted[0]] : [];
      }
      case 'LOWEST_HP_ALLY': {
        const sorted = [...aliveAllies].sort((a, b) => hpRatio(a) - hpRatio(b));
        return sorted.length ? [sorted[0]] : [];
      }
      case 'ADJACENT_ALLIES': {
        const adjacent = [];
        if (caster.position > 0) {
          const left = myTeam.cards[caster.position - 1];
          if (left?.isAlive && left.hp > 0) adjacent.push(left);
        }
        if (caster.position < 6) {
          const right = myTeam.cards[caster.position + 1];
          if (right?.isAlive && right.hp > 0) adjacent.push(right);
        }
        return adjacent;
      }
      case 'OPPOSING': {
        const opp = enemyTeam.cards[caster.position];
        return opp && opp.isAlive && opp.hp > 0 ? [opp] : this.resolveTargets('FRONT_ENEMY', caster);
      }
      case 'KILLER':
        return hintTarget ? [hintTarget] : [];
      default: return hintTarget ? [hintTarget] : [];
    }
  }

  triggerSkills(card, trigger, source) {
    if (!card.isAlive || card.hp <= 0) return;

    for (const skill of card.skills) {
      if (skill.trigger !== trigger) continue;
      if (this.isSilenced(card) && getSkillType(trigger) === 'active') continue;
      if (skill.currentCooldown > 0) continue;
      if (skill.oncePerBattle && skill.usedThisBattle) continue;

      const targets = this.resolveTargets(skill.target, card, source);
      if (skill.condition && targets.length) {
        if (!this.evaluateCondition(skill.condition, card, targets[0])) continue;
      }

      this.emit({ type: 'SKILL_TRIGGER', cardId: card.id, cardName: card.name, skillName: skill.name, skillId: skill.id });

      for (const effect of skill.effects) {
        const effectTargets = this.resolveTargets(effect.target, card, source);
        for (const t of effectTargets) {
          this.executeEffect(effect, card, t);
        }
      }

      if (skill.cooldown > 0) skill.currentCooldown = skill.cooldown;
      if (skill.oncePerBattle) skill.usedThisBattle = true;

      const mods = card.bondMods || {};
      if (card.cardClass === 'mage' && mods.mageSilenceChance && Math.random() < mods.mageSilenceChance) {
        const enemies = this.getAliveCards(this.getEnemyTeam(card));
        if (enemies.length) {
          const t = enemies[Math.floor(Math.random() * enemies.length)];
          this.addStatus(t, { type: 'SILENCE', value: 0, duration: 1, source: card.id });
          this.emit({ type: 'STATUS_APPLIED', cardId: t.id, cardName: t.name, status: 'SILENCE' });
        }
      }
    }
  }

  executeEffect(effect, caster, target) {
    if (!target || !target.isAlive) return;
    switch (effect.type) {
      case 'DEAL_DAMAGE': {
        const dmg = this.calculateDamage(caster, target, effect.amount);
        this.applyDamage(target, dmg, caster);
        if (target.hp <= 0) this.onCardDeath(target, caster);
        break;
      }
      case 'HEAL':
        this.healCard(target, Math.round(effect.amount * this.getBondHealMul(caster)), caster);
        break;
      case 'CLEANSE': {
        const removed = target.statusEffects.filter(s => NEGATIVE_STATUSES.has(s.type)).length;
        target.statusEffects = target.statusEffects.filter(s => !NEGATIVE_STATUSES.has(s.type));
        this.emit({ type: 'CLEANSED', cardId: target.id, cardName: target.name, count: removed });
        break;
      }
      case 'BUFF':
        this.addStatus(target, { type: effect.stat.toUpperCase() + '_UP', stat: effect.stat, value: effect.value, duration: effect.duration, source: caster.id });
        this.emit({ type: 'BUFF_APPLIED', cardId: target.id, cardName: target.name, stat: effect.stat, value: effect.value, duration: effect.duration });
        break;
      case 'DEBUFF':
        this.addStatus(target, { type: 'DEBUFF', stat: effect.stat, value: -effect.value, duration: effect.duration, source: caster.id });
        this.emit({ type: 'DEBUFF_APPLIED', cardId: target.id, cardName: target.name, stat: effect.stat, value: effect.value, duration: effect.duration });
        break;
      case 'SHIELD': {
        const amount = Math.round(effect.amount * this.getBondShieldMul(caster));
        target.shield += amount;
        this.emit({ type: 'SHIELD_GAINED', cardId: target.id, cardName: target.name, amount, totalShield: target.shield });
        break;
      }
      case 'APPLY_STATUS':
        this.addStatus(target, { type: effect.status, value: effect.value || 0, duration: effect.duration, source: caster.id });
        this.emit({ type: 'STATUS_APPLIED', cardId: target.id, cardName: target.name, status: effect.status, duration: effect.duration });
        break;
      case 'GAIN_GOLD':
        break;
      case 'EXECUTE':
        if (target.hp / target.maxHp < (effect.threshold || 0.2) && Math.random() < (effect.chance ?? 1)) {
          target.hp = 0;
          target.isAlive = false;
          this.emit({ type: 'EXECUTE', cardId: target.id, cardName: target.name, killerName: caster.name });
          this.onCardDeath(target, caster);
        }
        break;
      default:
        break;
    }
  }

  addStatus(card, status) {
    card.statusEffects.push({ ...status, id: `${status.type}_${Date.now()}_${Math.random()}` });
  }

  applyVariance(damage) {
    const v = CONFIG.DAMAGE_VARIANCE ?? 0.1;
    return damage * (1 - v + Math.random() * v * 2);
  }

  calculateDamage(attacker, defender, baseAmount) {
    let damage = baseAmount ?? attacker.attack;
    if (baseAmount != null) damage *= this.getBondSkillMul(attacker);
    damage *= this.getElementMul(attacker.element, defender.element);

    for (const s of attacker.statusEffects) {
      if (s.stat === 'attack' && s.duration > 0) damage *= (1 + s.value);
    }

    let defense = defender.defense;
    for (const s of defender.statusEffects) {
      if (s.stat === 'defense' && s.duration > 0) defense += s.value;
    }
    defense = Math.max(0, defense);
    damage = Math.max(CONFIG.MIN_DAMAGE, damage - defense);

    if (Math.random() < attacker.critRate) {
      damage *= attacker.critDamage;
      this.emit({ type: 'CRIT', cardId: attacker.id, cardName: attacker.name });
    }

    const mods = attacker.bondMods || {};
    if (attacker.cardClass === 'assassin' && mods.lowHpDmgBonus && defender.hp < defender.maxHp * 0.5) {
      damage *= (1 + mods.lowHpDmgBonus);
    }

    return Math.round(this.applyVariance(damage));
  }

  applyDamage(card, damage, source) {
    if (this.hasStatus(card, 'INVINCIBLE')) {
      this.emit({ type: 'DAMAGE_BLOCKED', cardId: card.id, cardName: card.name, reason: 'INVINCIBLE' });
      return;
    }

    const dodgeRate = card.statusEffects
      .filter(s => s.type === 'DODGE' && s.duration > 0)
      .reduce((sum, s) => sum + (s.value || 0), 0);
    if (dodgeRate > 0 && Math.random() < dodgeRate) {
      this.emit({ type: 'DODGE', cardId: card.id, cardName: card.name, attackerId: source?.id });
      return;
    }

    let remaining = damage;
    if (card.shield > 0) {
      const absorb = Math.min(remaining, card.shield);
      card.shield -= absorb;
      remaining -= absorb;
      this.emit({ type: 'SHIELD_ABSORB', cardId: card.id, cardName: card.name, amount: absorb, remainingShield: card.shield });
    }

    if (remaining > 0) {
      const actual = Math.min(remaining, card.hp);
      card.hp -= actual;
      this.emit({
        type: 'DAMAGE_TAKEN', cardId: card.id, cardName: card.name,
        damage: actual, remainingHp: card.hp, maxHp: card.maxHp, sourceName: source?.name,
      });
      if (card.hp <= 0) card.isAlive = false;
    }

    if (source?.isAlive && this.hasStatus(source, 'LIFESTEAL')) {
      const ls = source.statusEffects.find(s => s.type === 'LIFESTEAL' && s.duration > 0);
      if (ls) this.healCard(source, Math.round(damage * (ls.value || 0.2)), source);
    }
  }

  healCard(card, amount, source) {
    if (!card.isAlive && card.hp <= 0 && amount < card.maxHp) return;
    const actual = Math.min(amount, card.maxHp - card.hp);
    if (actual <= 0 && card.hp > 0) return;
    card.hp += actual || amount;
    if (card.hp > 0) card.isAlive = true;
    this.emit({ type: 'HEAL', cardId: card.id, cardName: card.name, amount: actual || amount, newHp: card.hp, sourceId: source?.id });
  }

  tryCounter(defender, attacker) {
    if (!this.hasStatus(defender, 'COUNTER') || !defender.isAlive || !attacker?.isAlive) return;
    const counterStatus = defender.statusEffects.find(s => s.type === 'COUNTER' && s.duration > 0);
    const counterVal = counterStatus?.value || 3;
    const counterDmg = counterVal < 1
      ? Math.max(CONFIG.MIN_DAMAGE, Math.round(defender.attack * counterVal))
      : Math.max(CONFIG.MIN_DAMAGE, counterVal);
    this.emit({ type: 'COUNTER_ATTACK', cardId: defender.id, cardName: defender.name, targetName: attacker.name, damage: counterDmg });
    this.applyDamage(attacker, counterDmg, defender);
    if (attacker.hp <= 0) this.onCardDeath(attacker, defender);
  }

  onCardDeath(card, killer) {
    if (card._deathHandled) return;
    card._deathHandled = true;
    card.isAlive = false;
    card.hp = 0;

    this.emit({
      type: 'CARD_DEATH', cardId: card.id, cardName: card.name,
      killerId: killer?.id, killerName: killer?.name, position: card.position,
    });

    this.triggerSkills(card, 'ON_DEATH', killer);

    if (card.isAlive && card.hp > 0) {
      card._deathHandled = false;
      this.emit({ type: 'CARD_REVIVED', cardId: card.id, cardName: card.name, newHp: card.hp });
      return;
    }

    const team = this.getTeam(card);
    for (const ally of this.getAliveCards(team)) {
      this.triggerSkills(ally, 'ON_ALLY_DEATH', card);
    }
    if (killer?.isAlive) {
      this.triggerSkills(killer, 'ON_KILL', card);
    }

    if (this.getAliveCards(team).length === 0) {
      this.emit({ type: 'TEAM_DEFEATED', teamId: team.playerId, teamName: team.playerName });
    }
  }

  selectTarget(attacker) {
    const enemies = this.getAliveCards(this.getEnemyTeam(attacker));
    if (!enemies.length) return null;
    const visible = enemies.filter(c => !this.hasStatus(c, 'STEALTH'));
    const pool = visible.length ? visible : enemies;
    const taunters = pool.filter(c => this.hasStatus(c, 'TAUNT'));
    if (taunters.length) return taunters.sort((a, b) => a.position - b.position)[0];
    return pool.sort((a, b) => a.position - b.position)[0];
  }

  performAttack(attacker, defender) {
    if (this.hasStatus(attacker, 'BLIND') && Math.random() < 0.3) {
      this.emit({ type: 'ATTACK_MISSED', cardId: attacker.id, cardName: attacker.name, reason: 'BLIND' });
      return;
    }

    const mul = this.getElementMul(attacker.element, defender.element);
    const relation = getElementRelation(attacker.element, defender.element);
    if (relation !== 'neutral') {
      this.emit({
        type: 'ELEMENT_EFFECT', relation,
        attackerName: attacker.name, defenderName: defender.name,
        attackerElement: ELEMENT_NAMES[attacker.element],
        defenderElement: ELEMENT_NAMES[defender.element],
        multiplier: mul,
      });
    }

    const damage = this.calculateDamage(attacker, defender);
    this.emit({
      type: 'ATTACK',
      attackerId: attacker.id, attackerName: attacker.name,
      defenderId: defender.id, defenderName: defender.name,
      damage, isCrit: false,
    });

    this.applyDamage(defender, damage, attacker);

    const mods = attacker.bondMods || {};
    if (mods.warriorLifesteal && attacker.cardClass === 'warrior' && damage > 0) {
      this.healCard(attacker, Math.round(damage * mods.warriorLifesteal), attacker);
    }

    if (defender.hp <= 0 || !defender.isAlive) {
      this.onCardDeath(defender, attacker);
    } else {
      this.triggerSkills(defender, 'ON_HIT', attacker);
      this.tryCounter(defender, attacker);
      if (attacker.hp <= 0 && !attacker.isAlive) {
        this.onCardDeath(attacker, defender);
      }
    }
  }

  executeCardAction(card) {
    if (!card.isAlive || card.hp <= 0) return;

    const skipReason = this.getSkipReason(card);
    if (skipReason) {
      this.emit({ type: 'ACTION_SKIPPED', cardId: card.id, cardName: card.name, reason: skipReason });
      return;
    }

    this.emit({ type: 'CARD_ACTION_START', cardId: card.id, cardName: card.name });
    this.triggerSkills(card, 'BEFORE_ATTACK');

    if (card.isAlive && card.hp > 0) {
      const target = this.selectTarget(card);
      if (target) this.performAttack(card, target);
    }

    if (card.isAlive) this.triggerSkills(card, 'AFTER_ATTACK');

    if (this.hasStatus(card, 'STEALTH')) {
      card.statusEffects = card.statusEffects.filter(s => s.type !== 'STEALTH');
    }

    this.emit({ type: 'CARD_ACTION_END', cardId: card.id, cardName: card.name });
  }

  processTurnStartEffects() {
    const alive = this.sortBySpeed(this.getAllCards().filter(c => c.isAlive && c.hp > 0));
    for (const card of alive) {
      this.triggerSkills(card, 'TURN_START');
    }

    for (const card of this.getAllCards()) {
      if (!card.isAlive) continue;
      for (const status of [...card.statusEffects]) {
        if (status.type === 'BURN' && status.duration > 0) {
          const dmg = status.value || 5;
          this.applyDamage(card, dmg, null);
          this.emit({ type: 'STATUS_DAMAGE', cardId: card.id, cardName: card.name, status: 'BURN', damage: dmg, remainingHp: card.hp });
          if (card.hp <= 0) this.onCardDeath(card, null);
        }
        if (status.type === 'POISON' && status.duration > 0) {
          const poisonDmg = Math.max(CONFIG.MIN_DAMAGE, status.value || 3);
          this.applyDamage(card, poisonDmg, null);
          this.emit({ type: 'STATUS_DAMAGE', cardId: card.id, cardName: card.name, status: 'POISON', damage: poisonDmg, remainingHp: card.hp });
          if (card.hp <= 0) this.onCardDeath(card, null);
        }
      }
    }
  }

  processTurnEndEffects() {
    for (const card of this.getAllCards()) {
      if (!card) continue;
      for (const status of [...card.statusEffects]) {
        status.duration -= 1;
        if (status.duration <= 0) {
          card.statusEffects = card.statusEffects.filter(s => s.id !== status.id);
          this.emit({ type: 'STATUS_EXPIRED', cardId: card.id, cardName: card.name, status: status.type });
        }
      }
      for (const skill of card.skills) {
        if (skill.currentCooldown > 0) skill.currentCooldown--;
      }
    }
  }

  checkBattleEnd() {
    const aliveA = this.getAliveCards(this.teamA).length;
    const aliveB = this.getAliveCards(this.teamB).length;
    if (aliveA === 0 && aliveB > 0) return this.createResult(this.playerB, this.playerA, 'NORMAL');
    if (aliveB === 0 && aliveA > 0) return this.createResult(this.playerA, this.playerB, 'NORMAL');
    if (aliveA === 0 && aliveB === 0) return this.createResult(null, null, 'DRAW');
    if (this.turn >= CONFIG.MAX_TURNS_PER_BATTLE) return this.resolveTimeout();
    return null;
  }

  resolveTimeout() {
    const hpA = this.getAliveCards(this.teamA).reduce((s, c) => s + c.hp, 0);
    const hpB = this.getAliveCards(this.teamB).reduce((s, c) => s + c.hp, 0);
    const maxA = this.teamA.cards.filter(Boolean).reduce((s, c) => s + c.maxHp, 0) || 1;
    const maxB = this.teamB.cards.filter(Boolean).reduce((s, c) => s + c.maxHp, 0) || 1;
    const ratioA = hpA / maxA;
    const ratioB = hpB / maxB;
    if (ratioA > ratioB) return this.createResult(this.playerA, this.playerB, 'TIMEOUT');
    if (ratioB > ratioA) return this.createResult(this.playerB, this.playerA, 'TIMEOUT');
    return this.createResult(null, null, 'DRAW');
  }

  createResult(winner, loser, type) {
    const survivorsA = this.getAliveCards(this.teamA).length;
    const survivorsB = this.getAliveCards(this.teamB).length;
    let damage = 0;
    if (winner && loser) {
      const survivors = winner.id === this.playerA.id ? survivorsA : survivorsB;
      const stageIdx = Math.min(this.turn, CONFIG.STAGE_DAMAGE.length - 1);
      damage = survivors * CONFIG.DAMAGE_PER_SURVIVOR + CONFIG.STAGE_DAMAGE[stageIdx];
    } else if (type === 'DRAW') {
      const stageIdx = Math.min(this.turn, CONFIG.STAGE_DAMAGE.length - 1);
      damage = CONFIG.STAGE_DAMAGE[stageIdx];
    }
    return { winner, loser, type, damage, turnCount: this.turn, eventLog: this.eventLog, teamA: this.teamA, teamB: this.teamB };
  }

  initBattle() {
    this.emit({ type: 'BATTLE_START' });
    const sorted = this.sortBySpeed(this.getAllCards());
    for (const card of sorted) {
      this.triggerSkills(card, 'BATTLE_START');
    }
    this.applyBonds();
    this.emit({ type: 'BATTLE_READY' });
  }

  runStep() {
    if (this.turn === 0) this.initBattle();

    this.turn++;
    this.emit({ type: 'TURN_START', turn: this.turn });
    this.processTurnStartEffects();

    let result = this.checkBattleEnd();
    if (result) {
      this.emit({ type: 'BATTLE_END', ...result });
      return { done: true, result };
    }

    const sorted = this.sortBySpeed(this.getAllCards().filter(c => c.isAlive && c.hp > 0));
    for (const card of sorted) {
      if (!card.isAlive) continue;
      this.executeCardAction(card);
      result = this.checkBattleEnd();
      if (result) {
        this.emit({ type: 'BATTLE_END', ...result });
        return { done: true, result };
      }
    }

    this.processTurnEndEffects();
    this.emit({ type: 'TURN_END', turn: this.turn });

    result = this.checkBattleEnd();
    if (result) {
      this.emit({ type: 'BATTLE_END', ...result });
      return { done: true, result };
    }
    return { done: false, result: null };
  }

  async runBattle(delayMs = CONFIG.TURN_INTERVAL) {
    while (true) {
      const { done, result } = this.runStep();
      if (done) return result;
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
    }
  }
}
