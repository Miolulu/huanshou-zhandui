/**
 * 仅对已有精灵 PNG 重新走 remove.bg 抠图（不重新裁切 sprite sheet）
 * node scripts/removebg-sprites.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { loadRemoveBgApiKey, removeBackground } from './removebg-api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const TARGETS = [
  ...fs.readdirSync(path.join(ROOT, 'assets/enemies')).filter((f) => f.endsWith('.png'))
    .map((f) => ({ rel: `assets/enemies/${f}`, type: 'animal' })),
  ...['purifier_portrait.png', 'purifier_battle.png'].map((f) => ({
    rel: `assets/player/${f}`,
    type: 'animal',
  })),
  ...fs.readdirSync(path.join(ROOT, 'assets/intents')).filter((f) => f.endsWith('.png'))
    .map((f) => ({ rel: `assets/intents/${f}`, type: 'auto' })),
  { rel: 'assets/ui/energy-badge.png', type: 'auto' },
];

const DELAY_MS = 600;
let lastAt = 0;

async function waitSlot() {
  const wait = DELAY_MS - (Date.now() - lastAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastAt = Date.now();
}

async function processOne({ rel, type }) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.warn('  ⚠ skip (missing)', rel);
    return;
  }
  const input = await fs.promises.readFile(abs);
  await waitSlot();
  const cut = await removeBackground(input, { type });
  let pipeline = sharp(cut);
  try {
    pipeline = pipeline.trim({ threshold: 1 });
  } catch {
    /* keep */
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(abs);
  console.log('  ✓', rel);
}

async function main() {
  if (!loadRemoveBgApiKey()) {
    console.error('缺少 REMOVE_BG_API_KEY，见 .env.example');
    process.exit(1);
  }
  console.log(`remove.bg 重抠 ${TARGETS.length} 张精灵…`);
  for (const t of TARGETS) await processOne(t);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
