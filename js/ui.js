import {
  CONFIG,
  getTeamSlotUpgradeCost,
  getTavernUpgradeCost,
  getAvailableRarities,
  ELEMENT_NAMES,
  RARITY_NAMES,
} from './config.js';
import { getTemplate } from './cards.js';
import { formatSkillList } from './skills.js';
import { elementBadgeHtml, classBadgeHtml } from './appShell.js';
import { summarizeActiveElementBonds } from './elements.js';
import { summarizeActiveClassBonds, CLASS_NAMES } from './classes.js';
import { renderBondGuideHTML, renderActiveBondsBattle } from './bondGuide.js';

const RARITY_CLASS = { common: 'r-common', rare: 'r-rare', epic: 'r-epic', legendary: 'r-legendary' };

export class UI {
  constructor(game) {
    this.game = game;
    this.selectedTeamPos = null;
    this.endRewards = null;
    this.bondGuideOpen = false;
    this.bindElements();
    this.bindActions();
  }

  bindElements() {
    this.el = {
      phase: document.getElementById('phase-info'),
      turn: document.getElementById('turn-info'),
      goldAmount: document.getElementById('gold-amount'),
      goldIncome: document.getElementById('gold-income'),
      hp: document.getElementById('hp-info'),
      streak: document.getElementById('streak-info'),
      tavernTier: document.getElementById('tavern-tier'),
      tavernCost: document.getElementById('tavern-cost'),
      teamCost: document.getElementById('team-cost'),
      shopHint: document.getElementById('shop-tier-hint'),
      players: document.getElementById('players-list'),
      shop: document.getElementById('shop-cards'),
      team: document.getElementById('team-slots'),
      opponent: document.getElementById('opponent-info'),
      battleField: document.getElementById('battle-field'),
      battleLog: document.getElementById('battle-log'),
      cardPanel: document.getElementById('card-action-panel'),
      selectedName: document.getElementById('selected-card-name'),
      selectedStats: document.getElementById('selected-card-stats'),
      selectedSkills: document.getElementById('selected-card-skills'),
      selectedElement: document.getElementById('selected-card-element'),
      selectedDesc: document.getElementById('selected-card-desc'),
      teamBonds: document.getElementById('team-bonds'),
      overlay: document.getElementById('overlay'),
      overlayTitle: document.getElementById('overlay-title'),
      overlayBody: document.getElementById('overlay-body'),
      battleActiveBonds: document.getElementById('battle-active-bonds'),
      bondGuidePanel: document.getElementById('bond-guide-panel'),
    };
  }

  bindActions() {
    document.getElementById('btn-end-prepare').onclick = () => {
      if (this.game.phase === 'PREPARE') this.game.endPreparePhase();
    };
    document.getElementById('btn-refresh').onclick = () => {
      this.game.refreshShopManual(this.game.getHuman());
    };
    document.getElementById('btn-freeze').onclick = () => {
      this.game.toggleFreeze(this.game.getHuman());
    };
    document.getElementById('btn-upgrade-tavern').onclick = () => {
      this.game.upgradeTavern(this.game.getHuman());
    };
    document.getElementById('btn-upgrade-team').onclick = () => {
      this.game.upgradeTeam(this.game.getHuman());
    };
    document.getElementById('btn-sell-card').onclick = () => {
      if (this.selectedTeamPos !== null) {
        this.game.sellCard(this.game.getHuman(), this.selectedTeamPos);
        this.selectedTeamPos = null;
        this.renderCardPanel(null);
      }
    };
    document.getElementById('btn-skip-battle').onclick = () => this.game.skipBattle();
    document.getElementById('btn-toggle-bond-guide').onclick = () => this.toggleBondGuide();
    if (this.el.bondGuidePanel && !this.el.bondGuidePanel.dataset.ready) {
      this.el.bondGuidePanel.innerHTML = renderBondGuideHTML();
      this.el.bondGuidePanel.dataset.ready = '1';
    }
  }

  toggleBondGuide() {
    this.bondGuideOpen = !this.bondGuideOpen;
    this.el.bondGuidePanel?.classList.toggle('hidden', !this.bondGuideOpen);
    const btn = document.getElementById('btn-toggle-bond-guide');
    if (btn) btn.textContent = this.bondGuideOpen ? '收起说明' : '羁绊说明';
  }

