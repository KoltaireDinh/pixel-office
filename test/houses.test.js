import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry } from '../src/main/houses.js';

const ev = (kind, extra = {}) => ({ squad: 'sq-1', role: 'manager', kind, cat: null, to: null, head: null, session: null, ts: 0, ...extra });
const start = (extra = {}) => ev('squad_start', { managerName: 'mgr', replace: true, ...extra });

test('squad_start creates house with manager present', () => {
  const r = createRegistry();
  assert.equal(r.apply(start(), 0), true);
  const [h] = r.list(0);
  assert.equal(h.id, 'sq-1');
  assert.equal(h.managerName, 'mgr');
  assert.equal(h.members.manager.present, true);
  assert.equal(h.members.coder.present, false);
  assert.equal(h.endedAt, null);
});

test('session_start marks member present, session_end absent', () => {
  const r = createRegistry();
  r.apply(start(), 0);
  r.apply(ev('session_start', { role: 'coder', session: 'c1' }), 1);
  assert.deepEqual(r.list(1)[0].members.coder, { present: true, session: 'c1' });
  r.apply(ev('session_end', { role: 'coder', session: 'c1' }), 2);
  assert.equal(r.list(2)[0].members.coder.present, false);
});

test('manager_join sets members.manager.session', () => {
  const r = createRegistry();
  r.apply(start(), 0);
  r.apply(ev('manager_join', { session: 'M' }), 1);
  assert.equal(r.list(1)[0].members.manager.session, 'M');
});

test('event for unknown squad is ignored', () => {
  const r = createRegistry();
  assert.equal(r.apply(ev('stop', { squad: 'nope' }), 0), false);
  assert.equal(r.list(0).length, 0);
});

test('tool events for a known squad mark the member present', () => {
  const r = createRegistry();
  r.apply(start(), 0);
  r.apply(ev('tool', { role: 'styler', cat: 'edit', session: 's' }), 1);
  assert.equal(r.list(1)[0].members.styler.present, true);
});

test('-Only relaunch: squad_start same id without replace keeps house', () => {
  const r = createRegistry();
  r.apply(start(), 0);
  r.apply(ev('session_start', { role: 'coder', session: 'c1' }), 1);
  r.apply(start({ replace: false }), 2);
  const list = r.list(2);
  assert.equal(list.length, 1);
  assert.equal(list[0].members.coder.present, true);
});

test('full relaunch: replace=true with new id ends older house of same managerName', () => {
  const r = createRegistry();
  r.apply(start(), 0);
  r.apply(start({ squad: 'sq-2' }), 10);
  const list = r.list(10);
  assert.deepEqual(list.map((h) => h.id), ['sq-2', 'sq-1']);
  assert.equal(list[1].endedAt, 10);
  assert.equal(list[0].endedAt, null);
});

test('house ends when all 4 children ended', () => {
  const r = createRegistry();
  r.apply(start(), 0);
  for (const role of ['researcher', 'prompt', 'coder', 'styler']) r.apply(ev('session_start', { role, session: role }), 1);
  for (const role of ['researcher', 'prompt', 'coder']) r.apply(ev('session_end', { role, session: role }), 2);
  assert.equal(r.list(2)[0].endedAt, null);
  r.apply(ev('session_end', { role: 'styler', session: 'styler' }), 3);
  assert.equal(r.list(3)[0].endedAt, 3);
});

test('house ends when manager session_end', () => {
  const r = createRegistry();
  r.apply(start(), 0);
  r.apply(ev('session_end'), 5);
  assert.equal(r.list(5)[0].endedAt, 5);
});

test('ended house disappears after 600000 ms', () => {
  const r = createRegistry();
  r.apply(start(), 0);
  r.apply(ev('session_end'), 5);
  assert.equal(r.list(600004).length, 1);
  assert.equal(r.list(600005).length, 0);
});
