/**
 * 净化远征 · 程序化氛围音乐 + 共享音频总线
 * 无外部音频文件，由 Web Audio 实时合成
 */

const STORAGE_MUTE = 'purify_audio_muted';
const STORAGE_VOL = 'purify_audio_vol';

let ac = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let unlocked = false;
let muted = false;
let musicVolume = 0.42;
let currentScene = 'off';
let pendingScene = 'off';
let activeTrack = null;
let stingPlayed = null;

function readPrefs() {
  try {
    muted = localStorage.getItem(STORAGE_MUTE) === '1';
    const v = Number(localStorage.getItem(STORAGE_VOL));
    if (Number.isFinite(v)) musicVolume = Math.min(1, Math.max(0, v));
  } catch { /* ignore */ }
}

readPrefs();

export function getAudioContext() {
  if (!ac) {
    try {
      ac = new window.AudioContext();
      master = ac.createGain();
      musicBus = ac.createGain();
      sfxBus = ac.createGain();
      master.gain.value = 1;
      musicBus.connect(master);
      sfxBus.connect(master);
      master.connect(ac.destination);
      applyMixLevels();
    } catch {
      return null;
    }
  }
  return ac;
}

export function getSfxBus() {
  getAudioContext();
  return sfxBus;
}

function applyMixLevels() {
  if (!musicBus || !sfxBus) return;
  musicBus.gain.value = muted ? 0 : musicVolume;
  sfxBus.gain.value = muted ? 0 : 0.85;
}

export function isAudioMuted() {
  return muted;
}

export function setAudioMuted(value) {
  muted = !!value;
  try { localStorage.setItem(STORAGE_MUTE, muted ? '1' : '0'); } catch { /* ignore */ }
  applyMixLevels();
  if (muted && activeTrack) activeTrack.stop(0.2);
  else if (!muted && unlocked && currentScene !== 'off') applyScene(currentScene);
  syncMuteButton();
}

export function toggleAudioMuted() {
  setAudioMuted(!muted);
  return muted;
}

export function getMusicVolume() {
  return musicVolume;
}

export function setMusicVolume(value) {
  musicVolume = Math.min(1, Math.max(0, value));
  try { localStorage.setItem(STORAGE_VOL, String(musicVolume)); } catch { /* ignore */ }
  applyMixLevels();
}

function syncMuteButton() {
  const btn = document.getElementById('btn-purify-audio');
  if (!btn) return;
  btn.textContent = muted ? '🔇' : '🔊';
  btn.title = muted ? '开启音效与音乐' : '静音';
  btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
}

export function bindAudioToggleButton() {
  const btn = document.getElementById('btn-purify-audio');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    unlockPurifyAudio();
    toggleAudioMuted();
  });
  syncMuteButton();
}

let unlockBound = false;

export function bindAudioUnlock() {
  if (unlockBound) return;
  unlockBound = true;
  const unlock = () => unlockPurifyAudio();
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('keydown', unlock, { passive: true });
}

export function unlockPurifyAudio() {
  getAudioContext();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (unlocked) return;
  unlocked = true;
  if (pendingScene !== 'off') applyScene(pendingScene);
}

function stopActiveTrack(fade = 1.4) {
  if (!activeTrack) return;
  const track = activeTrack;
  activeTrack = null;
  track.stop(fade);
}

function applyScene(scene) {
  currentScene = scene;
  if (!unlocked || muted || !ac || !musicBus) {
    stopActiveTrack(0.3);
    return;
  }

  if (scene === 'off') {
    stopActiveTrack(0.8);
    return;
  }

  if (activeTrack?.scene === scene) return;

  stopActiveTrack(1.2);
  const track = createTrack(scene);
  if (!track) return;
  activeTrack = track;
  track.start();
}

/** @param {'menu'|'map'|'combat'|'rest'|'shop'|'reward'|'victory'|'defeat'|'off'} scene */
export function setAmbientScene(scene) {
  pendingScene = scene;
  if (scene === 'off') {
    stingPlayed = null;
    applyScene('off');
    return;
  }
  if (scene !== 'victory' && scene !== 'defeat') {
    stingPlayed = null;
  }
  if ((scene === 'victory' || scene === 'defeat') && stingPlayed === scene) {
    return;
  }
  if (scene === 'victory' || scene === 'defeat') {
    stingPlayed = scene;
  }
  if (!unlocked) return;
  applyScene(scene);
}

function createTrack(scene) {
  switch (scene) {
    case 'menu': return new MenuTrack(ac, musicBus, scene);
    case 'map':
    case 'reward': return new MapTrack(ac, musicBus, scene);
    case 'combat': return new CombatTrack(ac, musicBus, scene);
    case 'rest': return new RestTrack(ac, musicBus, scene);
    case 'shop': return new ShopTrack(ac, musicBus, scene);
    case 'victory': return new StingTrack(ac, musicBus, scene, 'victory');
    case 'defeat': return new StingTrack(ac, musicBus, scene, 'defeat');
    default: return null;
  }
}

