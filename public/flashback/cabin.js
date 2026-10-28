// The Flashback cabin's floor plan, shared by the page and its tests. Walking itself is ../gallery/walk.js.

// Room: x -4..4, z -4..4 (front door at +z, chest of drawers on the back wall). Standable floor is the walls
// minus 0.5 m, and keep-out circles [x, z, r] round the chest (two, it's wide), the snowboard corner, and on the
// left wall the phone table and its chair.
export const CABIN = {
  minX: -3.5, maxX: 3.5, minZ: -3.5, maxZ: 3.5,
  blockers: [[-0.4, -4, 0.95], [0.4, -4, 0.95], [3.2, -3.3, 1.0], [-3.55, -2.2, 0.85], [-3.3, -1.15, 0.7]],
};

export const START = { x: 0, z: 3, yaw: 0, pitch: -0.05 };

// things you can click: where to stand and what to look at
export const SPOTS = {
  chest: { stand: { x: 0, z: -1.3 }, look: { x: 0, y: 1.25, z: -3.8 } },
  snowboard: { stand: { x: 1.9, z: -2.1 }, look: { x: 3.6, y: 0.9, z: -3.7 } },
  rollerblades: { stand: { x: 1.6, z: -2.6 }, look: { x: 2.7, y: 0.1, z: -3.6 } },
  phone: { stand: { x: -2.1, z: -1.9 }, look: { x: -3.6, y: 0.8, z: -2.25 } },
  crayons: { stand: { x: -0.4, z: -2.75 }, look: { x: -0.4, y: 1.03, z: -3.45 } },
};

// The chest's drawers and cabinet doors. Each tap flips one between shut and open, and it moves there at a steady
// speed (0.4 s end to end); a tap mid-way turns it round from where it is. step(dt) advances them all and returns
// how open each is, 0 shut to 1 open.
export const OPENABLE = ["drawer0", "drawer1", "drawer2", "doorLeft", "doorRight"];
export function hinges(names = OPENABLE) {
  const at = Object.fromEntries(names.map(n => [n, 0])), want = { ...at };
  return {
    toggle(name) { want[name] = 1 - want[name]; },
    step(dt) {
      const d = Number.isFinite(dt) ? Math.max(0, dt) / 0.4 : 0;
      for (const n of names) at[n] += Math.max(-d, Math.min(d, want[n] - at[n]));
      return { ...at };
    },
  };
}

// The chest's countertop and what swings over it: the cabinet doors hang from DOORS_FROM up, and open out over the
// counter, so anything standing on the counter must stay below that.
export const COUNTER = 1.0, DOORS_FROM = 1.55 - 0.72 / 2;

// The crayon box on the countertop, laid out like the classic yellow carton: a front and a back tier (the back one
// standing higher), each split by cardboard into four compartments of two staggered rows (10 and 9), 152 crayons in
// all. Every crayon is sharp except seven, one in each of the site's colours, worn down to stubs (no caption says
// why). Positions are the box's own, its floor at y 0; `top` is the crayon's highest point. BOX is the carton: its
// front wall is low so the tips show, and the back rises into the upright flap (the open lid), `flap` high.
export const SITE_COLOURS = ["#ff6a00", "#ffc46b", "#ff8a65", "#ece7dc", "#9a968d", "#2e3039", "#15161b"];
export const CRAYON = { r: 0.0042, body: 0.075, tip: 0.016, stub: 0.004 };
export const BOX = { w: 0.36, d: 0.13, front: 0.07, back: 0.1, flap: 0.17, across: 4 };
export function crayons() {
  const worn = [5, 30, 58, 77, 101, 120, 146], gap = 2 * CRAYON.r + 0.0003, cell = BOX.w / BOX.across, out = [];
  for (let tier = 0; tier < 2; tier++) for (let c = 0; c < BOX.across; c++) for (let row = 0; row < 2; row++) {
    const n = 10 - row, y = (tier ? 0.057 : 0.004) + CRAYON.body / 2, z = (tier ? -0.018 : 0.04) - row * 0.0125;
    for (let k = 0; k < n; k++) {
      const i = out.length, w = worn.indexOf(i);
      out.push({ x: -BOX.w / 2 + cell * (c + 0.5) + (k - (n - 1) / 2) * gap, y, z, worn: w >= 0,
        colour: w >= 0 ? SITE_COLOURS[w] : `hsl(${(i * 137.5) % 360}, ${55 + (i * 7) % 40}%, ${38 + (i * 11) % 30}%)`,
        top: y + CRAYON.body / 2 + (w >= 0 ? CRAYON.stub : CRAYON.tip) });
    }
  }
  return out;
}
