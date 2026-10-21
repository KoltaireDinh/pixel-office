// Renderer entry: SSE events -> per-character brains -> pixel scene + bubbles + ticker.
// ?debug=all cycles every character through every action (for visual checks).
import { createScene, ORDER } from './scene/draw.js';
import { walkMs } from './scene/nav.js';
import { createBrain } from './brain.js';
import { createBubbleScheduler, mountBubbles } from './bubbles.js';
import { CHAR_NAMES } from '../shared/protocol.js';
import { fitScene } from './layout.js';

const params = new URLSearchParams(location.search);
// Largest whole-number zoom (in device pixels) that fits the window keeps pixels crisp; the rest is a dark border.
let scale = 2; // CSS px per scene px
function fit() {
  const r = fitScene(innerWidth, innerHeight, devicePixelRatio || 1);
  scale = r.scale / (devicePixelRatio || 1);
  document.documentElement.style.setProperty('--s', scale);
  Object.assign($('frame').style, { width: `${r.cssW}px`, height: `${r.cssH}px`, left: `${r.left}px`, top: `${r.top}px` });
}

const $ = (id) => document.getElementById(id);
addEventListener('resize', fit);
matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener?.('change', fit);
fit();
const scene = createScene($('scene'));
const lines = await fetch('lines.json').then((r) => r.json());
const scheduler = createBubbleScheduler({ lines });
const bubbles = mountBubbles($('bubbles'), () => scale);

const VERB = { work: 'làm việc', type_fast: 'gõ lệnh', render: 'render video', read: 'đọc tài liệu', browse: 'xem video',
  phone: 'gọi trợ lý', walk: 'đưa thư', alert: 'chờ bạn', rest: 'nghỉ ngơi', sleep: 'ngủ gật', confused: 'gặp lỗi',
  enter: 'vào nhà', leave: 'ra về' };
const FADE_MS = 3000;

let houses = [];
let current = null; // squad id being shown
const brains = new Map(); // squad id -> { [role]: brain }
const lastSend = new Map(); // squad id -> ticker text

function brainsFor(house) {
  if (!brains.has(house.id)) {
    const set = {};
    for (const role of ORDER) {
      set[role] = createBrain(role, { walkMs: (to) => walkMs(role, to), initial: house.members[role]?.present ? 'rest' : 'absent' });
    }
    brains.set(house.id, set);
  }
  return brains.get(house.id);
}

function setHouses(list) {
  const known = new Set(houses.map((h) => h.id));
  houses = list;
  for (const id of brains.keys()) if (!houses.some((h) => h.id === id)) { brains.delete(id); lastSend.delete(id); }
  const fresh = houses.find((h) => !known.has(h.id));
  if (fresh || !houses.some((h) => h.id === current)) current = houses[0]?.id ?? null;
  houses.forEach(brainsFor);
  renderNav();
}

function onEvent(ev) {
  const set = brains.get(ev.squad);
  if (!set || !set[ev.role]) return;
  set[ev.role].handle(ev, Date.now());
  if (ev.kind === 'send' && ev.to) {
    lastSend.set(ev.squad, `${CHAR_NAMES[ev.role]} → ${CHAR_NAMES[ev.to]} · ${ev.head ?? 'đưa thư'}`);
  }
}

function renderNav() {
  const nav = $('nav');
  nav.classList.toggle('on', houses.length > 1);
  const i = houses.findIndex((h) => h.id === current);
  $('navLabel').textContent = houses.length > 1 ? `${i + 1}/${houses.length}` : '';
}
function step(d) {
  if (!houses.length) return;
  const i = houses.findIndex((h) => h.id === current);
  current = houses[(i + d + houses.length) % houses.length].id;
  renderNav();
}
$('prev').onclick = () => step(-1);
$('next').onclick = () => step(1);

