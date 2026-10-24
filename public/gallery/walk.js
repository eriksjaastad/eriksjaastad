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

// Wheel deltas come in pixels, lines (Firefox mice) or pages; turn one into metres of walking.
// Scrolling down (positive deltaY) walks backwards, like pulling the room towards you.
export function wheelMeters(deltaY, deltaMode, pageHeight) {
  const px = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? pageHeight : 1);
  return Number.isFinite(px) ? -Math.min(120, Math.max(-120, px)) * 0.006 : 0;
}

export const EYE = 1.75;  // a 6 ft person's eyes; the camera never leaves this height

// The page's input -> camera pose controller. The page forwards DOM events and applies frame()'s pose.
export function walker(start, room = ROOM) {
  const me = { ...start }, keys = new Set(), pointers = new Map();
  let last = null;
  const move = (forward, right) => { const d = heading(me.yaw, forward, right); Object.assign(me, walk(me, d.dx, d.dz, room)); };
  const turn = (dx, dy) => { me.yaw += dx * 0.005; me.pitch = Math.min(1.45, Math.max(-1.45, me.pitch + dy * 0.004)); };
  const pressed = (a, b) => keys.has(a) || keys.has(b);
  return {
    // drag looks, a sliding drag walks; with two pointers down neither acts, but both stay current
    pointerDown(id, x, y, slide) { pointers.set(id, { x, y, slide }); },
    pointerMove(id, x, y) {
      const p = pointers.get(id);
      if (!p) return;
      const dx = x - p.x, dy = y - p.y;
      p.x = x; p.y = y;
      if (pointers.size > 1) return;
      if (p.slide) move(dy * 0.01, -dx * 0.01); else turn(dx, dy);
    },
    pointerUp(id) { pointers.delete(id); },
    wheel(deltaY, deltaMode, pageHeight) { move(wheelMeters(deltaY, deltaMode, pageHeight), 0); },
    // a modifier means a shortcut (Cmd+W ...), and macOS drops keyups while Cmd is held: stop everything
    keyDown({ key, metaKey, ctrlKey, altKey }) { if (metaKey || ctrlKey || altKey) keys.clear(); else keys.add(key.toLowerCase()); },
    keyUp(key) { keys.delete(key.toLowerCase()); },
    blur() { keys.clear(); pointers.clear(); },
    // WASD / arrows walk 2.6 m/s, Q/E turn; dt capped at 50 ms so a frame after a pause can't teleport you
    frame(now) {
      const dt = last === null ? 0 : Math.min(0.05, Math.max(0, now - last) / 1000); last = now;
      const f = pressed("w", "arrowup") - pressed("s", "arrowdown"), r = pressed("d", "arrowright") - pressed("a", "arrowleft");
      if (f || r) move(f * 2.6 * dt, r * 2.6 * dt);
      const q = keys.has("q") - keys.has("e");
      if (q) turn(q * 300 * dt, 0);
      return { x: me.x, y: EYE, z: me.z, pitch: me.pitch, yaw: me.yaw, roll: 0 };
    },
  };
}
