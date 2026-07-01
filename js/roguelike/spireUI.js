/** 幻兽净化师 · 净化远征 UI */
import { RUN_PHASES, RUN_MODES, TIER_MAX_FLOOR } from './runEngine.js';
import { modeLabel } from './floorMap.js';
import { cardTypeClass, cardTypeLabel } from './cardPool.js';
import { intentIcon, intentLabel } from './enemies.js';
import { TERMS } from './lore.js';
import { CombatTutorial } from './combatTutorial.js';
import { showToast } from '../appShell.js';

export class SpireUI {
  constructor(run, onBack, hooks = {}) {
    this.run = run;
    this.onBack = onBack;
    this.hooks = hooks;
    this.tutorial = null;
    this.runEndRecorded = false;
    this.bindElements();
    this.bindActions();
  }

  bindElements() {
    this.el = {
      screen: document.getElementById('screen-spire'),
      floorBadge: document.getElementById('purify-floor-badge'),
      modeBadge: document.getElementById('purify-mode-badge'),
      hudHp: document.getElementById('spire-hp'),
      hudGold: document.getElementById('spire-gold'),
      hudDeck: document.getElementById('spire-deck'),
      viewMap: document.getElementById('spire-view-map'),
      viewCombat: document.getElementById('spire-view-combat'),
      viewReward: document.getElementById('spire-view-reward'),
      viewRest: document.getElementById('spire-view-rest'),
      viewEnd: document.getElementById('spire-view-end'),
      mapNodes: document.getElementById('spire-map-nodes'),
      mapTitle: document.getElementById('purify-map-title'),
      mapIntro: document.getElementById('purify-map-intro'),
      enemyArea: document.getElementById('spire-enemy'),
      playerArea: document.getElementById('spire-player'),
      hand: document.getElementById('spire-hand'),
      energy: document.getElementById('spire-energy'),
      combatLog: document.getElementById('spire-combat-log'),
      rewardCards: document.getElementById('spire-reward-cards'),
      endTitle: document.getElementById('spire-end-title'),
      endStats: document.getElementById('spire-end-stats'),
      tutorialHost: document.getElementById('purify-tutorial-host'),
    };
  }

  bindActions() {
    document.getElementById('btn-spire-back')?.addEventListener('click', () => {
      if (confirm(TERMS.abandonConfirm)) this.finishRun(false);
    });
    document.getElementById('btn-spire-end-turn')?.addEventListener('click', () => {
      if (this.tutorial?.active && !this.tutorial.canEndTurn()) {
        showToast('请按引导步骤操作');
        return;
      }
      const r = this.run.endCombatTurn();
      this.afterCombatAction(r, () => this.tutorial?.onAction('end_turn'));
      this.render();
    });
    document.getElementById('btn-spire-skip-reward')?.addEventListener('click', () => {
      this.run.skipReward();
      this.render();
    });
    document.getElementById('btn-spire-rest-heal')?.addEventListener('click', () => {
      const r = this.run.restHeal();
      if (r.ok) showToast(TERMS.restHealToast(r.healed));
      this.render();
    });
    document.getElementById('btn-spire-rest-upgrade')?.addEventListener('click', () => {
      this.run.restUpgrade();
      showToast(TERMS.restUpgradeToast);
      this.render();
    });
    document.getElementById('btn-spire-end-continue')?.addEventListener('click', () => {
      this.finishRun(this.run.getState().phase === RUN_PHASES.VICTORY);
    });
  }

  finishRun(victory) {
    this.recordRunEnd(victory);
    this.onBack?.();
  }

  afterCombatAction(result, stepAction) {
    stepAction?.();
    if (result?.tutorialFinished && this.tutorial?.active) {
      this.tutorial.onAction('win');
    }
  }

  recordRunEnd(victory) {
    if (this.runEndRecorded) return;
    this.runEndRecorded = true;
    const state = this.run.getState();
    this.hooks.onRunEnd?.({
      mode: state.mode,
      floor: state.floor,
      victory,
      stats: state.stats,
      encounterIds: state.lastEncounterIds,
    });
  }

