// Walking rules for the gallery, kept out of the page so they can be tested in node.

const STEP = 0.05;     // metres per collision check: far thinner than any keep-out circle, so nothing tunnels
const MAX_MOVE = 10;  // metres; bounds the loop for absurd input

// The gallery floor you can stand on, at eye level: walls minus 0.5 m, and keep-out circles [x, z, r]
// around the plinths, the book stand and the chest. Matches the room built in index.html.
export const ROOM = {
  minX: -5.5, maxX: 5.5, minZ: -9.5, maxZ: 5.5,
  blockers: [[4.7, 2, 0.8], [4.7, -2, 0.8], [4.7, -6, 0.8], [0, -8.4, 0.6], [-4.7, -8.9, 1.0]],
};

export function standable(x, z, room) {
  if (x < room.minX || x > room.maxX || z < room.minZ || z > room.maxZ) return false;
  return room.blockers.every(([bx, bz, r]) => Math.hypot(x - bx, z - bz) >= r);
}

// Move pos by a world-space delta in short steps. A step that would leave standable floor tries
// each axis alone (sliding along the wall or round the plinth) and otherwise stops, so you can
// never end up inside anything and a long move cannot jump across one. Returns a new {x, z}.
export function walk(pos, dx, dz, room = ROOM) {
  const len = Math.hypot(dx, dz);
  if (!Number.isFinite(len) || len === 0) return { ...pos };
  const k = Math.min(1, MAX_MOVE / len);  // one call never walks further than MAX_MOVE
  const n = Math.ceil(len * k / STEP);
  const sx = dx * k / n, sz = dz * k / n;
  let { x, z } = pos;
  for (let i = 0; i < n; i++) {
    if (standable(x + sx, z + sz, room)) { x += sx; z += sz; }
    else if (standable(x + sx, z, room)) x += sx;
    else if (standable(x, z + sz, room)) z += sz;
  }
  return { x, z };
}

// forward/right in metres, relative to where you face (yaw 0 looks down -z), as a world delta.
export function heading(yaw, forward, right) {
  const s = Math.sin(yaw), c = Math.cos(yaw);
  return { dx: -s * forward + c * right, dz: -c * forward - s * right };
}
