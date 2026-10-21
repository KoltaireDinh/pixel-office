// Called by reels-squad launch.ps1: announce a squad, starting the app if it is not running.
import { post, ensureApp } from './post.js';

function arg(name) { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (process.argv[2] !== 'squad-start') return;
  const ev = { squad: arg('squad'), role: 'manager', kind: 'squad_start', cat: null, to: null, head: null, session: null,
    managerName: arg('manager'), replace: process.argv.includes('--replace'), ts: Date.now() };
  if (!ev.squad || !ev.managerName) return;
  if (await post(ev)) return;
  try { ensureApp(); } catch { return; }
  for (let i = 0; i < 10; i++) { await sleep(500); if (await post({ ...ev, ts: Date.now() })) return; }
}

main().catch(() => {}).finally(() => process.exit(0));
