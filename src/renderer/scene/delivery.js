// One message delivery: walk to the recipient, hand the envelope over, walk back to the desk.
export const HANDOFF_MS = 600;

export function createDelivery(role, to) {
  let handedAt = null, done = false;
  return {
    // pos: the body's latest step result. Returns the spot to head for.
    target(pos, now) {
      if (handedAt === null) {
        if (pos.arrived) handedAt = now; else return `stand:${to}`;
      }
      if (now - handedAt < HANDOFF_MS) return `stand:${to}`;
      if (pos.arrived && now - handedAt > HANDOFF_MS) done = true;
      return `seat:${role}`;
    },
    handingOver(now) { return handedAt !== null && now - handedAt < HANDOFF_MS; },
    get carrying() { return handedAt === null; },
    get done() { return done; },
  };
}
