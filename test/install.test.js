import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNTIME_FILES, syncRuntime, ensureHooks, uninstallHooks, hookCommand } from '../src/main/install.js';
import { HOOK_EVENTS } from '../scripts/setup.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'po-install-'));
const AGENTPET = { hooks: [{ type: 'command', command: '"C:\\agentpet.exe" hook --agent claude' }] };

test('syncRuntime copies the hook files, marks them as ES modules and records the app exe', () => {
  const dest = path.join(tmp(), 'pixel-office');
  syncRuntime(repo, dest, 'C:\\Apps\\Pixel Office.exe');
  for (const f of RUNTIME_FILES) assert.equal(fs.readFileSync(path.join(dest, f), 'utf8'), fs.readFileSync(path.join(repo, f), 'utf8'), f);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8')).type, 'module');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dest, 'app.json'), 'utf8')).exe, 'C:\\Apps\\Pixel Office.exe');
});

test('hookCommand points node at the runtime hook with forward slashes', () => {
  assert.equal(hookCommand('C:\\Users\\A\\AppData\\Local\\PixelOffice\\pixel-office'), 'node "C:/Users/A/AppData/Local/PixelOffice/pixel-office/hook/hook.js"');
});

test('ensureHooks adds hooks once, keeps other hooks, backs up, and does not rewrite when unchanged', () => {
  const dir = tmp(), file = path.join(dir, 'settings.json');
  fs.writeFileSync(file, JSON.stringify({ theme: 'dark', hooks: { Stop: [AGENTPET] } }));
  const cmd = hookCommand(path.join(dir, 'rt', 'pixel-office'));
  assert.equal(ensureHooks(file, cmd), 'added');
  const s = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(s.theme, 'dark');
  assert.deepEqual(s.hooks.Stop[0], AGENTPET);
  for (const ev of HOOK_EVENTS) assert.ok(JSON.stringify(s.hooks[ev]).includes('hook/hook.js'), ev);
  assert.ok(fs.existsSync(`${file}.bak-pixel-office`));
  const mtime = fs.statSync(file).mtimeMs;
  assert.equal(ensureHooks(file, cmd), 'unchanged');
  assert.equal(fs.statSync(file).mtimeMs, mtime);
});

test('ensureHooks replaces a dev-checkout hook path with the installed one', () => {
  const dir = tmp(), file = path.join(dir, 'settings.json');
  fs.writeFileSync(file, '{}');
  ensureHooks(file, 'node "E:/aff/pixel-office/hook/hook.js"');
  ensureHooks(file, 'node "C:/rt/pixel-office/hook/hook.js"');
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(!text.includes('E:/aff'));
  assert.equal(JSON.parse(text).hooks.Stop.length, 1);
});

test('ensureHooks creates settings.json when Claude Code has none yet', () => {
  const file = path.join(tmp(), '.claude', 'settings.json');
  assert.equal(ensureHooks(file, 'node "C:/rt/pixel-office/hook/hook.js"'), 'added');
  assert.ok(JSON.parse(fs.readFileSync(file, 'utf8')).hooks.SessionStart);
});

test('ensureHooks leaves a broken settings.json alone', () => {
  const file = path.join(tmp(), 'settings.json');
  fs.writeFileSync(file, '{ not json');
  assert.equal(ensureHooks(file, 'node "C:/rt/pixel-office/hook/hook.js"'), 'error');
  assert.equal(fs.readFileSync(file, 'utf8'), '{ not json');
});

test('uninstallHooks removes only Pixel Office hooks', () => {
  const dir = tmp(), file = path.join(dir, 'settings.json');
  fs.writeFileSync(file, JSON.stringify({ hooks: { Stop: [AGENTPET] } }));
  ensureHooks(file, 'node "C:/rt/pixel-office/hook/hook.js"');
  uninstallHooks(file);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')).hooks, { Stop: [AGENTPET] });
});
