// The gallery's room styles: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { styleFrom, FOOTPRINT, hypostyleColumns, NAVE, AISLE, PANTHEON, bounds, shadowBox } from "../public/gallery/rooms.js";

test("rooms: ?room= picks a style by name; anything else is the classic room", () => {
  assert.equal(styleFrom("?room=hypostyle"), "hypostyle"); assert.equal(styleFrom("?room=pantheon"), "pantheon");
  for (const s of ["", "?room=", "?room=PANTHEON", "?room=toString", "?room=__proto__", "?other=pantheon", "?room=egypt"]) assert.equal(styleFrom(s), "classic", s);
});

// the gap between a circle and the footprint rectangle (negative: they overlap)
const gap = ([x, z], r) => Math.hypot(Math.max(FOOTPRINT.minX - x, 0, x - FOOTPRINT.maxX), Math.max(FOOTPRINT.minZ - z, 0, z - FOOTPRINT.maxZ)) - r;

test("hypostyle: every column stands clear of the gallery by at least a metre, about 134 of them, never two in one place", () => {
  const { nave, aisles } = hypostyleColumns();
  for (const c of nave) assert.ok(gap(c, NAVE.r) >= 1, `nave ${c}`);
  for (const c of aisles) assert.ok(gap(c, AISLE.r) >= 1, `aisle ${c}`);
  const all = [...nave, ...aisles];
  assert.equal(nave.length, 12); assert.ok(all.length >= 130 && all.length <= 140, `${all.length}`);
  assert.equal(new Set(all.map(String)).size, all.length);
});

test("pantheon: the whole gallery fits inside the rotunda with room to spare", () => {
  for (const x of [FOOTPRINT.minX, FOOTPRINT.maxX]) for (const z of [FOOTPRINT.minZ, FOOTPRINT.maxZ]) {
    assert.ok(Math.hypot(x - PANTHEON.x, z - PANTHEON.z) <= PANTHEON.r - 8, `${x},${z}`);
  }
});

// a point's light-space position, independently of shadowBox: three.js lookAt basis for a camera at `from` aimed at `to`
function lightSpace(from, to, p) {
  const b = [from[0] - to[0], from[1] - to[1], from[2] - to[2]], bl = Math.hypot(...b), back = b.map(v => v / bl);
  let right = [back[2], 0, -back[0]]; const rl = Math.hypot(...right); right = right.map(v => v / rl);  // up x back
  const up = [back[1] * right[2] - back[2] * right[1], back[2] * right[0] - back[0] * right[2], back[0] * right[1] - back[1] * right[0]];
  const d = [p[0] - from[0], p[1] - from[1], p[2] - from[2]], dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
  return { x: dot(d, right), y: dot(d, up), depth: -dot(d, back) };
}

test("shadowBox: for any sun and any box, every point inside the box is inside the light's shadow camera", () => {
  const v = fc.double({ min: -60, max: 60, noNaN: true }), box = fc.tuple(v, v, v, v, v, v).map(([a, b, c, d, e, f]) =>
    ({ minX: Math.min(a, b), maxX: Math.max(a, b), minY: Math.min(c, d), maxY: Math.max(c, d), minZ: Math.min(e, f), maxZ: Math.max(e, f) }));
  const sunAt = fc.tuple(v, fc.double({ min: 30, max: 120, noNaN: true }), v);
  fc.assert(fc.property(sunAt, fc.tuple(v, fc.constant(0), v), box, fc.tuple(...[0, 1, 2].map(() => fc.double({ min: 0, max: 1, noNaN: true }))),
    ([fx, fy, fz], to, b, [u, w, t]) => {
      const from = [fx + to[0] + 0.5, fy, fz + to[2]];  // the sun stands above, never exactly overhead of `to`
      const cam = shadowBox({ x: from[0], y: from[1], z: from[2] }, { x: to[0], y: to[1], z: to[2] }, b, 0);
      const p = [b.minX + u * (b.maxX - b.minX), b.minY + w * (b.maxY - b.minY), b.minZ + t * (b.maxZ - b.minZ)], ls = lightSpace(from, to, p);
      const e = 1e-6 * (1 + Math.abs(ls.depth) + Math.abs(ls.x) + Math.abs(ls.y));
      assert.ok(ls.x >= cam.left - e && ls.x <= cam.right + e && ls.y >= cam.bottom - e && ls.y <= cam.top + e && ls.depth <= cam.far + e, JSON.stringify({ ls, cam }));
      assert.ok(ls.depth >= cam.near - e || cam.near === 0.1);
    }), { numRuns: 500 });
});

test("bounds: each big space's box holds everything it builds, including the corners the review found unshadowed", () => {
  const h = bounds("hypostyle"), inside = (b, [x, y, z]) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY && z >= b.minZ && z <= b.maxZ;
  const { nave, aisles } = hypostyleColumns();
  for (const [x, z] of nave) assert.ok(inside(h, [x - NAVE.r, NAVE.h, z]) && inside(h, [x + NAVE.r, 0, z]));
  for (const [x, z] of aisles) assert.ok(inside(h, [x - AISLE.r, AISLE.h, z]) && inside(h, [x + AISLE.r, 0, z]));
  assert.ok(inside(h, [45, 0, 0.6]) && inside(h, [-h.maxX, NAVE.h + 5, 0]));
  const p = bounds("pantheon");
  assert.ok(inside(p, [-15, 0, 13]) && inside(p, [PANTHEON.x, 2 * PANTHEON.r, PANTHEON.z]) && inside(p, [PANTHEON.x + PANTHEON.r, PANTHEON.r, PANTHEON.z]));
});
