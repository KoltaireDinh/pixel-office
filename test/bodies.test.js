import test from 'node:test';
import assert from 'node:assert/strict';
import { createBodies } from '../src/renderer/scene/bodies.js';
import { SPOTS } from '../src/renderer/scene/nav.js';

test('bodies are kept per house; a new house starts everyone at their own spot', () => {
  const b = createBodies();
  const a = b.get('A', 'coder', 'seat:coder');
  a.setTarget('rest:coder'); a.step(5000);
  const inB = b.get('B', 'coder', 'gate');
  assert.deepEqual({ x: inB.step(0).x, y: inB.step(0).y }, SPOTS.gate);
  assert.equal(b.get('A', 'coder', 'seat:coder'), a);
});

test('old houses are forgotten after a limit', () => {
  const b = createBodies(2);
  const first = b.get('A', 'coder', 'seat:coder');
  b.get('B', 'coder', 'seat:coder'); b.get('C', 'coder', 'seat:coder');
  assert.notEqual(b.get('A', 'coder', 'seat:coder'), first);
});
