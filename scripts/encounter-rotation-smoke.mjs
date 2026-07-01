/**
 * 遭遇轮换冒烟：连续多层不应出现相同组合，且所有素材都能轮到
 * node scripts/encounter-rotation-smoke.mjs
 */
import { pickEncounter, resetEncounterMemory, MONSTER_POOL } from '../js/roguelike/enemies.js';

function keyOf(group) {
  return group.map((e) => e.id).sort().join('+');
}

function testNoConsecutiveRepeat() {
  resetEncounterMemory();
  const rng = (() => {
    let s = 12345;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  })();

  let prevKey = '';
  let repeats = 0;
  const floors = 60;
  for (let floor = 1; floor <= floors; floor++) {
    const group = pickEncounter(floor, 'normal', rng);
    const key = keyOf(group);
    if (key === prevKey) repeats += 1;
    prevKey = key;
  }
  const ok = repeats === 0;
  console.log('no consecutive repeat:', ok ? '✓' : '✗', { repeats, floors });
  return ok;
}

function testAllSpritesRotate() {
  resetEncounterMemory();
  const rng = (() => {
    let s = 777;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  })();

  const seen = new Set();
  for (let floor = 20; floor <= 120; floor += 3) {
    const group = pickEncounter(floor, 'normal', rng);
    group.forEach((e) => seen.add(e.id));
  }
  // late 池的所有普通怪都应至少出现一次
  const expected = MONSTER_POOL.late;
  const missing = expected.filter((id) => !seen.has(id));
  const ok = missing.length === 0;
  console.log('all sprites rotate:', ok ? '✓' : '✗', { seen: [...seen], missing });
  return ok;
}

function testVarietyOverWindow() {
  resetEncounterMemory();
  const rng = (() => {
    let s = 42;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  })();

  // 任意连续 6 层内，组合去重后应 >= 4 种，避免“两只怪一直循环”
  const keys = [];
  for (let floor = 1; floor <= 30; floor++) {
    keys.push(keyOf(pickEncounter(floor, 'normal', rng)));
  }
  let worst = Infinity;
  for (let i = 0; i + 6 <= keys.length; i++) {
    const distinct = new Set(keys.slice(i, i + 6)).size;
    worst = Math.min(worst, distinct);
  }
  const ok = worst >= 4;
  console.log('variety in window:', ok ? '✓' : '✗', { worstDistinctIn6: worst });
  return ok;
}

const results = [
  testNoConsecutiveRepeat(),
  testAllSpritesRotate(),
  testVarietyOverWindow(),
];
const ok = results.every(Boolean);
console.log(ok ? '✅ encounter rotation smoke passed' : '❌ encounter rotation smoke failed');
process.exit(ok ? 0 : 1);
