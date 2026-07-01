/**
 * 本地抠图：仅去除与画布边缘连通的近黑背景，保留角色本体上的深色细节
 */
import sharp from 'sharp';

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 贴边近黑像素（背景），不碰角色内部深色 */
function isBorderBlack(r, g, b, maxLum) {
  return luminance(r, g, b) <= maxLum;
}

/**
 * 从四边洪水填充：只穿过近黑像素，去掉黑底/黑边
 * 角色内部的眼窝、轮廓线等深色不会与边缘连通，因此保留
 */
function floodRemoveBorderBlack(data, width, height, maxLum) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const tryPush = (idx) => {
    if (idx < 0 || idx >= total || visited[idx]) return;
    const i = idx * 4;
    if (data[i + 3] < 8) return;
    if (!isBorderBlack(data[i], data[i + 1], data[i + 2], maxLum)) return;
    visited[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    tryPush(x);
    tryPush((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    tryPush(y * width);
    tryPush(y * width + width - 1);
  }

  while (head < tail) {
    const idx = queue[head++];
    const i = idx * 4;
    data[i + 3] = 0;
    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) tryPush(idx - 1);
    if (x < width - 1) tryPush(idx + 1);
    if (y > 0) tryPush(idx - width);
    if (y < height - 1) tryPush(idx + width);
  }
}

/** 仅清理贴透明区域的近黑晕边（1px 级 defringe） */
function defringeBorderOnly(data, width, height, maxLum) {
  const total = width * height;
  const alpha = new Uint8Array(total);
  for (let idx = 0; idx < total; idx++) alpha[idx] = data[idx * 4 + 3];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const a = alpha[idx];
      if (a === 0 || a === 255) continue;

      let nearClear = false;
      for (const n of [idx - 1, idx + 1, idx - width, idx + width]) {
        if (alpha[n] < 16) nearClear = true;
      }
      if (!nearClear) continue;

      const i = idx * 4;
      if (isBorderBlack(data[i], data[i + 1], data[i + 2], maxLum + 8)) {
        data[i + 3] = Math.round(a * 0.35);
      }
    }
  }
}

/**
 * @param {import('sharp').Sharp | Buffer} input
 * @param {{ preset?: 'sprite'|'icon' }} opts
 */
export async function matteSprite(input, { preset = 'sprite' } = {}) {
  const source = typeof input?.ensureAlpha === 'function' ? input : sharp(input);
  const { data, info } = await source.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const isIcon = preset === 'icon';
  const maxLum = isIcon ? 24 : 20;

  floodRemoveBorderBlack(data, width, height, maxLum);
  defringeBorderOnly(data, width, height, maxLum);

  let result = sharp(data, {
    raw: { width, height, channels: 4 },
  });

  try {
    result = result.trim({ threshold: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } });
  } catch {
    /* keep */
  }

  return result;
}
