import test from 'node:test';
import assert from 'node:assert/strict';
import { fitScene } from '../src/renderer/layout.js';

test('integer device-pixel scale at 100%', () => {
  assert.deepEqual(fitScene(800, 600, 1), { scale: 2, cssW: 800, cssH: 600, left: 0, top: 0 });
  assert.deepEqual(fitScene(1013, 700, 1), { scale: 2, cssW: 800, cssH: 600, left: 106, top: 50 });
});

test('integer device-pixel scale at 125% Windows scaling', () => {
  const r = fitScene(800, 600, 1.25);   // 1000x750 device px -> scale 2 (800x600 device px)
  assert.equal(r.scale, 2);
  assert.equal(r.cssW, 640);
  assert.equal(r.cssH, 480);
  assert.equal(Number.isInteger(r.left * 1.25), true);
  assert.equal(Number.isInteger(r.top * 1.25), true);
});

test('never below 1', () => {
  assert.equal(fitScene(100, 100, 1).scale, 1);
});
