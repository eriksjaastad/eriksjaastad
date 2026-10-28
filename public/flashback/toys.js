// Things in the cabin you pick up and turn over in your hands, kept out of the page so they can be tested in node.

// The robot in the top drawer: a '90s toy that changes between a truck and a robot. Each part has a pose in each
// form, [x, y, z, rx, ry, rz] in metres and radians, the toy's floor at y 0 and its front towards +z. Every rotation
// turns about one axis, so the parts can move straight from one pose to the other.
export const ROBOT = [
  { name: "legL", shape: "box", size: [0.022, 0.07, 0.024], colour: "#2456c8", truck: [-0.014, 0.012, -0.05, -Math.PI / 2, 0, 0], robot: [-0.014, 0.035, 0, 0, 0, 0] },
  { name: "legR", shape: "box", size: [0.022, 0.07, 0.024], colour: "#2456c8", truck: [0.014, 0.012, -0.05, -Math.PI / 2, 0, 0], robot: [0.014, 0.035, 0, 0, 0, 0] },
  { name: "hips", shape: "box", size: [0.05, 0.015, 0.024], colour: "#9aa0a8", truck: [0, 0.012, -0.0125, -Math.PI / 2, 0, 0], robot: [0, 0.0775, 0, 0, 0, 0] },
  { name: "chest", shape: "box", size: [0.056, 0.045, 0.03], colour: "#c8202a", truck: [0, 0.03, 0.02, 0, 0, 0], robot: [0, 0.1075, 0, 0, 0, 0] },
  { name: "windows", shape: "box", size: [0.044, 0.016, 0.002], colour: "#7fd3ff", truck: [0, 0.04, 0.036, 0, 0, 0], robot: [0, 0.115, 0.016, 0, 0, 0] },
  { name: "grille", shape: "box", size: [0.03, 0.012, 0.002], colour: "#c9ccd2", truck: [0, 0.018, 0.036, 0, 0, 0], robot: [0, 0.094, 0.016, 0, 0, 0] },
  { name: "armL", shape: "box", size: [0.016, 0.05, 0.018], colour: "#c8202a", truck: [-0.02, 0.012, -0.002, -Math.PI / 2, 0, 0], robot: [-0.038, 0.1, 0, 0, 0, 0.12] },
  { name: "armR", shape: "box", size: [0.016, 0.05, 0.018], colour: "#c8202a", truck: [0.02, 0.012, -0.002, -Math.PI / 2, 0, 0], robot: [0.038, 0.1, 0, 0, 0, -0.12] },
  { name: "head", shape: "box", size: [0.018, 0.02, 0.018], colour: "#2456c8", truck: [0, 0.03, 0.005, 0, 0, 0], robot: [0, 0.14, 0, 0, 0, 0] },
  { name: "stackL", shape: "stack", size: [0.004, 0.03, 0.004], colour: "#c9ccd2", truck: [-0.024, 0.06, 0.006, 0, 0, 0], robot: [-0.024, 0.14, -0.012, 0, 0, 0] },
  { name: "stackR", shape: "stack", size: [0.004, 0.03, 0.004], colour: "#c9ccd2", truck: [0.024, 0.06, 0.006, 0, 0, 0], robot: [0.024, 0.14, -0.012, 0, 0, 0] },
  ...[[-1, 0.02], [1, 0.02], [-1, -0.075], [1, -0.075]].map(([s, z], i) => ({
    name: `wheel${i}`, shape: "wheel", size: [0.009, 0.008, 0.009], colour: "#1b1b1d",
    truck: [s * 0.03, 0.009, z, 0, 0, Math.PI / 2], robot: [s * 0.028, i < 2 ? 0.05 : 0.02, 0, 0, 0, Math.PI / 2],
  })),
];

// a part's pose `f` of the way from truck (0) to robot (1); f outside 0..1 is held at the ends
export function pose(part, f) {
  const k = Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
  return part.truck.map((a, i) => (1 - k) * a + k * part.robot[i]);  // exact at both ends
}

// Turning a thing over in your hands: one finger (pointer `id`) drags it round, sideways to spin it, up and down
// to tip it (never past 70 degrees, so it can't end up upside down and lost). A press that barely moves is a tap.
export const TURN = 0.01, TIP = 1.2, TAP = 6;  // radians per pixel, the furthest tip, how far (px) a tap may wander
export function turner(yaw = 0.5, pitch = 0.25) {
  let owner = null, lastX = 0, lastY = 0, travel = 0;
  const ok = (x, y) => Number.isFinite(x) && Number.isFinite(y);
  return {
    get yaw() { return yaw; },
    get pitch() { return pitch; },
    grab(x, y, id = 0) { if (owner !== null || !ok(x, y)) return false; owner = id; lastX = x; lastY = y; travel = 0; return true; },
    move(x, y, id = 0) {
      if (id !== owner || !ok(x, y)) return;
      yaw += (x - lastX) * TURN; pitch = Math.min(TIP, Math.max(-TIP, pitch + (y - lastY) * TURN));
      travel += Math.hypot(x - lastX, y - lastY); lastX = x; lastY = y;
    },
    // the finger lifts at x, y (where it lifts counts): true if that was a tap
    release(x, y, id = 0) { if (id !== owner) return false; this.move(x, y, id); owner = null; return travel < TAP; },
    // a finger's press was interrupted: nothing it does from here counts; with no id, whichever finger holds it
    cancel(id) { if (id === undefined || id === owner) owner = null; },
  };
}

// The page's pointer events on the thing in your hands, wired to a turner: every coalesced sample of a move counts,
// so a fast drag can't pass for a tap, and the press ends on lift, cancel or lost capture. onTap() runs for a tap.
// drop() ends any press (the view closed or the window lost focus), so a late lift does nothing; reset() starts over
// with a fresh turn for the next time it's picked up.
export function inHands(el, onTap) {
  let t = turner();
  el.addEventListener("pointerdown", e => { if (t.grab(e.clientX, e.clientY, e.pointerId)) el.setPointerCapture?.(e.pointerId); });
  el.addEventListener("pointermove", e => {
    const all = e.getCoalescedEvents?.();  // every sample since the last event; Safari has none
    for (const c of all?.length ? all : [e]) t.move(c.clientX, c.clientY, e.pointerId);
  });
  el.addEventListener("pointerup", e => { if (t.release(e.clientX, e.clientY, e.pointerId)) onTap(); });
  for (const type of ["pointercancel", "lostpointercapture"]) el.addEventListener(type, e => t.cancel(e.pointerId));
  return { get yaw() { return t.yaw; }, get pitch() { return t.pitch; }, drop() { t.cancel(); }, reset() { t = turner(); } };
}
