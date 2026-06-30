import {
  CONFIG,
  getTavernUpgradeCost,
  getTeamSlotsForTavern,
  formatTavernShopOdds,
  getCardBuyCost,
  RARITY_NAMES,
} from './config.js';
import { getTemplate } from './cards.js';
import { formatSkillList } from './skills.js';
import { elementBadgeHtml, classBadgeHtml, showToast } from './appShell.js';
import { summarizeActiveComboBonds, summarizeBondProgress, formatComboEffect } from './comboBonds.js';
import { CLASS_NAMES } from './classes.js';
import { renderBondGuideHTML, renderActiveBondsBattle } from './bondGuide.js';
import { renderHeroCardRow } from './components/HeroCard.js';
import { BattleEffects, getBattleLogClass } from './components/BattleEffects.js';

const RARITY_CLASS = { common: 'r-common', rare: 'r-rare', epic: 'r-epic', legendary: 'r-legendary' };

export class UI {
  constructor(game) {
    this.game = game;
    this.selectedTeamPos = null;
    this.endRewards = null;
    this.bondGuideOpen = false;
    this.bindElements();
    this.battleEffects = new BattleEffects(
      document.getElementById('battle-effect-layer'),
      document.getElementById('battle'),
    );
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
      prepareTimer: document.getElementById('prepare-timer'),
      prepareTimerBox: document.getElementById('prepare-timer-box'),
      prepareTimerPanel: document.getElementById('prepare-timer-panel'),
      prepareTimerLarge: document.getElementById('prepare-timer-large'),
      prepareTimerFill: document.getElementById('prepare-timer-fill'),
      tavernTier: document.getElementById('tavern-tier'),
      tavernCost: document.getElementById('tavern-cost'),
      teamCost: document.getElementById('team-cost'),
      shopHint: document.getElementById('shop-tier-hint'),
      players: document.getElementById('players-list'),
      shop: document.getElementById('shop-cards'),
      team: document.getElementById('team-slots'),
      opponent: document.getElementById('opponent-info'),
      battleArena: document.getElementById('battle'),
      battleHudRound: document.getElementById('battle-hud-round'),
      battleHudOpponent: document.getElementById('battle-hud-opponent'),
      battleHudPhase: document.getElementById('battle-hud-phase'),
      battleHudEnergy: document.getElementById('battle-hud-energy'),
      battleHudCombo: document.getElementById('battle-hud-combo'),
      battleEnemyArea: document.getElementById('battle-enemy-area'),
      battlePlayerArea: document.getElementById('battle-player-area'),
      battleIdleMsg: document.getElementById('battle-idle-msg'),
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
    document.getElementById('btn-sell-card').onclick = () => {
      if (this.selectedTeamPos !== null) {
        this.game.sellCard(this.game.getHuman(), this.selectedTeamPos);
        this.selectedTeamPos = null;
        this.renderCardPanel(null);
      }
    };
    document.getElementById('btn-skip-battle').onclick = () => this.game.skipBattle();
    document.getElementById('btn-toggle-bond-guide').onclick = () => this.toggleBondGuide();
    if (this.el.bondGuidePanel) {
      this.el.bondGuidePanel.innerHTML = renderBondGuideHTML();
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
    if (state.prepareTimedOut && state.phase === 'MATCH' && !this._shownTimeoutToast) {
      this._shownTimeoutToast = true;
      showToast('准备时间结束，自动开战！');
    }
    if (state.phase === 'PREPARE') this._shownTimeoutToast = false;
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
      const carryNote = inc.goldBeforeIncome > 0 ? ` · 上回合结余${inc.goldBeforeIncome}金已清零` : '';
      this.el.goldIncome.textContent = `(本回合 ${inc.total} 金：${parts.join(' · ')}${carryNote})`;
    } else {
      this.el.goldIncome.textContent = '';
    }

    this.renderPrepareTimer(state);
  }

