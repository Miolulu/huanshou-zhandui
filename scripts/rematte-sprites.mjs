/**
 * 用保守抠图重处理已有立绘（仅去贴边黑底）
 * node scripts/rematte-sprites.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { matteSprite } from './local-matte.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const DIRS = ['assets/enemies', 'assets/player'];

for (const rel of DIRS) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) {
    const file = path.join(dir, name);
    const out = await matteSprite(sharp(file), { preset: 'sprite' });
    await out.png().toFile(file);
    console.log('  ✓', path.join(rel, name));
  }
}

console.log('done');
