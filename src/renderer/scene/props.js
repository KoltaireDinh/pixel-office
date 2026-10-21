// Desks, chairs and each character's desk items. Screens push light sources into `lights`.
import { rgb } from './gfx.js';

export const DESK_W = 30;

export function desk(g, sx, Fy, w = DESK_W) {
  const sp = g.sp, x0 = sx - w / 2, ty = Fy - 16;
  sp(x0, ty, w, 1, '#b07a52'); sp(x0, ty + 1, w, 2, '#7a4a32'); sp(x0 + 1, ty + 3, w - 2, 6, '#5a3424');
  sp(x0 + 3, ty + 5, w - 6, 1, '#4a2a1e'); sp(x0 + 2, ty + 9, 2, 7, '#4a2a1e'); sp(x0 + w - 4, ty + 9, 2, 7, '#4a2a1e');
}

export function chair(g, sx, Fy, away = false) {
  const x = away ? sx + 6 : sx - 5;
  g.sp(x, Fy - 30, 10, 14, '#5a3a5a'); g.sp(x, Fy - 30, 10, 1, '#7a5a7a');
  if (away) g.sp(x + 4, Fy - 16, 2, 14, '#3a2a3a');
}

// A tiny moving "video" for browse mode: sunset + hill + pixel figure.
function videoFrame(g, x, y, w, h, f) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const hill = j > h - 3 - ((i + f) % 7 < 3 ? 1 : 0);
    g.sp(x + i, y + j, 1, 1, hill ? '#2a6a4a' : j < h / 2 ? '#f07a3a' : '#c02a8a', 1);
  }
  g.sp(x + 1 + (f % (w - 2)), y + h - 4, 1, 2, '#ffffff', 1);
}

function smoke(g, x, y, f) {
  for (let k = 0; k < 3; k++) {
    const yy = y - ((f + k * 3) % 9), xx = x + Math.round(Math.sin((f + k * 5) / 2) * 2);
    g.sp(xx, yy, 2, 1, '#9a96b0'); g.sp(xx + 1, yy - 1, 1, 1, '#b0acc4');
  }
}

