// Compose one frame of the top-down house. Each character has a body that walks to the place its action
// belongs (desk, sofa, kitchen, garden...). Returns head anchors for bubbles.
import { createGfx } from './gfx.js';
import { applyLight } from './light.js';
import { drawStatic, drawAnimated, CEILING_LIGHTS } from './house.js';
import { furniture } from './furniture.js';
import { guy, envelope } from './sprites.js';
import { createMover } from './mover.js';
import { spotFor, HANDOFF_MS, SCENE_W, SCENE_H } from './nav.js';

export const ORDER = ['manager', 'prompt', 'researcher', 'coder', 'styler'];
const DESK_ACTIONS = new Set(['work', 'type_fast', 'read', 'browse', 'render', 'phone', 'confused']);

// Pose of someone sitting at their desk. sp draws on the sprite layer; x,y is the foot position.
function deskPose(sp, role, x, y, f, action) {
  const ox = x - 7, top = y - 19, slow = Math.floor(f / 2) % 2, fast = f % 2;
  const o = { sit: true, blink: f % 23 === 0 };
  if (action === 'work') {
    Object.assign(o, { al: slow ? -1 : 0, ar: slow ? 0 : -1 });
    if (role === 'coder') o.nod = slow;
    if (role === 'prompt' && Math.floor(f / 12) % 2 === 0) Object.assign(o, { ar: -4, al: 0 });
  }
  if (action === 'type_fast') Object.assign(o, { al: fast ? -1 : 0, ar: fast ? 0 : -1, nod: role === 'coder' ? fast : 0 });
  if (action === 'read') {
    if (role === 'researcher') { o.ar = -5; sp(ox + 12, top + 2, 4, 4, '#bfe0ff', 1); sp(ox + 13, top + 3, 2, 2, '#ffffff', 1); sp(ox + 12, top + 6, 1, 3, '#6a4424'); }
    else o.blink = f % 9 === 0;
  }
  if (action === 'browse') Object.assign(o, { al: -4, nod: 1, smile: Math.floor(f / 6) % 3 === 0 });
  if (action === 'render') Object.assign(o, { ar: fast ? -5 : -1 });
  if (action === 'phone') { Object.assign(o, { ar: -7, smile: true }); sp(ox + 11, top + 1, 2, 7, '#1a1a24'); }
  if (action === 'confused') {
    o.headScratch = true;
    sp(ox + 3, top - 9, 9, 3, '#4a4458'); sp(ox + 4, top - 10, 6, 1, '#4a4458');
    if (fast) { sp(ox + 5, top - 5, 1, 1, '#7aa0ff', 1); sp(ox + 9, top - 4, 1, 1, '#7aa0ff', 1); }
  }
  guy({ sp }, role, ox, top, f, o);
}

function zzz(sp, x, y, f) {
  const z = f % 12;
  sp(x + z / 3, y - z, 2, 1, '#ffffff', 1);
  if (z > 4) sp(x + 3 + z / 3, y - 4 - z, 3, 1, '#ffffff', 1);
}

function restPose(sp, role, x, y, f, lights) {
  const ox = x - 7, g = { sp };
  if (role === 'manager') { // at the kitchen table with a cup
    const up = Math.floor(f / 6) % 2;
    guy(g, role, ox, y - 19, f, { sit: true, ar: up ? -5 : 0, smile: true });
    sp(ox + 12, y - (up ? 14 : 8), 3, 3, '#f4f0e8'); if (up && f % 2) sp(ox + 13, y - 18, 1, 2, '#c8c4d8');
  } else if (role === 'researcher') { // making coffee at the counter
    const pour = Math.floor(f / 6) % 2;
    guy(g, role, ox, y - 21, f, { ar: pour ? -4 : -1, smile: true });
    sp(ox + 12, y - (pour ? 15 : 9), 3, 4, '#f4f0e8');
  } else if (role === 'prompt') { // reading on the sofa
    guy(g, role, ox, y - 19, f, { sit: true, al: -3, ar: -3, smile: true });
    sp(ox + 3, y - 10, 8, 5, '#4a7ad8'); sp(ox + 6, y - 10, 1, 5, '#f4f0e8');
  } else if (role === 'coder') { // playing the arcade, back to us
    guy(g, role, ox, y - 21, f, { back: true, al: f % 2 ? -2 : -1, ar: f % 2 ? -1 : -2 });
    if (f % 2) { sp(ox - 4, y - 30, 1, 3, '#ffffff', 1); sp(ox - 3, y - 30, 2, 1, '#ffffff', 1); }
  } else if (role === 'styler') { // on the garden bench, looking at the moon
    guy(g, role, ox, y - 19 - (f % 12 < 6 ? 0 : 1), f, { sit: true, smile: true, blink: f % 17 === 0 });
  }
}

