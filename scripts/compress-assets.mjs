/**
 * 批量压缩 assets/ 内图片
 * node scripts/compress-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { encodePipeline, kindFromPath, writeMainBackgroundJpeg } from './asset-encode.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
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
    const jpgRel = 'assets/scenes/main-bg.jpg';
    const jpgAbs = path.join(ROOT, jpgRel);
    const after = await writeMainBackgroundJpeg(jpgAbs, abs);
    if (abs !== jpgAbs && fs.existsSync(abs)) fs.unlinkSync(abs);
    return { rel: jpgRel, before, after };
  }

  if (/main-bg\.jpe?g$/i.test(rel)) {
    const after = await writeMainBackgroundJpeg(abs, abs);
    return { rel, before, after };
  }

  const kind = kindFromPath(rel);
  const encoded = encodePipeline(sharp(abs), kind);
  const tmp = `${abs}.tmp`;
  await encoded.toFile(tmp);
  fs.renameSync(tmp, abs);
  const after = fs.statSync(abs).size;
  return { rel, before, after };
}

async function main() {
  const files = walk(ASSETS);
  let totalBefore = 0;
  let totalAfter = 0;

  console.log(`压缩 ${files.length} 个文件…`);
  for (const abs of files) {
    const { rel, before, after } = await compressFile(abs);
    totalBefore += before;
    totalAfter += after;
    const pct = before > 0 ? Math.round((1 - after / before) * 100) : 0;
    console.log(`  ✓ ${rel}  ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB (${pct}%)`);
  }

  console.log(`合计 ${Math.round(totalBefore / 1024)}KB → ${Math.round(totalAfter / 1024)}KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