  renderPrepareTimer(state) {
    const inPrepare = state.phase === 'PREPARE';
    const left = state.prepareTimeLeft ?? 0;
    const total = state.prepareTimeTotal || 1;
    const pct = Math.max(0, Math.min(100, (left / total) * 100));

    if (this.el.prepareTimerBox) {
      this.el.prepareTimerBox.style.display = inPrepare ? '' : 'none';
      if (inPrepare && this.el.prepareTimer) {
        this.el.prepareTimer.textContent = `${left}s`;
        this.el.prepareTimer.classList.toggle('urgent', left <= 5);
      }
    }
    if (this.el.prepareTimerPanel) {
      this.el.prepareTimerPanel.classList.toggle('hidden', !inPrepare);
      if (inPrepare) {
        if (this.el.prepareTimerLarge) {
          this.el.prepareTimerLarge.textContent = String(left);
          this.el.prepareTimerLarge.classList.toggle('urgent', left <= 5);
        }
        if (this.el.prepareTimerFill) {
          this.el.prepareTimerFill.style.width = `${pct}%`;
          this.el.prepareTimerFill.classList.toggle('urgent', left <= 5);
        }
      }
    }
  }

  renderTavernControls(human, state) {
    this.el.tavernTier.textContent = human.tavernTier;

    const tavernCost = getTavernUpgradeCost(human.tavernTier);
    const nextSlots = human.tavernTier < CONFIG.MAX_TAVERN_TIER
      ? getTeamSlotsForTavern(human.tavernTier + 1) : human.team.maxSize;
    const slotsHint = human.tavernTier >= CONFIG.MAX_TAVERN_TIER
      ? '(满级)' : `(${tavernCost}金→Lv${human.tavernTier + 1} · ${human.team.maxSize}→${nextSlots}格)`;

    this.el.tavernCost.textContent = slotsHint;
    if (this.el.teamCost) this.el.teamCost.textContent = '';
    this.el.shopHint.textContent = `货架 ★1 · ${formatTavernShopOdds(human.tavernTier)}`;
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
    document.getElementById('btn-sell-card').textContent =
      `卖出 (+${getCardBuyCost(card.rarity, getTemplate(card.templateId)?.costTier)}金)`;
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
        ? renderActiveBondsBattle(cards)
        : '';
    }
  }

  renderTeamBonds(human) {
    if (!this.el.teamBonds) return;
    const cards = human.team.cards.filter((c, i) => c && i < human.team.maxSize);
    const combos = summarizeActiveComboBonds(cards);
    const progress = summarizeBondProgress(cards).filter(p => !p.tier || p.next);

    const activeHtml = combos.map(b =>
      `<span class="bond-tag bond-combo" title="${formatComboEffect(b.effect)}">${b.name}×${b.count}</span>`
    ).join('');

    const progHtml = progress.slice(0, 4).map(p => {
      const need = p.next ? `${p.count}/${p.next}` : `${p.count}`;
      return `<span class="bond-tag bond-progress">${p.bond.name} ${need}</span>`;
    }).join('');

    this.el.teamBonds.innerHTML = activeHtml || progHtml
      ? `${activeHtml}${progHtml ? `<div class="bond-progress-row">${progHtml}</div>` : ''}`
      : '<span class="hint">凑齐同属性+同职业触发组合羁绊（2/4）</span>';
  }

  handleTeamClick(pos) {
    const human = this.game.getHuman();
    if (this.game.phase !== 'PREPARE') return;

    const card = human.team.cards[pos];
    if (!card) {
      this.selectedTeamPos = null;
    } else {
      this.selectedTeamPos = this.selectedTeamPos === pos ? null : pos;
    }
    this.renderCardPanel(human.team.cards[this.selectedTeamPos] ?? null, human);
    this.renderTeam(human);
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
    const isPrepare = state.phase === 'PREPARE';

    document.getElementById('btn-end-prepare').disabled = !isPrepare;
    document.getElementById('btn-refresh').disabled = !isPrepare || human.gold < CONFIG.REFRESH_COST;
    document.getElementById('btn-freeze').disabled = !isPrepare;
    document.getElementById('btn-upgrade-tavern').disabled =
      !isPrepare || human.tavernTier >= CONFIG.MAX_TAVERN_TIER || human.gold < tavernCost;
    const teamBtn = document.getElementById('btn-upgrade-team');
    if (teamBtn) teamBtn.style.display = 'none';
    document.getElementById('btn-skip-battle').style.display = state.phase === 'BATTLE' ? 'inline-block' : 'none';
  }

    const phaseNames = { PREPARE: '准备', MATCH: '匹配', BATTLE: '战斗中', SETTLE: '结算', ENDED: '结束' };
    const inBattle = state.phase === 'BATTLE' || state.phase === 'SETTLE';
    const round = String(state.turn || 1).padStart(2, '0');

    if (this.el.battleHudRound) this.el.battleHudRound.textContent = round;
    if (this.el.battleHudPhase) this.el.battleHudPhase.textContent = phaseNames[state.phase] || state.phase;

    const opp = state.opponentPreview;
    if (this.el.battleHudOpponent) {
      this.el.battleHudOpponent.textContent = inBattle && this.game.currentBattle
        ? (this.game.currentBattle.playerB?.name || '对手').slice(0, 8)
        : (opp?.name || '—').slice(0, 8);
    }

    const cards = human.team.cards.filter((c, i) => c && i < human.team.maxSize);
    const comboCount = summarizeActiveComboBonds(cards).length;
    if (this.el.battleHudCombo) this.el.battleHudCombo.textContent = `×${comboCount}`;

    const engine = this.game.currentBattle;
    let energyPct = 0;
    if (inBattle && engine) {
      energyPct = Math.min(100, Math.round((engine.turn / CONFIG.MAX_TURNS_PER_BATTLE) * 100));
    } else if (state.phase === 'PREPARE' && state.prepareTimeLeft != null && CONFIG.PREPARE_TIME) {
      energyPct = Math.round((1 - state.prepareTimeLeft / CONFIG.PREPARE_TIME) * 100);
    }
    if (this.el.battleHudEnergy) this.el.battleHudEnergy.style.width = `${energyPct}%`;
  }

  renderBattleField(state) {
    const human = state.human;
    this.renderBattleHUD(state, human);

    const inBattle = state.phase === 'BATTLE' || state.phase === 'SETTLE';
    if (this.el.battleIdleMsg) {
      this.el.battleIdleMsg.style.display = inBattle ? 'none' : 'block';
      if (!inBattle) {
        this.el.battleIdleMsg.textContent = state.phase === 'PREPARE'
          ? '准备完成后自动开战'
          : '等待战斗开始…';
      }
    }

    if (!inBattle) {
      if (this.el.battleEnemyArea) {
        this.el.battleEnemyArea.innerHTML = renderHeroCardRow([], 'enemy', '敌方战队');
      }
      if (this.el.battlePlayerArea) {
        const cards = human.team.cards.filter((c, i) => c && i < human.team.maxSize);
        this.el.battlePlayerArea.innerHTML = cards.length
          ? renderHeroCardRow(cards, 'player', '我方战队')
          : '<span class="area-label">我方战队</span><span class="hint" style="margin-left:80px">暂无出战幻兽</span>';
      }
      return;
    }

    const engine = this.game.currentBattle;
    if (!engine) return;

    const isHumanA = engine.playerA?.isHuman;
    const playerTeam = isHumanA ? engine.teamA : engine.teamB;
    const enemyTeam = isHumanA ? engine.teamB : engine.teamA;

    const playerCards = playerTeam.cards.filter(Boolean);
    const enemyCards = enemyTeam.cards.filter(Boolean);

    if (this.el.battleEnemyArea) {
      this.el.battleEnemyArea.innerHTML = renderHeroCardRow(enemyCards, 'enemy', '敌方战队');
    }
    if (this.el.battlePlayerArea) {
      this.el.battlePlayerArea.innerHTML = renderHeroCardRow(playerCards, 'player', '我方战队');
    }
  }

  appendBattleLog(event) {
    const line = this.formatEvent(event);
    if (!line) return;
    const div = document.createElement('div');
    const logCls = getBattleLogClass(event.type);
    div.className = logCls ? `log-line ${logCls}` : 'log-line';
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
    return `${rewardHtml}<ol>${sorted.map(p => {
      const isChampion = p.rank === 1 && !p.eliminated;
      const tag = p.eliminated ? '淘汰' : (isChampion ? '🏆冠军' : '');
      return `<li>${p.name}: 第${p.rank || '?'}名 ${tag}</li>`;
    }).join('')}</ol><button id="btn-restart" class="btn-accent">返回主菜单</button>`;
  }

  setEndRewards(data) {
    this.endRewards = data;
  }

  handleBattleEvent(event) {
    if (this.battleEffects?.shouldPlay(event)) {
      this.battleEffects.play(event);
    }
    if (event.type === 'CARD_DEATH') {
      this.battleEffects?.flashArenaRed();
    }
  }

  flashBattleEvent(event) {
    this.handleBattleEvent(event);
  }

  onBattleStart() {
    this.clearBattleLog();
    if (this.battleEffects?.layer) this.battleEffects.layer.innerHTML = '';
  }
}
