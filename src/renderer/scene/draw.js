// Compose one frame of the house from each character's current action. Returns head anchors for bubbles.
import { createGfx } from './gfx.js';
import { sky, roof, room, ladder, decor, lamp, F1, F2 } from './world.js';
import { guy, envelope } from './sprites.js';
import { desk, chair, deskProps, phone } from './props.js';
import { applyLight } from './light.js';
import { STATIONS, STAIR_X, FEET, walkPath, pointAt, floorOf } from './paths.js';
import { ENTER_MS, LEAVE_MS } from '../brain.js';

export const ORDER = ['manager', 'prompt', 'researcher', 'coder', 'styler'];
const SEATED = new Set(['work', 'type_fast', 'read', 'browse', 'render', 'phone', 'confused', 'rest', 'sleep']);

function seatedPose(g, role, ox, sitY, f, action) {
  const slow = Math.floor(f / 2) % 2, fast = f % 2;
  const o = { sit: true, blink: f % 23 === 0 };
  let y = sitY;
  switch (action) {
    case 'work':
      Object.assign(o, { al: slow ? -1 : 0, ar: slow ? 0 : -1 });
      if (role === 'coder') o.nod = slow;
      if (role === 'styler') o.lean = slow ? 1 : -1;
      if (role === 'prompt' && Math.floor(f / 12) % 2 === 0) { o.ar = -4; o.al = 0; }
      break;
    case 'type_fast': Object.assign(o, { al: fast ? -1 : 0, ar: fast ? 0 : -1, nod: role === 'coder' ? fast : 0 }); break;
    case 'read':
      if (role === 'researcher') { o.ar = -5; g.sp(ox + 12, sitY + 2, 4, 4, '#bfe0ff', 1); g.sp(ox + 13, sitY + 3, 2, 2, '#ffffff', 1); g.sp(ox + 12, sitY + 6, 1, 3, '#6a4424'); }
      else { o.lean = 1; o.blink = f % 9 === 0; }
      break;
    case 'browse': Object.assign(o, { al: -4, nod: 1, smile: Math.floor(f / 6) % 3 === 0 }); break;
    case 'render': Object.assign(o, { ar: fast ? -5 : -1, shout: Math.floor(f / 6) % 4 === 0 }); break;
    case 'phone': Object.assign(o, { ar: -7, smile: true }); g.sp(ox + 11, sitY + 1, 2, 7, '#1a1a24'); break;
    case 'confused': {
      o.headScratch = true;
      const cy = sitY - 9;
      g.sp(ox + 3, cy, 9, 3, '#4a4458'); g.sp(ox + 4, cy - 1, 6, 1, '#4a4458');
      if (fast) { g.sp(ox + 5, cy + 4, 1, 1, '#7aa0ff', 1); g.sp(ox + 9, cy + 5, 1, 1, '#7aa0ff', 1); }
      break;
    }
    case 'sleep':
      Object.assign(o, { sleep: true, nod: 2 }); y += 4;
      { const z = f % 12; g.sp(ox + 13 + z / 3, sitY - 2 - z, 2, 1, '#ffffff', 1); if (z > 4) g.sp(ox + 16 + z / 3, sitY - 6 - z, 3, 1, '#ffffff', 1); }
      break;
    case 'rest': return restPose(g, role, ox, sitY, f);
  }
  guy(g, role, ox, y, f, o);
}

function restPose(g, role, ox, sitY, f) {
  const sp = g.sp;
  if (role === 'manager') {
    const up = Math.floor(f / 6) % 2;
    guy(g, role, ox, sitY + 1, f, { sit: true, lean: -1, ar: up ? -5 : 0, smile: true });
    sp(ox + 12, sitY + (up ? 4 : 9), 3, 3, '#f4f0e8'); if (up && f % 2) sp(ox + 13, sitY + 1, 1, 2, '#c8c4d8');
  } else if (role === 'prompt') {
    guy(g, role, ox, sitY + 4, f, { sit: true, sleep: true, nod: 2 });
    const z = f % 12; sp(ox + 13 + z / 3, sitY - 2 - z, 2, 1, '#ffffff', 1); if (z > 4) sp(ox + 16 + z / 3, sitY - 6 - z, 3, 1, '#ffffff', 1);
  } else if (role === 'researcher') {
    guy(g, role, ox, sitY, f, { sit: true, al: -3, ar: -3, smile: true, nod: 1 });
    sp(ox + 5, sitY + 9, 5, 3, '#1a1a24'); sp(ox + 6, sitY + 9, 3, 2, ['#e04a8a', '#f07a3a', '#7a4ad8'][Math.floor(f / 3) % 3], 1);
  } else if (role === 'coder') {
    guy(g, role, ox, sitY, f, { sit: true, al: -3, ar: -3, nod: f % 2, smile: true });
    sp(ox + 4, sitY + 10, 7, 4, '#8a8a9a'); sp(ox + 5, sitY + 10, 3, 2, '#9af07a', 1); sp(ox + 9, sitY + 11, 1, 1, '#e04848');
    const nx = f % 2 ? ox - 5 : ox + 17, ny = sitY - (f % 2 ? 4 : 6);
    sp(nx, ny, 1, 3, '#ffffff', 1); sp(nx + 1, ny, 2, 1, '#ffffff', 1);
  } else if (role === 'styler') {
    guy(g, role, ox, sitY - (f % 2), f, { sit: true, up: true, smile: true, blink: true });
  }
}

