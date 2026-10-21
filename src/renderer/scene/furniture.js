// Furniture of the top-down house. Each piece is a drawable with a depth (its front/bottom y):
// things with a larger depth are drawn later, so they cover what stands behind them.
import { rgb } from './gfx.js';

export const DESKS = {
  manager: { x: 40, y: 66, w: 46 },
  researcher: { x: 150, y: 62, w: 40 },
  coder: { x: 250, y: 62, w: 40 },
  prompt: { x: 150, y: 112, w: 40 },
  styler: { x: 250, y: 112, w: 40 },
};

function desk(sp, { x, y, w }) {
  sp(x, y, w, 8, '#b07a52'); sp(x, y, w, 1, '#c8946a'); sp(x, y + 8, w, 6, '#6a4028');
  sp(x + 2, y + 14, 3, 4, '#4a2a1e'); sp(x + w - 5, y + 14, 3, 4, '#4a2a1e');
}
function chair(sp, x, y) { sp(x, y, 12, 10, '#5a3a5a'); sp(x, y, 12, 2, '#7a5a7a'); }
function monitor(sp, x, y, glow, lights, k = 0.5) {
  sp(x, y, 12, 9, '#2a2a34'); sp(x + 1, y + 1, 10, 1, glow, 1); sp(x + 5, y + 9, 2, 2, '#2a2a34');
  lights.push({ x: x + 6, y: y + 6, r: 20, s: k, c: rgb(glow) });
}
function smoke(sp, x, y, f) {
  for (let k = 0; k < 3; k++) {
    const yy = y - ((f + k * 3) % 9), xx = x + Math.round(Math.sin((f + k * 5) / 2) * 2);
    sp(xx, yy, 2, 1, '#9a96b0'); sp(xx + 1, yy - 1, 1, 1, '#b0acc4');
  }
}
function videoFrame(sp, x, y, w, h, f) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const hill = j > h - 3 - ((i + f) % 7 < 3 ? 1 : 0);
    sp(x + i, y + j, 1, 1, hill ? '#2a6a4a' : j < h / 2 ? '#f07a3a' : '#c02a8a', 1);
  }
}

