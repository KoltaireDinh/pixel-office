// Character bodies, kept separately per house so switching houses never drags people across.
import { createMover } from './mover.js';

export function createBodies(maxHouses = 4) {
  const houses = new Map(); // houseId -> { [role]: mover }
  function get(houseId, role, startSpot) {
    let set = houses.get(houseId);
    if (!set) {
      set = {};
      houses.set(houseId, set);
      while (houses.size > maxHouses) houses.delete(houses.keys().next().value);
    }
    return (set[role] ??= createMover(startSpot));
  }
  return { get };
}