  render(state) {
    const human = state.human;
    if (!human) {
      this.showStartScreen();
      return;
    }

    this.renderHeader(state, human);
    this.renderPlayers(state);
    this.renderTavernControls(human, state);
    this.renderShop(human);
    this.renderTeam(human);
    this.renderTeamBonds(human);
    this.renderCardPanel(human.team.cards[this.selectedTeamPos] ?? null, human);
    this.renderOpponent(state);
    this.renderButtonStates(state, human);
    this.renderBattleField(state);
    this.renderBattleBonds(human, state.phase);

    if (state.phase === 'ENDED') {
      this.showOverlay('游戏结束', this.buildEndSummary(state));
    } else {
      this.hideOverlay();
    }
  }

  showStartScreen() {
    this.el.phase.textContent = '等待开始';
    this.el.turn.textContent = '-';
    this.el.goldAmount.textContent = '0';
    this.el.goldIncome.textContent = '';
  }

  renderHeader(state, human) {
    const phaseNames = { PREPARE: '准备', MATCH: '匹配', BATTLE: '战斗', SETTLE: '结算', ENDED: '结束' };
    this.el.phase.textContent = phaseNames[state.phase] || state.phase;
    this.el.turn.textContent = `R${state.turn}`;
    this.el.goldAmount.textContent = human.gold;
    this.el.hp.textContent = `${human.hp}/${human.maxHp}`;
    this.el.streak.textContent = `胜${human.winStreak} 负${human.lossStreak}`;

    if (human.lastIncome) {
      const inc = human.lastIncome;
      const parts = [`基础${inc.base}`, `利息${inc.interest}`];
      if (inc.streakBonus > 0) parts.push(`${inc.streakLabel}${inc.streakBonus}`);
      if (inc.skillGold) parts.push(`技能${inc.skillGold}`);
      this.el.goldIncome.textContent = `(本回合 +${inc.total}：${parts.join(' · ')})`;
    } else {
      this.el.goldIncome.textContent = '';
    }
  }

  renderTavernControls(human, state) {
    this.el.tavernTier.textContent = human.tavernTier;

    const tavernCost = getTavernUpgradeCost(human.tavernTier);
    const teamCost = getTeamSlotUpgradeCost(human.team.maxSize);
    const rarities = getAvailableRarities(human.tavernTier).map(r => RARITY_NAMES[r]).join('/');

    this.el.tavernCost.textContent = human.tavernTier >= CONFIG.MAX_TAVERN_TIER
      ? '(满级)' : `(${tavernCost}金→${human.tavernTier + 1}级)`;
    this.el.teamCost.textContent = human.team.maxSize >= CONFIG.MAX_TEAM_SIZE
      ? '(满)' : `(${teamCost}金→${human.team.maxSize + 1}格)`;
    this.el.shopHint.textContent = `货架均为 ★1 · 可刷出 ${rarities}`;
    document.getElementById('freeze-state').textContent = human.shop.frozen ? '开' : '关';
  }

  renderPlayers(state) {
    this.el.players.innerHTML = state.players.map(p => {
      const status = p.eliminated ? '淘汰' : `${p.hp}HP`;
      return `<div class="player-row ${p.eliminated ? 'eliminated' : ''} ${p.isHuman ? 'human' : ''}">
        <span>${p.isHuman ? '★ ' : ''}${p.name}</span>
        <span>${status}</span>
      </div>`;
    }).join('');
  }

