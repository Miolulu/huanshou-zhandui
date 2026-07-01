/** 净化远征 · Run 状态机（远征 / 阶层 / 无限） */
import { buildStarterDeck, pickRewardOptions, cloneCard } from './cardPool.js';
import {
  generateMap, getNode, selectNode, isRunComplete, nodeTier as mapNodeTier, NODE_TYPES,
} from './mapGenerator.js';
import {
  RUN_MODES, generateFloorChoices, nodeTier as floorNodeTier, TIER_MAX_FLOOR, createRng,
} from './floorMap.js';
import { CombatEngine, createTutorialCombat } from './combatEngine.js';

export { RUN_MODES, TIER_MAX_FLOOR };

export const RUN_PHASES = {
  MAP: 'map',
  COMBAT: 'combat',
  REWARD: 'reward',
  REST: 'rest',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
};

export class RunEngine {
  constructor(playerName = '净化师', options = {}) {
    const {
      seed = Date.now(),
      mode = RUN_MODES.EXPEDITION,
      skipTutorial = false,
      forceTutorial = false,
    } = options;

    this.playerName = playerName;
    this.mode = mode;
    this.seed = seed;
    this.rng = createRng(seed);
    this.phase = RUN_PHASES.MAP;
    this.deck = buildStarterDeck();
    this.gold = 99;
    this.combat = null;
    this.rewardOptions = [];
    this.pendingNode = null;
    this.runHp = 70;
    this.maxHp = 70;
    this.stats = { battlesWon: 0, elitesWon: 0 };
    this.floor = 1;
    this.floorChoices = [];
    this.pendingTutorial = forceTutorial || !skipTutorial;
    this.isTutorialCombat = false;
    this.lastEncounterIds = [];
    this.onCombatWonCallback = null;

    if (mode === RUN_MODES.EXPEDITION) {
      this.map = generateMap(seed);
    } else {
      this.map = null;
      this.refreshFloorChoices();
    }
  }

  refreshFloorChoices() {
    this.floorChoices = generateFloorChoices(this.floor, this.mode, this.rng);
  }

  startNode(nodeId) {
    if (this.mode === RUN_MODES.EXPEDITION) {
      return this.startExpeditionNode(nodeId);
    }
    return this.startFloorNode(nodeId);
  }

  startExpeditionNode(nodeId) {
    const node = getNode(this.map, nodeId);
    if (!node || !node.available) return { ok: false, message: '无法进入该节点' };

    if (node.type === NODE_TYPES.START) {
      selectNode(this.map, nodeId);
      this.phase = RUN_PHASES.MAP;
      return { ok: true, phase: RUN_PHASES.MAP };
    }

    if (!selectNode(this.map, nodeId)) return { ok: false, message: '节点无效' };
    this.pendingNode = node;

    if (node.type === NODE_TYPES.REST) {
      this.phase = RUN_PHASES.REST;
      return { ok: true, phase: RUN_PHASES.REST };
    }

    if ([NODE_TYPES.BATTLE, NODE_TYPES.ELITE, NODE_TYPES.BOSS].includes(node.type)) {
      return this.enterCombat(mapNodeTier(node.type), this.floor);
    }

    return { ok: false, message: '未知节点' };
  }

  startFloorNode(nodeId) {
    const node = this.floorChoices.find((n) => n.id === nodeId);
    if (!node) return { ok: false, message: '无法进入该节点' };
    this.pendingNode = node;

    if (node.type === 'rest') {
      this.phase = RUN_PHASES.REST;
      return { ok: true, phase: RUN_PHASES.REST };
    }

    return this.enterCombat(floorNodeTier(node.type), this.floor);
  }

  enterCombat(tier, floor) {
    if (this.pendingTutorial) {
      this.combat = createTutorialCombat(this.deck);
      this.isTutorialCombat = true;
      this.pendingTutorial = false;
      this.lastEncounterIds = this.combat.getEncounterIds();
      this.phase = RUN_PHASES.COMBAT;
      return { ok: true, phase: RUN_PHASES.COMBAT, tutorial: true };
    }

    this.combat = new CombatEngine(this.deck, tier, {
      startHp: this.runHp,
      maxHp: this.maxHp,
      floor,
      rng: this.rng,
    });
    this.isTutorialCombat = false;
    this.lastEncounterIds = this.combat.getEncounterIds();
    this.phase = RUN_PHASES.COMBAT;
    return { ok: true, phase: RUN_PHASES.COMBAT };
  }

  playCard(cardUid, targetIndex = null) {
    if (this.phase !== RUN_PHASES.COMBAT || !this.combat) return { ok: false };
    const wasTutorial = this.isTutorialCombat;
    const r = this.combat.playCard(cardUid, targetIndex);
    if (this.combat?.phase === 'won') this.onCombatWon();
    else if (this.combat?.phase === 'lost') this.onCombatLost();
    if (wasTutorial && this.phase === RUN_PHASES.MAP) {
      return { ...r, ok: r.ok !== false, tutorialFinished: true };
    }
    return r;
  }

  setCombatTarget(index) {
    if (!this.combat) return { ok: false };
    return this.combat.setTarget(index);
  }

