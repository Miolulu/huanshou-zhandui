/** 净化远征 · 程序化战斗音效（参照 Slay the Web Web Audio） */
let audioContext = null;
let muted = false;

function ctx() {
  if (!audioContext) {
    try {
      audioContext = new window.AudioContext();
    } catch {
      return null;
    }
  }
  return audioContext;
}

function beep(freq = 440, duration = 0.15, volume = 0.12, type = 'sine') {
  const ac = ctx();
  if (!ac || muted) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

function noise(duration = 0.12, volume = 0.08, freq = 600) {
  const ac = ctx();
  if (!ac || muted) return;
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

export const combatSounds = {
  setMuted(value) {
    muted = value;
  },
  playCard() {
    beep(207.65, 0.12, 0.14, 'square');
  },
  selectCard() {
    beep(261.63, 0.08, 0.1);
  },
  hitEnemy() {
    beep(349.23, 0.1, 0.13, 'triangle');
  },
  hitPlayer() {
    noise(0.18, 0.1, 400);
  },
  blockGain() {
    beep(523.25, 0.14, 0.1);
  },
  heal() {
    beep(659.25, 0.2, 0.09);
  },
  endTurn() {
    noise(0.15, 0.07, 350);
  },
  startTurn() {
    noise(0.12, 0.06, 800);
  },
};