  renderShop(human) {
    if (this.game.phase !== 'PREPARE') {
      this.el.shop.innerHTML = '<p class="hint">战斗阶段无法购物</p>';
      return;
    }
    this.el.shop.innerHTML = human.shop.cards.map((sc, i) => {
      const tpl = getTemplate(sc.cardTemplateId);
      const skillsHtml = tpl ? formatSkillList(tpl.skills) : '';
      return `
      <div class="card shop-card ${RARITY_CLASS[sc.rarity]}">
        <div class="card-head">
          <div class="card-name">${sc.name}</div>
          <div class="card-badges">${elementBadgeHtml(sc.element)}${classBadgeHtml(sc.cardClass || tpl?.class)}</div>
        </div>
        <div class="card-meta">★1 · ${RARITY_NAMES[sc.rarity]}</div>
        <div class="card-desc">${tpl?.description || ''}</div>
        <div class="card-skills-mini">${skillsHtml}</div>
        <div class="card-cost">${sc.cost} 金</div>
        <button class="btn-buy" data-shop-buy="${i}">购买</button>
      </div>`;
    }).join('') || '<p class="hint">货架为空</p>';

    this.el.shop.querySelectorAll('[data-shop-buy]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.game.buyCard(human, parseInt(btn.dataset.shopBuy, 10));
      };
    });
  }

  renderTeam(human) {
    this.el.team.innerHTML = Array.from({ length: CONFIG.MAX_TEAM_SIZE }, (_, i) => {
      const unlocked = i < human.team.maxSize;
      const card = human.team.cards[i];
      if (!unlocked) return `<div class="slot locked">🔒</div>`;
      if (!card) {
        return `<div class="slot empty" data-pos="${i}">${i + 1}</div>`;
      }
      const star = card.star ?? card.upgradeTier ?? 1;
      const starCls = star >= 3 ? 'star-3' : star >= 2 ? 'star-2' : 'star-1';
      return `
        <div class="slot filled ${RARITY_CLASS[card.rarity]} ${starCls} ${this.selectedTeamPos === i ? 'selected' : ''}" data-pos="${i}">
          <div class="card-head">
            <div class="card-name">${card.name}</div>
            <div class="card-badges">${elementBadgeHtml(card.element)}${classBadgeHtml(card.cardClass)}</div>
          </div>
          <div class="card-meta">${'★'.repeat(star)}${'☆'.repeat(3 - star)} · ${CLASS_NAMES[card.cardClass] || ''}</div>
          <div class="card-stats">HP${card.maxHp} ATK${card.attack} SPD${card.speed}</div>
        </div>`;
    }).join('');

    this.el.team.querySelectorAll('.slot.filled, .slot.empty').forEach(slot => {
      slot.onclick = () => this.handleTeamClick(parseInt(slot.dataset.pos, 10));
    });
  }

  renderCardPanel(card, human) {
    if (!card || this.game.phase !== 'PREPARE') {
      this.el.cardPanel.classList.add('hidden');
      return;
    }
    this.el.cardPanel.classList.remove('hidden');
    const star = card.star ?? card.upgradeTier ?? 1;
    this.el.selectedName.textContent = `${card.name} ${'★'.repeat(star)}${star >= 3 ? '（最终形态）' : ''}`;

    this.el.selectedStats.textContent =
      `HP ${card.maxHp} · ATK ${card.attack} · DEF ${card.defense} · SPD ${card.speed}`;
    this.el.selectedElement.innerHTML =
      `${elementBadgeHtml(card.element)} ${classBadgeHtml(card.cardClass)}`;
    if (this.el.selectedDesc) {
      this.el.selectedDesc.textContent = card.description || getTemplate(card.templateId)?.description || '';
    }
    this.el.selectedSkills.innerHTML = formatSkillList(card.skills);
    const mergeHint = star < 3 ? `再收集 ${Math.max(0, 3 - this.countSameStar(human, card))} 张同名 ★${star} → 自动合成 ★${star + 1}` : '已达最高星级 ★3';
    if (!this.el.selectedMergeHint) {
      const hint = document.createElement('p');
      hint.id = 'selected-merge-hint';
      hint.className = 'hint merge-hint';
      this.el.cardPanel.querySelector('.card-detail-left')?.appendChild(hint);
      this.el.selectedMergeHint = hint;
    }
    this.el.selectedMergeHint.textContent = mergeHint;
    document.getElementById('btn-sell-card').textContent = `卖出 (+${star}金)`;
  }

  countSameStar(human, card) {
    const star = card.star ?? card.upgradeTier ?? 1;
    return human.team.cards.filter(c =>
      c && c.templateId === card.templateId && (c.star ?? c.upgradeTier ?? 1) === star
    ).length;
  }

  renderBattleBonds(human, phase) {
    const cards = human.team.cards.filter((c, i) => c && i < human.team.maxSize);
    if (this.el.battleActiveBonds) {
      const showActive = ['PREPARE', 'BATTLE', 'SETTLE', 'MATCH'].includes(phase);
      this.el.battleActiveBonds.innerHTML = showActive
        ? `<h3 class="bond-active-title">当前激活羁绊</h3>${renderActiveBondsBattle(cards)}`
        : '';
    }
  }

  renderTeamBonds(human) {
    if (!this.el.teamBonds) return;
    const cards = human.team.cards.filter((c, i) => c && i < human.team.maxSize);
    const elBonds = summarizeActiveElementBonds(cards);
    const clsBonds = summarizeActiveClassBonds(cards);
    const parts = [
      ...elBonds.map(b => `<span class="bond-tag bond-el">${b.name}×${b.count}</span>`),
      ...clsBonds.map(b => `<span class="bond-tag bond-class">${b.name}×${b.count}</span>`),
    ];
    this.el.teamBonds.innerHTML = parts.length
      ? parts.join('')
      : '<span class="hint">暂无羁绊</span>';
  }

  handleTeamClick(pos) {
    const human = this.game.getHuman();
    if (this.game.phase !== 'PREPARE') return;

    if (this.selectedTeamPos === null) {
      if (human.team.cards[pos]) this.selectedTeamPos = pos;
    } else if (this.selectedTeamPos === pos) {
      this.selectedTeamPos = null;
    } else {
      this.game.moveCard(human, this.selectedTeamPos, pos);
      this.selectedTeamPos = pos;
      if (!human.team.cards[pos]) this.selectedTeamPos = null;
    }
    this.game.notify();
  }

  renderOpponent(state) {
    const opp = state.opponentPreview;
    if (!opp) {
      this.el.opponent.innerHTML = '<p class="hint">匹配后显示</p>';
      return;
    }
    const cards = opp.team.cards.filter((c, i) => c && i < opp.team.maxSize);
    this.el.opponent.innerHTML = `
      <h3>${opp.name} · ${opp.hp}HP · 酒馆${opp.tavernTier || 1}级</h3>
      <div>${cards.map(c =>
        `<span class="tag ${RARITY_CLASS[c.rarity]}">${c.name}${'★'.repeat(c.star ?? c.upgradeTier ?? 1)}</span>`
      ).join(' ') || '无阵容'}</div>`;
  }

  renderButtonStates(state, human) {
    const tavernCost = getTavernUpgradeCost(human.tavernTier);
    const teamCost = getTeamSlotUpgradeCost(human.team.maxSize);
    const isPrepare = state.phase === 'PREPARE';

    document.getElementById('btn-end-prepare').disabled = !isPrepare;
    document.getElementById('btn-refresh').disabled = !isPrepare || human.gold < CONFIG.REFRESH_COST;
    document.getElementById('btn-freeze').disabled = !isPrepare;
    document.getElementById('btn-upgrade-tavern').disabled =
      !isPrepare || human.tavernTier >= CONFIG.MAX_TAVERN_TIER || human.gold < tavernCost;
    document.getElementById('btn-upgrade-team').disabled =
      !isPrepare || human.team.maxSize >= CONFIG.MAX_TEAM_SIZE || human.gold < teamCost;
    document.getElementById('btn-skip-battle').style.display = state.phase === 'BATTLE' ? 'inline-block' : 'none';
  }

  renderBattleField(state) {
    if (state.phase !== 'BATTLE' && state.phase !== 'SETTLE') {
      this.el.battleField.innerHTML = '<p class="hint">准备完成后进入战斗</p>';
      return;
    }
    const engine = this.game.currentBattle;
    if (!engine) return;

    const renderSide = (team, label) => {
      const cards = team.cards.filter(c => c);
      return `<div class="battle-side">
        <h4>${label}</h4>
        ${cards.map(c => `
          <div class="battle-card ${c.isAlive && c.hp > 0 ? '' : 'dead'} ${RARITY_CLASS[c.rarity]}">
            ${c.name}${'★'.repeat(c.star ?? c.upgradeTier ?? 1)}<br>
            ${c.hp}/${c.maxHp}${c.shield ? ` 🛡${c.shield}` : ''}
          </div>`).join('')}
      </div>`;
    };

    this.el.battleField.innerHTML =
      renderSide(engine.teamA, engine.playerA.name) +
      '<div class="vs">VS</div>' +
      renderSide(engine.teamB, engine.playerB.name);
  }

  appendBattleLog(event) {
    const line = this.formatEvent(event);
    if (!line) return;
    const div = document.createElement('div');
    div.className = 'log-line';
    div.textContent = line;
    this.el.battleLog.appendChild(div);
    this.el.battleLog.scrollTop = this.el.battleLog.scrollHeight;
  }

  clearBattleLog() { this.el.battleLog.innerHTML = ''; }

  formatEvent(e) {
    switch (e.type) {
      case 'BATTLE_START': return '⚔ 战斗开始！';
      case 'TURN_START': return `—— 第 ${e.turn} 回合 ——`;
      case 'SKILL_TRIGGER': return `✨ ${e.cardName}【${e.skillName}】`;
      case 'ATTACK': return `🗡 ${e.attackerName} → ${e.defenderName} ${e.damage}伤`;
      case 'DAMAGE_TAKEN': return `  💥 ${e.cardName} 剩 ${e.remainingHp} HP`;
      case 'HEAL': return `💚 ${e.cardName} +${e.amount} HP`;
      case 'CARD_DEATH': return `💀 ${e.cardName} 阵亡`;
      case 'CRIT': return `💢 ${e.cardName} 暴击！`;
      case 'STATUS_APPLIED': return `🔮 ${e.cardName} ${e.status}`;
      case 'ELEMENT_EFFECT':
        return e.relation === 'strong'
          ? `⚡ ${e.attackerName}(${e.attackerElement}) 克制 ${e.defenderName}(${e.defenderElement}) ×${e.multiplier}`
          : `🛡 ${e.attackerName}(${e.attackerElement}) 被 ${e.defenderName}(${e.defenderElement}) 克制 ×${e.multiplier}`;
      case 'BOND_ACTIVE':
      case 'SYNERGY_APPLIED':
        return `🔗 ${e.teamName} 激活【${e.bondName}】${e.count ? `×${e.count}` : ''}`;
      case 'ACTION_SKIPPED':
        return `⏭ ${e.cardName} 跳过行动（${e.reason}）`;
      case 'TURN_END': return `—— 第 ${e.turn} 回合结束 ——`;
      case 'STATUS_EXPIRED': return `⌛ ${e.cardName} ${e.status} 消失`;
      case 'CARD_REVIVED': return `🌟 ${e.cardName} 复活！HP ${e.newHp}`;
      case 'TEAM_DEFEATED': return `💥 ${e.teamName} 全员阵亡`;
      case 'COUNTER_ATTACK':
      case 'COUNTER': return `↩ ${e.cardName} 反击 ${e.targetName} ${e.damage}伤`;
      case 'EXECUTE': return `⚰ ${e.killerName} 斩杀 ${e.cardName}！`;
      case 'CLEANSED':
      case 'CLEANSE': return `✨ ${e.cardName} 净化负面状态`;
      case 'ATTACK_MISSED': return `🌀 ${e.cardName} 攻击未命中（${e.reason}）`;
      case 'SHIELD_GAINED': return `🛡 ${e.cardName} +${e.amount} 护盾`;
      case 'DODGE': return `💨 ${e.cardName} 闪避！`;
      case 'BATTLE_END': return '🏁 战斗结束';
      default: return null;
    }
  }

  showOverlay(title, body) {
    this.el.overlay.style.display = 'flex';
    this.el.overlayTitle.textContent = title;
    this.el.overlayBody.innerHTML = body;
  }

  hideOverlay() { this.el.overlay.style.display = 'none'; }

  buildEndSummary(state) {
    const sorted = [...state.players].sort((a, b) => a.rank - b.rank || b.hp - a.hp);
    const human = sorted.find(p => p.isHuman);
    let rewardHtml = '';
    if (human && this.endRewards) {
      const r = this.endRewards;
      rewardHtml = `<div class="end-rewards"><p>获得经验 +${r.expGain || 0}</p>`;
      if (r.isRanked && r.rankResult) {
        const sc = r.rankResult.starsChange;
        const sign = sc > 0 ? '+' : '';
        rewardHtml += `<p>段位：${sign}${sc} 星`;
        if (r.rankResult.promoted) rewardHtml += ' · 晋级！';
        if (r.rankResult.demoted) rewardHtml += ' · 降级';
        rewardHtml += '</p>';
      }
      rewardHtml += '</div>';
    }
    return `${rewardHtml}<ol>${sorted.map(p =>
      `<li>${p.name}: 第${p.rank || '?'}名 ${p.eliminated && p.rank > 1 ? '淘汰' : (p.rank === 1 ? '🏆冠军' : '')}</li>`
    ).join('')}</ol><button id="btn-restart" class="btn-accent">返回主菜单</button>`;
  }

  setEndRewards(data) {
    this.endRewards = data;
  }

  flashBattleEvent(event) {
    const field = this.el.battleField;
    if (!field) return;
    if (event.type === 'DAMAGE_TAKEN') {
      field.classList.add('battle-shake');
      setTimeout(() => field.classList.remove('battle-shake'), 300);
    }
    if (event.type === 'CARD_DEATH') {
      field.classList.add('battle-flash-red');
      setTimeout(() => field.classList.remove('battle-flash-red'), 400);
    }
  }

  onBattleStart() { this.clearBattleLog(); }
}
