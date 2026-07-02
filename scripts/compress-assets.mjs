/**
 * 批量压缩 assets/ 内图片（跳过 _probe 与临时文件）
 * node scripts/compress-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { encodePipeline, kindFromPath, writeSceneJpeg } from './asset-encode.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const SKIP_DIRS = new Set(['_probe']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walk(abs, out);
    else if (/\.(png|jpe?g)$/i.test(name)) out.push(abs);
  }
  return out;
}

async function compressFile(abs) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const before = fs.statSync(abs).size;

  if (rel === 'assets/scenes/main-bg.png') {
    const jpgAbs = path.join(ROOT, 'assets/scenes/main-bg.jpg');
    const after = await writeSceneJpeg(jpgAbs, abs);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    return { rel: 'assets/scenes/main-bg.jpg', before, after };
  }

  if (/assets\/scenes\/.*\.jpe?g$/i.test(rel) || rel === 'assets/scenes/main-bg.jpg') {
    const tmp = `${abs}.tmp`;
    await sharp(abs)
      .resize(1280, 720, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
      .jpeg({ quality: 76, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toFile(tmp);
    const after = fs.statSync(tmp).size;
    if (after < before) {
      fs.renameSync(tmp, abs);
    } else {
      fs.unlinkSync(tmp);
    }
    return { rel, before, after: Math.min(before, after) };
  }

  const kind = kindFromPath(rel);
  const encoded = encodePipeline(sharp(abs), kind);
  const tmp = `${abs}.tmp`;
  await encoded.toFile(tmp);
  const after = fs.statSync(tmp).size;
  if (after < before) {
    fs.renameSync(tmp, abs);
  } else {
    fs.unlinkSync(tmp);
  }
  const finalSize = Math.min(before, after);
  return { rel, before, after: finalSize };
}

async function main() {
  const files = walk(ASSETS);
  let totalBefore = 0;
  let totalAfter = 0;
  let saved = 0;

  console.log(`压缩 ${files.length} 个文件（已跳过 assets/_probe）…\n`);
  for (const abs of files) {
    const { rel, before, after } = await compressFile(abs);
    totalBefore += before;
    totalAfter += after;
    if (after < before) saved += 1;
    const pct = before > 0 ? Math.round((1 - after / before) * 100) : 0;
    const sign = after <= before ? '↓' : '↑';
    console.log(`  ${sign} ${rel}  ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB (${pct}%)`);
  }

  console.log(`\n合计 ${Math.round(totalBefore / 1024)}KB → ${Math.round(totalAfter / 1024)}KB（-${Math.round((1 - totalAfter / totalBefore) * 100)}%）`);
  console.log(`${saved}/${files.length} 个文件体积减小`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
