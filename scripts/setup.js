// Add (or remove with --uninstall) the Pixel Office hook in ~/.claude/settings.json without touching other hooks.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOOK_EVENTS = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure',
  'PermissionRequest', 'Notification', 'Stop', 'StopFailure'];
export const TOOL_EVENTS = ['PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'PermissionRequest'];
const MARK = 'pixel-office/hook/hook.js';

const isMine = (group) => (group.hooks ?? []).some((h) => typeof h.command === 'string' && h.command.replace(/\\/g, '/').includes(MARK));

export function removeHooks(settings) {
  const out = structuredClone(settings);
  for (const ev of Object.keys(out.hooks ?? {})) {
    out.hooks[ev] = out.hooks[ev].filter((g) => !isMine(g));
    if (!out.hooks[ev].length) delete out.hooks[ev];
  }
  return out;
}

export function mergeHooks(settings, command) {
  const out = removeHooks(settings);
  out.hooks ??= {};
  for (const ev of HOOK_EVENTS) {
    const hooks = [{ type: 'command', command, async: true, timeout: 5 }];
    (out.hooks[ev] ??= []).push(TOOL_EVENTS.includes(ev) ? { matcher: '*', hooks } : { hooks });
  }
  return out;
}

function main() {
  const file = path.join(os.homedir(), '.claude', 'settings.json');
  const home = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..').replace(/\\/g, '/');
  const command = `node "${home}/hook/hook.js"`;
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '{}';
  const settings = JSON.parse(raw);
  const backup = `${file}.bak-pixel-office`;
  if (fs.existsSync(file) && !fs.existsSync(backup)) fs.copyFileSync(file, backup);
  const uninstall = process.argv.includes('--uninstall');
  const next = uninstall ? removeHooks(settings) : mergeHooks(settings, command);
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  console.log(uninstall ? `Đã gỡ hook Pixel Office khỏi ${file}` : `Đã thêm hook Pixel Office (${HOOK_EVENTS.length} sự kiện) vào ${file}\nBản sao lưu: ${backup}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