// state: { [role]: action } for desk content (screens, smoke). Returns drawables [{ depth, draw(sp) }].
export function furniture(state, f, lights) {
  const out = [];
  const add = (depth, draw) => out.push({ depth, draw });

  for (const [role, d] of Object.entries(DESKS)) {
    const action = state[role];
    add(d.y - 6, (sp) => chair(sp, d.x + d.w / 2 - 6, d.y - 10));
    add(d.y + 14, (sp) => {
      desk(sp, d);
      const render = action === 'render', browse = action === 'browse';
      if (role === 'manager') {
        sp(d.x + 4, d.y + 1, 10, 4, '#f4f0e8'); sp(d.x + 5, d.y + 2, 8, 1, '#c8c4d8');
        sp(d.x + 36, d.y - 3, 4, 5, '#f4f0e8'); if (f % 3) sp(d.x + 37, d.y - 7, 1, 3, '#c8c4d8');
        sp(d.x + 30, d.y + 2, 4, 3, '#2a2a3a');
      }
      if (role === 'researcher') {
        const sc = ['#e04a8a', '#f07a3a', '#7a4ad8'][Math.floor(f / 4) % 3];
        monitor(sp, d.x + 2, d.y - 6, sc, lights);
        if (browse) videoFrame(sp, d.x + 3, d.y - 5, 10, 7, f);
        sp(d.x + 28, d.y + 2, 8, 3, '#2a2a3a'); sp(d.x + 29, d.y + 2, 2, 1, '#e04848');
        if (render) smoke(sp, d.x + 7, d.y - 8, f);
      }
      if (role === 'coder') {
        monitor(sp, d.x + 1, d.y - 6, '#5af07a', lights); monitor(sp, d.x + 27, d.y - 6, '#5ab0ff', lights);
        if (browse) videoFrame(sp, d.x + 28, d.y - 5, 10, 7, f);
        sp(d.x + 16, d.y + 4, 8, 2, '#d0d0dc'); sp(d.x + 36, d.y + 1, 3, 4, '#ffd84a');
        if (render) { smoke(sp, d.x + 6, d.y - 8, f); smoke(sp, d.x + 32, d.y - 8, f + 4); }
      }
      if (role === 'prompt') {
        sp(d.x + 4, d.y + 1, 12, 5, '#f8f4e8'); sp(d.x + 10, d.y + 1, 1, 5, '#c8bca8');
        for (let k = 0; k < f % 10; k++) sp(d.x + 5 + (k % 4), d.y + 2 + (Math.floor(k / 4) % 2), 1, 1, '#7a7a9a');
        sp(d.x + 28, d.y - 4, 6, 6, '#4a7ad8'); sp(d.x + 28, d.y - 6, 6, 2, '#d84a4a');
        if (browse) { sp(d.x + 17, d.y - 2, 8, 6, '#2a2a34'); videoFrame(sp, d.x + 18, d.y - 1, 6, 4, f); }
        if (render) smoke(sp, d.x + 20, d.y - 4, f);
      }
      if (role === 'styler') {
        sp(d.x + 4, d.y + 1, 10, 4, '#d8b884'); sp(d.x + 5, d.y + 2, 1, 1, '#e04a6a'); sp(d.x + 8, d.y + 2, 1, 1, '#4a7ae0'); sp(d.x + 11, d.y + 2, 1, 1, '#ffd84a');
        monitor(sp, d.x + 26, d.y - 6, '#f0a0d0', lights, 0.35);
        if (browse) videoFrame(sp, d.x + 27, d.y - 5, 10, 7, f);
      }
      if (role === 'manager' && browse) { sp(d.x + 18, d.y - 2, 8, 6, '#2a2a34'); videoFrame(sp, d.x + 19, d.y - 1, 6, 4, f); }
    });
  }

  // Easel (Hồng paints standing to its left).
  add(124, (sp) => {
    const pal = ['#e04a6a', '#ffb040', '#40b0a0', '#4a7ae0', '#a05ad0'], hu = Math.floor(f / 3);
    sp(346, 100, 2, 26, '#6a4424'); sp(362, 100, 2, 26, '#6a4424'); sp(354, 104, 2, 20, '#5a3a20');
    sp(342, 94, 26, 20, '#f4f0e8');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 22; x++)
      sp(344 + x, 96 + y, 1, 1, y > 11 - Math.abs(x - 11) / 2 ? pal[(hu + 1) % 5] : y > 7 ? pal[(hu + 3) % 5] : pal[hu % 5]);
  });
  // Work room: printer + water cooler; office plant.
  add(50, (sp) => { sp(326, 36, 22, 14, '#d0d0d8'); sp(326, 36, 22, 3, '#e8e8f0'); sp(330, 40, 14, 2, '#2a2a34'); if (f % 6 < 3) sp(342, 42, 3, 2, '#5af07a', 1); });
  add(74, (sp) => { sp(380, 44, 12, 22, '#c8d8f0'); sp(382, 36, 8, 9, '#7ab0f0'); sp(380, 64, 12, 8, '#8a8aa0'); });
  add(112, (sp) => { sp(8, 100, 9, 12, '#7a4a32'); sp(6, 88, 12, 12, '#2f8a4a'); sp(4, 92, 3, 5, '#3aa05a'); sp(16, 90, 3, 5, '#3aa05a'); });

  // Lounge: sofa (back behind sitters, front lip in front), coffee table, arcade cabinet, bean bag, plant.
  add(186, (sp) => { sp(30, 182, 90, 10, '#8a3b4a'); sp(30, 182, 90, 2, '#a04a5a'); });
  add(210, (sp) => { sp(34, 200, 82, 9, '#a04a5a'); sp(34, 200, 82, 2, '#b85a6a'); sp(26, 188, 8, 22, '#7a3040'); sp(116, 188, 8, 22, '#7a3040'); });
  add(238, (sp) => { sp(48, 226, 54, 10, '#7a4a32'); sp(48, 226, 54, 2, '#9a6a46'); sp(56, 222, 6, 4, '#f4f0e8'); sp(84, 223, 9, 3, '#2a2a34'); });
  add(214, (sp) => {
    sp(150, 180, 22, 34, '#3a2a6a'); sp(150, 180, 22, 3, '#ffd84a', 1); sp(152, 184, 18, 12, '#000000', 1);
    sp(153, 185, 16, 10, ['#e04a8a', '#40b0a0', '#ffd84a'][Math.floor(f / 5) % 3], 1);
    sp(154, 200, 14, 4, '#2a2a34'); sp(156, 201, 2, 2, '#e04848', 1); sp(162, 201, 2, 2, '#4a7ae0', 1);
    lights.push({ x: 161, y: 194, r: 26, s: 0.6, c: [200, 120, 255] });
  });
  add(256, (sp) => { sp(148, 250, 24, 8, '#c08830'); sp(150, 246, 20, 6, '#e0a030'); sp(152, 245, 16, 2, '#f0b840'); });
  add(264, (sp) => { sp(170, 264, 10, 14, '#7a4a32'); sp(168, 252, 14, 12, '#2f8a4a'); sp(166, 256, 3, 5, '#3aa05a'); });
  add(282, (sp) => { sp(10, 268, 10, 12, '#7a4a32'); sp(8, 256, 14, 12, '#2f8a4a'); });

  // Kitchen: counter with coffee machine, fridge, table + stools.
  add(194, (sp) => {
    sp(204, 172, 36, 12, '#c8c0b0'); sp(204, 172, 36, 2, '#e0d8c8'); sp(204, 184, 36, 10, '#8a7a6a');
    sp(212, 162, 12, 12, '#3a3a44'); sp(214, 165, 8, 4, '#e04848', 1);
    for (let k = 0; k < 3; k++) { const yy = 158 - ((f + k * 3) % 8), xx = 217 + Math.round(Math.sin((f + k * 4) / 2) * 2); sp(xx, yy, 1, 2, '#d8d4e8'); }
    sp(270, 160, 14, 34, '#e8e8f0'); sp(270, 176, 14, 1, '#a8a8b8'); sp(281, 166, 1, 6, '#a8a8b8');
  });
  add(256, (sp) => { sp(220, 240, 36, 12, '#a06a46'); sp(220, 240, 36, 2, '#c08a5a'); sp(220, 252, 36, 4, '#7a4a32'); });
  add(258, (sp) => { sp(212, 246, 7, 8, '#7a4a32'); sp(258, 246, 7, 8, '#7a4a32'); });

  // Garden: bench, lamp posts, sleeping cat, fireflies, flowers.
  add(206, (sp) => { sp(330, 198, 44, 6, '#8a5a3a'); sp(330, 198, 44, 1, '#a87a52'); sp(332, 204, 3, 8, '#6a4028'); sp(369, 204, 3, 8, '#6a4028'); });
  for (const [x, y] of [[312, 214], [388, 238]]) {
    add(y, (sp) => { sp(x, y - 16, 2, 16, '#3a3448'); sp(x - 2, y - 20, 6, 4, '#c9773a'); sp(x - 1, y - 19, 4, 2, '#fff1b0', 1); });
    lights.push({ x: x + 1, y: y - 18, r: 36, s: 0.85, c: [255, 176, 96] });
  }
  add(232, (sp) => {
    sp(300, 226, 11, 6, '#e8a050'); sp(302, 224, 4, 3, '#e8a050'); sp(303, 226, 2, 1, '#2a1a2a');
    sp(310 + (f % 6 < 3 ? 0 : 1), 228, 3, 2, '#e8a050'); sp(304, 229, 4, 1, '#c88040');
  });
  [[310, 200], [340, 236], [372, 252], [330, 290], [298, 278]].forEach(([x, y], i) => {
    if ((f + i * 2) % 6 < 3) { add(300, (sp) => sp(x, y, 1, 1, '#eaff70', 1)); lights.push({ x, y, r: 8, s: 0.5, c: [220, 255, 120] }); }
  });
  add(196, (sp) => { sp(298, 188, 6, 8, '#e04a6a'); sp(300, 186, 2, 2, '#ffd84a'); });
  add(204, (sp) => { sp(388, 196, 6, 8, '#ffd84a'); sp(390, 194, 2, 2, '#e04a6a'); });

  return out;
}
