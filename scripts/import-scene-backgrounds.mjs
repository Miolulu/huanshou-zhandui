/**
 * 导入 5 张场景背景 → assets/scenes/scene-0..4 + main-bg.jpg
 * node scripts/import-scene-backgrounds.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { writeMainBackgroundJpeg } from './asset-encode.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASSET_DIR =
  'C:/Users/hortor/.cursor/projects/c-Users-hortor-Documents-kimi-workspace/assets';

const SCENES = [
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-a152a12e-39b3-477a-9e30-7c760116ad93.png',
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-4e598c12-ef9b-4ad0-9ad6-0c066dc0b845.png',
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-ca3b18de-1a3a-4606-94b9-9cfc49ae6503.png',
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-c7e10b1b-d132-4c95-9029-359cb77bb327.png',
  'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-73bdf321-86b8-4fd3-8d84-100447777df1.png',
];

const OUT_DIR = path.join(ROOT, 'assets/scenes');
fs.mkdirSync(OUT_DIR, { recursive: true });

for (let i = 0; i < SCENES.length; i++) {
  const src = path.join(ASSET_DIR, SCENES[i]);
  if (!fs.existsSync(src)) {
    console.error('missing', src);
    process.exitCode = 1;
    continue;
  }
  const out = path.join(OUT_DIR, `scene-${i}.jpg`);
  await sharp(src)
    .resize(1280, 720, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .jpeg({ quality: 76, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toFile(out);
  const size = fs.statSync(out).size;
  console.log(`scene-${i}.jpg ${(size / 1024).toFixed(0)}KB`);
}

const first = path.join(ASSET_DIR, SCENES[0]);
await writeMainBackgroundJpeg(path.join(OUT_DIR, 'main-bg.jpg'), first);
console.log('main-bg.jpg', (fs.statSync(path.join(OUT_DIR, 'main-bg.jpg')).size / 1024).toFixed(0), 'KB');

// 清理旧 png 版本
for (const legacy of ['scene-0.png', 'scene-1.png', 'scene-2.png', 'scene-3.png', 'scene-4.png', 'scene-5.png']) {
  const p = path.join(OUT_DIR, legacy);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('removed', legacy);
  }
}

console.log('done');
