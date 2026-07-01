import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const file = process.argv[2] || 'assets/enemies/corrupted_wolf.png';
const { data, info } = await sharp(path.join(ROOT, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let trans = 0;
let semi = 0;
let opaque = 0;
let blackTrans = 0;
for (let idx = 0; idx < info.width * info.height; idx++) {
  const i = idx * 4;
  const a = data[i + 3];
  if (a < 16) trans++;
  else if (a < 240) semi++;
  else opaque++;
  if (a < 16 && data[i] < 20 && data[i + 1] < 20 && data[i + 2] < 20) blackTrans++;
}
console.log(file, info.width, 'x', info.height, { trans, semi, opaque, blackTrans });
