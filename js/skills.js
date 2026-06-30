import { getSkillType, TRIGGER_NAMES } from './elements.js';

export function formatSkillList(skills) {
  if (!skills?.length) return '<p class="hint">无技能</p>';

  const active = skills.filter(s => getSkillType(s.trigger) === 'active');
  const passive = skills.filter(s => getSkillType(s.trigger) === 'passive');

  let html = '';
  if (active.length) {
    html += '<div class="skill-group"><span class="skill-tag active-tag">主动</span>';
    html += active.map(renderSkill).join('');
    html += '</div>';
  }
  if (passive.length) {
    html += '<div class="skill-group"><span class="skill-tag passive-tag">被动</span>';
    html += passive.map(renderSkill).join('');
    html += '</div>';
  }
  return html;
}

function renderSkill(skill) {
  const trigger = TRIGGER_NAMES[skill.trigger] || skill.trigger;
  const cd = skill.cooldown > 0 ? ` · CD ${skill.cooldown}回合` : '';
  const evo = skill.evolved ? ' <span class="evo-tag">★3</span>' : '';
  return `<div class="skill-item${skill.evolved ? ' skill-evolved' : ''}">
    <strong>${skill.name}${evo}</strong>
    <span class="skill-trigger">[${trigger}${cd}]</span>
    <p>${skill.description || ''}</p>
  </div>`;
}

export function formatSkillCompact(skills) {
  return skills.map(s => {
    const type = getSkillType(s.trigger) === 'active' ? '主' : '被';
    return `<span class="skill-chip ${type === '主' ? 'chip-active' : 'chip-passive'}" title="${s.description}">${type}·${s.name}</span>`;
  }).join('');
}
