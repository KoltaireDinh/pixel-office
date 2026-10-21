// Where everyone sits and how they walk between desks (via the ladder on the right wall).

export const F2 = { top: 56, floor: 124 };
export const F1 = { top: 140, floor: 208 };
export const FEET = { 2: F2.floor + 4, 1: F1.floor + 4 };
export const STAIR_X = 121;
export const WALK_SPEED = 24; // px per second

export const STATIONS = {
  manager: { floor: 2, sx: 30 },
  prompt: { floor: 2, sx: 94 },
  researcher: { floor: 1, sx: 20 },
  coder: { floor: 1, sx: 60 },
  styler: { floor: 1, sx: 100 },
};

export function floorOf(role) { return STATIONS[role].floor === 2 ? F2 : F1; }

// Points are foot positions. Same floor: straight line. Different floors: to the ladder, climb, then across.
export function walkPath(from, to) {
  const a = STATIONS[from], b = STATIONS[to];
  const ya = FEET[a.floor], yb = FEET[b.floor];
  if (a.floor === b.floor) return [{ x: a.sx, y: ya }, { x: b.sx, y: yb }];
  return [{ x: a.sx, y: ya }, { x: STAIR_X, y: ya }, { x: STAIR_X, y: yb }, { x: b.sx, y: yb }];
}

export function pathLength(path) {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  return len;
}

export function pointAt(path, p) {
  const total = pathLength(path);
  let d = Math.min(1, Math.max(0, p)) * total;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= seg || i === path.length - 1) {
      const k = seg ? Math.min(1, d / seg) : 1;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dir: Math.sign(b.x - a.x) || 1, climb: a.x === b.x && a.y !== b.y };
    }
    d -= seg;
  }
  const last = path.at(-1);
  return { x: last.x, y: last.y, dir: 1, climb: false };
}

// There and back again.
export function walkMs(from, to) {
  return Math.round((pathLength(walkPath(from, to)) * 2 / WALK_SPEED) * 1000);
}
