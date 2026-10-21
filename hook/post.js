import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PORT } from '../src/shared/protocol.js';

export function port() { return Number(process.env.PIXEL_OFFICE_PORT) || DEFAULT_PORT; }

export function post(ev, { port: p = port(), timeoutMs = 300 } = {}) {
  return new Promise((resolve) => {
    const body = JSON.stringify(ev);
    const req = http.request({ host: '127.0.0.1', port: p, path: '/event', method: 'POST', timeout: timeoutMs,
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, (res) => {
      res.resume(); resolve(res.statusCode === 200);
    });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.end(body);
  });
}

export function appHome() {
  return process.env.PIXEL_OFFICE_HOME || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

// The installed app records its exe in app.json next to the hook files; a dev checkout runs electron on itself.
export function launchCommand(home) {
  try {
    const { exe } = JSON.parse(fs.readFileSync(path.join(home, 'app.json'), 'utf8'));
    if (exe) return { cmd: exe, args: [] };
  } catch { /* not installed */ }
  return { cmd: createRequire(path.join(home, 'package.json'))('electron'), args: [home] };
}

// Start the app detached so it outlives the caller.
export function ensureApp() {
  const { cmd, args } = launchCommand(appHome());
  const child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: false });
  child.unref();
}
