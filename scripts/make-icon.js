// Draw the pixel-house app icon (same art as the tray icon) as build/icon.png, 256x256, no image libraries.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const S = 16, Z = 16, N = S * Z;
const px = Array.from({ length: S }, () => Array(S).fill(null));
const fill = (x0, x1, y0, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px[y][x] = c; };
for (let y = 1; y < 8; y++) fill(8 - y, 8 + y, y, y + 1, [162, 74, 74]);
fill(3, 13, 8, 15, [48, 40, 92]);
fill(5, 8, 9, 12, [255, 216, 74]);
fill(9, 11, 11, 15, [122, 74, 50]);

const raw = Buffer.alloc(N * (N * 4 + 1));
for (let y = 0; y < N; y++) {
  raw[y * (N * 4 + 1)] = 0;
  for (let x = 0; x < N; x++) {
    const c = px[Math.floor(y / Z)][Math.floor(x / Z)], i = y * (N * 4 + 1) + 1 + x * 4;
    if (c) { raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2]; raw[i + 3] = 255; }
  }
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build', 'icon.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(out);
