import test from 'node:test';
import assert from 'node:assert/strict';
import { createMover } from '../src/renderer/scene/mover.js';
import { SPOTS, walkPath, pathLength, WALK_SPEED } from '../src/renderer/scene/nav.js';

test('starts at its spot, arrived', () => {
  const m = createMover('seat:coder');
  assert.deepEqual(m.step(16), { ...SPOTS['seat:coder'], moving: false, dir: 1, arrived: true });
});

test('reaches the target in about length / speed', () => {
  const m = createMover('seat:coder');
  m.setTarget('rest:coder');
  const ms = (pathLength(walkPath(SPOTS['seat:coder'], 'rest:coder')) / WALK_SPEED) * 1000;
  let s;
  for (let t = 0; t < ms - 100; t += 50) { s = m.step(50); }
  assert.equal(s.arrived, false);
  assert.equal(s.moving, true);
  for (let t = 0; t < 300; t += 50) s = m.step(50);
  assert.equal(s.arrived, true);
  assert.equal(s.x, SPOTS['rest:coder'].x);
  assert.equal(s.y, SPOTS['rest:coder'].y);
});

test('re-target mid-walk never jumps', () => {
  const m = createMover('seat:coder');
  m.setTarget('rest:styler');
  let prev = m.step(0);
  for (let i = 0; i < 40; i++) {
    if (i === 20) m.setTarget('sleep:prompt');
    const s = m.step(100);
    assert.ok(Math.abs(s.x - prev.x) + Math.abs(s.y - prev.y) <= WALK_SPEED * 0.1 + 1e-6, `step ${i}`);
    prev = s;
  }
});

test('setting the same target again does not restart the walk', () => {
  const m = createMover('seat:coder');
  m.setTarget('rest:coder');
  m.step(1000);
  const a = m.step(0);
  m.setTarget('rest:coder');
  const b = m.step(0);
  assert.deepEqual(a, b);
});

test('teleport places the body at a spot immediately', () => {
  const m = createMover('gate');
  m.teleport('seat:prompt');
  const s = m.step(0);
  assert.equal(s.x, SPOTS['seat:prompt'].x);
  assert.equal(s.arrived, true);
});
