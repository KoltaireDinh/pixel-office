// Static-ish world: night sky, roof with cat, two rooms, decor, ladder, hanging lamps.
import { W, bay } from './gfx.js';
import { F1, F2, STAIR_X } from './paths.js';

const SKY = ['#0e0b2e', '#1c1550', '#33236a', '#5a2e78', '#9a4a7a', '#d8706a'];
const STARS = [...Array(28)].map((_, i) => [(i * 37 + 11) % W, (i * 23 + 5) % 40, i % 4]);

export function sky(g, f) {
  const { px } = g;
  for (let y = 0; y < 56; y++) {
    const t = (y / 56) * (SKY.length - 1), i = Math.floor(t), fr = t - i;
    for (let x = 0; x < W; x++) px(x, y, fr > bay(x, y) ? SKY[Math.min(i + 1, SKY.length - 1)] : SKY[i], 1);
  }
  for (const [x, y, k] of STARS) {
    if ((f + k * 3) % 11 !== 0) px(x, y, k ? '#cfc8ff' : '#ffffff', 1);
    if (k === 0 && f % 8 < 4) { px(x - 1, y, '#8a80d0', 1); px(x + 1, y, '#8a80d0', 1); }
  }
  for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
    const d = i * i + j * j;
    if (d <= 25) px(16 + i, 12 + j, (i + 2) * (i + 2) + (j - 1) * (j - 1) < 4 ? '#e8dca8' : '#fff4c8', 1);
    else if (d <= 40 && bay(16 + i, 12 + j) < 0.4) px(16 + i, 12 + j, '#6a5a9a', 1);
  }
  const s = f % 40;
  if (s < 6) for (let k = 0; k < 5; k++) px(100 - s * 4 + k, 6 + s * 2 - k / 2, k ? '#ffd8a0' : '#ffffff', 1);
}

export function roof(g, f) {
  const { px, rect } = g;
  for (let y = 30; y < 56; y++) {
    const hw = (y - 30) * 2.7;
    for (let x = Math.max(0, Math.floor(64 - hw)); x < Math.min(W, 64 + hw); x++) {
      const row = Math.floor((y - 30) / 4), seam = (x + row * 3) % 6 === 0;
      px(x, y, (y - 30) % 4 === 3 ? '#5e2630' : seam ? '#6e2c36' : (y - 30) % 4 === 0 ? '#a24a4a' : '#8a3b3b');
    }
  }
  rect(88, 26, 9, 18, '#7a4a4a');
  for (let y = 26; y < 44; y += 3) rect(88, y, 9, 1, '#5a3238');
  rect(87, 24, 11, 3, '#5a3238');
  for (let k = 0; k < 4; k++) {
    const yy = 20 - k * 5 - ((f / 2) % 5), xx = 92 + Math.round(Math.sin((f + k * 7) / 3) * 2);
    if (yy > 0) { px(xx, yy, '#8a86b0'); px(xx + 1, yy, '#7a76a0'); px(xx, yy - 1, '#9a96c0'); }
  }
  const cx = 58, cy = 19;
  rect(cx, cy + 3, 7, 6, '#3a3448'); rect(cx + 1, cy, 5, 4, '#3a3448'); px(cx + 1, cy - 1, '#3a3448'); px(cx + 5, cy - 1, '#3a3448');
  if (f % 20) { px(cx + 2, cy + 1, '#ffe060', 1); px(cx + 4, cy + 1, '#ffe060', 1); }
  const tw = f % 6 < 3 ? 1 : 0;
  rect(cx + 7, cy + 7, 2, 1, '#3a3448'); rect(cx + 8 + tw, cy + 4, 1, 3, '#3a3448');
  rect(118, 20, 1, 16, '#2a2236'); rect(114, 22, 9, 1, '#2a2236'); rect(116, 19, 5, 1, '#2a2236');
  px(118, 19, f % 4 < 2 ? '#ff4a4a' : '#5a1a2a', f % 4 < 2);
}

export function room(g, fl) {
  const { px, rect } = g;
  const T = fl.top, Fy = fl.floor;
  rect(0, T, W, 3, '#1a1230');
  for (let y = T + 3; y < Fy; y++) for (let x = 0; x < W; x++) {
    let c = x % 10 === 0 ? '#2a2250' : '#30285c';
    if (y > Fy - 18) { c = x % 16 === 0 || y === Fy - 18 ? '#4a2e40' : '#3a2846'; if (y === Fy - 17) c = '#5b3d52'; }
    px(x, y, c);
  }
  for (let y = Fy; y < Fy + 12; y++) for (let x = 0; x < W; x++) {
    const r = Math.floor((y - Fy) / 3), seam = (x + r * 11) % 24 === 0;
    px(x, y, (y - Fy) % 3 === 2 || seam ? '#3a2220' : r % 2 ? '#5a3a2e' : '#4e3228');
  }
  rect(0, Fy + 12, W, 4, '#24182a');
  rect(0, T, 2, Fy - T + 12, '#1a1230'); rect(W - 2, T, 2, Fy - T + 12, '#1a1230');
}

