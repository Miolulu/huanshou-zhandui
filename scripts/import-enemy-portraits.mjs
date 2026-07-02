/**
 * 导入用户提供的怪物立绘（已抠图，贴边黑底需去底）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { matteSprite } from './local-matte.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASSET_DIR =
  'C:/Users/hortor/.cursor/projects/c-Users-hortor-Documents-kimi-workspace/assets';

const PORTRAITS = [
  ['corrupted_mushroom', 'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_download-546c7f34-b4e6-4fbb-a0de-dba756a05b5b.png'],
  ['corrupted_wolf', 'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_download-085cd4b8-6941-4476-bae4-13e4314a146d.png'],
  ['corrupted_cat', 'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_58385185-43a2-4001-b49c-f428e98d9690-0089906e-2642-4034-8d25-05db84d8c521.png'],
  ['corrupted_crab', 'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_052a81e7-2418-4bcd-9702-40f543cf068d-de5464c0-7017-4986-91a7-bd14fee7f96d.png'],
  ['corrupted_turtle', 'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_bd6b59bf-2ffb-420f-87e0-6582a5a1d3e1-43b70e0c-d733-4b55-b87b-6450f3b32634.png'],
  ['corrupted_shadow', 'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_2eb75931-d47f-48b5-9d59-263cee103138-bca28a30-c58a-4ee4-9ec8-f1fbc8b271d5.png'],
  ['boss_dragon', 'c__Users_hortor_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_d57b1967-3346-46c3-82a4-d42dccd6469d-c6fc36f4-d81e-45c7-9725-076f8d46b310.png'],
];

const OUT_MAX = 640;

for (const [id, fileName] of PORTRAITS) {
  const src = path.join(ASSET_DIR, fileName);
  if (!fs.existsSync(src)) {
    console.error('missing', src);
    process.exitCode = 1;
    continue;
  }

  const matted = await matteSprite(src, { preset: 'sprite' });
  const out = path.join(ROOT, 'assets/enemies', `${id}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  await matted
    .resize({
      width: OUT_MAX,
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(out);

  const meta = await sharp(out).metadata();
  const size = fs.statSync(out).size;
  console.log(`${id}: ${meta.width}x${meta.height} ${(size / 1024).toFixed(1)}KB`);
}

console.log('done');
