import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startServer } from '../src/main/server.js';
import { createRegistry } from '../src/main/houses.js';

function request(port, method, p, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method, headers: { 'content-type': 'application/json' } }, (res) => {
      let b = ''; res.on('data', (d) => { b += d; }); res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

async function withServer(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'po-static-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<h1>hi</h1>');
  const srv = await startServer({ port: 0, staticDir: dir, registry: createRegistry() });
  try { await fn(srv.port); } finally { await srv.close(); }
}

test('server: health, static, traversal, bad json', async () => {
  await withServer(async (port) => {
    assert.equal((await request(port, 'GET', '/health')).body, 'ok');
    assert.match((await request(port, 'GET', '/')).body, /hi/);
    assert.equal((await request(port, 'GET', '/..%2f..%2fpackage.json')).status, 404);
    assert.equal((await request(port, 'POST', '/event', '{bad')).status, 400);
    assert.equal((await request(port, 'POST', '/event', 'x'.repeat(5000))).status, 400);
  });
});

test('server: null byte in url does not crash the server', async () => {
  await withServer(async (port) => {
    assert.equal((await request(port, 'GET', '/%00x')).status, 404);
    assert.equal((await request(port, 'GET', '/health')).body, 'ok');
  });
});

test('server: rejects non-JSON content type and invalid events', async () => {
  await withServer(async (port) => {
    const body = JSON.stringify({ squad: 'sq-1', role: 'manager', kind: 'squad_start', managerName: 'm', ts: 1 });
    const plain = await new Promise((resolve) => {
      const req = http.request({ host: '127.0.0.1', port, path: '/event', method: 'POST', headers: { 'content-type': 'text/plain' } },
        (res) => { res.resume(); resolve(res.statusCode); });
      req.end(body);
    });
    assert.equal(plain, 415);
    assert.equal((await request(port, 'POST', '/event', JSON.stringify({ squad: 'sq-1', role: '__proto__', kind: 'stop' }))).status, 400);
    assert.equal((await request(port, 'POST', '/event', body)).status, 200);
  });
});

test('server: shared modules are served for the renderer', async () => {
  await withServer(async (port) => {
    const r = await request(port, 'GET', '/shared/protocol.js');
    assert.equal(r.status, 200);
    assert.match(r.body, /CHAR_NAMES/);
    assert.equal((await request(port, 'GET', '/favicon.ico')).status, 204);
  });
});

test('server: font route serves VT323', async () => {
  await withServer(async (port) => {
    assert.equal((await request(port, 'GET', '/fonts/vt323-vietnamese-400-normal.woff2')).status, 200);
  });
});

test('server: POST /event is pushed to /stream subscribers', async () => {
  await withServer(async (port) => {
    const msgs = [];
    const req = http.get({ host: '127.0.0.1', port, path: '/stream' });
    const done = new Promise((resolve) => {
      req.on('response', (res) => {
        let buf = '';
        res.on('data', (d) => {
          buf += d;
          let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
            if (chunk.startsWith('data: ')) msgs.push(JSON.parse(chunk.slice(6)));
            if (msgs.length === 2) resolve();
          }
        });
      });
    });
    await new Promise((r) => setTimeout(r, 50));
    const r = await request(port, 'POST', '/event', JSON.stringify({ squad: 'sq-1', role: 'manager', kind: 'squad_start', managerName: 'mgr', replace: true, ts: 1 }));
    assert.equal(r.status, 200);
    await done;
    req.destroy();
    assert.equal(msgs[0].type, 'state');
    assert.deepEqual(msgs[0].houses, []);
    assert.equal(msgs[1].type, 'event');
    assert.equal(msgs[1].ev.kind, 'squad_start');
    assert.equal(msgs[1].houses[0].id, 'sq-1');
  });
});
