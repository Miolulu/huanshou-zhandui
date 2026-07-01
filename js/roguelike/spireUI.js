/** 幻兽净化师 · 净化远征 UI */
import { RUN_PHASES, RUN_MODES, TIER_MAX_FLOOR } from './runEngine.js';
import { modeLabel } from './floorMap.js';
import { renderPurifyCardHtml, renderShopOfferHtml } from './cardUI.js';
import { TERMS } from './lore.js';
import { CombatTutorial } from './combatTutorial.js';
import { PurifyBattleEffects } from './purifyBattleEffects.js';
import { destroyCardDrag, enableCardDrag } from './cardDrag.js';
import { mountExpeditionMap } from './expeditionMapView.js';
import { SpireOverlays } from './spireOverlays.js';
import { renderPlayerTarget, renderEnemyTarget } from './combatView.js';
import { renderPileInto } from './pileOverlay.js';
import { mainBackgroundUrl } from './assetPaths.js';
import { showToast } from '../appShell.js';

function logLineClass(line) {
  if (/伤害|扑击|攻\d|受到 \d+/.test(line)) return 'log-damage';
  if (/恢复|复苏/.test(line)) return 'log-heal';
  if (/护幕|淤壳|\+/.test(line) && /护幕|淤壳/.test(line)) return 'log-block';
  if (/暴走|秽气|污染膨胀|缩入/.test(line)) return 'log-enemy';
  return '';
}

export class SpireUI {
  constructor(run, onBack, hooks = {}) {
    this.run = run;
    this.onBack = onBack;
    this.hooks = hooks;
    this.tutorial = null;
    this.tutorialDismissed = false;
    this.runEndRecorded = false;
    this.combatBusy = false;
    this.lastRunPhase = null;
    this.battleEffects = new PurifyBattleEffects();
    this.overlays = new SpireOverlays(document.getElementById('screen-spire'));
    this.overlays.onOpen = (id) => this.onOverlayOpen(id);
    this.overlays.onModalEscape = (id) => {
      if (id === 'spire-overlay-rest') showToast('请先选择调息或精研');
      else if (id === 'spire-overlay-end') showToast('请点击返回主页');
    };
    this.bindElements();
    this.bindActions();
    this.bindCombatShortcuts();
  }

  bindElements() {
    this.el = {
      screen: document.getElementById('screen-spire'),
      floorBadge: document.getElementById('purify-floor-badge'),
      modeBadge: document.getElementById('purify-mode-badge'),
      hudHp: document.getElementById('spire-hp'),
      hudGold: document.getElementById('spire-gold'),
      sceneBg: document.getElementById('spire-scene-bg'),
      overlayMapNodes: document.getElementById('spire-overlay-map-nodes'),
      overlayMapTitle: document.getElementById('overlay-map-title'),
      overlayMapIntro: document.getElementById('overlay-map-intro'),
      overlayDeckCards: document.getElementById('spire-overlay-deck-cards'),
      overlayDrawCards: document.getElementById('spire-overlay-draw-cards'),
      overlayDiscardCards: document.getElementById('spire-overlay-discard-cards'),
      overlayExhaustCards: document.getElementById('spire-overlay-exhaust-cards'),
      overlayLogBody: document.getElementById('spire-overlay-log-body'),
      viewCombat: document.getElementById('spire-view-combat'),
      enemyArea: document.getElementById('spire-enemy'),
      playerArea: document.getElementById('spire-player'),
      hand: document.getElementById('spire-hand'),
      energyText: document.getElementById('spire-energy-text'),
      combatLog: document.getElementById('spire-combat-log'),
      effectLayer: document.getElementById('spire-effect-layer'),
      actionBar: document.getElementById('purify-action-bar'),
      combatBattle: document.querySelector('#spire-view-combat .purify-battle'),
      rewardCards: document.getElementById('spire-reward-cards'),
      shopCards: document.getElementById('spire-shop-cards'),
      shopGold: document.getElementById('purify-shop-gold'),
      shopIntro: document.getElementById('purify-shop-intro'),
      shopRemovePanel: document.getElementById('spire-shop-remove-panel'),
      shopDeckPick: document.getElementById('spire-shop-deck-pick'),
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
      if (this.combatBusy) return;
      if (this.tutorial?.active && !this.tutorial.canEndTurn()) {
        showToast('请按引导步骤操作');
        return;
      }
      this.performCombatAction(
        () => this.run.endCombatTurn(),
        () => this.tutorial?.onAction('end_turn'),
      );
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
    document.getElementById('btn-spire-shop-leave')?.addEventListener('click', () => {
      this.run.leaveShop();
      this.render();
    });
    document.getElementById('btn-spire-shop-remove')?.addEventListener('click', () => {
      const r = this.run.startShopRemove();
      if (!r.ok && r.message) showToast(r.message);
      this.render();
    });
    document.getElementById('btn-spire-shop-remove-cancel')?.addEventListener('click', () => {
      this.run.cancelShopRemove();
      this.render();
    });
  }

  bindCombatShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!this.el.screen?.classList.contains('active')) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const state = this.run?.getState?.();
      if (!state) return;

