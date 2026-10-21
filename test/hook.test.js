import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeSquad, readSquads } from '../hook/squads.js';

const HOOK = path.resolve('hook/hook.js');

function freshDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'po-squads-')); }

function runHook(input, env) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const p = spawn(process.execPath, [HOOK], { env: { ...process.env, PIXEL_OFFICE_SQUAD: '', PIXEL_OFFICE_ROLE: '', ...env } });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.on('close', (status) => resolve({ status, out, ms: Date.now() - t0 }));
    p.stdin.end(typeof input === 'string' ? input : JSON.stringify(input));
  });
}

function fakeServer() {
  return new Promise((resolve) => {
    const got = [];
    const srv = http.createServer((req, res) => {
      let b = ''; req.on('data', (d) => { b += d; });
      req.on('end', () => { got.push(JSON.parse(b)); res.end('ok'); });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ got, port: srv.address().port, close: () => srv.close() }));
  });
}

test('hook exits 0 fast with no output when the app is down', async () => {
  const dir = freshDir();
  writeSquad(dir, { squad: 'sq-1', managerName: 'mgr', managerSession: null, createdAt: Date.now() });
  const r = await runHook({ hook_event_name: 'Stop', session_id: 's' },
    { PIXEL_OFFICE_SQUAD: 'sq-1', PIXEL_OFFICE_ROLE: 'coder', PIXEL_OFFICE_SQUADS_DIR: dir, PIXEL_OFFICE_PORT: '1' });
  assert.equal(r.status, 0);
  assert.equal(r.out, '');
  assert.ok(r.ms < 1000, `took ${r.ms}ms`);
});

test('hook exits 0 on garbage stdin', async () => {
  const r = await runHook('{not json', { PIXEL_OFFICE_SQUADS_DIR: freshDir(), PIXEL_OFFICE_PORT: '1' });
  assert.equal(r.status, 0);
});

test('child session event is posted condensed', async () => {
  const srv = await fakeServer();
  const dir = freshDir();
  writeSquad(dir, { squad: 'sq-1', managerName: 'mgr', managerSession: null, createdAt: Date.now() });
  await runHook({ hook_event_name: 'Stop', session_id: 's' },
    { PIXEL_OFFICE_SQUAD: 'sq-1', PIXEL_OFFICE_ROLE: 'coder', PIXEL_OFFICE_SQUADS_DIR: dir, PIXEL_OFFICE_PORT: String(srv.port) });
  srv.close();
  assert.equal(srv.got.length, 1);
  assert.equal(srv.got[0].kind, 'stop');
  assert.equal(srv.got[0].role, 'coder');
  assert.equal(srv.got[0].squad, 'sq-1');
});

test('manager joins via launch.ps1 then is recognised', async () => {
  const srv = await fakeServer();
  const dir = freshDir();
  writeSquad(dir, { squad: 'sq-9', managerName: 'mgr', managerSession: null, createdAt: Date.now() });
  const env = { PIXEL_OFFICE_SQUADS_DIR: dir, PIXEL_OFFICE_PORT: String(srv.port) };
  await runHook({ hook_event_name: 'PostToolUse', session_id: 'M', tool_name: 'PowerShell',
    tool_input: { command: 'powershell -File "C:\\Users\\PC\\.claude\\skills\\reels-squad\\scripts\\launch.ps1" -Manager mgr' } }, env);
  await runHook({ hook_event_name: 'Stop', session_id: 'M' }, env);
  srv.close();
  assert.deepEqual(srv.got.map((e) => [e.kind, e.role, e.squad]), [['manager_join', 'manager', 'sq-9'], ['stop', 'manager', 'sq-9']]);
  assert.equal(readSquads(dir)[0].managerSession, 'M');
});

test('unknown session is ignored', async () => {
  const srv = await fakeServer();
  await runHook({ hook_event_name: 'Stop', session_id: 'X' }, { PIXEL_OFFICE_SQUADS_DIR: freshDir(), PIXEL_OFFICE_PORT: String(srv.port) });
  srv.close();
  assert.equal(srv.got.length, 0);
});
