/** 实战新手引导 · 进入战斗时的分步教学 */
export const COMBAT_TUTORIAL_STEPS = [
  {
    id: 'intent',
    title: '读懂污意',
    text: '敌人头上的「污意」预告了下一调息的行动。先观察它要暴走还是缩壳。',
    highlight: '.purify-intent',
    action: 'observe',
  },
  {
    id: 'attack',
    title: '打出攻型技法',
    text: '点击「净化冲击」消耗 1 点灵力，对选中的污化幻兽造成净化伤害。',
    highlight: '.purify-card.card-attack',
    action: 'play_attack',
    cardType: 'attack',
  },
  {
    id: 'barrier',
    title: '展开护幕',
    text: '敌人即将攻击。打出「圣光护幕」获得护幕，抵御部分伤害。',
    highlight: '.purify-card.card-skill',
    action: 'play_skill',
    cardType: 'skill',
  },
  {
    id: 'end_turn',
    title: '收势',
    text: '技法用尽后点击「收势」，进入敌人调息。护幕会在下轮清零。',
    highlight: '.purify-end-turn',
    action: 'end_turn',
  },
  {
    id: 'finish',
    title: '完成净化',
    text: '继续攻击直到污秽归零。净化成功后，该幻兽的故事会收录进怪物手册。',
    highlight: '.purify-foe-card',
    action: 'win',
  },
];

export class CombatTutorial {
  constructor(onComplete) {
    this.stepIndex = 0;
    this.active = true;
    this.onComplete = onComplete;
  }

  get currentStep() {
    return COMBAT_TUTORIAL_STEPS[this.stepIndex] || null;
  }

  isDone() {
    return this.stepIndex >= COMBAT_TUTORIAL_STEPS.length;
  }

  canPlayCard(card, combat) {
    const step = this.currentStep;
    if (!step || !this.active) return true;
    if (step.action === 'play_attack' && card.type !== 'attack') return false;
    if (step.action === 'play_skill' && card.type !== 'skill') return false;
    if (step.action === 'end_turn' || step.action === 'observe') return false;
    return true;
  }

  canEndTurn() {
    const step = this.currentStep;
    if (!this.active || !step) return true;
    return step.action === 'end_turn' || step.action === 'win';
  }

  onAction(actionType, combat) {
    const step = this.currentStep;
    if (!step || !this.active) return;

    const match = (
      (step.action === 'play_attack' && actionType === 'play_attack')
      || (step.action === 'play_skill' && actionType === 'play_skill')
      || (step.action === 'end_turn' && actionType === 'end_turn')
      || (step.action === 'win' && actionType === 'win')
      || (step.action === 'observe' && actionType === 'observe')
    );

    if (match) {
      this.stepIndex += 1;
      if (this.isDone()) {
        this.active = false;
        this.onComplete?.();
      }
    }
  }

  skipObserve() {
    if (this.currentStep?.action === 'observe') {
      this.onAction('observe');
    }
  }

  skipAll() {
    if (!this.active) return;
    this.active = false;
    this.stepIndex = COMBAT_TUTORIAL_STEPS.length;
    this.onComplete?.();
  }

  getOverlayHtml() {
    const step = this.currentStep;
    if (!step || !this.active) return '';
    return `
      <div class="purify-tutorial-overlay" id="purify-tutorial-overlay">
        <div class="purify-tutorial-card">
          <span class="purify-tutorial-step">${this.stepIndex + 1} / ${COMBAT_TUTORIAL_STEPS.length}</span>
          <h3>${step.title}</h3>
          <p>${step.text}</p>
          <div class="purify-tutorial-actions">
            ${step.action === 'observe' ? '<button type="button" class="purify-tutorial-next" id="btn-tutorial-next">知道了</button>' : ''}
            <button type="button" class="purify-tutorial-skip" id="btn-tutorial-skip">跳过引导</button>
          </div>
        </div>
      </div>`;
  }
}
