import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchCommand } from '../hook/post.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('launchCommand starts the installed exe recorded in app.json', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'po-post-'));
  fs.writeFileSync(path.join(home, 'app.json'), JSON.stringify({ exe: 'C:\Apps\Pixel Office.exe' }));
  assert.deepEqual(launchCommand(home), { cmd: 'C:\Apps\Pixel Office.exe', args: [] });
});

test('launchCommand falls back to electron for a dev checkout', () => {
  const { cmd, args } = launchCommand(repo);
  assert.match(cmd, /electron/i);
  assert.deepEqual(args, [repo]);
});
