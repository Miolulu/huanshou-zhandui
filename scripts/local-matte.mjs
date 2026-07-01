/**
 * 保守抠图 v4：椭圆主体识别 + 贴边洪水，去掉四角黑块与两侧光效溢出
 */
import sharp from 'sharp';

function maxChannel(r, g, b) {
  return Math.max(r, g, b);
}

function colorDist(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length * p) / 100));
  return sorted[idx];
}

/** 角色彩色像素 */
function isColorPixel(r, g, b, minBright = 42) {
  return maxChannel(r, g, b) > minBright;
}

/** 可删除的暗色背景 */
function isRemovableBg(r, g, b, maxBright = 36) {
  return maxChannel(r, g, b) <= maxBright;
}

/** 扩张时可纳入保护的极暗描边像素 */
function isProtectableDark(r, g, b, maxBright = 26) {
  return maxChannel(r, g, b) <= maxBright;
}

function buildForegroundMask(data, width, height, { minBright = 42, dilatePasses = 2, darkMax = 26 } = {}) {
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
        if (!isProtectableDark(data[i], data[i + 1], data[i + 2], darkMax)) continue;
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

/**
 * 按彩色像素分布拟合椭圆主体（比矩形核心更贴合角色轮廓）
 * @returns {{ cx: number, cy: number, rx: number, ry: number } | null}
 */
function fitEllipseFromColor(data, width, height, minBright = 45, { padX = 8, padY = 10, pct = 90 } = {}) {
  const xs = [];
  const ys = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      if (!isColorPixel(data[i], data[i + 1], data[i + 2], minBright)) continue;
      xs.push(x);
      ys.push(y);
    }
  }
  if (xs.length < 24) return null;

  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  const dxs = xs.map((x) => Math.abs(x - cx)).sort((a, b) => a - b);
  const dys = ys.map((y) => Math.abs(y - cy)).sort((a, b) => a - b);
  const rx = percentile(dxs, pct) + padX;
  const ry = percentile(dys, pct) + padY;
  if (rx < 8 || ry < 8) return null;
  return { cx, cy, rx, ry };
}

function buildEllipseMask(width, height, ellipse) {
  const mask = new Uint8Array(width * height);
  const { cx, cy, rx, ry } = ellipse;
  const invRx2 = 1 / (rx * rx);
  const invRy2 = 1 / (ry * ry);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx * invRx2 + dy * dy * invRy2 <= 1) {
        mask[y * width + x] = 1;
      }
    }
  }
  return mask;
}

/** 删除椭圆外的像素（去掉两侧溢出光效/贴边黑块） */
function cullOutsideEllipse(data, width, height, ellipse) {
  const mask = buildEllipseMask(width, height, ellipse);
  const total = width * height;
  for (let idx = 0; idx < total; idx++) {
    if (!mask[idx]) data[idx * 4 + 3] = 0;
  }
}

/** 从四边洪水删除暗色背景 */
function floodRemoveBackground(data, width, height, fg, maxBright = 36) {
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

function cleanEdgeAlpha(data, width, height, fg) {
  const total = width * height;
  for (let idx = 0; idx < total; idx++) {
    const i = idx * 4;
    const a = data[i + 3];
    if (a === 0 || a === 255) continue;

    if (fg[idx]) {
      data[i + 3] = 255;
      continue;
    }

    if (isRemovableBg(data[i], data[i + 1], data[i + 2], 42)) {
      data[i + 3] = 0;
    }
  }
}

/** 按四角采样估计背景色，删除与背景色接近的贴边连通区 */
function floodRemoveTintedBg(data, width, height, fg, cornerSamples = 4) {
  const samples = [];
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  for (const [cx, cy] of corners) {
    const i = (cy * width + cx) * 4;
    if (data[i + 3] > 8) samples.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (!samples.length) return;

  const bg = samples[0];
  const tolerance = 22;

  const isBgLike = (r, g, b) => colorDist([r, g, b], bg) <= tolerance;

  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const tryPush = (idx) => {
    if (idx < 0 || idx >= total || visited[idx] || fg[idx]) return;
    const i = idx * 4;
    if (data[i + 3] < 8) return;
    if (!isBgLike(data[i], data[i + 1], data[i + 2])) return;
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

/**
 * @param {import('sharp').Sharp | Buffer} input
 * @param {{ preset?: 'sprite'|'icon'|'player' }} opts
 */
export async function matteSprite(input, { preset = 'sprite' } = {}) {
  const source = typeof input?.ensureAlpha === 'function' ? input : sharp(input);
  const { data, info } = await source.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const isIcon = preset === 'icon';
  const isPlayer = preset === 'player';
  const minBright = isIcon ? 38 : 42;
  const maxBright = isIcon ? 34 : 36;
  const dilatePasses = 2;
  const darkMax = isIcon ? 28 : isPlayer ? 28 : 26;

  const fg = buildForegroundMask(data, width, height, { minBright, dilatePasses, darkMax });
  floodRemoveTintedBg(data, width, height, fg);
  floodRemoveBackground(data, width, height, fg, maxBright);

  // 敌人：椭圆主体裁切，去掉两侧溢出光效；玩家立绘保留全身法阵/光效
  if (preset !== 'player') {
    const ellipse = fitEllipseFromColor(data, width, height, minBright + 3, {
      padX: isIcon ? 6 : 10,
      padY: isIcon ? 8 : 12,
      pct: width > 500 ? 93 : 90,
    });
    if (ellipse) cullOutsideEllipse(data, width, height, ellipse);
  }

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