  render() {
    const state = this.run.getState();
    this.renderHud(state);
    this.hideAllViews();

    switch (state.phase) {
      case RUN_PHASES.MAP:
        this.el.viewMap.classList.remove('hidden');
        this.renderMap(state);
        break;
      case RUN_PHASES.COMBAT:
        this.el.viewCombat.classList.remove('hidden');
        this.renderCombat(state);
        break;
      case RUN_PHASES.REWARD:
        this.el.viewReward.classList.remove('hidden');
        this.renderReward(state);
        break;
      case RUN_PHASES.REST:
        this.el.viewRest.classList.remove('hidden');
        break;
      case RUN_PHASES.VICTORY:
      case RUN_PHASES.DEFEAT:
        this.el.viewEnd.classList.remove('hidden');
        this.renderEnd(state);
        this.recordRunEnd(state.phase === RUN_PHASES.VICTORY);
        break;
      default:
        break;
    }
  }

  hideAllViews() {
    ['viewMap', 'viewCombat', 'viewReward', 'viewRest', 'viewEnd'].forEach((k) => {
      this.el[k]?.classList.add('hidden');
    });
  }

  renderHud(state) {
    if (this.el.modeBadge) {
      this.el.modeBadge.textContent = modeLabel(state.mode);
    }
    if (this.el.floorBadge) {
      if (state.mode === RUN_MODES.EXPEDITION) {
        this.el.floorBadge.textContent = '';
        this.el.floorBadge.classList.add('hidden');
      } else {
        this.el.floorBadge.classList.remove('hidden');
        const max = state.maxFloor ? ` / ${state.maxFloor}` : '';
        this.el.floorBadge.textContent = `第 ${state.floor}${max} 层`;
      }
    }
    if (this.el.hudHp) {
      const hp = state.combat?.player?.hp ?? state.runHp;
      const max = state.combat?.player?.maxHp ?? state.maxHp;
      this.el.hudHp.textContent = `🌿 ${hp}/${max}`;
      this.el.hudHp.title = TERMS.mind;
    }
    if (this.el.hudGold) {
      this.el.hudGold.textContent = `💰 ${state.gold}`;
      this.el.hudGold.title = TERMS.exploreCoin;
    }
    if (this.el.hudDeck) {
      this.el.hudDeck.textContent = `📜 ${state.deckSize}`;
      this.el.hudDeck.title = TERMS.codex;
    }
  }

  renderMap(state) {
    if (!this.el.mapNodes) return;

    if (state.mode === RUN_MODES.EXPEDITION && state.map) {
      if (this.el.mapTitle) this.el.mapTitle.textContent = TERMS.mapTitle;
      if (this.el.mapIntro) this.el.mapIntro.textContent = TERMS.modeDesc;
      this.renderExpeditionMap(state);
      return;
    }

    if (this.el.mapTitle) {
      this.el.mapTitle.textContent = state.mode === RUN_MODES.TIER
        ? `阶层挑战 · 第 ${state.floor} / ${TIER_MAX_FLOOR} 层`
        : `无限模式 · 第 ${state.floor} 层`;
    }
    if (this.el.mapIntro) {
      this.el.mapIntro.textContent = '选择本层净化路线 · 每层遭遇的污化幻兽组合随机生成';
    }

    this.el.mapNodes.innerHTML = `
      <div class="purify-path-row purify-floor-row">
        ${state.floorChoices.map((n) =>
          `<button type="button" class="purify-node available" data-node="${n.id}">
            <span class="purify-node-icon">${n.icon}</span>
            <span class="purify-node-label">${n.label}</span>
          </button>`
        ).join('')}
      </div>`;

    this.el.mapNodes.querySelectorAll('.purify-node').forEach((btn) => {
      btn.onclick = () => {
        const r = this.run.startNode(btn.dataset.node);
        if (!r.ok && r.message) showToast(r.message);
        if (r.tutorial || r.ok) {
          this.hooks.onEncounter?.(this.run.getState().lastEncounterIds, { seen: true });
        }
        this.render();
      };
    });
  }

