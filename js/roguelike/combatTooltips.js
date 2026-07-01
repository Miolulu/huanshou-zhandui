/** 战斗单位 hover 注解 */
import { ENEMIES, intentLabel } from './enemies.js';
import { TERMS } from './lore.js';

function statLine(label, value) {
  return value ? `${label}：${value}` : '';
}

export function playerTooltipData(combat) {
  const p = combat.player;
  const lines = [
    statLine(TERMS.mind, `${p.hp} / ${p.maxHp}`),
    p.block > 0 ? statLine(TERMS.barrier, p.block) : '',
    p.energy != null ? statLine(TERMS.spirit, `${p.energy} / ${p.maxEnergy}`) : '',
    combat.strength > 0 ? statLine(TERMS.purifyPower, combat.strength) : '',
    combat.weak > 0 ? statLine(TERMS.miasma, `${combat.weak} 回合`) : '',
    combat.powers?.barrier > 0 ? `${TERMS.cardPower}·护幕：每回合 +3 护幕` : '',
    combat.powers?.rage > 0 ? '净化之怒：攻型技法后 +1 净化力' : '',
  ].filter(Boolean);
  return {
    title: TERMS.playerRole,
    desc: '拖动攻型技法至污化幻兽，守型与秘法拖向自身或战场。',
    stats: lines.join('<br>'),
  };
}

export function enemyTooltipData(enemy) {
  const def = ENEMIES[enemy.id];
  const lines = [
    enemy.hp > 0 ? statLine('下轮意图', intentLabel(enemy.intent)) : '',
    statLine(TERMS.taint, `${enemy.hp} / ${enemy.maxHp}`),
    enemy.block > 0 ? statLine('淤壳', enemy.block) : '',
    enemy.strength > 0 ? statLine(TERMS.purifyPower, enemy.strength) : '',
    enemy.poison > 0 ? statLine(TERMS.taintStack, `${enemy.poison} 层`) : '',
    def?.personality ? `性格：${def.personality}` : '',
    def?.weakness ? `弱点：${def.weakness}` : '',
  ].filter(Boolean);
  return {
    title: enemy.name,
    desc: enemy.desc || def?.desc || def?.story || '',
    stats: lines.join('<br>'),
  };
}

export function setTooltip(el, data) {
  if (!el || !data) return;
  el.dataset.tooltip = JSON.stringify(data);
  delete el._tooltipBound;
}
