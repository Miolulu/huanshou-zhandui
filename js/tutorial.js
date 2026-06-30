/** 新手教程（文档第七章简化版） */
import { completeTutorial, loadProfile } from './playerProfile.js';
import { showToast } from './appShell.js';

const STEPS = [
  { title: '欢迎来到幻兽战队', text: '这是一款8人策略卡牌自走棋。每回合在酒馆购买幻兽、组建战队，然后自动战斗。', target: null },
  { title: '选择游戏模式', text: '主界面可选择排位、休闲、人机对战等模式。人机模式可单独练习。', target: '.mode-grid' },
  { title: '创建或加入房间', text: '多人对战可创建房间邀请好友，或输入6位房间号加入。', target: '.menu-actions' },
  { title: '种族与技能', text: '每局随机5个种族进入卡池（左侧可见）。无羁绊加成，靠战吼/亡语自行搭配；图鉴有跳蛙流、海盗流等思路。', target: null },
  { title: '三连发现', text: '3张同名同星自动合成升星，并弹出「发现」：从更高费随从中选一张免费加入战队（需有空栏位）。', target: null },
  { title: '站位调整', text: '准备阶段可拖拽栏位，或先点一张再点另一张交换位置。从左到右攻击，跳蛙流等流派很吃站位。', target: null },
  { title: '段位与成长', text: '排位赛会升降段位星数。完成任务和签到可获得金币经验。', target: '.profile-panel' },
  { title: '开始游戏', text: '点击模式卡片即可开始。人机对战无需房间，直接开局！', target: '.mode-grid' },
];

let stepIndex = 0;
let overlayEl = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.id = 'tutorial-overlay';
  overlayEl.className = 'tutorial-overlay hidden';
  overlayEl.innerHTML = `
    <div class="tutorial-box">
      <div class="tutorial-progress"></div>
      <h3 class="tutorial-title"></h3>
      <p class="tutorial-text"></p>
      <div class="tutorial-actions">
        <button type="button" class="btn-muted" id="tutorial-skip">跳过</button>
        <button type="button" class="btn-accent" id="tutorial-next">下一步</button>
      </div>
    </div>`;
  document.body.appendChild(overlayEl);
  overlayEl.querySelector('#tutorial-skip').onclick = () => finishTutorial();
  overlayEl.querySelector('#tutorial-next').onclick = () => nextStep();
  return overlayEl;
}

function highlightTarget(selector) {
  document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
  if (!selector) return;
  const el = document.querySelector(selector);
  if (el) el.classList.add('tutorial-highlight');
}

function renderStep() {
  const step = STEPS[stepIndex];
  const el = ensureOverlay();
  el.classList.remove('hidden');
  el.querySelector('.tutorial-title').textContent = step.title;
  el.querySelector('.tutorial-text').textContent = step.text;
  el.querySelector('.tutorial-progress').textContent = `${stepIndex + 1} / ${STEPS.length}`;
  el.querySelector('#tutorial-next').textContent = stepIndex >= STEPS.length - 1 ? '完成' : '下一步';
  highlightTarget(step.target);
}

function finishTutorial() {
  completeTutorial(loadProfile());
  overlayEl?.classList.add('hidden');
  highlightTarget(null);
  stepIndex = 0;
  showToast('教程完成！获得 200 金币 + 100 经验');
}

function nextStep() {
  if (stepIndex >= STEPS.length - 1) {
    finishTutorial();
    return;
  }
  stepIndex++;
  renderStep();
}

export function startTutorial(force = false) {
  const profile = loadProfile();
  if (profile.tutorialCompleted && !force) return false;
  stepIndex = 0;
  renderStep();
  return true;
}

export function shouldAutoStartTutorial() {
  return !loadProfile().tutorialCompleted;
}
