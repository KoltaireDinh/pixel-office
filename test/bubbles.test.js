import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pickLine, createBubbleScheduler, resolveOverlap, ACTIONS } from '../src/renderer/bubbles.js';
import { ROLES } from '../src/shared/protocol.js';

const LINES = JSON.parse(fs.readFileSync(new URL('../src/renderer/lines.json', import.meta.url), 'utf8'));
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

test('lines.json: every role x action has >=4 lines of <=24 chars', () => {
  for (const role of ROLES) for (const action of ACTIONS) {
    const arr = LINES[role]?.[action];
    assert.ok(Array.isArray(arr) && arr.length >= 4, `${role}.${action}`);
    for (const l of arr) assert.ok(l.replace('{to}', 'Hồng').replace('{task}', 'C1').length <= 24, `${role}.${action}: ${l}`);
  }
});

test('pickLine never repeats last', () => {
  const lines = { coder: { work: ['a', 'b'] } };
  for (let i = 0; i < 20; i++) assert.equal(pickLine(lines, 'coder', 'work', {}, 'a', Math.random).text, 'b');
});

test('pickLine kinds: rest->think, alert->alert, work->say, "..."->think', () => {
  const lines = { coder: { rest: ['x'], alert: ['y'], work: ['z'], read: ['r'] }, prompt: { work: ['hmm...'] } };
  assert.equal(pickLine(lines, 'coder', 'rest', {}, null, Math.random).kind, 'think');
  assert.equal(pickLine(lines, 'coder', 'alert', {}, null, Math.random).kind, 'alert');
  assert.equal(pickLine(lines, 'coder', 'work', {}, null, Math.random).kind, 'say');
  assert.equal(pickLine(lines, 'coder', 'read', {}, null, Math.random).kind, 'think');
  assert.equal(pickLine(lines, 'prompt', 'work', {}, null, Math.random).kind, 'think');
});

test('walk line fills {to}; skips {task} lines when no task', () => {
  const lines = { coder: { walk: ['TASK {task} đây!', 'Thư cho {to}!'] } };
  for (let i = 0; i < 10; i++) assert.equal(pickLine(lines, 'coder', 'walk', { to: 'Sếp Bơ' }, null, Math.random).text, 'Thư cho Sếp Bơ!');
  assert.equal(pickLine(lines, 'coder', 'walk', { to: 'Mây', task: 'C1' }, null, seq(0)).text, 'TASK C1 đây!');
});

test('pickLine returns null for unknown role/action', () => {
  assert.equal(pickLine(LINES, 'coder', 'nope', {}, null, Math.random), null);
});

test('scheduler: at most 2 non-alert bubbles, alert chars always have one', () => {
  const s = createBubbleScheduler({ lines: LINES, rand: Math.random });
  const chars = { manager: { action: 'alert' }, prompt: { action: 'alert' }, researcher: { action: 'work' }, coder: { action: 'work' }, styler: { action: 'rest' } };
  for (let t = 0; t < 60000; t += 100) {
    const b = s.tick(t, chars);
    assert.ok(b.filter((x) => x.kind !== 'alert').length <= 2, `t=${t}`);
    assert.ok(b.some((x) => x.role === 'manager' && x.kind === 'alert'), `t=${t}`);
    assert.ok(b.some((x) => x.role === 'prompt' && x.kind === 'alert'), `t=${t}`);
  }
});

test('scheduler: absent chars never speak and bubbles expire', () => {
  const s = createBubbleScheduler({ lines: LINES, rand: Math.random });
  const chars = { manager: { action: 'absent' }, prompt: { action: 'work' } };
  let saw = false;
  for (let t = 0; t < 30000; t += 100) {
    const b = s.tick(t, chars);
    assert.ok(!b.some((x) => x.role === 'manager'));
    for (const x of b) assert.ok(x.until > t);
    if (b.length) saw = true;
  }
  assert.ok(saw);
});

test('resolveOverlap: no two rects intersect, all inside bounds', () => {
  const bounds = { left: 0, top: 0, right: 256, bottom: 448 };
  const rects = [{ x: 40, y: 200, w: 90, h: 20 }, { x: 60, y: 205, w: 100, h: 20 }, { x: 200, y: 210, w: 90, h: 20 }];
  const out = resolveOverlap(rects, bounds);
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.w <= 256 && a.y + a.h <= 448, `rect ${i} out of bounds`);
    for (let j = 0; j < i; j++) {
      const b = out[j];
      assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${i} overlaps ${j}`);
    }
  }
});
