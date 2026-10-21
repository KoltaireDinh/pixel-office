// Static scenery of the top-down house (floors, walls, doorways, wall decor) plus the few animated background bits.
import { bay } from './gfx.js';

export const WALL_H = 26;

function wood(g, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const r = Math.floor((y - y0) / 5), seam = (x + r * 13) % 32 === 0;
    g.px(x, y, (y - y0) % 5 === 4 || seam ? '#6e452c' : r % 2 ? '#8a5a3a' : '#82543a');
  }
}
function tiles(g, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const t = (Math.floor((x - x0) / 10) + Math.floor((y - y0) / 10)) % 2;
    g.px(x, y, (x - x0) % 10 === 0 || (y - y0) % 10 === 0 ? '#9a9288' : t ? '#d0c8b8' : '#bab2a2');
  }
}
function carpet(g, x0, y0, w, h, edge = '#b04a5a', a = '#7a3050', b = '#6e2a48') {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const e = x < x0 + 3 || y < y0 + 3 || x >= x0 + w - 3 || y >= y0 + h - 3;
    g.px(x, y, e ? edge : ((x + y) >> 2) % 2 ? a : b);
  }
}
function grass(g, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const n = (x * 7 + y * 13) % 17;
    g.px(x, y, n < 2 ? '#4a8a52' : bay(x, y) > 0.5 ? '#2f6a3e' : '#367446');
  }
}
function backWall(g, x0, y0, w, paper, stripe) {
  g.rect(x0, y0, w, 4, '#2a1e36');
  for (let y = y0 + 4; y < y0 + WALL_H; y++) for (let x = x0; x < x0 + w; x++) {
    let c = x % 8 === 0 ? stripe : paper;
    if (y > y0 + WALL_H - 7) c = y === y0 + WALL_H - 6 ? '#8a6040' : '#6a4a3a';
    g.px(x, y, c);
  }
  g.rect(x0, y0 + WALL_H, w, 1, '#3a2a2a');
}
function vWall(g, x, y0, y1) { g.rect(x, y0, 8, y1 - y0, '#2a1e36'); g.rect(x + 2, y0, 4, y1 - y0, '#3a2a4a'); }
function windowFrame(g, x0, y0, w, h) {
  g.rect(x0 - 2, y0 - 2, w + 4, h + 4, '#6a4a3a');
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) g.px(x, y, (y - y0) / h > bay(x, y) * 1.2 ? '#4a2a72' : '#1c1550', 1);
  g.rect(x0 + (w >> 1) - 1, y0, 2, h, '#6a4a3a');
}
// A doorway through a horizontal wall band: floor shows through, dark jambs either side.
function doorway(g, x0, w, y0, y1, floorFn) {
  floorFn(x0, y0, w, y1 - y0);
  g.rect(x0 - 2, y0, 2, y1 - y0, '#1a1226'); g.rect(x0 + w, y0, 2, y1 - y0, '#1a1226');
}

