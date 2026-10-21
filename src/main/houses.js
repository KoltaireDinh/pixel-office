// Which squads ("houses") exist and who is in them. Pure: time is passed in.
import { ROLES, CHILD_ROLES, EVENT_KINDS } from '../shared/protocol.js';

export const HOUSE_TTL_MS = 600000;
export const IDLE_TTL_MS = 12 * 3600000;
const MAX_ID = 64;

function newHouse(id, managerName, now) {
  const members = {};
  for (const r of ROLES) members[r] = { present: r === 'manager', session: null };
  return { id, managerName, createdAt: now, lastEventAt: now, endedAt: null, members };
}

export function isValidEvent(ev) {
  return !!ev && typeof ev === 'object' && typeof ev.squad === 'string' && ev.squad.length > 0 && ev.squad.length <= MAX_ID
    && ROLES.includes(ev.role) && EVENT_KINDS.includes(ev.kind);
}

export function createRegistry() {
  const houses = new Map();

  function end(h, now) { if (h.endedAt === null) h.endedAt = now; }

  function apply(ev, now) {
    if (!isValidEvent(ev)) return false;
    if (ev.kind === 'squad_start') {
      if (ev.replace) {
        for (const h of houses.values()) if (h.id !== ev.squad && h.managerName === ev.managerName) end(h, now);
      }
      const name = typeof ev.managerName === 'string' ? ev.managerName.slice(0, MAX_ID) : null;
      const h = houses.get(ev.squad);
      if (h) { h.managerName = name ?? h.managerName; h.lastEventAt = now; h.members.manager.present = true; }
      else houses.set(ev.squad, newHouse(ev.squad, name, now));
      return true;
    }
    const h = houses.get(ev.squad);
    if (!h) return false;
    h.lastEventAt = now;
    const m = h.members[ev.role];
    if (ev.kind === 'session_end') {
      m.present = false;
      // The manager restarts (/clear, new name) while the squad keeps working, so only the children close the house.
      if (CHILD_ROLES.every((r) => !h.members[r].present && h.members[r].session)) end(h, now);
      return true;
    }
    m.present = true;
    if (typeof ev.session === 'string') m.session = ev.session.slice(0, MAX_ID);
    return true;
  }

  function list(now) {
    for (const [id, h] of houses) {
      if ((h.endedAt !== null && now - h.endedAt >= HOUSE_TTL_MS) || now - h.lastEventAt >= IDLE_TTL_MS) houses.delete(id);
    }
    return [...houses.values()].sort((a, b) => b.createdAt - a.createdAt).map((h) => structuredClone(h));
  }

  return { apply, list };
}