// T = desk top y. action decides screen content and extra items.
export function deskProps(g, role, sx, T, f, action, lights) {
  const sp = g.sp;
  const browse = action === 'browse', render = action === 'render';
  if (role === 'manager') {
    sp(sx - 12, T - 3, 8, 3, '#f4f0e8'); sp(sx - 11, T - 2, 6, 1, '#c8c4d8'); sp(sx - 12, T - 5, 8, 2, '#e8e4f0');
    sp(sx + 5, T - 3, 7, 3, '#3a2a3a'); sp(sx + 6, T - 2, 5, 1, '#e0b040');
    if (action !== 'rest') { sp(sx + 12, T - 4, 3, 4, '#f4f0e8'); if (f % 3) sp(sx + 13, T - 7, 1, 2, '#c8c4d8'); }
  }
  if (role === 'prompt') {
    sp(sx + 2, T - 2, 11, 2, '#f8f4e8'); sp(sx + 7, T - 2, 1, 2, '#c8bca8');
    for (let k = 0; k < f % 10; k++) sp(sx + 3 + (k % 4), T - 2 + (Math.floor(k / 4) % 2), 1, 1, '#7a7a9a');
    sp(sx - 13, T - 6, 6, 6, '#4a7ad8'); sp(sx - 13, T - 8, 6, 2, '#d84a4a'); sp(sx - 12, T - 10, 4, 2, '#e0b040');
  }
  if (role === 'researcher') {
    sp(sx - 14, T - 13, 12, 10, '#3a3a4a');
    const sc = ['#e04a8a', '#f07a3a', '#7a4ad8'][Math.floor(f / 4) % 3];
    if (browse) videoFrame(g, sx - 13, T - 12, 10, 8, f);
    else { sp(sx - 13, T - 12, 10, 8, sc, 1); sp(sx - 11, T - 10, 6, 4, '#ffffff', 1); sp(sx - 10, T - 9, 4, 2, sc, 1); }
    sp(sx - 9, T - 3, 2, 3, '#3a3a4a');
    lights.push({ x: sx - 8, y: T - 8, r: 16, s: 0.55, c: rgb(sc) });
    sp(sx + 6, T - 3, 8, 3, '#2a2a3a'); sp(sx + 7, T - 3, 2, 1, '#e04848'); sp(sx + 10, T - 3, 2, 1, '#e04848');
    if (render) smoke(g, sx - 8, T - 15, f);
  }
  if (role === 'coder') {
    [[sx - 15, '#0e2a1a', '#5af07a'], [sx + 4, '#0e1a3a', '#5ab0ff']].forEach(([mx, bgc, fg], k) => {
      sp(mx, T - 12, 11, 9, '#2a2a34');
      if (browse && k === 1) videoFrame(g, mx + 1, T - 11, 9, 7, f);
      else { sp(mx + 1, T - 11, 9, 7, bgc, 1); for (let r = 0; r < 3; r++) sp(mx + 2, T - 10 + r * 2, ((f + r * 3 + k * 2) % 6) + 2, 1, fg, 1); }
      sp(mx + 4, T - 3, 3, 3, '#2a2a34');
      lights.push({ x: mx + 5, y: T - 7, r: 16, s: 0.55, c: rgb(fg) });
    });
    sp(sx - 3, T - 1, 6, 1, '#d0d0dc'); sp(sx + 12, T - 5, 3, 5, '#ffd84a'); sp(sx + 12, T - 5, 3, 1, '#e04848');
    if (render) { smoke(g, sx - 10, T - 14, f); smoke(g, sx + 9, T - 14, f + 4); }
  }
  if (role === 'styler') {
    sp(sx - 13, T - 3, 8, 3, '#d8b884'); sp(sx - 12, T - 3, 1, 1, '#e04a6a'); sp(sx - 10, T - 2, 1, 1, '#4a7ae0'); sp(sx - 8, T - 3, 1, 1, '#ffd84a');
    sp(sx + 3, T - 20, 12, 14, '#f4f0e8');
    if (browse) videoFrame(g, sx + 4, T - 19, 10, 12, f);
    else {
      const hu = Math.floor(f / 3), pal = ['#e04a6a', '#ffb040', '#40b0a0', '#4a7ae0', '#a05ad0'];
      for (let y = 0; y < 12; y++) for (let x = 0; x < 10; x++)
        sp(sx + 4 + x, T - 19 + y, 1, 1, y > 8 - Math.abs(x - 5) ? pal[(hu + 1) % 5] : y > 5 ? pal[(hu + 3) % 5] : pal[hu % 5]);
    }
    sp(sx + 5, T - 6, 1, 6, '#6a4424'); sp(sx + 12, T - 6, 1, 6, '#6a4424');
    if (render) smoke(g, sx + 9, T - 22, f);
  }
  // Characters without a screen get a small tablet to watch videos on.
  if (browse && (role === 'manager' || role === 'prompt')) { sp(sx - 4, T - 6, 8, 6, '#2a2a34'); videoFrame(g, sx - 3, T - 5, 6, 4, f); lights.push({ x: sx, y: T - 4, r: 12, s: 0.5, c: [240, 120, 90] }); }
  if (render && (role === 'manager' || role === 'prompt')) smoke(g, sx, T - 6, f);
}

// Desk phone; the receiver is in hand while on the phone.
export function phone(g, sx, T, inHand) {
  g.sp(sx + 8, T - 3, 5, 3, '#2a2a3a'); g.sp(sx + 9, T - 2, 3, 1, '#4a4a5a');
  if (!inHand) g.sp(sx + 8, T - 4, 5, 1, '#1a1a24');
}
