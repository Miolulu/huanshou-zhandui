/**
 * remove.bg 抠图 API
 * https://www.remove.bg/api
 * 在 .env 或环境变量中设置 REMOVE_BG_API_KEY
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CACHE_DIR = path.join(__dirname, '.removebg-cache');

export function loadRemoveBgApiKey() {
  if (process.env.REMOVE_BG_API_KEY) return process.env.REMOVE_BG_API_KEY.trim();

  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return '';

  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (key !== 'REMOVE_BG_API_KEY') continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return '';
}

function cachePath(imageBuffer) {
  const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  return path.join(CACHE_DIR, `${hash}.png`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {Buffer} imageBuffer PNG/JPEG input
 * @param {{ type?: 'auto'|'person'|'product'|'animal' }} opts
 * @returns {Promise<Buffer>} transparent PNG
 */
export async function removeBackground(imageBuffer, { type = 'auto' } = {}) {
  const apiKey = loadRemoveBgApiKey();
  if (!apiKey) {
    throw new Error(
      '未设置 REMOVE_BG_API_KEY。请在 https://www.remove.bg/api 注册并创建 API Key，'
      + '写入项目根目录 .env：REMOVE_BG_API_KEY=你的密钥',
    );
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cached = cachePath(imageBuffer);
  if (fs.existsSync(cached)) {
    return fs.readFileSync(cached);
  }

  const formData = new FormData();
  formData.append('size', 'auto');
  formData.append('format', 'png');
  formData.append('type', type);
  formData.append('image_file', new Blob([imageBuffer], { type: 'image/png' }), 'sprite.png');

  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(1200 * attempt);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (response.ok) {
      const out = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(cached, out);
      return out;
    }

    const errText = await response.text();
    lastErr = new Error(`remove.bg ${response.status}: ${errText.slice(0, 280)}`);
    if (response.status !== 429) break;
  }

  throw lastErr;
}
