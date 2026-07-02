/**
 * 裁切污意图标 / 净化冲击连击 / 击败特效
 * node scripts/slice-vfx-events.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { encodePipeline } from './asset-encode.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(
  'C:',
  'Users',
  'hortor',
  '.cursor',
  'projects',
  'c-Users-hortor-Documents-kimi-workspace',
  'assets',
);

const INTENT_SHEET = path.join(
  ASSETS,
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-6af447f0-5ef5-4032-b18d-e5895c68547d.png',
);
const STRIKE_SHEET = path.join(
  ASSETS,
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-719cab85-7a8a-4238-86fb-57c2e8b0f007.png',
);
const DEFEAT_SHEET = path.join(
  ASSETS,
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-4572ee0a-43e9-4f0f-8b54-c7ed0da31c9c.png',
);

const INTENT_REGIONS = {
  damage: { left: 10, top: 35, width: 135, height: 190 },
  block: { left: 268, top: 35, width: 205, height: 190 },
  buff: { left: 48, top: 248, width: 125, height: 155 },
  debuff: { left: 268, top: 248, width: 195, height: 155 },
  unknown: { left: 118, top: 478, width: 210, height: 210 },
};

const STATUS_REGIONS = {
  strength: { left: 48, top: 248, width: 125, height: 155 },
  vulnerable: { left: 268, top: 248, width: 195, height: 155 },
  poison: { left: 268, top: 248, width: 195, height: 155 },
  weak: { left: 268, top: 248, width: 195, height: 155 },
  block: { left: 268, top: 35, width: 205, height: 190 },
};

const DEFEAT_COLS = 3;
const DEFEAT_ROWS = 2;
const DEFEAT_NAMES = [
  'corrupted_mushroom',
  'corrupted_cat',
  'corrupted_wolf',
  'corrupted_turtle',
  'corrupted_crab',
  'corrupted_shadow',
];

async function exportRegion(sheet, outRel, region, kind = 'icon') {
  const out = path.join(ROOT, outRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await encodePipeline(sharp(sheet).extract(region), kind).toFile(out);
  console.log('  ✓', outRel);
}

export async function sliceVfxEvents() {
  if (!fs.existsSync(INTENT_SHEET)) throw new Error(`Missing intent sheet: ${INTENT_SHEET}`);
  if (!fs.existsSync(STRIKE_SHEET)) throw new Error(`Missing strike sheet: ${STRIKE_SHEET}`);
  if (!fs.existsSync(DEFEAT_SHEET)) throw new Error(`Missing defeat sheet: ${DEFEAT_SHEET}`);

  const strikeMeta = await sharp(STRIKE_SHEET).metadata();
  const strikeH = Math.floor(strikeMeta.height / 2);

  console.log('Intent icons…');
  for (const [name, region] of Object.entries(INTENT_REGIONS)) {
    await exportRegion(INTENT_SHEET, `assets/intents/${name}.png`, region);
  }

  console.log('Status icons…');
  for (const [name, region] of Object.entries(STATUS_REGIONS)) {
    await exportRegion(INTENT_SHEET, `assets/status/${name}.png`, region);
  }

  console.log('Purify strike FX…');
  await exportRegion(STRIKE_SHEET, 'assets/fx/purify_strike_double.png', {
    left: 0,
    top: 0,
    width: strikeMeta.width,
    height: strikeH,
  }, 'scene');
  await exportRegion(STRIKE_SHEET, 'assets/fx/purify_strike_triple.png', {
    left: 0,
    top: strikeH,
    width: strikeMeta.width,
    height: strikeMeta.height - strikeH,
  }, 'scene');

  console.log('Defeat FX…');
  const defeatMeta = await sharp(DEFEAT_SHEET).metadata();
  const cellW = Math.floor(defeatMeta.width / DEFEAT_COLS);
  const cellH = Math.floor(defeatMeta.height / DEFEAT_ROWS);
  for (let row = 0; row < DEFEAT_ROWS; row++) {
    for (let col = 0; col < DEFEAT_COLS; col++) {
      const idx = row * DEFEAT_COLS + col;
      const w = col === DEFEAT_COLS - 1 ? defeatMeta.width - cellW * col : cellW;
      const h = row === DEFEAT_ROWS - 1 ? defeatMeta.height - cellH * row : cellH;
      await exportRegion(DEFEAT_SHEET, `assets/fx/defeat_${DEFEAT_NAMES[idx]}.png`, {
        left: col * cellW,
        top: row * cellH,
        width: w,
        height: h,
      }, 'scene');
    }
  }
  await exportRegion(DEFEAT_SHEET, 'assets/fx/defeat_boss_dragon.png', {
    left: cellW,
    top: cellH,
    width: cellW,
    height: cellH,
  }, 'scene');

  console.log('Done.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sliceVfxEvents().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
