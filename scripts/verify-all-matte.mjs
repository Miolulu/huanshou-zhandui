/**
 * 恢复原始素材 → 重抠 → 逐张验收
 * node scripts/verify-all-matte.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import sharp from 'sharp';
import { matteSprite } from './local-matte.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RESTORE_COMMIT = 'bc2cca2';
const DIRS = ['assets/enemies', 'assets/player'];
const PROBE_DIR = path.join(ROOT, 'assets/_probe');

function restoreFromGit(relPath) {
  const out = path.join(ROOT, relPath);
  const blob = execSync(`git show ${RESTORE_COMMIT}:${relPath.replace(/\\/g, '/')}`, {
    cwd: ROOT,
    maxBuffer: 20 * 1024 * 1024,
  });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, blob);
}

function maxC(r, g, b) { return Math.max(r, g, b); }

async function analyze(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  let trans = 0;
  let semi = 0;
  let opaque = 0;
  let edgeBlack = 0;
  let interiorBlack = 0;
  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const i = idx * 4;
      const a = data[i + 3];
      if (a < 16) { trans++; continue; }
      if (a < 240) semi++;
      else opaque++;

      if (a > 200) {
        if (maxC(data[i], data[i + 1], data[i + 2]) <= 36) {
          if (x === 0 || y === 0 || x === width - 1 || y === height - 1) edgeBlack++;
          else interiorBlack++;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const bw = maxX >= minX ? maxX - minX + 1 : 0;
  const bh = maxY >= minY ? maxY - minY + 1 : 0;
  const fillRatio = bw && bh ? (opaque / (bw * bh)).toFixed(2) : '0';

  return { w: width, h: height, trans, semi, opaque, edgeBlack, interiorBlack, bbox: `${bw}x${bh}`, fillRatio };
}

fs.mkdirSync(PROBE_DIR, { recursive: true });

console.log(`Restoring from ${RESTORE_COMMIT}...`);
for (const rel of DIRS) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) {
    restoreFromGit(path.join(rel, name).replace(/\\/g, '/'));
  }
}

console.log('Rematte all sprites...\n');
const results = [];

for (const rel of DIRS) {
  const dir = path.join(ROOT, rel);
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) {
    const file = path.join(dir, name);
    const out = await matteSprite(sharp(file), { preset: 'sprite' });
    await out.png().toFile(file);
    const stats = await analyze(file);
    const relPath = path.join(rel, name);
    results.push({ file: relPath, ...stats });

    const ok = stats.semi === 0 && stats.edgeBlack < 100;
    const flag = ok ? '✓' : '⚠';
    console.log(`${flag} ${relPath}`);
    console.log(`   trans=${stats.trans} semi=${stats.semi} edgeBlack=${stats.edgeBlack} interiorBlack=${stats.interiorBlack} bbox=${stats.bbox}`);

    await sharp(file).resize(280, null, { fit: 'inside' }).png().toFile(path.join(PROBE_DIR, name));
  }
}

const bad = results.filter((r) => r.semi > 0 || r.edgeBlack >= 100);
console.log(`\n${results.length} sprites, ${bad.length} need attention`);
if (bad.length) {
  console.log('Flagged:', bad.map((b) => b.file).join(', '));
  process.exitCode = 1;
}
