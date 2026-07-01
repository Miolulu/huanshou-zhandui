/**
 * 本地精细抠图：边缘采样 + Lab 洪水填充 + 软 alpha + 去黑边 + alpha 羽化
 */
import sharp from 'sharp';

function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function rgbToLab(r, g, b) {
  let R = srgbToLinear(r);
  let G = srgbToLinear(g);
  let B = srgbToLinear(b);
  let X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  let Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  let Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;
  X /= 0.95047;
  Y /= 1;
  Z /= 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

function labDist(a, b) {
  const dL = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 从四边采样，取偏暗区域的中位色作为背景 */
function sampleEdgeBackground(data, width, height) {
  const samples = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 28));

  const push = (x, y) => {
    const i = (y * width + x) * 4;
    if (data[i + 3] < 8) return;
    samples.push([data[i], data[i + 1], data[i + 2]]);
  };

  for (let x = 0; x < width; x += step) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    push(0, y);
    push(width - 1, y);
  }

  if (!samples.length) return rgbToLab(12, 14, 28);

  samples.sort((a, b) => luminance(a[0], a[1], a[2]) - luminance(b[0], b[1], b[2]));
  const dark = samples.slice(0, Math.max(4, Math.floor(samples.length * 0.6)));
  const median = (pick) => {
    const arr = dark.map(pick).sort((a, b) => a - b);
    return arr[Math.floor(arr.length / 2)];
  };

  return rgbToLab(median((p) => p[0]), median((p) => p[1]), median((p) => p[2]));
}

function floodRemoveBg(data, width, height, bgLab, hardT) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const tryPush = (idx) => {
    if (idx < 0 || idx >= total || visited[idx]) return;
    const i = idx * 4;
    const dist = labDist(rgbToLab(data[i], data[i + 1], data[i + 2]), bgLab);
    if (dist > hardT) return;
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

/** 软 alpha：接近背景的像素渐变透明 */
function applySoftAlpha(data, width, height, bgLab, hardT, softT) {
  const total = width * height;
  for (let idx = 0; idx < total; idx++) {
    const i = idx * 4;
    const a = data[i + 3];
    if (a === 0) continue;
    const dist = labDist(rgbToLab(data[i], data[i + 1], data[i + 2]), bgLab);
    if (dist <= hardT) {
      data[i + 3] = 0;
    } else if (dist < softT) {
      const t = (dist - hardT) / (softT - hardT);
      data[i + 3] = Math.round(a * t * t * (3 - 2 * t));
    }
  }
}

/** 去掉贴边半透明深色晕（黑边） */
function defringe(data, width, height, bgLab, fringeT) {
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
        if (alpha[n] < 24) nearClear = true;
      }
      if (!nearClear) continue;

      const i = idx * 4;
      const dist = labDist(rgbToLab(data[i], data[i + 1], data[i + 2]), bgLab);
      if (dist < fringeT) {
        const cut = 1 - dist / fringeT;
        data[i + 3] = Math.round(a * (1 - cut * 0.92));
      }
    }
  }
}

/** 仅对 alpha 通道做 3×3 平滑，保留硬边主体 */
function smoothAlphaEdges(data, width, height) {
  const total = width * height;
  const src = new Uint8Array(total);
  for (let idx = 0; idx < total; idx++) src[idx] = data[idx * 4 + 3];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const a = src[idx];
      if (a === 0 || a === 255) continue;

      let onEdge = false;
      for (const n of [idx - 1, idx + 1, idx - width, idx + width]) {
        const na = src[n];
        if (na === 0 || (na < 200 && a > na + 40)) onEdge = true;
      }
      if (!onEdge) continue;

      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += src[(y + dy) * width + (x + dx)];
          n += 1;
        }
      }
      data[idx * 4 + 3] = Math.round(sum / n);
    }
  }
}

/**
 * @param {import('sharp').Sharp | Buffer} input
 * @param {{ preset?: 'sprite'|'icon' }} opts
 */
export async function matteSprite(input, { preset = 'sprite' } = {}) {
  let source = typeof input?.ensureAlpha === 'function' ? input : sharp(input);
  if (preset === 'sprite' || preset === 'icon') {
    const meta = await source.metadata();
    const w = meta.width || 64;
    const h = meta.height || 64;
    source = source.resize({
      width: w * 2,
      height: h * 2,
      kernel: sharp.kernel.lanczos3,
    });
  }
  const { data, info } = await source.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const isIcon = preset === 'icon';
  const hardT = isIcon ? 24 : width > 280 ? 34 : 30;
  const softT = hardT + (isIcon ? 18 : 26);
  const fringeT = softT + 12;

  const bgLab = sampleEdgeBackground(data, width, height);
  floodRemoveBg(data, width, height, bgLab, hardT);
  applySoftAlpha(data, width, height, bgLab, hardT, softT);
  defringe(data, width, height, bgLab, fringeT);
  smoothAlphaEdges(data, width, height);

  let result = sharp(data, {
    raw: { width, height, channels: 4 },
  });

  try {
    result = result.trim({ threshold: 2 });
  } catch {
    /* keep */
  }

  return result;
}
