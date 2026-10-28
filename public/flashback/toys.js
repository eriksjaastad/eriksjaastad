// Things in the cabin you pick up and turn over in your hands, kept out of the page so they can be tested in node.

// The things on the countertop. Each is a list of parts lying as they rest on the counter (floor at y 0, front
// towards +z), and each part has two poses, a and b, as [x, y, z, rx, ry, rz] in metres and radians; tapping the
// thing in your hands moves it from one to the other (the robot from truck to robot, the flip phone from shut to
// open). Each rotation turns about one axis. A part with `from` is drawn that far from its position, so it turns
// about its position like a hinge (the flip phone's lid).
const flat = (x, y, z) => [x, y, z, 0, 0, 0];
const same = (part, at) => ({ ...part, a: at, b: at });
export const ROBOT = [
  { name: "legL", shape: "box", size: [0.022, 0.07, 0.024], colour: "#2456c8", a: [-0.014, 0.012, -0.05, -Math.PI / 2, 0, 0], b: flat(-0.014, 0.035, 0) },
  { name: "legR", shape: "box", size: [0.022, 0.07, 0.024], colour: "#2456c8", a: [0.014, 0.012, -0.05, -Math.PI / 2, 0, 0], b: flat(0.014, 0.035, 0) },
  { name: "hips", shape: "box", size: [0.05, 0.015, 0.024], colour: "#9aa0a8", a: [0, 0.012, -0.0125, -Math.PI / 2, 0, 0], b: flat(0, 0.0775, 0) },
  { name: "chest", shape: "box", size: [0.056, 0.045, 0.03], colour: "#c8202a", a: flat(0, 0.03, 0.02), b: flat(0, 0.1075, 0) },
  { name: "windows", shape: "box", size: [0.044, 0.016, 0.002], colour: "#7fd3ff", a: flat(0, 0.04, 0.036), b: flat(0, 0.115, 0.016) },
  { name: "grille", shape: "box", size: [0.03, 0.012, 0.002], colour: "#c9ccd2", a: flat(0, 0.018, 0.036), b: flat(0, 0.094, 0.016) },
  { name: "armL", shape: "box", size: [0.016, 0.05, 0.018], colour: "#c8202a", a: [-0.02, 0.012, -0.002, -Math.PI / 2, 0, 0], b: [-0.038, 0.1, 0, 0, 0, 0.12] },
  { name: "armR", shape: "box", size: [0.016, 0.05, 0.018], colour: "#c8202a", a: [0.02, 0.012, -0.002, -Math.PI / 2, 0, 0], b: [0.038, 0.1, 0, 0, 0, -0.12] },
  { name: "head", shape: "box", size: [0.018, 0.02, 0.018], colour: "#2456c8", a: flat(0, 0.03, 0.005), b: flat(0, 0.14, 0) },
  { name: "stackL", shape: "rod", size: [0.004, 0.03, 0.004], colour: "#c9ccd2", a: flat(-0.024, 0.06, 0.006), b: flat(-0.024, 0.14, -0.012) },
  { name: "stackR", shape: "rod", size: [0.004, 0.03, 0.004], colour: "#c9ccd2", a: flat(0.024, 0.06, 0.006), b: flat(0.024, 0.14, -0.012) },
  ...[[-1, 0.02], [1, 0.02], [-1, -0.075], [1, -0.075]].map(([s, z], i) => ({
    name: `wheel${i}`, shape: "wheel", size: [0.009, 0.008, 0.009], colour: "#1b1b1d",
    a: [s * 0.03, 0.009, z, 0, 0, Math.PI / 2], b: [s * 0.028, i < 2 ? 0.05 : 0.02, 0, 0, 0, Math.PI / 2],
  })),
];
// the flip phone: thin and silver, shut on the counter; open, the lid swings up on its hinge to show the screen
// inside and the blue-lit keypad
const FLIP = [
  same({ name: "base", shape: "box", size: [0.053, 0.007, 0.098], colour: "#aeb3bb" }, flat(0, 0.0035, 0)),
  same({ name: "keys", shape: "box", size: [0.044, 0.0006, 0.06], colour: "#6fb7ff" }, flat(0, 0.0073, 0.012)),
  same({ name: "hinge", shape: "wheel", size: [0.0045, 0.05, 0.0045], colour: "#8d929b" }, [0, 0.007, -0.049, 0, 0, Math.PI / 2]),
  { name: "lid", shape: "box", size: [0.053, 0.007, 0.098], colour: "#aeb3bb", from: [0, 0.0035, 0.049], a: flat(0, 0.007, -0.049), b: [0, 0.007, -0.049, -2.75, 0, 0] },
  { name: "screen", shape: "box", size: [0.04, 0.0006, 0.05], colour: "#2f6fd0", from: [0, -0.0004, 0.052], a: flat(0, 0.007, -0.049), b: [0, 0.007, -0.049, -2.75, 0, 0] },
  { name: "outer", shape: "box", size: [0.02, 0.0005, 0.02], colour: "#111318", from: [0, 0.0073, 0.075], a: flat(0, 0.007, -0.049), b: [0, 0.007, -0.049, -2.75, 0, 0] },
];
// the brick: a navy candy bar with a grey-green screen that lights up when you turn it on, and a stubby antenna
const BRICK = [
  same({ name: "body", shape: "box", size: [0.048, 0.02, 0.132], colour: "#22304f" }, flat(0, 0.01, 0)),
  same({ name: "face", shape: "box", size: [0.042, 0.001, 0.124], colour: "#34415f" }, flat(0, 0.0205, 0)),
  same({ name: "screen", shape: "box", size: [0.034, 0.0008, 0.028], colour: "#6f7d5c" }, flat(0, 0.0212, -0.035)),
  { name: "glow", shape: "box", size: [0.032, 0.0006, 0.026], colour: "#b8e07a", a: flat(0, 0.01, -0.035), b: flat(0, 0.0219, -0.035) },
  same({ name: "nav", shape: "box", size: [0.026, 0.0015, 0.01], colour: "#c9ccd2" }, flat(0, 0.0215, 0.0)),
  ...Array.from({ length: 12 }, (_, i) => same({ name: `key${i}`, shape: "box", size: [0.01, 0.0015, 0.007], colour: "#c9ccd2" },
    flat(-0.013 + (i % 3) * 0.013, 0.0215, 0.016 + Math.floor(i / 3) * 0.011))),
  same({ name: "antenna", shape: "rod", size: [0.004, 0.012, 0.004], colour: "#1a2238" }, [0.015, 0.012, -0.071, Math.PI / 2, 0, 0]),
];
// the MP3 player that played discs the size of a quarter: the gold disc slides out of its side
const MP3 = [
  same({ name: "body", shape: "box", size: [0.06, 0.016, 0.075], colour: "#c8ccd4" }, flat(0, 0.008, 0)),
  same({ name: "screen", shape: "box", size: [0.032, 0.0006, 0.016], colour: "#2b3a2e" }, flat(0, 0.0163, -0.02)),
  ...[-0.014, 0, 0.014].map((x, i) => same({ name: `button${i}`, shape: "wheel", size: [0.004, 0.0016, 0.004], colour: "#6d7480" }, flat(x, 0.0166, 0.016))),
  same({ name: "slot", shape: "box", size: [0.0012, 0.003, 0.036], colour: "#30343a" }, flat(0.0302, 0.008, 0.008)),
  { name: "disc", shape: "wheel", size: [0.016, 0.0012, 0.016], colour: "#d4b25a", a: flat(0.012, 0.008, 0.008), b: flat(0.05, 0.008, 0.008) },
];
// each thing: its caption, what tapping it does, its parts, where it rests on the counter (x, turned), and in your
// hands how high its middle is and how far away you hold it
export const THINGS = {
  brick: { title: "Cell phone", note: "the brick: dropped a hundred times, never broke", verb: "Turn it on", parts: BRICK, at: [-0.22, 0.3], middle: 0.01, view: 0.4 },
  flip: { title: "Flip phone", note: "snap it shut to hang up", verb: "Flip it open", parts: FLIP, at: [-0.03, -0.15], middle: 0.02, view: 0.36 },
  mp3: { title: "MP3 player", note: "its discs were the size of a quarter", verb: "Eject the disc", parts: MP3, at: [0.15, 0.2], middle: 0.008, view: 0.3 },
  robot: { title: "Robot", note: "it changes into a truck", verb: "Change it", parts: ROBOT, at: [0.4, -0.5], middle: 0.075, view: 0.5 },
};

// a part's pose `f` of the way from a (0) to b (1); f outside 0..1 is held at the ends
export function pose(part, f) {
  const k = Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
  return part.a.map((v, i) => (1 - k) * v + k * part.b[i]);  // exact at both ends
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
