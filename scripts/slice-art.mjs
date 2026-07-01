/**
 * 从 GPT 生成的 sprite sheet 裁切到 assets/
 * node scripts/slice-art.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(
  'C:',
  'Users',
  'hortor',
  '.cursor',
  'projects',
  'c-Users-hortor-Documents-kimi-workspace',
  'assets',
);

const src = (name) => path.join(SRC, name);

async function crop(outRel, file, region, { trim = true } = {}) {
  const out = path.join(ROOT, outRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let pipeline = sharp(file).extract(region);
  if (trim) {
    pipeline = pipeline.trim({ threshold: 12, background: '#000000' });
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(out);
  console.log('  ✓', outRel);
}

async function upscaleScene(outRel, inputRel) {
  const out = path.join(ROOT, outRel);
  const input = path.join(ROOT, inputRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(input)
    .resize(1920, 1080, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .modulate({ saturation: 1.08, brightness: 0.95 })
    .sharpen({ sigma: 1.1, m1: 0.8, m2: 1.4 })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('  ✓', outRel);
}

async function main() {
  const enemies = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-27e9f85b-370a-4105-b027-1f21f44101d7.png');
  const cards3 = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-d71b1849-1a0e-453e-93c5-cc6ee61fa800.png');
  const cards2 = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-fd42ae59-27e1-49ab-bb1a-da2b73fb590e.png');
  const cardsBatch6 = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-00ebfc49-49cc-4926-967c-c4533fea8e5c.png');
  const cardsBatch5 = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-64018102-6fa1-49b5-a545-8a5ea9a5d9e4.png');
  const player = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-87537738-4552-472d-825c-df3edf705e6f.png');
  const scenes = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-5363b966-8d89-43c0-b81a-a86cdabb5f79.png');
  const uiFile = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-4f4a4bc1-67c8-469c-b3a4-97b82aa582aa.png');

  console.log('Enemies…');
  const ew = 341;
  const eh = Math.floor(682 / 3);
  const ehLast = 682 - eh * 2;
  const map = [
    ['assets/enemies/corrupted_mushroom.png', { left: 0, top: 0, width: ew, height: eh }],
    ['assets/enemies/corrupted_wolf.png', { left: ew, top: 0, width: ew, height: eh }],
    ['assets/enemies/corrupted_turtle.png', { left: 0, top: eh, width: ew, height: eh }],
    ['assets/enemies/corrupted_cat.png', { left: ew, top: eh, width: ew, height: eh }],
    ['assets/enemies/corrupted_crab.png', { left: ew * 2, top: eh, width: 1024 - ew * 2, height: eh }],
    ['assets/enemies/corrupted_shadow.png', { left: 0, top: eh * 2, width: ew, height: ehLast }],
    ['assets/enemies/boss_dragon.png', { left: ew, top: eh * 2, width: 1024 - ew, height: ehLast }],
  ];
  for (const [out, region] of map) await crop(out, enemies, region);

  console.log('Cards (starter + extras)…');
  const ch = Math.floor(682 / 3);
  await crop('assets/cards/purify_strike.png', cards3, { left: 0, top: 0, width: 1024, height: ch });
  await crop('assets/cards/holy_barrier.png', cards3, { left: 0, top: ch, width: 1024, height: ch });
  await crop('assets/cards/beast_pact.png', cards3, { left: 0, top: ch * 2, width: 1024, height: 682 - ch * 2 });
  const ch2 = Math.floor(682 / 2);
  await crop('assets/cards/flame_purify.png', cards2, { left: 0, top: 0, width: 1024, height: ch2 });
  await crop('assets/cards/thunder_purify.png', cards2, { left: 0, top: ch2, width: 1024, height: 682 - ch2 });

  console.log('Cards batch 6 (攻型 2×3)…');
  const b6w = Math.floor(1024 / 2);
  const b6h = Math.floor(681 / 3);
  const batch6 = [
    ['vine_lash', 0, 0],
    ['twin_purify', 1, 0],
    ['life_drain', 0, 1],
    ['heavy_purify', 1, 1],
    ['poison_fang', 0, 2],
    ['wind_cut', 1, 2],
  ];
  for (const [id, col, row] of batch6) {
    const w = col === 1 ? 1024 - b6w : b6w;
    const h = row === 2 ? 681 - b6h * 2 : b6h;
    await crop(`assets/cards/${id}.png`, cardsBatch6, {
      left: col * b6w,
      top: row * b6h,
      width: w,
      height: h,
    });
  }

  console.log('Cards batch 5 (守型/秘法 3+4)…');
  const topH = Math.floor(681 * 0.52);
  const botH = 681 - topH;
  const topW = Math.floor(1024 / 3);
  const botW = Math.floor(1024 / 4);
  const batch5Top = ['ice_shell', 'heal_bloom', 'iron_aegis'];
  const batch5Bot = ['meditate', 'quick_guard', 'barrier', 'rage'];
  for (let i = 0; i < batch5Top.length; i++) {
    const w = i === 2 ? 1024 - topW * 2 : topW;
    await crop(`assets/cards/${batch5Top[i]}.png`, cardsBatch5, {
      left: i * topW,
      top: 0,
      width: w,
      height: topH,
    });
  }
  for (let i = 0; i < batch5Bot.length; i++) {
    const w = i === 3 ? 1024 - botW * 3 : botW;
    await crop(`assets/cards/${batch5Bot[i]}.png`, cardsBatch5, {
      left: i * botW,
      top: topH,
      width: w,
      height: botH,
    });
  }

  console.log('Player…');
  try {
    await crop('assets/player/purifier_portrait.png', player, { left: 0, top: 0, width: 512, height: 682 }, { trim: false });
    await crop('assets/player/purifier_battle.png', player, { left: 512, top: 0, width: 512, height: 682 }, { trim: false });
  } catch (e) {
    console.warn('  ⚠ Player sprites skipped:', e.message);
  }

  console.log('Scenes…');
  const sw = Math.floor(1024 / 3);
  const sh = Math.floor(576 / 2);
  let idx = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const w = col === 2 ? 1024 - sw * 2 : sw;
      const h = row === 1 ? 576 - sh : sh;
      await crop(`assets/scenes/scene-${idx}.png`, scenes, {
        left: col * sw,
        top: row * sh,
        width: w,
        height: h,
      });
      idx++;
    }
  }
  await upscaleScene('assets/scenes/main-bg.png', 'assets/scenes/scene-5.png');

  console.log('Intent icons…');
  const iw = 64;
  const ih = 64;
  const intents = [
    ['assets/intents/damage.png', 0],
    ['assets/intents/block.png', 1],
    ['assets/intents/buff.png', 2],
    ['assets/intents/debuff.png', 3],
    ['assets/intents/unknown.png', 4],
  ];
  const iconY = 900;
  const iconX0 = 280;
  const iconGap = 74;
  for (const [out, i] of intents) {
    await crop(out, uiFile, { left: iconX0 + i * iconGap, top: iconY, width: iw, height: ih });
  }

  console.log('Energy badge…');
  await crop('assets/ui/energy-badge.png', uiFile, { left: 360, top: 130, width: 100, height: 100 });

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
