import test from 'node:test';
import assert from 'node:assert/strict';
import { walkPath, pointAt, walkMs, STATIONS, STAIR_X } from '../src/renderer/scene/paths.js';

const pick = (q) => ({ x: Math.round(q.x), y: Math.round(q.y) });

test('every role has a station', () => {
  assert.deepEqual(Object.keys(STATIONS).sort(), ['coder', 'manager', 'prompt', 'researcher', 'styler']);
});

test('same floor path stays on floor y', () => {
  const p = walkPath('researcher', 'styler');
  assert.ok(p.every((q) => q.y === p[0].y));
  assert.equal(p[0].x, STATIONS.researcher.sx);
  assert.equal(p.at(-1).x, STATIONS.styler.sx);
});

test('cross floor path uses stairs', () => {
  const p = walkPath('coder', 'manager');
  assert.ok(p.some((q) => q.x >= STAIR_X));
  assert.ok(p[0].y > p.at(-1).y);
});

test('pointAt endpoints and clamping', () => {
  const p = walkPath('coder', 'manager');
  assert.deepEqual(pick(pointAt(p, 0)), pick(p[0]));
  assert.deepEqual(pick(pointAt(p, 1)), pick(p.at(-1)));
  assert.deepEqual(pick(pointAt(p, 2)), pick(p.at(-1)));
  assert.deepEqual(pick(pointAt(p, -1)), pick(p[0]));
});

test('pointAt reports climbing on the vertical segment', () => {
  const p = walkPath('coder', 'manager');
  const states = Array.from({ length: 101 }, (_, i) => pointAt(p, i / 100).climb);
  assert.ok(states.includes(true));
  assert.ok(states.includes(false));
});

test('walkMs positive and longer across floors', () => {
  assert.ok(walkMs('coder', 'styler') > 0);
  assert.ok(walkMs('coder', 'manager') > walkMs('coder', 'styler'));
});
