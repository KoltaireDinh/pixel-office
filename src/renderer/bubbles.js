// 8-bit speech bubbles: which character says what, when, and where (never overlapping).
import { CHAR_NAMES } from '../shared/protocol.js';

export const ACTIONS = ['work', 'type_fast', 'render', 'read', 'browse', 'phone', 'walk', 'alert', 'rest', 'sleep', 'confused'];
export const SAY_MS = 2800;
export const ALERT_MS = 4000;
export const MAX_CHATTER = 2;
const THINK_ACTIONS = new Set(['rest', 'sleep', 'read']);

export function pickLine(lines, role, action, ctx, last, rand) {
  let arr = lines?.[role]?.[action];
  if (!Array.isArray(arr) || !arr.length) return null;
  arr = arr.filter((l) => !l.includes('{task}') || ctx.task);
  if (arr.length > 1) arr = arr.filter((l) => fill(l, ctx) !== last);
  if (!arr.length) return null;
  const text = fill(arr[Math.floor(rand() * arr.length) % arr.length], ctx);
  const kind = action === 'alert' ? 'alert' : THINK_ACTIONS.has(action) || text.endsWith('...') ? 'think' : 'say';
  return { text, kind };
}

function fill(l, ctx) { return l.replace('{to}', ctx.to ?? 'mọi người').replace('{task}', ctx.task ?? ''); }

function ctxFor(st) {
  const to = st.data?.to ? CHAR_NAMES[st.data.to] : undefined;
  const task = /TASK\s+([^\s:—-]+)/.exec(st.data?.head ?? '')?.[1];
  return { to, task };
}

export function createBubbleScheduler({ lines, rand = Math.random }) {
  const active = new Map(); // role -> bubble
  const lastText = {};
  let nextAt = 0;

  function make(role, st, now, ms) {
    const line = pickLine(lines, role, st.action, ctxFor(st), lastText[role], rand);
    if (!line) return;
    lastText[role] = line.text;
    active.set(role, { role, text: line.text, kind: line.kind, until: now + ms });
  }

  function tick(now, chars) {
    for (const [role, b] of active) {
      const st = chars[role];
      const gone = !st || st.action === 'absent' || (b.kind === 'alert') !== (st.action === 'alert');
      if (b.until <= now || gone) active.delete(role);
    }
    for (const [role, st] of Object.entries(chars)) if (st.action === 'alert' && !active.has(role)) make(role, st, now, ALERT_MS);
    if (now >= nextAt) {
      nextAt = now + 1200 + rand() * 1500;
      const chatter = [...active.values()].filter((b) => b.kind !== 'alert').length;
      const pool = Object.entries(chars).filter(([role, st]) => !active.has(role) && st.action !== 'alert' && ACTIONS.includes(st.action));
      if (chatter < MAX_CHATTER && pool.length) {
        const [role, st] = pool[Math.floor(rand() * pool.length) % pool.length];
        make(role, st, now, SAY_MS);
      }
    }
    return [...active.values()];
  }

  return { tick };
}

const hit = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

// Clamp each rect into bounds, then lift later rects above earlier ones they collide with.
export function resolveOverlap(rects, bounds, gap = 4) {
  const out = [];
  for (const r0 of rects) {
    const r = { ...r0 };
    r.x = Math.min(Math.max(r.x, bounds.left), bounds.right - r.w);
    r.y = Math.min(Math.max(r.y, bounds.top), bounds.bottom - r.h);
    for (let guard = 0; guard < out.length + 1; guard++) {
      const other = out.find((o) => hit(r, o));
      if (!other) break;
      r.y = other.y - r.h - gap;
      if (r.y < bounds.top) { r.y = other.y + other.h + gap; }
    }
    out.push(r);
  }
  return out;
}

// DOM side: one element per speaking role, positioned over the canvas.
export function mountBubbles(container, scale) {
  const els = new Map();
  function update(bubbles, anchors) {
    for (const [role, el] of els) if (!bubbles.some((b) => b.role === role)) { el.remove(); els.delete(role); }
    const items = [];
    for (const b of bubbles) {
      const a = anchors[b.role];
      if (!a) continue;
      let el = els.get(b.role);
      if (!el) { el = document.createElement('div'); container.appendChild(el); els.set(b.role, el); }
      if (el.dataset.text !== b.text) { el.dataset.text = b.text; el.textContent = b.text; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
      el.className = `bub ${b.kind}`;
      const w = el.offsetWidth + 12, h = el.offsetHeight + 12;
      items.push({ el, ax: a[0] * scale, rect: { x: a[0] * scale - w / 2, y: a[1] * scale - h - 8, w, h } });
    }
    const W = container.clientWidth, H = container.clientHeight;
    const placed = resolveOverlap(items.map((i) => i.rect), { left: 2, top: 2, right: W - 2, bottom: H - 2 });
    placed.forEach((r, i) => {
      const { el, ax } = items[i];
      el.style.left = `${r.x + 6}px`; el.style.top = `${r.y + 6}px`;
      el.style.setProperty('--tail', `${Math.min(Math.max(ax - r.x - 6, 8), r.w - 20)}px`);
    });
  }
  return { update };
}