export function drawStatic(g) {
  const W = g.W, H = g.H;
  // Upper floor: office + work room.
  wood(g, 0, 0, 128, 150); wood(g, 128, 0, 272, 150);
  backWall(g, 0, 0, 128, '#4a3a6a', '#433560'); backWall(g, 128, 0, 272, '#5a4a7a', '#52436f');
  // Lower floor: lounge, kitchen, garden.
  carpet(g, 0, 150, 196, 150, '#5a2a40', '#7a3050', '#6e2a48'); tiles(g, 196, 150, 94, 150); grass(g, 290, 150, 110, 150);
  backWall(g, 0, 150, 196, '#6a3a5a', '#5e3350'); backWall(g, 196, 150, 94, '#e8e0d0', '#d8d0c0');
  for (let y = 150; y < 178; y++) for (let x = 290; x < W; x++) g.px(x, y, (y - 150) / 28 > bay(x, y) ? '#33236a' : '#1c1550', 1);
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const d = i * i + j * j; if (d <= 16) g.px(380 + i, 162 + j, d < 4 && i < 0 ? '#e8dca8' : '#fff4c8', 1); }
  for (let x = 290; x < W; x += 6) g.rect(x, 172, 2, 11, '#8a6a4a');
  g.rect(290, 174, 110, 2, '#a07a52'); g.rect(290, 179, 110, 2, '#a07a52');
  // Band between floors with doorways (office->lounge, work->kitchen).
  g.rect(0, 144, W, 8, '#2a1e36');
  doorway(g, 66, 28, 144, 180, (x, y, w, h) => wood(g, x, y, w, h));
  doorway(g, 244, 24, 144, 196, (x, y, w, h) => tiles(g, x, y, w, h));
  // Vertical walls with doorways (office|work, lounge|kitchen, kitchen|garden).
  vWall(g, 124, 0, 64); vWall(g, 124, 96, 146);
  vWall(g, 192, 150, 216); vWall(g, 192, 244, H);
  vWall(g, 286, 178, 216); vWall(g, 286, 244, H);
  g.rect(286, 150, 8, 28, '#2a1e36');
  // Outer frame.
  g.rect(0, 0, W, 3, '#140e20'); g.rect(0, H - 3, W, 3, '#140e20'); g.rect(0, 0, 3, H, '#140e20'); g.rect(W - 3, 0, 3, H, '#140e20');

  // Office wall: PLAN board, bookshelf, framed photo. Rug.
  g.rect(60, 4, 52, 19, '#6a4a3a'); g.rect(62, 6, 48, 15, '#ece6f4');
  [1, 1, 0.6, 0.3].forEach((p, i) => { g.rect(64, 8 + i * 3, 3, 2, p === 1 ? '#40b060' : '#e0a030'); g.rect(69, 8 + i * 3, Math.round(36 * p), 2, i === 2 ? '#7a6ad8' : '#a8a0c8'); });
  g.rect(8, 3, 40, 22, '#4a2e2a');
  const books = ['#d84a4a', '#4a7ad8', '#e0b040', '#40a070', '#a05ad0'];
  for (let s = 0; s < 2; s++) { g.rect(8, 12 + s * 10, 40, 1, '#3a2220'); for (let b = 0; b < 12; b++) g.rect(10 + b * 3, 4 + s * 10, 3, 8 - (b % 3), books[(b + s) % 5]); }
  carpet(g, 26, 92, 76, 40, '#c8a050', '#8a3040', '#7a2a38');
  // Work room wall: two windows, poster, clock spot.
  windowFrame(g, 150, 5, 26, 16); windowFrame(g, 356, 5, 26, 16);
  g.rect(200, 6, 22, 15, '#2a2236');
  for (let y = 8; y < 19; y++) for (let x = 202; x < 220; x++) g.px(x, y, (x - 202 + y - 8) / 28 > bay(x, y) ? '#f07a3a' : '#c02a8a');
  g.rect(208, 10, 6, 6, '#ffffff'); g.rect(209, 11, 4, 4, '#c02a8a');
  // Lounge wall: framed picture + shelf. Kitchen wall: shelf with jars.
  g.rect(140, 156, 30, 14, '#6a4a3a'); g.rect(142, 158, 26, 10, '#3a8a6a'); g.rect(146, 162, 6, 6, '#e0b040');
  g.rect(244, 160, 30, 2, '#8a6a4a'); [0, 1, 2, 3].forEach((i) => g.rect(246 + i * 7, 154, 5, 6, ['#e04a6a', '#e0b040', '#40a070', '#4a7ad8'][i]));
  // Garden: stone path + pond.
  for (let i = 0; i < 6; i++) g.rect(300 + i * 16, 262 + (i % 2) * 4, 10, 6, '#a8a0b0');
  for (let y = 0; y < 14; y++) for (let x = 0; x < 30; x++) { const d = ((x - 15) / 15) ** 2 + ((y - 7) / 7) ** 2; if (d < 1) g.px(352 + x, 276 + y, '#2a4a8a'); }
}

// Animated background bits drawn every frame over the static snapshot.
export function drawAnimated(g, f) {
  [[150, 5], [356, 5]].forEach(([x, y]) => { if (f % 9) g.px(x + 3, y + 3, '#ffffff', 1); g.px(x + 22, y + 5, '#cfc8ff', 1); });
  [[300, 156], [322, 162], [350, 154], [366, 168], [392, 158]].forEach(([x, y], i) => { if ((f + i * 3) % 10) g.px(x, y, '#ffffff', 1); });
  if (f % 4 < 2) { g.px(370, 280, '#fff4c8', 1); g.px(371, 280, '#fff4c8', 1); }
  // Clock.
  const cx = 300, cy = 13;
  for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) { const d = i * i + j * j; if (d <= 25) g.px(cx + i, cy + j, d > 16 ? '#8a6a4a' : '#f0e8d0'); }
  g.px(cx, cy, '#2a1a2a'); g.px(cx, cy - 1, '#2a1a2a'); g.px(cx, cy - 2, '#2a1a2a');
  g.px(cx + Math.round(Math.cos(f / 8) * 3), cy + Math.round(Math.sin(f / 8) * 3), '#2a1a2a');
}

export const CEILING_LIGHTS = [
  { x: 64, y: 70, r: 72, s: 0.75, c: [255, 176, 96] },
  { x: 200, y: 66, r: 72, s: 0.7, c: [255, 176, 96] },
  { x: 320, y: 66, r: 72, s: 0.7, c: [255, 176, 96] },
  { x: 96, y: 228, r: 80, s: 0.7, c: [255, 160, 110] },
  { x: 242, y: 228, r: 60, s: 0.75, c: [255, 200, 140] },
];
