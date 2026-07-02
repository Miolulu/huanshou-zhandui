/** 净化远征 · 程序化战斗音效 */
import { getAudioContext, getSfxBus, isAudioMuted, setAudioMuted } from './purifyAudio.js';

function ctx() {
  return getAudioContext();
}

function out() {
  return getSfxBus();
}

function beep(freq = 440, duration = 0.15, volume = 0.12, type = 'sine') {
  const ac = ctx();
  const bus = out();
  if (!ac || !bus || isAudioMuted()) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(t);
  osc.stop(t + duration);
}

function noise(duration = 0.12, volume = 0.08, freq = 600) {
  const ac = ctx();
  const bus = out();
  if (!ac || !bus || isAudioMuted()) return;
  const t = ac.currentTime;
  const bufferSize = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  src.start(t);
  src.stop(t + duration);
}

function chord(freqs, duration, volume, type = 'triangle') {
  freqs.forEach((f, i) => beep(f, duration, volume * (1 - i * 0.12), type));
}

export const combatSounds = {
  setMuted(value) {
    setAudioMuted(value);
  },
  playCard() {
    beep(207.65, 0.1, 0.12, 'square');
    beep(329.63, 0.14, 0.08, 'sine');
  },
  selectCard() {
    beep(261.63, 0.07, 0.09, 'triangle');
  },
  hitEnemy() {
    noise(0.06, 0.06, 1800);
    beep(349.23, 0.08, 0.11, 'triangle');
    beep(523.25, 0.12, 0.06, 'sine');
  },
  hitPlayer() {
    noise(0.2, 0.11, 320);
    beep(146.83, 0.18, 0.08, 'sawtooth');
  },
  blockGain() {
    chord([392, 523.25, 659.25], 0.16, 0.06);
  },
  heal() {
    chord([523.25, 659.25, 783.99], 0.28, 0.07, 'sine');
  },
  endTurn() {
    noise(0.12, 0.06, 380);
    beep(174.61, 0.2, 0.05, 'triangle');
  },
  startTurn() {
    beep(440, 0.08, 0.07, 'sine');
    noise(0.1, 0.05, 900);
  },
  cardToHand() {
    beep(261.63, 0.05, 0.07, 'triangle');
  },
  purifyStrike() {
    beep(587.33, 0.1, 0.1, 'sine');
    noise(0.08, 0.05, 2400);
  },
  enemyDefeat() {
    chord([392, 523.25, 659.25, 783.99], 0.35, 0.07, 'sine');
  },
};
