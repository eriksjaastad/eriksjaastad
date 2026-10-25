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

const MOVE_KEYS = ["w", "a", "s", "d", "q", "e", "arrowup", "arrowdown", "arrowleft", "arrowright"];

export const EYE = 1.75;  // a 6 ft person's eyes; the camera never leaves this height

// The page's input -> camera pose controller. The page forwards DOM events and applies frame()'s pose.
export function walker(start, room = ROOM) {
  const me = { ...start }, keys = new Set(), pointers = new Map();
  let last = null, flight = null;
  // your own walking or turning always takes over from a walk to a piece (a zero-length nudge does not)
  const move = (forward, right) => { if (!forward && !right) return; flight = null; const d = heading(me.yaw, forward, right); Object.assign(me, walk(me, d.dx, d.dz, room)); };
  const turn = (dx, dy) => { if (!dx && !dy) return; flight = null; me.yaw += dx * 0.005; me.pitch = Math.min(1.45, Math.max(-1.45, me.pitch + dy * 0.004)); };
  // one frame of a walk to a piece: feet at 3 m/s and head at 2.5 rad/s, timed to arrive together. The feet go
  // through walk(), so the route slides round anything in the way; a walk that makes no progress ends.
  const fly = dt => {
    const dx = flight.x - me.x, dz = flight.z - me.z, dyaw = flight.yaw - me.yaw, dpitch = flight.pitch - me.pitch;
    const left = Math.max(Math.hypot(dx, dz) / 3, Math.abs(dyaw) / 2.5, Math.abs(dpitch) / 2.5);  // seconds to go
    const k = left > dt ? dt / left : 1;
    const at = walk(me, dx * k, dz * k, room);
    if (dt > 0 && Math.hypot(dx, dz) > 1e-6 && at.x === me.x && at.z === me.z) { flight = null; return; }
    Object.assign(me, at); me.yaw += dyaw * k; me.pitch += dpitch * k;
    if (k === 1) flight = null;
  };
  const pressed = (a, b) => keys.has(a) || keys.has(b);
  // the gesture so far is a tap while one primary pointer is down and has moved at most 6 px in total.
  // Each new gesture starts fresh, so a press lost to blur or cancel can't spoil the next click.
  let tap = null;
  const pointerMove = (id, x, y) => {
    const p = pointers.get(id);
    if (!p || !Number.isFinite(x) || !Number.isFinite(y)) return;  // a bad sample neither moves you nor resets travel
    const dx = x - p.x, dy = y - p.y;
    p.x = x; p.y = y;
    if (tap && (tap.travel += Math.hypot(dx, dy)) > 6) tap = null;
    if (pointers.size > 1) return;
    if (p.slide) move(dy * 0.01, -dx * 0.01); else turn(dx, dy);
  };
  return {
    // drag looks, a sliding drag walks; with two pointers down neither acts, but both stay current.
    // primary: the main button of the first pointer (a right-drag or a second finger is never a tap)
    pointerDown(id, x, y, slide, primary) {
      tap = !pointers.size && primary && !slide ? { travel: 0 } : null;
      pointers.set(id, { x, y, slide });
    },
    // feed every sample (coalesced events too), so travel that comes back on itself still counts
    pointerMove,
    // lifting at x, y counts that last bit of travel; returns true when the whole gesture was a tap
    pointerUp(id, x, y) {
      if (!pointers.has(id)) return false;
      pointerMove(id, x, y);
      pointers.delete(id);
      const wasTap = !!tap;  // a tap only ever has one pointer, so this was the last one up
      tap = null;
      return wasTap;
    },
    pointerCancel(id) { pointers.delete(id); },
    wheel(deltaY, deltaMode, pageHeight) { move(wheelMeters(deltaY, deltaMode, pageHeight), 0); },
    // a modifier means a shortcut (Cmd+W ...), and macOS drops keyups while Cmd is held: stop everything
    // a movement key stops a walk to a piece at once, even if released before the next frame
    keyDown({ key, metaKey, ctrlKey, altKey }) {
      if (metaKey || ctrlKey || altKey) { keys.clear(); return; }
      const k = key.toLowerCase();
      keys.add(k);
      if (MOVE_KEYS.includes(k)) flight = null;
    },
    keyUp(key) { keys.delete(key.toLowerCase()); },
    blur() { keys.clear(); pointers.clear(); },
    // walk to stand at {x, z} looking at {x, y, z}; calling it again (same piece or another) starts afresh
    goTo(stand, look) {
      const yaw = Math.atan2(stand.x - look.x, stand.z - look.z);
      const pitch = Math.min(1.45, Math.max(-1.45, Math.atan2(look.y - EYE, Math.hypot(look.x - stand.x, look.z - stand.z))));
      flight = { x: stand.x, z: stand.z, yaw: me.yaw + Math.atan2(Math.sin(yaw - me.yaw), Math.cos(yaw - me.yaw)), pitch };
    },
    // WASD / arrows walk 2.6 m/s, Q/E turn; dt capped at 50 ms so a frame after a pause can't teleport you
    frame(now) {
      const dt = last === null ? 0 : Math.min(0.05, Math.max(0, now - last) / 1000); last = now;
      const f = pressed("w", "arrowup") - pressed("s", "arrowdown"), r = pressed("d", "arrowright") - pressed("a", "arrowleft");
      if (f || r) move(f * 2.6 * dt, r * 2.6 * dt);
      const q = keys.has("q") - keys.has("e");
      if (q) turn(q * 300 * dt, 0);
      if (flight) fly(dt);
      return { x: me.x, y: EYE, z: me.z, pitch: me.pitch, yaw: me.yaw, roll: 0, flying: !!flight };
    },
  };
}