// Ladder on the right wall joining the two floors, through a hatch in the upper floor.
export function ladder(g) {
  const { rect } = g;
  rect(STAIR_X - 4, F2.floor, 9, 16, '#140e20');
  for (let y = F2.floor - 6; y < F1.floor + 4; y++) { rect(STAIR_X - 4, y, 1, 1, '#7a4a32'); rect(STAIR_X + 4, y, 1, 1, '#7a4a32'); }
  for (let y = F2.floor - 4; y < F1.floor + 4; y += 5) rect(STAIR_X - 3, y, 7, 1, '#a06a46');
  rect(STAIR_X - 5, F2.floor - 7, 2, 1, '#b07a52'); rect(STAIR_X + 4, F2.floor - 7, 2, 1, '#b07a52');
}

export function decor(g, f) {
  const { px, rect } = g;
  // Upper floor: PLAN board, window, bookshelf, plant.
  rect(12, 66, 36, 24, '#6a4a3a'); rect(14, 68, 32, 20, '#ece6f4'); px(30, 64, '#8a8a9a');
  [1, 1, 0.6, 0.3].forEach((p, i) => {
    rect(16, 70 + i * 4, 3, 2, p === 1 ? '#40b060' : '#e0a030');
    rect(21, 70 + i * 4, Math.round(22 * p), 2, i === 2 ? '#7a6ad8' : '#a8a0c8');
  });
  rect(52, 68, 24, 24, '#5a3a2e');
  for (let y = 70; y < 90; y++) for (let x = 54; x < 74; x++) px(x, y, (y - 70) / 20 > bay(x, y) * 1.3 ? '#4a2a72' : '#1c1550', 1);
  rect(63, 70, 2, 20, '#5a3a2e'); rect(54, 79, 20, 2, '#5a3a2e');
  if (f % 9) px(57, 73, '#ffffff', 1);
  px(70, 75, '#cfc8ff', 1); px(68, 86, '#ffd84a', 1);
  rect(104, 64, 22, 40, '#4a2e2a');
  const books = ['#d84a4a', '#4a7ad8', '#e0b040', '#40a070', '#a05ad0'];
  for (let s = 0; s < 3; s++) {
    rect(104, 74 + s * 12, 22, 2, '#3a2220');
    for (let b = 0; b < 9; b++) rect(106 + b * 2, 66 + s * 12, 2, 8 - (b % 3), books[(b + s) % 5]);
  }
  rect(4, 114, 6, 10, '#7a4a32'); rect(5, 106, 4, 8, '#2f8a4a'); rect(3, 108, 2, 4, '#3aa05a'); rect(9, 105, 2, 5, '#3aa05a');
  // Lower floor: poster, clock, small painting.
  rect(8, 152, 22, 16, '#2a2236');
  for (let y = 154; y < 166; y++) for (let x = 10; x < 28; x++) px(x, y, (x - 10 + y - 154) / 30 > bay(x, y) ? '#f07a3a' : '#c02a8a');
  rect(16, 157, 6, 6, '#ffffff'); rect(17, 158, 4, 4, '#c02a8a'); px(18, 159, '#ffffff');
  rect(78, 150, 14, 10, '#6a4a3a'); rect(79, 151, 12, 8, '#3a8a6a'); rect(81, 155, 4, 4, '#e0b040');
  const ccx = 44, ccy = 154;
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const d = i * i + j * j; if (d <= 16) px(ccx + i, ccy + j, d > 9 ? '#8a6a4a' : '#f0e8d0'); }
  const a = f / 8;
  px(ccx + Math.round(Math.cos(a) * 3), ccy + Math.round(Math.sin(a) * 3), '#2a1a2a');
  px(ccx, ccy, '#2a1a2a'); px(ccx, ccy - 1, '#2a1a2a'); px(ccx, ccy - 2, '#2a1a2a');
}

export function lamp(g, sx, T, on = true) {
  const { rect } = g;
  rect(sx, T + 3, 1, 6, '#2a2236'); rect(sx - 3, T + 9, 7, 3, '#c9773a'); rect(sx - 2, T + 8, 5, 1, '#e0904a');
  rect(sx - 1, T + 12, 3, 1, on ? '#fff1b0' : '#6a5a4a', on);
}

export { F1, F2 };