  renderExpeditionMap(state) {
    const rows = state.map.rows;
    this.el.mapNodes.innerHTML = rows.map((row, ri) => {
      const nodes = row.map((n) => {
        const cls = [
          'purify-node',
          n.cleared ? 'cleared' : '',
          n.available ? 'available' : '',
          n.id === state.map.currentNodeId ? 'current' : '',
        ].filter(Boolean).join(' ');
        const disabled = !n.available || n.cleared;
        return `<button type="button" class="${cls}" data-node="${n.id}" ${disabled ? 'disabled' : ''}>
          <span class="purify-node-icon">${n.icon}</span>
          <span class="purify-node-label">${n.label}</span>
        </button>`;
      }).join('');
      return `<div class="purify-path-row" data-row="${ri}">${nodes}</div>`;
    }).join('');

    this.el.mapNodes.querySelectorAll('.purify-node.available:not(.cleared)').forEach((btn) => {
      btn.onclick = () => {
        const r = this.run.startNode(btn.dataset.node);
        if (!r.ok && r.message) showToast(r.message);
        if (r.tutorial || (r.ok && r.phase === RUN_PHASES.COMBAT)) {
          this.hooks.onEncounter?.(this.run.getState().lastEncounterIds, { seen: true });
        }
        this.render();
      };
    });
  }

  renderCombat(state) {
    const c = state.combat;
    if (!c) return;

    if (state.isTutorialCombat && !this.tutorial) {
      this.tutorial = new CombatTutorial(() => {
        this.hooks.onTutorialComplete?.();
        showToast('实战引导完成！继续你的净化远征');
        this.tutorial = null;
        this.renderTutorialOverlay(null);
      });
    }

    const enemies = c.enemies || (c.enemy ? [c.enemy] : []);
    this.el.enemyArea.innerHTML = `<div class="purify-foe-group">${enemies.map((e, i) => {
      const dead = e.hp <= 0;
      const targeted = i === c.targetIndex && !dead;
      return `
      <button type="button" class="purify-foe-card ${dead ? 'dead' : ''} ${targeted ? 'targeted' : ''}"
        data-target="${i}" ${dead ? 'disabled' : ''}>
        <div class="purify-foe-icon">${e.icon || '👹'}</div>
        <div class="purify-foe-name">${e.name}</div>
        ${e.desc && enemies.length === 1 ? `<div class="purify-foe-desc">${e.desc}</div>` : ''}
        <div class="purify-foe-taint"><span>${TERMS.taint}</span> ${e.hp}/${e.maxHp}</div>
        ${e.block ? `<div class="purify-foe-barrier">🛡 ${e.block}</div>` : ''}
        ${!dead ? `<div class="purify-intent">${intentIcon(e.intent)} ${intentLabel(e.intent)}</div>` : '<div class="purify-foe-dead">已净化</div>'}
      </button>`;
    }).join('')}</div>`;

    this.el.enemyArea.querySelectorAll('.purify-foe-card:not(.dead)').forEach((btn) => {
      btn.onclick = () => {
        this.run.setCombatTarget(Number(btn.dataset.target));
        if (this.tutorial?.currentStep?.action === 'observe') {
          this.tutorial.onAction('observe');
        }
        this.render();
      };
    });

    const p = c.player;
    this.el.playerArea.innerHTML = `
      <div class="purify-self-stats">
        <div class="purify-stat">🌿 ${p.hp}/${p.maxHp} ${TERMS.mind}</div>
        <div class="purify-stat">🛡 ${TERMS.barrier} ${p.block}</div>
        ${c.strength ? `<div class="purify-stat">💪 ${TERMS.purifyPower} ${c.strength}</div>` : ''}
        ${c.weak ? `<div class="purify-stat miasma">${TERMS.miasma} ${c.weak}</div>` : ''}
      </div>
      <div class="purify-piles">
        <span>${TERMS.drawPile} ${c.drawCount}</span>
        <span>${TERMS.discardPile} ${c.discardCount}</span>
        <span>${TERMS.exhaustPile} ${c.exhaustCount}</span>
      </div>`;

    if (this.el.energy) {
      this.el.energy.innerHTML = Array.from({ length: p.maxEnergy }, (_, i) =>
        `<span class="purify-orb ${i < p.energy ? 'filled' : ''}"></span>`
      ).join('');
    }

    this.el.hand.innerHTML = c.hand.map((card) => {
      const energyOk = card.cost <= p.energy && c.phase === 'player';
      const tutorialOk = !this.tutorial?.active || this.tutorial.canPlayCard(card, c);
      const playable = energyOk && tutorialOk;
      return `<button type="button" class="purify-card ${cardTypeClass(card.type)} ${playable ? '' : 'disabled'}"
        data-uid="${card.uid}" ${playable ? '' : 'disabled'}>
        <div class="purify-card-cost">${card.cost}</div>
        <div class="purify-card-name">${card.name}</div>
        <div class="purify-card-type">${cardTypeLabel(card.type)}</div>
        <div class="purify-card-desc">${card.desc || ''}</div>
      </button>`;
    }).join('');

    this.el.hand.querySelectorAll('.purify-card:not(.disabled)').forEach((btn) => {
      btn.onclick = () => {
        const card = c.hand.find((x) => x.uid === btn.dataset.uid);
        const r = this.run.playCard(btn.dataset.uid, c.targetIndex);
        if (!r.ok && r.message) showToast(r.message);
        else {
          this.afterCombatAction(r, () => {
            if (card?.type === 'attack') this.tutorial?.onAction('play_attack');
            else if (card?.type === 'skill') this.tutorial?.onAction('play_skill');
          });
        }
        this.render();
      };
    });

    const endBtn = document.getElementById('btn-spire-end-turn');
    if (endBtn) {
      const canEnd = c.phase === 'player' && (!this.tutorial?.active || this.tutorial.canEndTurn());
      endBtn.disabled = !canEnd;
      endBtn.textContent = TERMS.endTurn;
    }

    if (this.el.combatLog) {
      this.el.combatLog.innerHTML = c.log.map((line) => `<div class="purify-log-line">${line}</div>`).join('');
    }

    if (c.phase === 'won' && this.tutorial?.active) {
      this.tutorial.onAction('win');
    }

    this.renderTutorialOverlay(this.tutorial);
  }

