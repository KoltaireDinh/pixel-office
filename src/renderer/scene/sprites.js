// Chibi characters (about 14x21 px). One function draws any of the five, in any pose.
import { dk } from './gfx.js';

export const CHARS = {
  manager: { skin: '#f2c48d', hair: '#3b2418', top: '#2c3e7a', pants: '#1f2a52', shoe: '#1a1220' },
  prompt: { skin: '#f7d6b5', hair: '#8a5ad8', top: '#c6b0f0', pants: '#4b3a7a', shoe: '#3a2c5a' },
  researcher: { skin: '#e8b07a', hair: '#7a3e1e', top: '#c08a4a', pants: '#4a3426', shoe: '#3a2414' },
  coder: { skin: '#b8743f', hair: '#1c1424', top: '#2f9e62', pants: '#26324a', shoe: '#e8e8e8' },
  styler: { skin: '#f5cfae', hair: '#e8843a', top: '#f1ead8', pants: '#3d5a8a', shoe: '#8b2f3a' },
};

const EYE = '#2a1a2a';

// o: { sit, walk, climb, raise, up, al, ar, lean, nod, sleep, blink, smile, shout, headScratch }
export function guy(g, role, ox, y, f, o = {}) {
  const sp = g.sp, c = CHARS[role];
  if (!o.sit) {
    const a = (o.walk || o.climb) && f % 2;
    sp(ox + 4, y + 15, 2, 4 - (a ? 1 : 0), c.pants);
    sp(ox + 8, y + 15, 2, 4 - (o.walk || o.climb ? (a ? 0 : 1) : 0), c.pants);
    sp(ox + 3, y + 19 - (a ? 1 : 0), 3, 2, c.shoe);
    sp(ox + 8, y + 19 - ((o.walk || o.climb) && !a ? 1 : 0), 3, 2, c.shoe);
  }
  sp(ox + 3, y + 9, 8, 6, c.top); sp(ox + 10, y + 9, 1, 6, dk(c.top, 0.78)); sp(ox + 3, y + 9, 8, 1, dk(c.top, 1.12));
  if (role === 'manager') { sp(ox + 6, y + 9, 2, 1, '#f4f0e8'); sp(ox + 6, y + 10, 2, 4, '#d84a4a'); sp(ox + 7, y + 10, 1, 4, '#a83038'); }
  if (role === 'researcher') { sp(ox + 3, y + 12, 8, 1, '#6a4424'); sp(ox + 6, y + 9, 1, 6, '#9a6a3a'); }
  if (role === 'prompt') { sp(ox + 3, y + 13, 8, 1, '#a48ad6'); sp(ox + 4, y + 11, 6, 1, '#b9a1e8'); }
  if (role === 'coder') { sp(ox + 5, y + 12, 4, 2, '#258048'); sp(ox + 5, y + 9, 1, 2, '#dddddd'); sp(ox + 8, y + 9, 1, 2, '#dddddd'); }
  if (role === 'styler') { sp(ox + 4, y + 10, 6, 5, '#e9d2a0'); sp(ox + 5, y + 11, 1, 1, '#e04a6a'); sp(ox + 8, y + 12, 1, 1, '#4a7ae0'); sp(ox + 6, y + 13, 1, 1, '#40b060'); }

  const al = o.al || 0, ar = o.ar || 0;
  const armUp = (x) => { sp(x, y + 3, 2, 6, c.top); sp(x, y + 2, 2, 1, c.skin); };
  const armDown = (x, d, col) => { sp(x, y + 9 + d, 2, 5, col); sp(x, y + 14 + d, 2, 1, c.skin); };
  if (o.up || (o.climb && f % 2)) { armUp(ox + 1); if (o.up) armUp(ox + 11); else armDown(ox + 11, -2, dk(c.top, 0.85)); }
  else if (o.climb) { armDown(ox + 1, -2, c.top); armUp(ox + 11); }
  else {
    armDown(ox + 1, al, c.top);
    if (o.raise) armUp(ox + 11);
    else if (o.headScratch) { sp(ox + 11, y + 1, 2, 8, c.top); sp(ox + 10, y, 2, 1, c.skin); }
    else armDown(ox + 11, ar, dk(c.top, 0.85));
  }

  const hx = ox + 2 + (o.lean || 0), hy = y + (o.nod || 0);
  sp(hx + 1, hy, 8, 9, c.skin); sp(hx, hy + 1, 10, 7, c.skin);
  sp(hx + 9, hy + 1, 1, 7, dk(c.skin, 0.86)); sp(hx + 1, hy + 8, 8, 1, dk(c.skin, 0.86));
  if (o.sleep || o.blink) { sp(hx + 2, hy + 5, 2, 1, EYE); sp(hx + 6, hy + 5, 2, 1, EYE); }
  else { sp(hx + 2, hy + 4, 2, 2, EYE); sp(hx + 6, hy + 4, 2, 2, EYE); sp(hx + 2, hy + 4, 1, 1, '#ffffff'); sp(hx + 6, hy + 4, 1, 1, '#ffffff'); }
  sp(hx + 1, hy + 6, 2, 1, '#f08aa0'); sp(hx + 7, hy + 6, 2, 1, '#f08aa0');
  if (o.shout) sp(hx + 4, hy + 6, 2, 2, '#5a1a2a');
  else if (o.smile) sp(hx + 4, hy + 7, 2, 1, '#a83a4a');
  else if (o.headScratch) sp(hx + 4, hy + 7, 3, 1, '#7a3a4a');

  const h = c.hair;
  // Seen from behind: the face is covered by hair (hats and headphones still drawn below).
  if (o.back) { sp(hx + 1, hy, 8, 8, h); sp(hx, hy + 1, 10, 6, h); sp(hx + 2, hy + 7, 6, 1, dk(c.skin, 0.86)); }
  if (role === 'manager') { sp(hx + 1, hy - 1, 8, 2, h); sp(hx, hy, 10, 2, h); sp(hx, hy + 2, 1, 2, h); sp(hx + 9, hy + 2, 1, 2, h); sp(hx + 2, hy - 1, 3, 1, dk(h, 1.5)); }
  if (role === 'researcher') { sp(hx - 1, hy, 12, 2, '#8a5a2e'); sp(hx + 1, hy - 3, 8, 3, '#8a5a2e'); sp(hx + 1, hy - 1, 8, 1, '#4a2e16'); sp(hx + 2, hy - 3, 3, 1, '#a87a46'); sp(hx, hy + 2, 1, 3, h); sp(hx + 9, hy + 2, 1, 3, h); }
  if (role === 'prompt') { sp(hx, hy - 1, 10, 3, h); sp(hx - 1, hy + 1, 2, 10, h); sp(hx + 9, hy + 1, 2, 10, h); sp(hx + 1, hy - 2, 8, 1, h); sp(hx + 2, hy - 1, 3, 1, dk(h, 1.35)); sp(hx + 10, hy - 2, 1, 3, '#ffd84a'); }
  if (role === 'coder') {
    sp(hx, hy - 1, 10, 3, h); sp(hx - 1, hy - 2, 12, 1, '#5a5a6a'); sp(hx - 1, hy + 2, 2, 4, '#e04848'); sp(hx + 9, hy + 2, 2, 4, '#e04848');
    sp(hx + 1, hy + 3, 4, 3, '#1a1a24'); sp(hx + 5, hy + 3, 4, 3, '#1a1a24');
    sp(hx + 2, hy + 4, 2, 1, f % 2 ? '#7af0ff' : '#3a5a6a', 1); sp(hx + 6, hy + 4, 2, 1, f % 2 ? '#7af0ff' : '#3a5a6a', 1);
  }
  if (role === 'styler') { sp(hx, hy + 1, 10, 2, h); sp(hx - 1, hy + 2, 2, 6, h); sp(hx + 9, hy + 2, 2, 6, h); sp(hx - 1, hy - 2, 11, 3, '#d23c4a'); sp(hx + 4, hy - 3, 2, 1, '#d23c4a'); sp(hx, hy - 2, 4, 1, '#f05a6a'); }
}

// Envelope carried while delivering a message; red for BLOCKED/FAIL reports.
export function envelope(g, x, y, urgent) {
  const paper = urgent ? '#f0b0b0' : '#f4f0e8';
  g.sp(x, y, 6, 4, paper); g.sp(x, y, 6, 1, urgent ? '#d07070' : '#d8d0c0'); g.sp(x + 2, y + 1, 2, 1, '#d84a4a');
}
