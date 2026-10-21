// One character's behaviour: hook events in, current action out. Pure: time is passed in.

export const ENTER_MS = 1500;
export const LEAVE_MS = 2000;
export const CONFUSED_MS = 3000;
export const TOOL_FALLBACK_MS = 5000;
export const SLEEP_AFTER_MS = 180000;

const TOOL_ACTIONS = { edit: 'work', bash: 'type_fast', render: 'render', read: 'read', browse: 'browse', agent: 'phone', other: 'work' };
const DECAYS_TO_WORK = new Set(['type_fast', 'render', 'read', 'browse', 'phone']);
const KNOWN = new Set(['squad_start', 'manager_join', 'session_start', 'prompt', 'tool', 'send', 'wait', 'stop', 'fail', 'session_end']);

export function createBrain(role, { walkMs = () => 3000, initial = 'absent' } = {}) {
  let action = initial, since = 0, data = null;
  let lockUntil = null, after = 'work', pending = null, pendingAt = 0;
  let confusedPrev = null;

  function set(a, t, d = null) { action = a; since = t; data = d; }
  function lock(a, t, ms, d, next) { set(a, t, d); lockUntil = t + ms; after = next; }

  function apply(ev, t) {
    switch (ev.kind) {
      case 'session_start': lock('enter', t, ENTER_MS, null, 'rest'); return;
      case 'session_end': lock('leave', t, LEAVE_MS, null, 'absent'); return;
      case 'squad_start': case 'manager_join': return;
      case 'prompt': set('work', t); return;
      case 'tool': set(TOOL_ACTIONS[ev.cat] ?? 'work', t); return;
      case 'send': {
        if (!ev.to || ev.to === role) { set('work', t); return; }
        const ms = walkMs(ev.to);
        lock('walk', t, ms, { to: ev.to, head: ev.head ?? null, ms }, 'work'); return;
      }
      case 'wait': set('alert', t); return;
      case 'stop': set('rest', t); return;
      case 'fail': confusedPrev = { action, data }; set('confused', t); return;
    }
  }

  function handle(ev, now) {
    if (!ev || !KNOWN.has(ev.kind)) return;
    if (lockUntil !== null && now < lockUntil) { pending = ev; pendingAt = now; return; }
    if (action === 'absent' && ev.kind !== 'session_start' && ev.kind !== 'session_end'
        && ev.kind !== 'squad_start' && ev.kind !== 'manager_join') {
      lock('enter', now, ENTER_MS, null, 'work');
      pending = ev; pendingAt = now;
      return;
    }
    apply(ev, now);
  }

  function tick(now) {
    if (lockUntil !== null && now >= lockUntil) {
      const t = lockUntil;
      lockUntil = null;
      set(after, t);
      if (pending) { const ev = pending; pending = null; apply(ev, Math.max(t, pendingAt)); }
    }
    if (lockUntil === null) {
      if (action === 'confused' && now - since >= CONFUSED_MS) {
        const prev = confusedPrev ?? { action: 'work', data: null };
        set(prev.action, since + CONFUSED_MS, prev.data);
      }
      if (DECAYS_TO_WORK.has(action) && now - since >= TOOL_FALLBACK_MS) set('work', since + TOOL_FALLBACK_MS);
      if (action === 'rest' && now - since >= SLEEP_AFTER_MS) set('sleep', since + SLEEP_AFTER_MS);
    }
    return { action, since, data };
  }

  // The scene calls this when the sender is actually back from a delivery.
  function endWalk(now) {
    if (action === 'walk' && lockUntil !== null && now < lockUntil) lockUntil = now;
    tick(now);
  }

  return { handle, tick, endWalk };
}
