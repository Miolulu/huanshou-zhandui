/**
 * 从 UI 图标 + 攻击特效 sprite sheet 裁切（素材已抠图，仅 trim + 缩放）
 * node scripts/slice-icons-fx.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { encodePipeline } from './asset-encode.mjs';

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

const SHEET = path.join(
  SRC,
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-3d376b60-41f3-4107-b6a3-2c01fa23c65b.png',
);

const ELEMENT_BOXES = [
  { left: 16, top: 350, width: 84, height: 80 },
  { left: 132, top: 350, width: 83, height: 80 },
  { left: 247, top: 350, width: 84, height: 80 },
  { left: 359, top: 350, width: 82, height: 80 },
  { left: 478, top: 350, width: 84, height: 80 },
  { left: 593, top: 350, width: 81, height: 80 },
  { left: 710, top: 350, width: 81, height: 80 },
  { left: 816, top: 350, width: 80, height: 80 },
  { left: 917, top: 350, width: 82, height: 80 },
];

const ELEMENT_NAMES = [
  'light', 'fire', 'water', 'grass', 'electric', 'earth', 'wind', 'dark', 'neutral',
];

const STATUS_BOXES = [
  { left: 12, top: 440, width: 55, height: 80 },
  { left: 75, top: 440, width: 55, height: 80 },
  { left: 137, top: 440, width: 55, height: 80 },
  { left: 199, top: 440, width: 56, height: 80 },
  { left: 262, top: 440, width: 57, height: 80 },
  { left: 328, top: 440, width: 58, height: 80 },
  { left: 394, top: 440, width: 57, height: 80 },
  { left: 460, top: 440, width: 57, height: 80 },
  { left: 526, top: 440, width: 58, height: 80 },
  { left: 592, top: 440, width: 57, height: 80 },
  { left: 658, top: 440, width: 58, height: 80 },
  { left: 725, top: 440, width: 59, height: 80 },
  { left: 793, top: 440, width: 58, height: 80 },
  { left: 861, top: 440, width: 60, height: 80 },
  { left: 931, top: 440, width: 59, height: 80 },
];

/** 污意图标：上箭头 buff / 下箭头 debuff / 盾 block / 剑 damage / 影面 unknown */
const INTENT_MAP = {
  buff: 0,
  debuff: 1,
  block: 2,
  damage: 3,
  unknown: 14,
};

const FX_Y = 528;
const FX_H = 148;
const FX_COLS = 9;
const FX_NAMES = [
  'slash', 'fire', 'water', 'grass', 'electric', 'earth', 'wind', 'dark', 'light',
];

async function exportRegion(outRel, region, { kind = 'icon', pad = 4 } = {}) {
  const out = path.join(ROOT, outRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const left = Math.max(0, region.left - pad);
  const top = Math.max(0, region.top - pad);
  const width = Math.min(1024 - left, region.width + pad * 2);
  const height = Math.min(682 - top, region.height + pad * 2);

  let pipeline = sharp(SHEET).extract({ left, top, width, height });

  await encodePipeline(pipeline, kind).toFile(out);
  console.log('  ✓', outRel);
}

export async function sliceIconsAndFx() {
  if (!fs.existsSync(SHEET)) {
    throw new Error(`Sprite sheet not found: ${SHEET}`);
  }

  console.log('Element icons…');
  for (let i = 0; i < ELEMENT_NAMES.length; i++) {
    await exportRegion(`assets/elements/${ELEMENT_NAMES[i]}.png`, ELEMENT_BOXES[i]);
  }

  console.log('Intent icons…');
  for (const [name, idx] of Object.entries(INTENT_MAP)) {
    await exportRegion(`assets/intents/${name}.png`, STATUS_BOXES[idx]);
  }

  console.log('Attack FX…');
  const fxW = Math.floor(1024 / FX_COLS);
  for (let col = 0; col < FX_COLS; col++) {
    const w = col === FX_COLS - 1 ? 1024 - fxW * col : fxW;
    await exportRegion(`assets/fx/attack_${FX_NAMES[col]}.png`, {
      left: col * fxW,
      top: FX_Y,
      width: w,
      height: FX_H,
    }, { kind: 'icon', pad: 6 });
  }

  console.log('Done.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sliceIconsAndFx().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
