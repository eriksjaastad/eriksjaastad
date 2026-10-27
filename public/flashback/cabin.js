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
