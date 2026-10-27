// The gallery's room styles. Each one hangs the same pieces in the same places and walks with the same controls;
// a style only changes the look and, where it adds things to bump into, the floor you can stand on.
import { ROOM } from "./walk.js";

// the Egyptian hall's columns: a row down each side wall between the pieces, and a pair flanking the book. They stay
// off every straight line from the entrance to a piece's standing spot, because click-to-walk goes straight there.
export const COLUMNS = [[-4.6, 4], [-4.6, 0], [-4.6, -4], [4.6, 4], [4.6, 0], [4.6, -4], [-2.4, -9], [2.4, -9]];
export const COLUMN_R = 0.55;  // the shaft's radius; you keep 0.5 m further off, like the walls

export const ROOMS = {
  classic: { floor: ROOM },
  egypt: { floor: { ...ROOM, blockers: [...ROOM.blockers, ...COLUMNS.map(([x, z]) => [x, z, COLUMN_R + 0.5])] } },
};

// the style a page address asks for (?room=egypt), or the classic room for anything else
export function styleFrom(search) {
  const s = new URLSearchParams(search).get("room");
  return s && Object.hasOwn(ROOMS, s) ? s : "classic";
}