function headline(house, chars) {
  if (!house) return ['PIXEL OFFICE', 'CHƯA CÓ SQUAD', 'chạy /reels-squad nhé', ''];
  const present = ORDER.filter((r) => chars[r].action !== 'absent').length;
  const acts = ORDER.map((r) => chars[r].action).filter((a) => a !== 'absent');
  let status = 'ĐANG LÀM VIỆC', cls = '';
  if (house.endedAt) status = 'ĐÃ TAN LÀM';
  else if (acts.includes('alert')) { status = 'CHỜ BẠN!'; cls = 'alert'; }
  else if (acts.length && acts.every((a) => a === 'rest' || a === 'sleep')) status = 'NGHỈ NGƠI';
  return ['REELS SQUAD', `${present} AGENT`, status, cls];
}

function tickerText(house, chars) {
  if (!house) return '';
  if (lastSend.has(house.id)) return lastSend.get(house.id);
  const busy = ORDER.find((r) => !['absent', 'rest', 'sleep'].includes(chars[r].action));
  return busy ? `${CHAR_NAMES[busy]} đang ${VERB[chars[busy].action] ?? 'làm việc'}` : '';
}

const DEBUG_ACTIONS = ['work', 'type_fast', 'read', 'browse', 'render', 'phone', 'confused', 'rest', 'sleep', 'alert', 'walk', 'enter', 'leave', 'absent'];
const DEBUG_TARGET = { manager: 'coder', prompt: 'manager', researcher: 'styler', coder: 'manager', styler: 'prompt' };
function debugChars(now) {
  const chars = {};
  const slot = Math.floor(now / 3000);
  ORDER.forEach((role, i) => {
    const action = DEBUG_ACTIONS[(slot + i * 3) % DEBUG_ACTIONS.length];
    const data = action === 'walk' ? { to: DEBUG_TARGET[role], head: i % 2 ? '[BLOCKED] x' : 'TASK C1', ms: 3000 } : null;
    chars[role] = { action, since: slot * 3000, data };
  });
  return chars;
}

let lastFrame = -1, lastTop = '', lastTicker = null;
function frame() {
  const now = Date.now();
  const f = Math.floor(now / 1000 * 6);
  if (f !== lastFrame) {
    lastFrame = f;
    const debug = params.get('debug') === 'all';
    const house = debug ? { id: 'debug', endedAt: null } : houses.find((h) => h.id === current);
    let chars = {};
    if (debug) chars = debugChars(now);
    else if (house) { const set = brainsFor(house); for (const r of ORDER) chars[r] = set[r].tick(now); }
    else for (const r of ORDER) chars[r] = { action: 'absent', since: 0, data: null };
    const dim = !house ? 0.25 : house.endedAt ? Math.max(0, 1 - (now - house.endedAt) / FADE_MS) : 1;
    const anchors = scene.render(chars, f, now, { dim, houseId: house?.id ?? 'none' });
    if (house && !debug) { const set = brainsFor(house); for (const r of scene.takeWalkDone()) set[r].endWalk(now); }
    bubbles.update(house && !house.endedAt ? scheduler.tick(now, chars) : [], anchors);

    const [a, b, c, cls] = headline(house, chars);
    const top = `${a}|${b}|${c}|${cls}`;
    if (top !== lastTop) { lastTop = top; $('t1').textContent = a; $('t2').textContent = b; $('t3').textContent = c; $('t3').className = cls; }
    const t = tickerText(house, chars);
    if (t !== lastTicker) { lastTicker = t; $('ticker').textContent = t; }
  }
  requestAnimationFrame(frame);
}

function connect() {
  const es = new EventSource('/stream');
  es.onmessage = (m) => {
    let msg;
    try { msg = JSON.parse(m.data); } catch { return; }
    if (msg.houses) setHouses(msg.houses);
    if (msg.type === 'event' && msg.ev) onEvent(msg.ev);
  };
  es.onerror = () => { es.close(); setTimeout(connect, 2000); };
}

connect();
requestAnimationFrame(frame);
