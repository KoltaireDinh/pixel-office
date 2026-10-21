// Installed-app plumbing: copy the hook scripts out of the app bundle to a stable folder Claude Code can run
// with node, and keep ~/.claude/settings.json pointing at them.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeHooks, removeHooks } from '../../scripts/setup.js';

export const RUNTIME_FILES = ['hook/hook.js', 'hook/condense.js', 'hook/post.js', 'hook/squads.js', 'hook/notify.js', 'src/shared/protocol.js'];

export function runtimeDir() {
  return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'PixelOffice', 'pixel-office');
}

export function settingsFile() { return path.join(os.homedir(), '.claude', 'settings.json'); }

export function hookCommand(dir) { return `node "${dir.replace(/\\/g, '/')}/hook/hook.js"`; }

export function syncRuntime(srcRoot, destRoot, exe) {
  for (const f of RUNTIME_FILES) {
    const to = path.join(destRoot, f);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, fs.readFileSync(path.join(srcRoot, f)));
  }
  fs.writeFileSync(path.join(destRoot, 'package.json'), JSON.stringify({ type: 'module' }) + '\n');
  fs.writeFileSync(path.join(destRoot, 'app.json'), JSON.stringify({ exe }) + '\n');
}

function readSettings(file) {
  if (!fs.existsSync(file)) return { raw: null, settings: {} };
  const raw = fs.readFileSync(file, 'utf8');
  return { raw, settings: JSON.parse(raw.replace(/^﻿/, '')) };
}

// Returns 'added', 'unchanged' or 'error' (unreadable settings are never overwritten).
export function ensureHooks(file, command) {
  let cur;
  try { cur = readSettings(file); } catch { return 'error'; }
  const next = mergeHooks(cur.settings, command);
  if (cur.raw !== null && JSON.stringify(next) === JSON.stringify(cur.settings)) return 'unchanged';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const backup = `${file}.bak-pixel-office`;
  if (cur.raw !== null && !fs.existsSync(backup)) fs.writeFileSync(backup, cur.raw);
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  return 'added';
}

export function uninstallHooks(file) {
  let cur;
  try { cur = readSettings(file); } catch { return 'error'; }
  if (cur.raw === null) return 'unchanged';
  fs.writeFileSync(file, JSON.stringify(removeHooks(cur.settings), null, 2) + '\n');
  return 'removed';
}
