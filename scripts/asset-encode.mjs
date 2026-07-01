/**
 * 素材压缩编码（sharp）
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PNG_OPTS = { compressionLevel: 9, effort: 10 };

const MAX_WIDTH = {
  card: 640,
  sprite: 420,
  icon: 96,
  scene: 960,
  ui: 128,
  default: 1024,
};

/** @returns {import('sharp').Sharp} */
export function encodePipeline(input, kind) {
  let p = input?.constructor?.name === 'Sharp' ? input : sharp(input);
  const maxW = MAX_WIDTH[kind] || MAX_WIDTH.default;
  p = p.resize({ width: maxW, withoutEnlargement: true });
  return p.png(PNG_OPTS);
}

export async function writeEncoded(outRel, pipeline, kind) {
  const buf = await encodePipeline(pipeline, kind).toBuffer();
  fs.mkdirSync(path.dirname(outRel), { recursive: true });
  fs.writeFileSync(outRel, buf);
  return buf.length;
}

export async function writeMainBackgroundJpeg(outRel, inputPath) {
  fs.mkdirSync(path.dirname(outRel), { recursive: true });
  await sharp(inputPath)
    .resize(1920, 1080, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .modulate({ saturation: 1.06, brightness: 0.96 })
    .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.1 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outRel);
  return fs.statSync(outRel).size;
}

export function kindFromPath(relPath) {
  const p = relPath.replace(/\\/g, '/');
  if (p.includes('/cards/')) return 'card';
  if (p.includes('/enemies/') || p.includes('/player/')) return 'sprite';
  if (p.includes('/intents/') || p.includes('/ui/')) return 'icon';
  if (p.includes('/scenes/scene-')) return 'scene';
  return 'default';
}
