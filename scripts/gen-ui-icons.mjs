/**
 * 生成污意/灵耗等小图标（矢量绘制，避免错误裁切）
 * node scripts/gen-ui-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SIZE = 128;

function svgIcon(name) {
  const s = SIZE;
  const c = s / 2;
  switch (name) {
    case 'damage':
      return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff8a7a"/><stop offset="100%" stop-color="#c62828"/></linearGradient></defs>
        <path d="M${c} 14 L${s - 18} ${s - 22} L${c + 8} ${s - 22} L${c} ${s - 8} L${c - 8} ${s - 22} L18 ${s - 22} Z" fill="url(#g)" stroke="#5a1010" stroke-width="4" stroke-linejoin="round"/>
        <path d="M${c} 30 L${c} ${s - 34}" stroke="#fff2" stroke-width="6" stroke-linecap="round"/>
      </svg>`;
    case 'block':
      return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d8d8ff"/><stop offset="100%" stop-color="#5c5cb8"/></linearGradient></defs>
        <path d="M${c} 12 L${s - 16} 30 L${s - 16} ${s * 0.58} L${c} ${s - 14} L16 ${s * 0.58} L16 30 Z" fill="url(#g)" stroke="#2f2f6e" stroke-width="4" stroke-linejoin="round"/>
      </svg>`;
    case 'buff':
      return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${c}" cy="${c}" r="46" fill="#1f4d32" stroke="#7dffb0" stroke-width="4"/>
        <path d="M${c} 34 L${c} ${s - 34} M${c - 24} ${c - 6} L${c} 34 L${c + 24} ${c - 6}" fill="none" stroke="#9cffc8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    case 'debuff':
      return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${c}" cy="${c}" r="46" fill="#3d1f4f" stroke="#d9a7ff" stroke-width="4"/>
        <path d="M${c - 24} ${c + 6} L${c} ${s - 34} L${c + 24} ${c + 6}" fill="none" stroke="#e8c4ff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    case 'unknown':
      return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${c}" cy="${c}" r="46" fill="#2a3038" stroke="#9aa8b8" stroke-width="4"/>
        <text x="${c}" y="${c + 14}" text-anchor="middle" font-size="52" font-weight="700" fill="#e8edf2" font-family="sans-serif">?</text>
      </svg>`;
    case 'energy':
      return `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7dffb0"/><stop offset="100%" stop-color="#116f54"/></linearGradient></defs>
        <polygon points="${c},10 ${s - 12},${c} ${c},${s - 10} 12,${c}" fill="url(#g)" stroke="#0a3d2e" stroke-width="4" stroke-linejoin="round"/>
        <text x="${c}" y="${c + 10}" text-anchor="middle" font-size="40" font-weight="800" fill="#f0fff6" font-family="sans-serif">⚡</text>
      </svg>`;
    default:
      return svgIcon('unknown');
  }
}

async function writeIcon(rel, name) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svgIcon(name))).png({ compressionLevel: 9 }).toFile(out);
  console.log('  ✓', rel);
}

export async function generateUiIcons() {
  console.log('UI 图标…');
  await writeIcon('assets/intents/damage.png', 'damage');
  await writeIcon('assets/intents/block.png', 'block');
  await writeIcon('assets/intents/buff.png', 'buff');
  await writeIcon('assets/intents/debuff.png', 'debuff');
  await writeIcon('assets/intents/unknown.png', 'unknown');
  await writeIcon('assets/ui/energy-badge.png', 'energy');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateUiIcons().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
