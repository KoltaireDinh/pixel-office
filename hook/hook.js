// Claude Code hook entry: stdin JSON -> condensed event -> POST to Pixel Office. Never fails, never prints.
import fs from 'node:fs';
import path from 'node:path';
import { condense } from './condense.js';
import { post } from './post.js';
import { squadsDir, findSquad, findByManagerSession, claimNewest } from './squads.js';

setTimeout(() => process.exit(0), 800).unref();

function readStdin() {
  return new Promise((resolve) => {
    let s = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { s += d; });
    process.stdin.on('end', () => resolve(s));
    process.stdin.on('error', () => resolve(s));
  });
}

const LAUNCH = /reels-squad[\\/]+scripts[\\/]+launch\.ps1/i;

async function main() {
  const raw = await readStdin();
  const dir = squadsDir();
  try { if (fs.existsSync(path.join(dir, '..', 'debug'))) fs.appendFileSync(path.join(dir, '..', 'hook-debug.log'), raw.trim() + '\n'); } catch { /* ignore */ }
  let input;
  try { input = JSON.parse(raw); } catch { return; }
  const now = Date.now();

  const envSquad = process.env.PIXEL_OFFICE_SQUAD, envRole = process.env.PIXEL_OFFICE_ROLE;
  if (envSquad && envRole) {
    const sq = findSquad(dir, envSquad);
    const ev = condense(input, { squad: envSquad, role: envRole, managerName: sq?.managerName ?? null, now });
    if (ev) await post(ev);
    return;
  }

  if (input.hook_event_name === 'PostToolUse' && ['Bash', 'PowerShell'].includes(input.tool_name)
      && LAUNCH.test(input.tool_input?.command ?? '') && !findByManagerSession(dir, input.session_id)) {
    const sq = claimNewest(dir, input.session_id, now);
    if (sq) await post({ squad: sq.squad, role: 'manager', kind: 'manager_join', cat: null, to: null, head: null, session: input.session_id, ts: now });
    return;
  }

  const sq = findByManagerSession(dir, input.session_id);
  if (!sq) return;
  const ev = condense(input, { squad: sq.squad, role: 'manager', managerName: sq.managerName, now });
  if (ev) await post(ev);
}

main().catch(() => {}).finally(() => process.exit(0));
