/** 状态效果说明 — Tooltip 数据源 */
export const STATUS_DEFS = {
  BURN: { name: '灼烧', desc: '每回合受到火焰伤害', kind: 'debuff' },
  POISON: { name: '中毒', desc: '每回合受到毒素伤害', kind: 'debuff' },
  STUN: { name: '眩晕', desc: '无法行动', kind: 'debuff' },
  FREEZE: { name: '冰冻', desc: '无法行动', kind: 'debuff' },
  PARALYZE: { name: '麻痹', desc: '无法行动', kind: 'debuff' },
  ENTANGLE: { name: '缠绕', desc: '无法行动', kind: 'debuff' },
  SILENCE: { name: '沉默', desc: '无法释放技能', kind: 'debuff' },
  BLIND: { name: '致盲', desc: '攻击有概率落空', kind: 'debuff' },
  DODGE: { name: '闪避', desc: '提高闪避概率', kind: 'buff' },
  TAUNT: { name: '嘲讽', desc: '敌人优先攻击该单位', kind: 'buff' },
  SHIELD: { name: '护盾', desc: '吸收伤害', kind: 'buff' },
  REGEN: { name: '再生', desc: '每回合恢复生命', kind: 'buff' },
  INVINCIBLE: { name: '无敌', desc: '免疫伤害', kind: 'buff' },
  THORNS: { name: '反伤', desc: '受击时对攻击者造成伤害', kind: 'buff' },
  STEALTH: { name: '潜行', desc: '无法被单体技能选中', kind: 'buff' },
};

export function formatStatusTooltip(status) {
  const def = STATUS_DEFS[status.type] || { name: status.type, desc: '状态效果' };
  const lines = [def.desc];
  if (status.duration > 0 && status.duration < 90) lines.push(`剩余 ${status.duration} 回合`);
  if (status.value) lines.push(`强度 ${status.value}`);
  return { title: def.name, desc: lines.join(' · '), kind: def.kind };
}

export function escapeTooltipAttr(obj) {
  return JSON.stringify(obj).replace(/"/g, '&quot;');
}
