// A character's body in the house: walks along floor-plan paths toward a named spot at a steady speed.
import { SPOTS, walkPath, WALK_SPEED } from './nav.js';

export function createMover(startSpot) {
  let pos = { ...SPOTS[startSpot] };
  let target = startSpot, path = [], dir = 1;

  function setTarget(spot) {
    if (spot === target || !SPOTS[spot]) return;
    target = spot;
    path = walkPath(pos, spot).slice(1);
  }

  function teleport(spot) {
    if (!SPOTS[spot]) return;
    target = spot; pos = { ...SPOTS[spot] }; path = [];
  }

  function step(dtMs) {
    let budget = (WALK_SPEED * dtMs) / 1000;
    while (budget > 0 && path.length) {
      const next = path[0];
      const dx = next.x - pos.x, dy = next.y - pos.y, d = Math.abs(dx) + Math.abs(dy);
      if (dx) dir = Math.sign(dx);
      if (d <= budget) { pos = { x: next.x, y: next.y }; path.shift(); budget -= d; }
      else { pos = { x: pos.x + Math.sign(dx) * Math.min(Math.abs(dx), budget), y: pos.y + (dx ? 0 : Math.sign(dy) * budget) }; budget = 0; }
    }
    return { x: pos.x, y: pos.y, moving: path.length > 0, dir, arrived: path.length === 0 };
  }

  return { setTarget, teleport, step, get target() { return target; } };
}
