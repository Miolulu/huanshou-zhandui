/**
 * 保守抠图：只去掉贴边黑底，保留角色身上所有黑色细节（眼窝/轮廓/阴影）
 *
 * 思路：
 * 1. 从彩色像素向外扩张，把与角色相邻的黑色像素都标为「本体」
 * 2. 仅删除从画布边缘连通的、且不在本体保护范围内的近黑像素
 */
import sharp from 'sharp';

function maxChannel(r, g, b) {
  return Math.max(r, g, b);
}

/** 明显属于角色的彩色像素（非暗色背景） */
function isColorPixel(r, g, b, minBright = 38) {
  return maxChannel(r, g, b) > minBright;
}

/** 可删除的暗色背景（含 JPEG 压缩后的近黑底） */
function isRemovableBg(r, g, b, maxBright = 34) {
  return maxChannel(r, g, b) <= maxBright;
}

/**
 * 扩张本体遮罩：与彩色像素相邻的黑色像素一律保留
 */
function buildForegroundMask(data, width, height, { minBright = 38, dilatePasses = 6 } = {}) {
  const total = width * height;
  const fg = new Uint8Array(total);

  for (let idx = 0; idx < total; idx++) {
    const i = idx * 4;
    if (data[i + 3] < 8) continue;
    if (isColorPixel(data[i], data[i + 1], data[i + 2], minBright)) fg[idx] = 1;
  }

  for (let pass = 0; pass < dilatePasses; pass++) {
    let changed = false;
    const next = new Uint8Array(fg);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (fg[idx]) continue;
        const i = idx * 4;
        if (data[i + 3] < 8) continue;
        const neighbors = [
          x > 0 ? idx - 1 : -1,
          x < width - 1 ? idx + 1 : -1,
          y > 0 ? idx - width : -1,
          y < height - 1 ? idx + width : -1,
        ];
        for (const n of neighbors) {
          if (n >= 0 && fg[n]) {
            next[idx] = 1;
            changed = true;
            break;
          }
        }
      }
    }
    fg.set(next);
    if (!changed) break;
  }

  return fg;
}

/** 从四边删除连通的暗色背景，但跳过本体遮罩内的像素 */
function floodRemoveBackground(data, width, height, fg, maxBright = 34) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const tryPush = (idx) => {
    if (idx < 0 || idx >= total || visited[idx] || fg[idx]) return;
    const i = idx * 4;
    if (data[i + 3] < 8) return;
    if (!isRemovableBg(data[i], data[i + 1], data[i + 2], maxBright)) return;
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
    data[idx * 4 + 3] = 0;
    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) tryPush(idx - 1);
    if (x < width - 1) tryPush(idx + 1);
    if (y > 0) tryPush(idx - width);
    if (y < height - 1) tryPush(idx + width);
  }
}

/** 清理边缘半透明脏像素，但不侵蚀本体内部 */
function cleanEdgeAlpha(data, width, height, fg) {
  const total = width * height;
  for (let idx = 0; idx < total; idx++) {
    const i = idx * 4;
    const a = data[i + 3];
    if (a === 0 || a === 255) continue;

    if (fg[idx]) {
      // 本体上的半透明像素（抗锯齿）保留为不透明
      data[i + 3] = 255;
      continue;
    }

    // 背景缘的半透明晕边直接去掉
    if (isRemovableBg(data[i], data[i + 1], data[i + 2], 40)) {
      data[i + 3] = 0;
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
  const minBright = isIcon ? 32 : 38;
  const maxBright = isIcon ? 36 : 34;
  const dilatePasses = isIcon ? 4 : 6;

  const fg = buildForegroundMask(data, width, height, { minBright, dilatePasses });
  floodRemoveBackground(data, width, height, fg, maxBright);
  cleanEdgeAlpha(data, width, height, fg);

  let result = sharp(data, {
    raw: { width, height, channels: 4 },
  });

  try {
    result = result.trim({ threshold: 1, background: { r: 0, g: 0, b: 0, alpha: 0 } });
  } catch {
    /* keep */
  }

  return result;
}