      if ((e.key === 'e' || e.key === 'E') && state.phase === RUN_PHASES.COMBAT) {
        e.preventDefault();
        document.getElementById('btn-spire-end-turn')?.click();
      }
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
    if (!this.tutorial?.active) {
      this.clearTutorialOverlay();
    }
  }

  bindBattleEffectRefs() {
    this.battleEffects.bind({
      stage: this.el.combatBattle,
      effectLayer: this.el.effectLayer,
      enemyArea: this.el.enemyArea,
      playerArea: this.el.playerArea,
      hand: this.el.hand,
    });
  }

  async performCombatAction(actionFn, stepAction, { cardEl } = {}) {
    if (this.combatBusy) return null;
    this.combatBusy = true;
    destroyCardDrag();

    if (cardEl) await this.battleEffects.animateCardPlay(cardEl);

    const result = actionFn();
    if (!result?.ok) {
      if (result?.message) showToast(result.message);
      this.combatBusy = false;
      return result;
    }

    this.afterCombatAction(result, stepAction);

    const hasTurnEnd = (result.events || []).some((e) => e.type === 'TURN_END');
    if (hasTurnEnd && !cardEl) {
      await this.battleEffects.animateHandDiscard();
    }

    this.render();
    this.bindBattleEffectRefs();

    const events = (result.events || []).filter((e) => e.type !== 'HAND_DISCARDED');
    await this.battleEffects.playSequence(events);

    const endBtn = document.getElementById('btn-spire-end-turn');
    endBtn?.classList.add('pokeball-shake');
    setTimeout(() => endBtn?.classList.remove('pokeball-shake'), 600);

    this.combatBusy = false;

    const phase = this.run.getState().phase;
    if (phase !== RUN_PHASES.COMBAT) {
      this.render();
    } else {
      this.updateCombatChrome(this.run.getState().combat);
    }
    return result;
  }

  updateCombatChrome(c) {
    if (!c) return;
    const endBtn = document.getElementById('btn-spire-end-turn');
    if (endBtn) {
      const canEnd = c.phase === 'player' && (!this.tutorial?.active || this.tutorial.canEndTurn());
      endBtn.disabled = !canEnd || this.combatBusy;
      const label = TERMS.endTurn;
      endBtn.innerHTML = `<u>${label.charAt(0)}</u>${label.slice(1)}`;
    }
    if (this.el.energyText) {
      this.el.energyText.textContent = `${c.player.energy}/${c.player.maxEnergy}`;
    }
    if (this.el.actionBar) {
      const noEnergy = c.phase === 'player' && c.player.energy <= 0;
      this.el.actionBar.classList.toggle('no-energy', noEnergy);
    }
  }

  clearTutorialOverlay() {
    const host = this.el.tutorialHost;
    if (!host) return;
    host.innerHTML = '';
    host.classList.add('hidden');
    document.querySelectorAll('.purify-tutorial-highlight').forEach((el) => {
      el.classList.remove('purify-tutorial-highlight');
    });
  }

  finishTutorialGuide() {
    this.tutorialDismissed = true;
    this.tutorial = null;
    this.clearTutorialOverlay();
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
    this.updateSceneBg(state);
    this.overlays.updateLabels(state);

    if (state.phase !== RUN_PHASES.COMBAT || !state.combat) {
      this.clearTutorialOverlay();
      destroyCardDrag();
    }

    this.overlays.closeModals();
    this.el.viewCombat?.classList.add('hidden');

    switch (state.phase) {
      case RUN_PHASES.MAP:
        this.renderMapInto(state, this.el.overlayMapNodes, true);
        if (this.lastRunPhase !== RUN_PHASES.MAP) {
          this.overlays.open('spire-overlay-map');
        }
        break;
      case RUN_PHASES.COMBAT:
        this.overlays.closeCornerOverlays();
        this.el.viewCombat?.classList.remove('hidden');
        this.renderCombat(state);
        break;
      case RUN_PHASES.REWARD:
        this.renderReward(state);
        this.overlays.open('spire-overlay-reward');
        break;
      case RUN_PHASES.REST:
        this.overlays.open('spire-overlay-rest');
        break;
      case RUN_PHASES.SHOP:
        this.renderShop(state);
        this.overlays.open('spire-overlay-shop');
        break;
      case RUN_PHASES.VICTORY:
      case RUN_PHASES.DEFEAT:
        this.renderEnd(state);
        this.overlays.open('spire-overlay-end');
        this.recordRunEnd(state.phase === RUN_PHASES.VICTORY);
        break;
      default:
        break;
    }
    this.lastRunPhase = state.phase;
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
  }

  updateSceneBg(state) {
    if (!this.el.sceneBg) return;
    const idx = Math.min(5, Math.max(0, (state.floor || 1) - 1));
    this.el.sceneBg.dataset.roomIndex = String(idx);
    this.el.sceneBg.style.backgroundImage = `url('${mainBackgroundUrl()}')`;
  }

  onOverlayOpen(id) {
    const state = this.run.getState();
    if (id === 'spire-overlay-map') {
      this.renderMapInto(state, this.el.overlayMapNodes, state.phase === RUN_PHASES.MAP);
    }
    if (id === 'spire-overlay-deck') this.renderDeckOverlay(state);
    if (id === 'spire-overlay-draw') this.renderDrawOverlay(state);
    if (id === 'spire-overlay-discard') this.renderDiscardOverlay(state);
    if (id === 'spire-overlay-exhaust') this.renderExhaustOverlay(state);
    if (id === 'spire-overlay-log') this.renderLogOverlay(state);
  }

  renderDeckOverlay(state) {
    renderPileInto(this.el.overlayDeckCards, this.run.deck || [], { emptyText: '秘典为空' });
  }

  renderDrawOverlay(state) {
    const cards = state.combat?.drawPile || [];
    renderPileInto(this.el.overlayDrawCards, cards, { emptyText: '待启为空' });
  }

  renderDiscardOverlay(state) {
    const cards = state.combat?.discardPile || [];
    renderPileInto(this.el.overlayDiscardCards, cards, { emptyText: '余韵为空' });
  }

  renderExhaustOverlay(state) {
    const cards = state.combat?.exhaustPile || [];
    renderPileInto(this.el.overlayExhaustCards, cards, { emptyText: '暂无已竭技法' });
  }

  renderLogOverlay(state) {
    if (!this.el.overlayLogBody) return;
    const log = state.combat?.log || [];
    this.el.overlayLogBody.innerHTML = log.length
      ? log.map((line) => `<div class="purify-log-line ${logLineClass(line)}">${line}</div>`).join('')
      : '<div class="purify-log-line">暂无战斗记录</div>';
  }

  renderMapInto(state, container, interactive = true) {
    if (!container) return;

    if (state.mode === RUN_MODES.EXPEDITION && state.map) {
      if (this.el.overlayMapTitle) this.el.overlayMapTitle.textContent = TERMS.mapTitle;
      if (this.el.overlayMapIntro) this.el.overlayMapIntro.textContent = interactive ? TERMS.modeDesc : '当前远征进度（战斗中仅可查看）';
      this.renderExpeditionMap(state, container, interactive);
      return;
    }

    if (state.phase === RUN_PHASES.COMBAT && !interactive) {
      container.innerHTML = `<p class="Box-sub">战斗进行中 · 收势后可继续选择路线</p>`;
      return;
    }

    if (this.el.overlayMapTitle) {
      this.el.overlayMapTitle.textContent = state.mode === RUN_MODES.TIER
        ? `阶层挑战 · 第 ${state.floor} / ${TIER_MAX_FLOOR} 层`
        : `无限模式 · 第 ${state.floor} 层`;
    }
    if (this.el.overlayMapIntro) {
      this.el.overlayMapIntro.textContent = '选择本层净化路线';
    }

    container.innerHTML = `
      <div class="purify-path-row purify-floor-row">
        ${state.floorChoices.map((n) =>
          `<button type="button" class="purify-node available ${n.type === 'boss' ? 'boss-node' : ''}" data-type="${n.type || ''}" data-node="${n.id}">
            <span class="purify-node-icon">${n.icon}</span>
            <span class="purify-node-label">${n.label}</span>
          </button>`
        ).join('')}
      </div>`;

    if (interactive) this.bindMapNodeClicks(container);
  }

  bindMapNodeClicks(container) {
    container.querySelectorAll('.purify-node.available:not(.cleared)').forEach((btn) => {
      btn.onclick = () => {
        this.overlays.closeAll();
        const r = this.run.startNode(btn.dataset.node);
        if (!r.ok && r.message) showToast(r.message);
        if (r.tutorial || r.ok) {
          this.hooks.onEncounter?.(this.run.getState().lastEncounterIds, { seen: true });
        }
        this.render();
      };
    });
  }

  renderExpeditionMap(state, container, interactive = true) {
    mountExpeditionMap(container, state, interactive);
    if (interactive) this.bindMapNodeClicks(container);
  }

  renderCombat(state) {
    const c = state.combat;
    if (!c) return;

    document.querySelectorAll('body > .Card-clone').forEach((el) => el.remove());

    if (state.isTutorialCombat && !this.tutorial && !this.tutorialDismissed) {
      this.tutorial = new CombatTutorial(({ skipped } = {}) => {
        this.hooks.onTutorialComplete?.();
        this.finishTutorialGuide();
        showToast(skipped ? '已跳过实战引导' : '实战引导完成！继续你的净化远征');
      });
    }

    const enemies = c.enemies || (c.enemy ? [c.enemy] : []);
    this.el.enemyArea.innerHTML = enemies.map((e, i) =>
      renderEnemyTarget(e, i, {
        targeted: i === c.targetIndex && e.hp > 0,
        showDesc: enemies.length === 1,
      })
    ).join('');

    this.el.enemyArea.querySelectorAll('.Target--enemy:not(.Target--isDead)').forEach((el) => {
      const pick = () => {
        this.run.setCombatTarget(Number(el.dataset.target));
        if (this.tutorial?.currentStep?.action === 'observe') {
          this.tutorial.onAction('observe');
        }
        this.render();
      };
      el.onclick = pick;
      el.onkeydown = (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          pick();
        }
      };
    });

    this.el.playerArea.innerHTML = renderPlayerTarget(c);

    if (this.el.energyText) {
      this.el.energyText.textContent = `${c.player.energy}/${c.player.maxEnergy}`;
    }

    const p = c.player;
    this.el.hand.innerHTML = c.hand.map((card) => {
      const energyOk = card.cost <= p.energy && c.phase === 'player';
      const tutorialOk = !this.tutorial?.active || this.tutorial.canPlayCard(card, c);
      const playable = energyOk && tutorialOk;
      return renderPurifyCardHtml(card, { playable });
    }).join('');

    this.setupCardDrag(c);

    this.updateCombatChrome(c);

    if (this.el.combatLog) {
      this.el.combatLog.innerHTML = c.log.map((line) =>
        `<div class="purify-log-line ${logLineClass(line)}">${line}</div>`
      ).join('');
    }

    this.bindBattleEffectRefs();

    if (c.phase === 'won' && this.tutorial?.active) {
      this.tutorial.onAction('win');
    }

    this.renderTutorialOverlay(this.tutorial);
  }

  setupCardDrag(c) {
    if (!this.el.combatBattle || c.phase !== 'player' || this.combatBusy) return;
    if (typeof window.gsap === 'undefined' || typeof window.Draggable === 'undefined') return;

    enableCardDrag(this.el.combatBattle, {
      getTargetIndex: () => c.targetIndex,
      onPlay: (cardEl, targetIndex) => {
        if (this.combatBusy) return;
        const card = c.hand.find((x) => x.uid === cardEl.dataset.uid);
        if (!card) return;
        const tutorialOk = !this.tutorial?.active || this.tutorial.canPlayCard(card, c);
        if (!tutorialOk) {
          showToast('请按引导步骤操作');
          this.render();
          return;
        }
        this.performCombatAction(
          () => this.run.playCard(cardEl.dataset.uid, targetIndex),
          () => {
            if (card?.type === 'attack') this.tutorial?.onAction('play_attack');
            else if (card?.type === 'skill') this.tutorial?.onAction('play_skill');
          },
          { cardEl, fromDrag: true },
        );
      },
    });
  }

  renderTutorialOverlay(tutorial) {
    const host = this.el.tutorialHost;
    if (!host) return;
    if (!tutorial?.active) {
      this.clearTutorialOverlay();
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
    document.querySelectorAll('.purify-tutorial-highlight').forEach((el) => {
      el.classList.remove('purify-tutorial-highlight');
    });
    const step = tutorial.currentStep;
    if (step?.highlight) {
      document.querySelector(step.highlight)?.classList.add('purify-tutorial-highlight');
    }
  }

  renderReward(state) {
    if (!this.el.rewardCards) return;
    this.el.rewardCards.innerHTML = state.rewardOptions.map((card) =>
      renderPurifyCardHtml(card, { playable: true, extraClass: 'purify-reward-card' })
    ).join('');

    this.el.rewardCards.querySelectorAll('.purify-reward-card').forEach((btn) => {
      btn.onclick = () => {
        this.run.pickReward(btn.dataset.uid);
        showToast(TERMS.pickRewardToast);
        this.render();
      };
    });
  }

  renderShop(state) {
    const title = document.getElementById('purify-shop-title');
    if (title) title.textContent = `🏪 ${TERMS.shopTitle}`;
    if (this.el.shopIntro) this.el.shopIntro.textContent = TERMS.shopIntro;
    if (this.el.shopGold) {
      this.el.shopGold.textContent = `${TERMS.exploreCoin}：${state.gold}`;
    }

    const removeBtn = document.getElementById('btn-spire-shop-remove');
    const leaveBtn = document.getElementById('btn-spire-shop-leave');
    if (removeBtn) {
      removeBtn.textContent = TERMS.shopRemovePrice(state.removeCardPrice);
      removeBtn.disabled = state.gold < state.removeCardPrice || this.run.deck.length <= 5;
    }
    if (leaveBtn) leaveBtn.textContent = TERMS.shopLeave;

    if (this.el.shopRemovePanel) {
      this.el.shopRemovePanel.classList.toggle('hidden', !state.shopRemoving);
    }

    if (state.shopRemoving && this.el.shopDeckPick) {
      this.el.shopDeckPick.innerHTML = this.run.deck.map((card) =>
        renderPurifyCardHtml(card, { playable: true, extraClass: 'Shop-remove-pick' })
      ).join('');
      this.el.shopDeckPick.querySelectorAll('.Shop-remove-pick').forEach((btn) => {
        btn.onclick = () => {
          const r = this.run.confirmShopRemove(btn.dataset.uid);
          if (r.ok) showToast(TERMS.shopRemovedToast);
          else if (r.message) showToast(r.message);
          this.render();
        };
      });
    } else if (this.el.shopCards) {
      this.el.shopCards.innerHTML = state.shopInventory.map((item, i) =>
        renderShopOfferHtml(item, i, { gold: state.gold })
      ).join('');
      this.el.shopCards.querySelectorAll('[data-shop-buy]').forEach((btn) => {
        btn.onclick = () => {
          const r = this.run.buyShopItem(Number(btn.dataset.shopBuy));
          if (r.ok) showToast(TERMS.shopBoughtToast(r.card.name));
          else if (r.message) showToast(r.message);
          this.render();
        };
      });
    }
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