  endCombatTurn() {
    if (this.phase !== RUN_PHASES.COMBAT || !this.combat) return { ok: false };
    const wasTutorial = this.isTutorialCombat;
    const r = this.combat.endTurn();
    if (this.combat?.phase === 'won') this.onCombatWon();
    else if (this.combat?.phase === 'lost') this.onCombatLost();
    if (wasTutorial && this.phase === RUN_PHASES.MAP) {
      return { ...r, ok: r.ok !== false, tutorialFinished: true };
    }
    return r;
  }

  onCombatWon() {
    const encounterIds = this.combat?.getEncounterIds() || this.lastEncounterIds;
    this.lastEncounterIds = encounterIds;

    if (this.isTutorialCombat) {
      this.combat = null;
      this.isTutorialCombat = false;
      this.phase = RUN_PHASES.MAP;
      return;
    }

    this.runHp = this.combat.player.hp;
    this.deck = this.combat.getDeckAfterCombat();
    const tier = this.combat.tier;
    if (tier === 'elite') this.stats.elitesWon += 1;
    else if (tier !== 'boss') this.stats.battlesWon += 1;
    this.gold += tier === 'boss' ? 0 : tier === 'elite' ? 45 : 25;

    const isBossWin = tier === 'boss'
      || (this.mode === RUN_MODES.EXPEDITION && this.pendingNode?.type === NODE_TYPES.BOSS)
      || (this.mode === RUN_MODES.TIER && this.floor >= TIER_MAX_FLOOR && tier === 'boss');

    this.combat = null;

    if (!this.isTutorialCombat && encounterIds.length) {
      this.onCombatWonCallback?.(encounterIds);
    }

    if (isBossWin) {
      this.phase = RUN_PHASES.VICTORY;
      return;
    }

    if (this.mode === RUN_MODES.EXPEDITION) {
      this.rewardOptions = pickRewardOptions(3, this.rng);
      this.phase = RUN_PHASES.REWARD;
      return;
    }

    this.advanceFloorAfterWin(true);
  }

  advanceFloorAfterWin(withReward) {
    if (this.mode === RUN_MODES.TIER && this.floor >= TIER_MAX_FLOOR) {
      this.phase = RUN_PHASES.VICTORY;
      return;
    }

    this.floor += 1;
    this.refreshFloorChoices();

    if (withReward) {
      this.rewardOptions = pickRewardOptions(3, this.rng);
      this.phase = RUN_PHASES.REWARD;
    } else {
      this.phase = RUN_PHASES.MAP;
    }
  }

  onCombatLost() {
    this.phase = RUN_PHASES.DEFEAT;
    this.combat = null;
    this.isTutorialCombat = false;
  }

  pickReward(cardUid) {
    if (this.phase !== RUN_PHASES.REWARD) return { ok: false };
    const card = this.rewardOptions.find((c) => c.uid === cardUid);
    if (!card) return { ok: false, message: '无效技法' };
    this.deck.push(cloneCard(card));
    this.rewardOptions = [];
    this.finishRewardPhase();
    return { ok: true };
  }

  skipReward() {
    if (this.phase !== RUN_PHASES.REWARD) return { ok: false };
    this.rewardOptions = [];
    this.finishRewardPhase();
    return { ok: true };
  }

  finishRewardPhase() {
    if (this.mode === RUN_MODES.EXPEDITION) {
      this.phase = RUN_PHASES.MAP;
      if (isRunComplete(this.map)) this.phase = RUN_PHASES.VICTORY;
      return;
    }
    this.phase = RUN_PHASES.MAP;
  }

  restHeal() {
    if (this.phase !== RUN_PHASES.REST) return { ok: false };
    const before = this.runHp;
    this.runHp = Math.min(this.maxHp, this.runHp + 20);
    this.afterRest();
    return { ok: true, healed: this.runHp - before };
  }

  restUpgrade() {
    if (this.phase !== RUN_PHASES.REST) return { ok: false };
    const upgradable = this.deck.filter((c) => c.damage || c.block);
    if (upgradable.length) {
      const card = upgradable[Math.floor(this.rng() * upgradable.length)];
      if (card.damage) card.damage += 3;
      else if (card.block) card.block += 3;
      card.desc = (card.desc || '') + ' (已强化)';
    }
    this.afterRest();
    return { ok: true };
  }

  afterRest() {
    if (this.mode === RUN_MODES.EXPEDITION) {
      this.phase = RUN_PHASES.MAP;
      return;
    }
    this.floor += 1;
    this.refreshFloorChoices();
    this.phase = RUN_PHASES.MAP;
  }

  getState() {
    return {
      phase: this.phase,
      mode: this.mode,
      playerName: this.playerName,
      map: this.map,
      floor: this.floor,
      floorChoices: this.floorChoices.map((c) => ({ ...c })),
      maxFloor: this.mode === RUN_MODES.TIER ? TIER_MAX_FLOOR : null,
      deckSize: this.deck.length,
      gold: this.gold,
      combat: this.combat?.getState() ?? null,
      rewardOptions: this.rewardOptions.map((c) => ({ ...c })),
      stats: { ...this.stats },
      runHp: this.runHp,
      maxHp: this.maxHp,
      isTutorialCombat: this.isTutorialCombat,
      lastEncounterIds: [...this.lastEncounterIds],
    };
  }
}

export function createRun(playerName, options = {}) {
  if (typeof options === 'number') {
    return new RunEngine(playerName, { seed: options });
  }
  return new RunEngine(playerName, options);
}
