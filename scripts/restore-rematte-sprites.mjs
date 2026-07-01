/**
 * 从抠图前的原始 PNG 恢复，再用保守算法重抠
 * node scripts/restore-rematte-sprites.mjs
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

function restoreFromGit(relPath) {
  const out = path.join(ROOT, relPath);
  const blob = execSync(`git show ${RESTORE_COMMIT}:${relPath.replace(/\\/g, '/')}`, {
    cwd: ROOT,
    maxBuffer: 20 * 1024 * 1024,
  });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, blob);
}

async function probeAlpha(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let trans = 0;
  let semi = 0;
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a < 16) trans++;
    else if (a < 240) semi++;
    else opaque++;
  }
  return { w: info.width, h: info.height, trans, semi, opaque };
}

console.log(`Restoring sprites from ${RESTORE_COMMIT}...`);
for (const rel of DIRS) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) {
    restoreFromGit(path.join(rel, name).replace(/\\/g, '/'));
    console.log('  restore', path.join(rel, name));
  }
}

console.log('Applying conservative matte...');
for (const rel of DIRS) {
  const dir = path.join(ROOT, rel);
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) {
    const file = path.join(dir, name);
    const relNorm = path.join(rel, name).replace(/\\/g, '/');
    const preset = relNorm.includes('/player/') ? 'player' : 'sprite';
    const out = await matteSprite(sharp(file), { preset });
    await out.png().toFile(file);
    const stats = await probeAlpha(file);
    console.log('  ✓', path.join(rel, name), stats);
  }
}

console.log('done');
