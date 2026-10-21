import test from 'node:test';
import assert from 'node:assert/strict';
import { SPOTS, ROOMS, DOORS, walkPath, spotFor, walkMs, roomOf } from '../src/renderer/scene/nav.js';
import { ROLES } from '../src/shared/protocol.js';

const inRect = (p, r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;
const same = (a, b) => a.x === b.x && a.y === b.y;
const isDoorStep = (a, b) => DOORS.some((d) => (same(a, d.pa) && same(b, d.pb)) || (same(a, d.pb) && same(b, d.pa)));

function assertWalkable(path) {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const ok = Object.values(ROOMS).some((r) => inRect(a, r) && inRect(b, r)) || isDoorStep(a, b);
    assert.ok(ok, `segment ${JSON.stringify(a)} -> ${JSON.stringify(b)} crosses a wall`);
    assert.ok(a.x === b.x || a.y === b.y, 'segments are axis-aligned');
  }
}

test('every spot lies inside a room', () => {
  for (const [name, p] of Object.entries(SPOTS)) assert.ok(roomOf(p), name);
});

test('every role has seat, stand, rest and sleep spots', () => {
  for (const r of ROLES) for (const k of ['seat', 'stand', 'rest', 'sleep']) assert.ok(SPOTS[`${k}:${r}`], `${k}:${r}`);
});

test('paths between all spots start and end correctly and never cross walls', () => {
  const names = Object.keys(SPOTS);
  for (const a of names) for (const b of names) {
    const p = walkPath(SPOTS[a], b);
    assert.deepEqual(p[0], SPOTS[a], `${a}->${b} start`);
    assert.deepEqual(p.at(-1), SPOTS[b], `${a}->${b} end`);
    assertWalkable(p);
  }
});

test('path from a point mid-room works', () => {
  const p = walkPath({ x: 300, y: 100 }, 'rest:prompt');
  assert.deepEqual(p[0], { x: 300, y: 100 });
  assertWalkable(p);
});

test('spotFor maps actions to places', () => {
  assert.equal(spotFor('coder', 'work'), 'seat:coder');
  assert.equal(spotFor('coder', 'render'), 'seat:coder');
  assert.equal(spotFor('styler', 'work'), 'easel:styler');
  assert.equal(spotFor('styler', 'read'), 'seat:styler');
  assert.equal(spotFor('coder', 'alert'), 'stand:coder');
  assert.equal(spotFor('coder', 'rest'), 'rest:coder');
  assert.equal(spotFor('coder', 'sleep'), 'sleep:coder');
  assert.equal(spotFor('manager', 'walk', { to: 'coder' }), 'stand:coder');
  assert.equal(spotFor('coder', 'leave'), 'gate');
  assert.equal(spotFor('coder', 'absent'), 'gate');
  assert.equal(spotFor('coder', 'enter'), 'seat:coder');
});

test('walkMs is positive and longer for farther recipients', () => {
  assert.ok(walkMs('researcher', 'coder') > 0);
  assert.ok(walkMs('manager', 'styler') > walkMs('researcher', 'coder'));
});

test('path from inside a doorway goes through the door, not the wall', () => {
  for (const start of [{ x: 256, y: 170 }, { x: 80, y: 160 }, { x: 128, y: 80 }, { x: 200, y: 230 }]) {
    for (const spot of ['seat:manager', 'rest:researcher', 'rest:styler', 'sleep:coder']) {
      const p = walkPath(start, spot);
      const first = p[1];
      assert.ok(DOORS.some((d) => same(first, d.pa) || same(first, d.pb)), `${JSON.stringify(start)} -> ${spot} first step ${JSON.stringify(first)}`);
      assert.ok(first.x === start.x || first.y === start.y, 'first step axis-aligned');
      assertWalkable(p.slice(1));
    }
  }
});
