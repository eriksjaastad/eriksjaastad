// The gallery's room styles. The gallery itself (its pieces, where they stand, the floor you walk) is the same in
// every one; a style is the space around it. Classic is the original walled room. The others take the walls away and
// stand the gallery, roped off, in the middle of a real place at its real size.

export const STYLES = ["classic", "hypostyle", "pantheon"];

// the style a page address asks for (?room=hypostyle, ?room=pantheon), or the classic room for anything else
export function styleFrom(search) {
  const s = new URLSearchParams(search).get("room");
  return STYLES.includes(s) ? s : "classic";
}

// The gallery's footprint (index.html: x -6..6, z -10..6). Nothing a style builds may stand inside it.
export const FOOTPRINT = { minX: -6, maxX: 6, minZ: -10, maxZ: 6 };

// The Great Hypostyle Hall at Karnak: a nave of 12 open-papyrus columns about 21 m tall and 3.5 m thick, and on
// either side rows of shorter (about 15 m) bud columns, about 134 columns in all. The gallery stands in the nave.
export const NAVE = { r: 1.75, h: 21, rows: [-9.3, 9.3], zs: Array.from({ length: 6 }, (_, i) => -2 + (i - 2.5) * 7) };
export const AISLE = { r: 1.35, h: 14, xs: Array.from({ length: 7 }, (_, k) => 13.6 + k * 5.2), zs: Array.from({ length: 9 }, (_, i) => -2 + (i - 4) * 5.2) };
export function hypostyleColumns() {
  return {
    nave: NAVE.rows.flatMap(x => NAVE.zs.map(z => [x, z])),
    aisles: [-1, 1].flatMap(side => AISLE.xs.flatMap(x => AISLE.zs.map(z => [side * x, z]))),
  };
}

// The Pantheon's rotunda: 43.3 m across and 43.3 m from the floor to the top of the dome (a sphere would just fit
// inside), with an 8.2 m oculus open to the sky. Centred on the gallery.
export const PANTHEON = { r: 21.65, oculus: 4.1, x: 0, z: -2 };

// The box each big space fills (walls, roofs, dome), which the sun's shadow camera must cover: three.js gives anything
// outside that camera unshadowed sunlight, as if no roof were there.
export function bounds(style) {
  if (style === "hypostyle") {
    const outer = AISLE.xs.at(-1) + 4.5, zs = AISLE.zs;
    return { minX: -outer, maxX: outer, minY: 0, maxY: NAVE.h + 5.2, minZ: Math.min(...zs) - 4.5, maxZ: Math.max(...zs) + 4.5 };
  }
  const { r, x, z } = PANTHEON;
  return { minX: x - r, maxX: x + r, minY: 0, maxY: 2 * r, minZ: z - r, maxZ: z + r };
}

// The orthographic extents for a directional light at `from` aimed at `to` (three.js lookAt, world up +y) that hold
// every corner of `box`, and so everything inside it, with `margin` to spare. Points are {x, y, z}.
export function shadowBox(from, to, box, margin = 1) {
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }), dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const unit = a => { const l = Math.hypot(a.x, a.y, a.z); return { x: a.x / l, y: a.y / l, z: a.z / l }; };
  const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
  const back = unit(sub(from, to)), right = unit(cross({ x: 0, y: 1, z: 0 }, back)), up = cross(back, right);
  const xs = [], ys = [], ds = [];
  for (const x of [box.minX, box.maxX]) for (const y of [box.minY, box.maxY]) for (const z of [box.minZ, box.maxZ]) {
    const d = sub({ x, y, z }, from); xs.push(dot(d, right)); ys.push(dot(d, up)); ds.push(-dot(d, back));
  }
  return { left: Math.min(...xs) - margin, right: Math.max(...xs) + margin, bottom: Math.min(...ys) - margin, top: Math.max(...ys) + margin,
    near: Math.max(0.1, Math.min(...ds) - margin), far: Math.max(...ds) + margin };
}