export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  const g = createGfx(ctx, SCENE_W, SCENE_H);
  drawStatic(g);
  const bg = g.snapshot();
  const bodies = {};
  const walks = {}; // role -> { since, delivered, at }
  let lastNow = null;

  // chars: { [role]: {action, since, data} }, now in ms. Returns { [role]: [x, y] | null } in scene px.
  function render(chars, f, now, { dim = 1 } = {}) {
    const dt = lastNow === null ? 0 : Math.min(500, Math.max(0, now - lastNow));
    lastNow = now;
    g.restore(bg);
    drawAnimated(g, f);
    g.clearLayer();
    const lights = CEILING_LIGHTS.map((l) => ({ ...l }));
    const deskState = {};
    const drawables = [];
    const anchors = {};

    for (const role of ORDER) {
      const st = chars[role] ?? { action: 'absent', since: 0, data: null };
      let spot = spotFor(role, st.action, st.data);
      if (!bodies[role]) {
        bodies[role] = createMover(st.action === 'absent' || st.action === 'enter' ? 'gate' : spot);
      }
      const body = bodies[role];
      // Deliveries: go to the recipient, hand over, then head back to the desk.
      if (st.action === 'walk' && st.data?.to) {
        const w = walks[role]?.since === st.since ? walks[role] : (walks[role] = { since: st.since, delivered: false, at: 0 });
        if (w.delivered) spot = `seat:${role}`;
        body.setTarget(spot);
        const pos = body.step(dt);
        if (!w.delivered && pos.arrived && body.target === spot) { w.delivered = true; w.at = now; }
        if (w.delivered && now - w.at > HANDOFF_MS) body.setTarget(`seat:${role}`);
      } else {
        body.setTarget(spot);
        body.step(dt);
      }
      const p = body.step(0);
      const hidden = (st.action === 'absent' || st.action === 'leave') && p.arrived;
      deskState[role] = p.arrived && DESK_ACTIONS.has(st.action) ? st.action : null;
      anchors[role] = null;
      if (hidden) continue;

      const x = Math.round(p.x), y = Math.round(p.y);
      const atDesk = p.arrived && DESK_ACTIONS.has(st.action) && !(role === 'styler' && body.target === 'easel:styler');
      const sitting = atDesk || (p.arrived && (st.action === 'sleep' || (st.action === 'rest' && role !== 'researcher' && role !== 'coder')));
      anchors[role] = [x, y - (sitting ? 22 : 25)];

      drawables.push({ depth: y, draw: (sp) => {
        const gg = { sp };
        if (!p.arrived) {
          guy(gg, role, x - 7, y - 21 - (f % 2), f, { walk: true, smile: true });
          const w = walks[role];
          if (st.action === 'walk' && w && !w.delivered) envelope(gg, p.dir > 0 ? x + 6 : x - 12, y - 11, /^\[(BLOCKED|FAIL)/.test(st.data?.head ?? ''));
          return;
        }
        if (atDesk) return deskPose(sp, role, x, y, f, st.action);
        switch (st.action) {
          case 'work': case 'type_fast': case 'render': // Hồng at the easel
            guy(gg, role, x - 7, y - 21 - (f % 2), f, { ar: f % 2 ? -5 : -2, smile: true }); return;
          case 'alert': {
            const b = f % 2;
            guy(gg, role, x - 7, y - 21 - b, f, { raise: true, shout: true });
            sp(x + 5, y - 34 - b, 3, 6, '#ffd84a', 1); sp(x + 5, y - 27 - b, 3, 2, '#ffd84a', 1);
            lights.push({ x, y: y - 20, r: 18, s: 0.7, c: [255, 216, 74] });
            return;
          }
          case 'walk':
            if (walks[role]?.delivered && body.target === `seat:${role}`) return deskPose(sp, role, x, y, f, 'work');
            // handing over the envelope
            guy(gg, role, x - 7, y - 21, f, { raise: true, smile: true }); envelope(gg, x + 5, y - 26, false); return;
          case 'enter': return deskPose(sp, role, x, y, f, 'work');
          case 'rest': restPose(sp, role, x, y, f, lights); return;
          case 'sleep': guy(gg, role, x - 7, y - 17, f, { sit: true, sleep: true, nod: 2 }); zzz(sp, x + 6, y - 22, f); return;
          default: guy(gg, role, x - 7, y - 21, f, { smile: true });
        }
      } });
    }

    for (const d of furniture(deskState, f, lights)) drawables.push(d);
    drawables.sort((a, b) => a.depth - b.depth);
    for (const d of drawables) d.draw(g.sp);
    g.flushLayer();
    applyLight(g, lights, dim);
    g.present();
    return anchors;
  }

  return { render };
}
