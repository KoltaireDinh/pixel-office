import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrain } from '../src/renderer/brain.js';

const mk = (walk = 3000, initial = 'rest') => createBrain('coder', { walkMs: () => walk, initial });
const tool = (cat) => ({ kind: 'tool', cat });

test('starts absent', () => {
  assert.equal(createBrain('coder').tick(0).action, 'absent');
});

test('tool events map to actions', () => {
  const b = mk();
  const cases = { edit: 'work', bash: 'type_fast', render: 'render', read: 'read', browse: 'browse', agent: 'phone', other: 'work' };
  let t = 0;
  for (const [cat, action] of Object.entries(cases)) { b.handle(tool(cat), t); assert.equal(b.tick(t).action, action, cat); t += 10; }
  b.handle({ kind: 'prompt' }, t);
  assert.equal(b.tick(t).action, 'work');
});

test('tool action falls back to work after 5000ms', () => {
  const b = mk();
  b.handle(tool('render'), 0);
  assert.equal(b.tick(4999).action, 'render');
  assert.equal(b.tick(5000).action, 'work');
});

test('rest becomes sleep after 180000ms', () => {
  const b = mk();
  b.handle({ kind: 'stop' }, 0);
  assert.equal(b.tick(179999).action, 'rest');
  assert.equal(b.tick(180000).action, 'sleep');
});

test('walk carries recipient and head', () => {
  const b = mk();
  b.handle({ kind: 'send', to: 'manager', head: '[DONE] x' }, 0);
  assert.deepEqual(b.tick(10), { action: 'walk', since: 0, data: { to: 'manager', head: '[DONE] x', ms: 3000 } });
});

test('walk is not interrupted; latest queued event applies after', () => {
  const b = mk();
  b.handle({ kind: 'send', to: 'manager' }, 0);
  for (let i = 0; i < 10; i++) b.handle(tool(i % 2 ? 'read' : 'edit'), 100 + i * 50);
  b.handle({ kind: 'stop' }, 900);
  assert.equal(b.tick(2999).action, 'walk');
  assert.equal(b.tick(3000).action, 'rest');
});

test('walk without queued event returns to work', () => {
  const b = mk();
  b.handle({ kind: 'send', to: 'manager' }, 0);
  assert.equal(b.tick(3000).action, 'work');
});

test('send without a known recipient does not walk', () => {
  const b = mk();
  b.handle({ kind: 'send', to: null }, 0);
  assert.equal(b.tick(0).action, 'work');
});

test('wait shows alert until next event', () => {
  const b = mk();
  b.handle({ kind: 'wait' }, 0);
  assert.equal(b.tick(600000).action, 'alert');
  b.handle(tool('edit'), 600001);
  assert.equal(b.tick(600001).action, 'work');
});

test('fail -> confused 3000ms then previous action', () => {
  const b = mk();
  b.handle(tool('read'), 0);
  b.handle({ kind: 'fail' }, 1000);
  assert.equal(b.tick(3999).action, 'confused');
  assert.equal(b.tick(4000).action, 'read');
});

test('session lifecycle: enter -> rest, leave -> absent', () => {
  const b = mk(3000, 'absent');
  b.handle({ kind: 'session_start' }, 0);
  assert.equal(b.tick(1499).action, 'enter');
  assert.equal(b.tick(1500).action, 'rest');
  b.handle({ kind: 'session_end' }, 2000);
  assert.equal(b.tick(3999).action, 'leave');
  assert.equal(b.tick(4000).action, 'absent');
});

test('first activity of an absent character walks in first', () => {
  const b = mk(3000, 'absent');
  b.handle(tool('edit'), 0);
  assert.equal(b.tick(0).action, 'enter');
  assert.equal(b.tick(1500).action, 'work');
});

test('unknown kind is ignored', () => {
  const b = mk();
  b.handle({ kind: 'stop' }, 0);
  b.handle({ kind: 'bogus' }, 5);
  b.handle(null, 6);
  assert.equal(b.tick(10).action, 'rest');
});
