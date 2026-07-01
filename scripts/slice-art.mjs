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

async function crop(outRel, file, region) {
  const out = path.join(ROOT, outRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(file)
    .extract(region)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('  ✓', outRel);
}

async function main() {
  const enemies = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-27e9f85b-370a-4105-b027-1f21f44101d7.png');
  const cards3 = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-d71b1849-1a0e-453e-93c5-cc6ee61fa800.png');
  const cards2 = src('c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-fd42ae59-27e1-49ab-bb1a-da2b73fb590e.png');
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

  console.log('Player…');
  await crop('assets/player/purifier_portrait.png', player, { left: 0, top: 0, width: 512, height: 682 });
  await crop('assets/player/purifier_battle.png', player, { left: 512, top: 0, width: 512, height: 682 });

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
