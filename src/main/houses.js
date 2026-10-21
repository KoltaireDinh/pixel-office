// Which squads ("houses") exist and who is in them. Pure: time is passed in.
import { ROLES, CHILD_ROLES } from '../shared/protocol.js';

export const HOUSE_TTL_MS = 600000;

function newHouse(id, managerName, now) {
  const members = {};
  for (const r of ROLES) members[r] = { present: r === 'manager', session: null };
  return { id, managerName, createdAt: now, endedAt: null, members };
}

export function createRegistry() {
  const houses = new Map();

  function end(h, now) { if (h.endedAt === null) h.endedAt = now; }

  function apply(ev, now) {
    if (!ev || typeof ev !== 'object') return false;
    if (ev.kind === 'squad_start') {
      if (!ev.squad) return false;
      if (ev.replace) {
        for (const h of houses.values()) if (h.id !== ev.squad && h.managerName === ev.managerName) end(h, now);
      }
      if (!houses.has(ev.squad)) houses.set(ev.squad, newHouse(ev.squad, ev.managerName ?? null, now));
      return true;
    }
    const h = houses.get(ev.squad);
    if (!h || !h.members[ev.role]) return false;
    const m = h.members[ev.role];
    if (ev.kind === 'session_end') {
      m.present = false;
      if (ev.role === 'manager' || CHILD_ROLES.every((r) => !h.members[r].present && h.members[r].session)) end(h, now);
      return true;
    }
    m.present = true;
    if (ev.session) m.session = ev.session;
    return true;
  }

  function list(now) {
    for (const [id, h] of houses) if (h.endedAt !== null && now - h.endedAt >= HOUSE_TTL_MS) houses.delete(id);
    return [...houses.values()].sort((a, b) => b.createdAt - a.createdAt).map((h) => structuredClone(h));
  }

  return { apply, list };
}
