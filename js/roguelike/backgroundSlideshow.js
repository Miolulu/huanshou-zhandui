/**
 * 主界面 / 战斗场景背景 · 5 张图自动轮换淡入淡出
 */
import { SCENE_BACKGROUNDS, ASSET_VER } from './assetPaths.js';

const INTERVAL_MS = 14000;
const FADE_MS = 2000;

const HOST_SELECTORS = [
  '#screen-menu .App-background',
  '#spire-scene-bg',
];

let slideIndex = 0;
let activeSlot = 0;
let timer = null;
let running = false;

function sceneUrl(index) {
  const path = SCENE_BACKGROUNDS[index % SCENE_BACKGROUNDS.length];
  return `${path}?v=${ASSET_VER}`;
}

function ensureLayers(host) {
  if (!host || host.dataset.bgSlideshow === '1') return;
  host.dataset.bgSlideshow = '1';
  host.classList.add('bg-slideshow-host');
  const a = document.createElement('span');
  const b = document.createElement('span');
  a.className = 'bg-slide is-active';
  a.dataset.slot = '0';
  b.className = 'bg-slide';
  b.dataset.slot = '1';
  host.appendChild(a);
  host.appendChild(b);
}

function hosts() {
  return HOST_SELECTORS.map((sel) => document.querySelector(sel)).filter(Boolean);
}

function applyToHost(host, url, slot) {
  const slides = host.querySelectorAll('.bg-slide');
  const next = slides[slot];
  const prev = slides[1 - slot];
  if (!next) return;
  next.style.backgroundImage = `url('${url}')`;
  next.classList.add('is-active');
  prev?.classList.remove('is-active');
}

function showIndex(index, slot) {
  const url = sceneUrl(index);
  hosts().forEach((host) => applyToHost(host, url, slot));
}

function advance() {
  slideIndex = (slideIndex + 1) % SCENE_BACKGROUNDS.length;
  activeSlot = 1 - activeSlot;
  showIndex(slideIndex, activeSlot);
}

export function startBackgroundSlideshow({ reset = false } = {}) {
  if (reset) {
    slideIndex = 0;
    activeSlot = 0;
  }
  hosts().forEach(ensureLayers);
  if (!hosts().length) return;

  showIndex(slideIndex, activeSlot);
  running = true;

  if (timer) clearInterval(timer);
  timer = setInterval(advance, INTERVAL_MS);
}

export function stopBackgroundSlideshow() {
  running = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function refreshBackgroundHosts() {
  if (!running) return;
  hosts().forEach(ensureLayers);
  showIndex(slideIndex, activeSlot);
}

export function getBackgroundSlideIndex() {
  return slideIndex;
}

export { INTERVAL_MS, FADE_MS };
