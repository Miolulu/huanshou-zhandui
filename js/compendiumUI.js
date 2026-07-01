/** 怪物手册 · 主页图鉴面板 */
import { ENEMIES, getAllEnemyIds } from './roguelike/enemies.js';
import { enemySpriteUrl } from './roguelike/assetPaths.js';
import { loadProfile } from './playerProfile.js';
import { getCompendiumEntry, ensurePurifyProfile } from './roguelike/purifyProfile.js';

export function renderCompendiumPanel(container) {
  if (!container) return;
  const profile = ensurePurifyProfile(loadProfile());
  const ids = getAllEnemyIds();

  container.innerHTML = `
    <div class="compendium-header">
      <h3 id="compendium-modal-title">怪物手册</h3>
    </div>
    <div class="compendium-grid">
      ${ids.map((id) => renderCompendiumCard(id, profile)).join('')}
    </div>`;
}

function compendiumPortraitHtml(id, def) {
  const src = enemySpriteUrl(id);
  if (src) {
    return `<div class="compendium-icon compendium-portrait" aria-hidden="true"><img src="${src}" alt=""></div>`;
  }
  return `<div class="compendium-icon">${def.icon}</div>`;
}

function renderCompendiumCard(id, profile) {
  const def = ENEMIES[id];
  const entry = getCompendiumEntry(profile, id);
  const unlocked = entry?.seen;

  if (!unlocked) {
    return `
      <article class="compendium-card locked">
        <div class="compendium-icon">???</div>
        <h4>未知幻兽</h4>
      </article>`;
  }

  const defeated = entry?.defeated;
  return `
    <article class="compendium-card ${defeated ? 'defeated' : 'seen'}">
      ${compendiumPortraitHtml(id, def)}
      <h4>${def.name}</h4>
      <p class="compendium-personality"><strong>性格</strong> ${def.personality || '—'}</p>
      <p class="compendium-story"><strong>故事</strong> ${def.story || def.desc}</p>
      <p class="compendium-weakness"><strong>弱点</strong> ${def.weakness || '—'}</p>
      <span class="compendium-tag">${defeated ? '已净化' : '已发现'}</span>
    </article>`;
}

export function renderPurifyRecords(container) {
  if (!container) return;
  const p = ensurePurifyProfile(loadProfile());
  const tier = p.purify.tier;
  const inf = p.purify.infinite;
  const exp = p.purify.expedition;

  container.innerHTML = `
    <h4>净化记录</h4>
    <div class="purify-records">
      <div class="record-row">
        <span>阶层挑战最高层</span>
        <strong>${tier.bestFloor || 0} / 100</strong>
      </div>
      <div class="record-row">
        <span>阶层通关</span>
        <strong>${tier.cleared ? '已完成' : '未通关'}</strong>
      </div>
      <div class="record-row">
        <span>无限模式最高层</span>
        <strong>${inf.bestFloor || 0}</strong>
      </div>
      <div class="record-row">
        <span>无限模式次数</span>
        <strong>${inf.totalRuns || 0}</strong>
      </div>
      <div class="record-row">
        <span>远征完成</span>
        <strong>${exp.wins || 0} 次</strong>
      </div>
    </div>`;
}
