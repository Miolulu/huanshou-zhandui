/**
 * 素材压缩编码（sharp）
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PNG_OPTS = { compressionLevel: 9, effort: 10, adaptiveFiltering: true };

const MAX_WIDTH = {
  card: 400,
  sprite: 520,
  portrait: 320,
  fx: 512,
  icon: 80,
  scene: 1280,
  ui: 96,
  default: 720,
};

const SCENE_JPEG = { quality: 76, mozjpeg: true, chromaSubsampling: '4:2:0' };

/** @returns {import('sharp').Sharp} */
export function encodePipeline(input, kind) {
  let p = input?.constructor?.name === 'Sharp' ? input : sharp(input);
  const maxW = MAX_WIDTH[kind] || MAX_WIDTH.default;
  p = p.resize({ width: maxW, withoutEnlargement: true });

  if (kind === 'icon' || kind === 'ui') {
    return p.png({
      compressionLevel: 9,
      effort: 10,
      palette: true,
      quality: 72,
      dither: 0.4,
    });
  }

  if (kind === 'portrait') {
    return p.png({
      compressionLevel: 9,
      effort: 10,
      palette: true,
      quality: 78,
      dither: 0.35,
    });
  }

  if (kind === 'fx') {
    return p.png({
      compressionLevel: 9,
      effort: 10,
      palette: true,
      quality: 74,
      dither: 0.35,
    });
  }

  return p.png(PNG_OPTS);
}

export async function writeEncoded(outRel, pipeline, kind) {
  const buf = await encodePipeline(pipeline, kind).toBuffer();
  fs.mkdirSync(path.dirname(outRel), { recursive: true });
  fs.writeFileSync(outRel, buf);
  return buf.length;
}

export async function writeSceneJpeg(outAbs, inputPath) {
  const tmp = `${outAbs}.tmp`;
  await sharp(inputPath)
    .resize(1280, 720, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .jpeg(SCENE_JPEG)
    .toFile(tmp);
  fs.renameSync(tmp, outAbs);
  return fs.statSync(outAbs).size;
}

export async function writeMainBackgroundJpeg(outRel, inputPath) {
  return writeSceneJpeg(outRel, inputPath);
}

export function kindFromPath(relPath) {
  const p = relPath.replace(/\\/g, '/');
  if (p.includes('/cards/')) return 'card';
  if (p.includes('purifier_portrait')) return 'portrait';
  if (p.includes('/enemies/') || p.includes('/player/')) return 'sprite';
  if (p.includes('/fx/')) return 'fx';
  if (p.includes('/intents/') || p.includes('/status/') || p.includes('/elements/')) return 'icon';
  if (p.includes('/ui/')) return 'ui';
  if (p.includes('/scenes/')) return 'scene';
  return 'default';
}
