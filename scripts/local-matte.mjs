/**
 * 保守抠图 v5：贴边去底 + 外接圆裁切（圆必须包住全部角色像素，不裁切本体）
 */
import sharp from 'sharp';

function maxChannel(r, g, b) {
  return Math.max(r, g, b);
}

function colorDist(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
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
 * 外接圆：圆心取不透明区域包围盒中心，半径覆盖全部不透明像素 + 边距
 * 只去掉圆外画布角，不会切到角色任何部分
 */
function applyContainingCircleCrop(data, width, height, pad = 12) {
  const points = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 16) points.push([x, y]);
    }
  }
  if (points.length < 16) return;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  let radius = 0;
  for (const [x, y] of points) {
    radius = Math.max(radius, Math.hypot(x - cx, y - cy));
  }
  radius += pad;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] === 0) continue;
      if (Math.hypot(x - cx, y - cy) > radius) data[i + 3] = 0;
    }
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
  cleanEdgeAlpha(data, width, height, fg);

  // 敌人：外接圆裁切（圆包住全部不透明像素，不切角色）；玩家保留完整画布
  if (preset !== 'player') {
    applyContainingCircleCrop(data, width, height, isIcon ? 8 : 14);
  }

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