class BaseTrack {
  constructor(context, bus, scene) {
    this.ac = context;
    this.bus = bus;
    this.scene = scene;
    this.nodes = [];
    this.timers = [];
    this.localGain = null;
    this.running = false;
  }

  connect(node) {
    this.nodes.push(node);
    return node;
  }

  schedule(fn) {
    const id = setInterval(fn, this.beatMs);
    this.timers.push(() => clearInterval(id));
    fn();
  }

  scheduleTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    this.timers.push(() => clearTimeout(id));
  }

  stop(fade = 1.2) {
    this.running = false;
    this.timers.forEach((clear) => clear());
    this.timers = [];
    const t = this.ac.currentTime;
    if (this.localGain) {
      this.localGain.gain.cancelScheduledValues(t);
      this.localGain.gain.setValueAtTime(this.localGain.gain.value, t);
      this.localGain.gain.linearRampToValueAtTime(0.0001, t + fade);
    }
    setTimeout(() => {
      this.nodes.forEach((node) => {
        try { node.stop?.(); } catch { /* ignore */ }
        try { node.disconnect?.(); } catch { /* ignore */ }
      });
      this.nodes = [];
    }, fade * 1000 + 80);
  }

  fadeIn(duration = 2.5) {
    const t = this.ac.currentTime;
    this.localGain.gain.setValueAtTime(0.0001, t);
    this.localGain.gain.linearRampToValueAtTime(1, t + duration);
  }

  tone(time, freq, duration, volume, type = 'sine', detune = 0) {
    const osc = this.ac.createOscillator();
    const g = this.ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    osc.detune.setValueAtTime(detune, time);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(volume, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(g);
    g.connect(this.localGain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
    this.nodes.push(osc, g);
  }

  noiseBurst(time, duration, volume, freq = 500) {
    const bufferSize = Math.max(1, Math.floor(this.ac.sampleRate * duration));
    const buffer = this.ac.createBuffer(1, bufferSize, this.ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ac.createBufferSource();
    src.buffer = buffer;
    const filter = this.ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(volume, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.localGain);
    src.start(time);
    src.stop(time + duration + 0.02);
    this.nodes.push(src, filter, g);
  }
}

/** 主菜单 · 静谧净化主题 */
class MenuTrack extends BaseTrack {
  start() {
    this.beatMs = (60 / 54) * 1000;
    this.localGain = this.connect(this.ac.createGain());
    this.localGain.connect(this.bus);
    this.running = true;
    this.fadeIn(2.8);

    const filter = this.ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(this.localGain);
    this.connect(filter);

    [146.83, 174.61, 220, 261.63].forEach((freq, i) => {
      const osc = this.ac.createOscillator();
      const g = this.ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = i * 4;
      g.gain.value = 0.018 + i * 0.004;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.nodes.push(osc, g);
    });

    let step = 0;
    const motif = [392, 440, 523.25, 440];
    this.schedule(() => {
      if (!this.running) return;
      const t = this.ac.currentTime;
      this.tone(t, motif[step % motif.length], 1.4, 0.045, 'triangle');
      step += 1;
    });
  }
}

/** 路线图 · 探索感 */
class MapTrack extends BaseTrack {
  start() {
    this.beatMs = (60 / 66) * 1000;
    this.localGain = this.connect(this.ac.createGain());
    this.localGain.connect(this.bus);
    this.running = true;
    this.fadeIn(2.2);

    const filter = this.ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    filter.connect(this.localGain);
    this.connect(filter);

    [110, 164.81, 196, 246.94].forEach((freq) => {
      const osc = this.ac.createOscillator();
      const g = this.ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.value = 0.022;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.nodes.push(osc, g);
    });

    let step = 0;
    const arp = [293.66, 329.63, 392, 440, 392, 329.63];
    this.schedule(() => {
      if (!this.running) return;
      const t = this.ac.currentTime;
      this.tone(t, arp[step % arp.length], 0.55, 0.038, 'sine');
      if (step % 2 === 0) this.noiseBurst(t, 0.06, 0.018, 1200);
      step += 1;
    });
  }
}

/** 战斗 · 紧张脉冲与暗紫低音 */
class CombatTrack extends BaseTrack {
  start() {
    this.beatMs = (60 / 92) * 1000;
    this.localGain = this.connect(this.ac.createGain());
    this.localGain.connect(this.bus);
    this.running = true;
    this.fadeIn(1.6);

    const filter = this.ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    filter.Q.value = 0.7;
    filter.connect(this.localGain);
    this.connect(filter);

    const lfo = this.ac.createOscillator();
    const lfoGain = this.ac.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.nodes.push(lfo, lfoGain);

    [73.42, 110, 146.83].forEach((freq, i) => {
      const osc = this.ac.createOscillator();
      const g = this.ac.createGain();
      osc.type = i === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;
      g.gain.value = i === 0 ? 0.028 : 0.02;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.nodes.push(osc, g);
    });

    let beat = 0;
    const motif = [220, 261.63, 293.66, 329.63];
    this.schedule(() => {
      if (!this.running) return;
      const t = this.ac.currentTime;
      if (beat % 2 === 0) {
        const kick = this.ac.createOscillator();
        const kg = this.ac.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(130, t);
        kick.frequency.exponentialRampToValueAtTime(42, t + 0.1);
        kg.gain.setValueAtTime(0.12, t);
        kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        kick.connect(kg);
        kg.connect(this.localGain);
        kick.start(t);
        kick.stop(t + 0.16);
        this.nodes.push(kick, kg);
      }
      if (beat % 4 === 2) {
        this.tone(t, motif[(beat / 2) % motif.length], 0.35, 0.05, 'square');
      }
      if (beat % 4 === 1) this.noiseBurst(t, 0.05, 0.025, 2200);
      beat += 1;
    });
  }
}

/** 驿站调息 · 柔和治愈 */
class RestTrack extends BaseTrack {
  start() {
    this.beatMs = (60 / 48) * 1000;
    this.localGain = this.connect(this.ac.createGain());
    this.localGain.connect(this.bus);
    this.running = true;
    this.fadeIn(3);

    const filter = this.ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.connect(this.localGain);
    this.connect(filter);

    const wind = this.ac.createBufferSource();
    const windBuf = this.ac.createBuffer(1, this.ac.sampleRate * 2, this.ac.sampleRate);
    const wd = windBuf.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    wind.buffer = windBuf;
    wind.loop = true;
    const windFilter = this.ac.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 420;
    const windGain = this.ac.createGain();
    windGain.gain.value = 0.012;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(filter);
    wind.start();
    this.nodes.push(wind, windFilter, windGain);

    [146.83, 174.61, 220, 261.63].forEach((freq) => {
      const osc = this.ac.createOscillator();
      const g = this.ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.024;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.nodes.push(osc, g);
    });

    let step = 0;
    const bells = [523.25, 659.25, 783.99, 659.25];
    this.schedule(() => {
      if (!this.running) return;
      const t = this.ac.currentTime;
      if (step % 2 === 0) {
        this.tone(t, bells[(step / 2) % bells.length], 2.2, 0.032, 'sine');
      }
      step += 1;
    });
  }
}

/** 秘法铺 · 轻快神秘 */
class ShopTrack extends BaseTrack {
  start() {
    this.beatMs = (60 / 76) * 1000;
    this.localGain = this.connect(this.ac.createGain());
    this.localGain.connect(this.bus);
    this.running = true;
    this.fadeIn(2);

    const filter = this.ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;
    filter.connect(this.localGain);
    this.connect(filter);

    [196, 246.94, 293.66].forEach((freq) => {
      const osc = this.ac.createOscillator();
      const g = this.ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      g.gain.value = 0.02;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      this.nodes.push(osc, g);
    });

    let step = 0;
    const arp = [392, 440, 523.25, 587.33, 523.25, 440];
    this.schedule(() => {
      if (!this.running) return;
      const t = this.ac.currentTime;
      this.tone(t, arp[step % arp.length], 0.4, 0.042, 'triangle');
      if (step % 3 === 0) this.noiseBurst(t, 0.04, 0.015, 2800);
      step += 1;
    });
  }
}

/** 胜负短乐句 */
class StingTrack extends BaseTrack {
  constructor(context, bus, scene, kind) {
    super(context, bus, scene);
    this.kind = kind;
  }

  start() {
    this.localGain = this.connect(this.ac.createGain());
    this.localGain.connect(this.bus);
    this.running = true;
    this.fadeIn(0.2);
    const t = this.ac.currentTime;
    const notes = this.kind === 'victory'
      ? [392, 493.88, 587.33, 783.99]
      : [220, 196, 174.61, 146.83];
    notes.forEach((freq, i) => {
      this.tone(t + i * 0.22, freq, 0.55, this.kind === 'victory' ? 0.07 : 0.05, 'sine');
    });
    this.scheduleTimeout(() => {
      this.stop(1.8);
    }, this.kind === 'victory' ? 3200 : 3800);
  }
}

export function sceneForRunPhase(phase, RUN_PHASES) {
  switch (phase) {
    case RUN_PHASES.COMBAT: return 'combat';
    case RUN_PHASES.REST: return 'rest';
    case RUN_PHASES.SHOP: return 'shop';
    case RUN_PHASES.REWARD: return 'reward';
    case RUN_PHASES.VICTORY: return 'victory';
    case RUN_PHASES.DEFEAT: return 'defeat';
    case RUN_PHASES.MAP: return 'map';
    default: return 'off';
  }
}
