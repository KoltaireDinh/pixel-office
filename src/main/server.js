// Local-only HTTP server: receives hook events, serves the renderer, streams state over SSE.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PORT, HEAD_MAX } from '../shared/protocol.js';
import { isValidEvent } from './houses.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FONT_DIR = path.join(ROOT, 'node_modules', '@fontsource', 'vt323', 'files');
const SHARED_DIR = path.join(ROOT, 'src', 'shared');
const MAX_BODY = 4096;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };

function serveFile(res, base, rel) {
  const file = path.resolve(base, '.' + path.posix.normalize('/' + rel));
  if (rel.includes('\0') || !file.startsWith(path.resolve(base) + path.sep)) { res.writeHead(404).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(data);
  });
}

export function startServer({ port = DEFAULT_PORT, host = '127.0.0.1', staticDir, registry, now = Date.now }) {
  const clients = new Set();
  const send = (msg) => { const line = `data: ${JSON.stringify(msg)}\n\n`; for (const c of clients) c.write(line); };

  const server = http.createServer((req, res) => {
    let url;
    try { url = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }

    if (req.method === 'POST' && url === '/event') {
      // JSON-only: a browser page can't send this cross-origin without a CORS preflight, which we never answer.
      if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) { req.resume(); res.writeHead(415).end(); return; }
      let body = '', tooBig = false;
      req.on('data', (d) => { body += d; if (body.length > MAX_BODY) tooBig = true; });
      req.on('end', () => {
        let ev;
        try { if (tooBig) throw new Error('too big'); ev = JSON.parse(body); } catch { res.writeHead(400).end(); return; }
        if (!isValidEvent(ev)) { res.writeHead(400).end(); return; }
        if (typeof ev.head === 'string') ev.head = ev.head.slice(0, HEAD_MAX);
        const t = now();
        registry.apply(ev, t);
        send({ type: 'event', ev, houses: registry.list(t) });
        res.writeHead(200).end('ok');
      });
      return;
    }
    if (req.method !== 'GET') { res.writeHead(405).end(); return; }
    if (url === '/health') { res.writeHead(200).end('ok'); return; }
    if (url === '/stream') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(`data: ${JSON.stringify({ type: 'state', houses: registry.list(now()) })}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (url === '/favicon.ico') { res.writeHead(204).end(); return; }
    if (url.startsWith('/fonts/')) { serveFile(res, FONT_DIR, url.slice('/fonts/'.length)); return; }
    if (url.startsWith('/shared/')) { serveFile(res, SHARED_DIR, url.slice('/shared/'.length)); return; }
    serveFile(res, staticDir, url === '/' ? 'index.html' : url.slice(1));
  });

  // Periodic state push so expired houses disappear and the UI notices even without events.
  const timer = setInterval(() => send({ type: 'state', houses: registry.list(now()) }), 30000);
  timer.unref();

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve({
      port: server.address().port,
      close: () => new Promise((r) => { clearInterval(timer); for (const c of clients) c.end(); server.close(() => r()); }),
    }));
  });
}
