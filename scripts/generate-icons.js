// Generate PNG app icons (192 + 512) for the PWA without any image deps.
// Draws a blue rounded square with a white graduation-cap glyph.
// Run with: node scripts/generate-icons.js
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public');
mkdirSync(outDir, { recursive: true });

const BG = [0x25, 0x63, 0xeb]; // brand-600 blue
const WHITE = [0xff, 0xff, 0xff];
const LIGHT = [0xbf, 0xdb, 0xfe]; // cap band

class Canvas {
  constructor(size) {
    this.size = size;
    this.px = Buffer.alloc(size * size * 4);
  }
  set(x, y, [r, g, b], a = 255) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    const i = (y * this.size + x) * 4;
    this.px[i] = r; this.px[i + 1] = g; this.px[i + 2] = b; this.px[i + 3] = a;
  }
  fillBg() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const r = this.size * 0.22;
        const inCorner =
          (x < r && y < r && (r - x) ** 2 + (r - y) ** 2 > r * r) ||
          (x > this.size - r && y < r && (x - (this.size - r)) ** 2 + (r - y) ** 2 > r * r) ||
          (x < r && y > this.size - r && (r - x) ** 2 + (y - (this.size - r)) ** 2 > r * r) ||
          (x > this.size - r && y > this.size - r && (x - (this.size - r)) ** 2 + (y - (this.size - r)) ** 2 > r * r);
        if (inCorner) this.set(x, y, [0, 0, 0], 0);
        else this.set(x, y, BG);
      }
    }
  }
  rect(x0, y0, w, h, color) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) this.set(x, y, color);
  }
  triangle(cx, cy, halfW, halfH, color) {
    for (let y = cy - halfH; y <= cy + halfH; y++) {
      const t = (y - (cy - halfH)) / (2 * halfH);
      const w = Math.round(halfW * (1 - Math.abs(2 * t - 1)));
      for (let x = cx - w; x <= cx + w; x++) this.set(x, y, color);
    }
  }
  lineV(y0, y1, x, color, thick = 1) {
    for (let y = y0; y <= y1; y++)
      for (let t = 0; t < thick; t++) this.set(x + t, y, color);
  }
}

function drawCap(c) {
  const s = c.size;
  const cx = Math.round(s * 0.5);
  const top = Math.round(s * 0.34);
  const halfW = Math.round(s * 0.28);
  const halfH = Math.round(s * 0.1);
  c.triangle(cx, top, halfW, halfH, WHITE);
  c.rect(cx - Math.round(s * 0.16), top + halfH - 1, Math.round(s * 0.32), Math.round(s * 0.08), LIGHT);
  const tx = cx + halfW - Math.round(s * 0.04);
  c.lineV(top, top + Math.round(s * 0.22), tx, WHITE, Math.max(1, Math.round(s * 0.02)));
  c.rect(tx - 1, top + Math.round(s * 0.22), Math.max(2, Math.round(s * 0.04)), Math.max(2, Math.round(s * 0.04)), WHITE);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(canvas) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.size, 0);
  ihdr.writeUInt32BE(canvas.size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const rowLen = canvas.size * 4;
  const raw = Buffer.alloc((rowLen + 1) * canvas.size);
  for (let y = 0; y < canvas.size; y++) {
    raw[y * (rowLen + 1)] = 0;
    canvas.px.copy(raw, y * (rowLen + 1) + 1, y * rowLen, (y + 1) * rowLen);
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) {
  const c = new Canvas(size);
  c.fillBg();
  drawCap(c);
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, encodePNG(c));
  console.log('wrote', file);
}
