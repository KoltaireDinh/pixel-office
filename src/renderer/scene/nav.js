// Floor plan of the top-down house: rooms, doors, named spots, and walking routes between them.
// All points are foot positions in the 400x300 scene.

export const SCENE_W = 400, SCENE_H = 300;
export const WALK_SPEED = 24; // px per second

// Walkable floor of each room, and the vertical "lane" people use to cross it without walking through furniture.
export const ROOMS = {
  office: { x0: 6, x1: 122, y0: 28, y1: 144, lane: 110 },
  work: { x0: 134, x1: 394, y0: 28, y1: 144, lane: 220 },
  lounge: { x0: 6, x1: 194, y0: 180, y1: 294, lane: 136 },
  kitchen: { x0: 206, x1: 284, y0: 196, y1: 294, lane: 212 },
  garden: { x0: 296, x1: 394, y0: 184, y1: 294, lane: 300 },
};

// pa is inside room a, pb inside room b; walking pa<->pb passes through the doorway.
export const DOORS = [
  { a: 'office', b: 'work', pa: { x: 122, y: 80 }, pb: { x: 134, y: 80 } },
  { a: 'office', b: 'lounge', pa: { x: 80, y: 144 }, pb: { x: 80, y: 186 } },
  { a: 'work', b: 'kitchen', pa: { x: 256, y: 144 }, pb: { x: 256, y: 200 } },
  { a: 'lounge', b: 'kitchen', pa: { x: 194, y: 230 }, pb: { x: 206, y: 230 } },
  { a: 'kitchen', b: 'garden', pa: { x: 284, y: 230 }, pb: { x: 296, y: 230 } },
];

export const SPOTS = {
  'seat:manager': { x: 63, y: 64 }, 'stand:manager': { x: 96, y: 84 }, 'rest:manager': { x: 232, y: 238 }, 'sleep:manager': { x: 46, y: 206 },
  'seat:researcher': { x: 170, y: 60 }, 'stand:researcher': { x: 198, y: 72 }, 'rest:researcher': { x: 220, y: 200 }, 'sleep:researcher': { x: 104, y: 206 },
  'seat:coder': { x: 270, y: 60 }, 'stand:coder': { x: 298, y: 72 }, 'rest:coder': { x: 161, y: 224 }, 'sleep:coder': { x: 160, y: 262 },
  'seat:prompt': { x: 170, y: 110 }, 'stand:prompt': { x: 198, y: 122 }, 'rest:prompt': { x: 60, y: 206 }, 'sleep:prompt': { x: 75, y: 206 },
  'seat:styler': { x: 270, y: 110 }, 'stand:styler': { x: 298, y: 134 }, 'rest:styler': { x: 350, y: 214 }, 'sleep:styler': { x: 366, y: 214 },
  'easel:styler': { x: 336, y: 126 },
  gate: { x: 394, y: 250 },
};

const SEATED = new Set(['work', 'type_fast', 'read', 'browse', 'render', 'phone', 'confused']);
const EASEL = new Set(['work', 'type_fast', 'render']);

export function roomOf(p) {
  for (const [name, r] of Object.entries(ROOMS)) if (p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1) return name;
  return null;
}

function nearestRoom(p) {
  let best = 'work', bd = Infinity;
  for (const [name, r] of Object.entries(ROOMS)) {
    const dx = Math.max(r.x0 - p.x, 0, p.x - r.x1), dy = Math.max(r.y0 - p.y, 0, p.y - r.y1), d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = name; }
  }
  return best;
}

function route(fromRoom, toRoom) {
  const prev = { [fromRoom]: null }, queue = [fromRoom];
  while (queue.length) {
    const r = queue.shift();
    if (r === toRoom) break;
    for (const d of DOORS) {
      const next = d.a === r ? d.b : d.b === r ? d.a : null;
      if (next && !(next in prev)) { prev[next] = { room: r, door: d }; queue.push(next); }
    }
  }
  const steps = [];
  for (let r = toRoom; prev[r]; r = prev[r].room) steps.unshift({ door: prev[r].door, from: prev[r].room });
  return steps;
}

// Inside one room: go to the lane, along it, then across to the exit.
function crossRoom(room, a, b) {
  const lx = ROOMS[room].lane;
  if (a.x === b.x || a.y === b.y) return [b];
  return [{ x: lx, y: a.y }, { x: lx, y: b.y }, b];
}

export function walkPath(from, toSpot) {
  const target = SPOTS[toSpot];
  const start = { x: Math.round(from.x), y: Math.round(from.y) };
  let room = roomOf(start) ?? nearestRoom(start);
  const pts = [start];
  let cur = start;
  for (const { door, from: r } of route(room, roomOf(target))) {
    const near = door.a === r ? door.pa : door.pb, far = door.a === r ? door.pb : door.pa;
    pts.push(...crossRoom(room, cur, near), far);
    cur = far; room = door.a === r ? door.b : door.a;
  }
  pts.push(...crossRoom(room, cur, target));
  return pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
}

export function pathLength(path) {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.abs(path[i].x - path[i - 1].x) + Math.abs(path[i].y - path[i - 1].y);
  return len;
}

export function spotFor(role, action, data) {
  if (action === 'walk') return data?.to ? `stand:${data.to}` : `seat:${role}`;
  if (action === 'alert') return `stand:${role}`;
  if (action === 'rest') return `rest:${role}`;
  if (action === 'sleep') return `sleep:${role}`;
  if (action === 'leave' || action === 'absent') return 'gate';
  if (role === 'styler' && EASEL.has(action)) return 'easel:styler';
  if (SEATED.has(action) || action === 'enter') return `seat:${role}`;
  return `seat:${role}`;
}

export const HANDOFF_MS = 600;

// Time for a delivery: desk -> recipient -> back, plus a short handoff pause.
export function walkMs(role, to) {
  return Math.round((pathLength(walkPath(SPOTS[`seat:${role}`], `stand:${to}`)) * 2 / WALK_SPEED) * 1000) + HANDOFF_MS;
}
