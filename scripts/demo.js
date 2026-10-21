// Play a fake reels-squad session into a running Pixel Office (npm start or npm run preview).
//   node scripts/demo.js [--loop] [--port 47821]
import { post } from '../hook/post.js';

const portArg = process.argv.indexOf('--port');
const port = portArg > 0 ? Number(process.argv[portArg + 1]) : Number(process.env.PIXEL_OFFICE_PORT) || 47821;
const loop = process.argv.includes('--loop');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MANAGER = 'demo-manager';
const SCRIPT = [
  [0, 'manager', 'squad_start', { managerName: MANAGER, replace: true }],
  [1500, 'researcher', 'session_start'], [600, 'prompt', 'session_start'], [600, 'coder', 'session_start'], [600, 'styler', 'session_start'],
  [2500, 'manager', 'tool', { cat: 'edit' }],
  [2000, 'manager', 'send', { to: 'researcher', head: 'TASK R1: tải top 5 video @science_in_8bit' }],
  [2000, 'researcher', 'prompt'], [500, 'researcher', 'tool', { cat: 'browse' }],
  [4000, 'researcher', 'tool', { cat: 'bash' }], [3000, 'researcher', 'tool', { cat: 'read' }],
  [3000, 'researcher', 'send', { to: 'manager', head: '[DONE] researcher TASK R1 — 5 video' }],
  [1000, 'manager', 'send', { to: 'prompt', head: 'TASK P1: master prompt video #1' }],
  [1000, 'researcher', 'stop'],
  [3000, 'prompt', 'prompt'], [500, 'prompt', 'tool', { cat: 'read' }], [3000, 'prompt', 'tool', { cat: 'edit' }],
  [4000, 'prompt', 'send', { to: 'manager', head: '[DONE] prompt TASK P1 — prompt xong' }],
  [1500, 'manager', 'send', { to: 'coder', head: 'TASK C1: dựng HTML + render v1' }],
  [500, 'prompt', 'stop'],
  [4500, 'coder', 'prompt'], [500, 'coder', 'tool', { cat: 'edit' }], [3000, 'coder', 'tool', { cat: 'render' }],
  [4000, 'coder', 'fail'], [3500, 'coder', 'tool', { cat: 'bash' }], [2500, 'coder', 'wait'],
  [5000, 'coder', 'tool', { cat: 'render' }],
  [4000, 'coder', 'send', { to: 'manager', head: '[DONE] coder TASK C1 — v1.mp4' }],
  [1000, 'manager', 'send', { to: 'styler', head: 'TASK S1: low poly + ánh sáng' }],
  [500, 'coder', 'stop'],
  [4500, 'styler', 'prompt'], [500, 'styler', 'tool', { cat: 'edit' }], [3000, 'styler', 'tool', { cat: 'agent' }],
  [3000, 'styler', 'tool', { cat: 'render' }],
  [4000, 'styler', 'send', { to: 'manager', head: '[BLOCKED] styler TASK S1 — thiếu font' }],
  [1000, 'styler', 'stop'],
  [3000, 'manager', 'tool', { cat: 'read' }], [3000, 'manager', 'wait'],
  [8000, 'manager', 'stop'],
];

async function run() {
  const squad = `sq-demo-${Date.now()}`;
  for (const [delay, role, kind, extra = {}] of SCRIPT) {
    await sleep(delay);
    const ev = { squad, role, kind, cat: null, to: null, head: null, session: `demo-${role}`, ts: Date.now(), ...extra };
    const ok = await post(ev, { port, timeoutMs: 1000 });
    console.log(`${ok ? '✓' : '✗'} ${role.padEnd(10)} ${kind}${extra.cat ? ' ' + extra.cat : ''}${extra.head ? ' · ' + extra.head : ''}`);
  }
}

do { await run(); } while (loop);
