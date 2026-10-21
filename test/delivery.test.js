import test from 'node:test';
import assert from 'node:assert/strict';
import { createDelivery, HANDOFF_MS } from '../src/renderer/scene/delivery.js';

test('goes to the recipient, waits HANDOFF_MS, then returns; done only when back', () => {
  const d = createDelivery('coder', 'manager');
  assert.equal(d.target({ arrived: false }, 0), 'stand:manager');
  assert.equal(d.target({ arrived: true }, 1000), 'stand:manager');
  assert.equal(d.handingOver(1000 + HANDOFF_MS - 1), true);
  assert.equal(d.target({ arrived: true }, 1000 + HANDOFF_MS - 1), 'stand:manager');
  assert.equal(d.target({ arrived: true }, 1000 + HANDOFF_MS), 'seat:coder');
  assert.equal(d.done, false);
  assert.equal(d.target({ arrived: false }, 1000 + HANDOFF_MS + 10), 'seat:coder');
  d.target({ arrived: true }, 9000);
  assert.equal(d.done, true);
  assert.equal(d.carrying, false);
});

test('carrying is true only before the handoff', () => {
  const d = createDelivery('coder', 'manager');
  assert.equal(d.carrying, true);
  d.target({ arrived: true }, 100);
  assert.equal(d.carrying, false);
});