export function createScene(canvas) {
  const ctx = canvas.getContext('2d');
  const g = createGfx(ctx);

  // chars: { [role]: {action, since, data} }, now in ms. Returns { [role]: [x, y] | null } in logical px.
  function render(chars, f, now, { dim = 1 } = {}) {
    const lights = [];
    const anchors = {};
    const front = [];
    g.clearLayer();
    sky(g, f); roof(g, f); room(g, F2); room(g, F1); decor(g, f); ladder(g);

    for (const role of ORDER) {
      const st = chars[role] ?? { action: 'absent', since: 0, data: null };
      const { sx } = STATIONS[role], fl = floorOf(role), Fy = fl.floor, T = Fy - 16, sitY = T - 14, ox = sx - 7;
      lamp(g, sx, fl.top, dim > 0.5);
      lights.push({ x: sx, y: fl.top + 14, r: 46, s: 0.9, c: [255, 176, 96] });
      anchors[role] = null;
      if (SEATED.has(st.action)) {
        chair(g, sx, Fy);
        seatedPose(g, role, ox, sitY, f, st.action);
        anchors[role] = [sx, sitY - 3];
      } else {
        chair(g, sx, Fy, st.action === 'absent' || st.action === 'walk' || st.action === 'enter' || st.action === 'leave');
        if (st.action !== 'absent') front.push({ role, st, sx, Fy });
      }
      desk(g, sx, Fy);
      deskProps(g, role, sx, T, f, st.action, lights);
      phone(g, sx, T, st.action === 'phone');
    }

    for (const { role, st, sx, Fy } of front) {
      const age = now - st.since;
      if (st.action === 'alert') {
        const b = f % 2, ox = sx - 7, y = Fy - 14 - b;
        guy(g, role, ox, y, f, { raise: true, shout: true });
        g.sp(ox + 12, y - 12, 3, 6, '#ffd84a', 1); g.sp(ox + 12, y - 5, 3, 2, '#ffd84a', 1);
        lights.push({ x: ox + 7, y: Fy - 22, r: 16, s: 0.7, c: [255, 216, 74] });
        anchors[role] = [ox + 7, y - 14];
      } else if (st.action === 'walk' && st.data?.to) {
        const p = Math.min(1, Math.max(0, age / st.data.ms));
        const path = walkPath(role, st.data.to);
        const out = p < 0.5;
        const q = pointAt(path, out ? p * 2 : 2 - p * 2);
        const dir = out ? q.dir : -q.dir;
        guy(g, role, q.x - 7, q.y - 21 - (f % 2 && !q.climb ? 1 : 0), f, { walk: !q.climb, climb: q.climb, smile: true });
        if (out) envelope(g, dir > 0 ? q.x + 6 : q.x - 12, q.y - 10, /^\[(BLOCKED|FAIL)/.test(st.data.head ?? ''));
        anchors[role] = [q.x, q.y - 24];
      } else if (st.action === 'enter' || st.action === 'leave') {
        const p = Math.min(1, age / (st.action === 'enter' ? ENTER_MS : LEAVE_MS));
        const k = st.action === 'enter' ? p : 1 - p;
        const x = STAIR_X + (sx - STAIR_X) * k, y = FEET[STATIONS[role].floor];
        guy(g, role, x - 7, y - 21 - (f % 2), f, { walk: true });
        anchors[role] = [x, y - 24];
      }
    }

    g.flushLayer();
    applyLight(g, lights, dim);
    g.present();
    return anchors;
  }

  return { render };
}