  renderTutorialOverlay(tutorial) {
    const host = this.el.tutorialHost;
    if (!host) return;
    if (!tutorial?.active) {
      host.innerHTML = '';
      host.classList.add('hidden');
      document.querySelectorAll('.purify-tutorial-highlight').forEach((el) => {
        el.classList.remove('purify-tutorial-highlight');
      });
      return;
    }
    host.classList.remove('hidden');
    host.innerHTML = tutorial.getOverlayHtml();
    document.getElementById('btn-tutorial-next')?.addEventListener('click', () => {
      tutorial.skipObserve();
      this.render();
    });
    document.getElementById('btn-tutorial-skip')?.addEventListener('click', () => {
      tutorial.skipAll();
      this.render();
    });
    const step = tutorial.currentStep;
    if (step?.highlight) {
      document.querySelector(step.highlight)?.classList.add('purify-tutorial-highlight');
    }
  }

  renderReward(state) {
    if (!this.el.rewardCards) return;
    this.el.rewardCards.innerHTML = state.rewardOptions.map((card) =>
      `<button type="button" class="purify-card purify-reward-card ${cardTypeClass(card.type)}" data-uid="${card.uid}">
        <div class="purify-card-cost">${card.cost}</div>
        <div class="purify-card-name">${card.name}</div>
        <div class="purify-card-type">${cardTypeLabel(card.type)}</div>
        <div class="purify-card-desc">${card.desc || ''}</div>
      </button>`
    ).join('');

    this.el.rewardCards.querySelectorAll('.purify-reward-card').forEach((btn) => {
      btn.onclick = () => {
        this.run.pickReward(btn.dataset.uid);
        showToast(TERMS.pickRewardToast);
        this.render();
      };
    });
  }

  renderEnd(state) {
    const win = state.phase === RUN_PHASES.VICTORY;
    if (this.el.endTitle) {
      let title = win ? TERMS.winTitle : TERMS.loseTitle;
      if (state.mode === RUN_MODES.TIER && win) title = `阶层挑战完成 · 100 层源点已净化`;
      if (state.mode === RUN_MODES.INFINITE) {
        title = win ? `无限模式 · 第 ${state.floor} 层` : `无限模式 · 止步第 ${state.floor} 层`;
      }
      this.el.endTitle.textContent = title;
      this.el.endTitle.className = win ? 'purify-end-win' : 'purify-end-loss';
    }
    if (this.el.endStats) {
      const floorLine = state.mode !== RUN_MODES.EXPEDITION
        ? `<p>到达层数：${state.floor}${state.maxFloor ? ` / ${state.maxFloor}` : ''}</p>` : '';
      this.el.endStats.innerHTML = `
        ${floorLine}
        <p>${TERMS.statPurified}：${state.stats.battlesWon}</p>
        <p>${TERMS.statElite}：${state.stats.elitesWon}</p>
        <p>${TERMS.statCodex}：${state.deckSize} 张</p>
        <p>${TERMS.statCoin}：${state.gold}</p>`;
    }
  }
}
