// The Flashback cabin's floor plan, shared by the page and its tests. Walking itself is ../gallery/walk.js.

// Room: x -4..4, z -4..4 (front door at +z, chest of drawers on the back wall). Standable floor is the walls
// minus 0.5 m, and keep-out circles [x, z, r] round the chest (two, it's wide) and the snowboard corner.
export const CABIN = {
  minX: -3.5, maxX: 3.5, minZ: -3.5, maxZ: 3.5,
  blockers: [[-0.4, -4, 0.95], [0.4, -4, 0.95], [3.2, -3.3, 1.0]],
};

export const START = { x: 0, z: 3, yaw: 0, pitch: -0.05 };

// things you can click: where to stand and what to look at
export const SPOTS = {
  chest: { stand: { x: 0, z: -1.3 }, look: { x: 0, y: 1.25, z: -3.8 } },
  snowboard: { stand: { x: 1.9, z: -2.1 }, look: { x: 3.6, y: 0.9, z: -3.7 } },
  rollerblades: { stand: { x: 1.6, z: -2.6 }, look: { x: 2.7, y: 0.1, z: -3.6 } },
};
