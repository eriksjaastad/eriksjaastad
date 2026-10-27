// The gallery's room styles: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { standable, walker, heading } from "../public/gallery/walk.js";
import { ROOMS, COLUMNS, COLUMN_R, styleFrom } from "../public/gallery/rooms.js";

// the standing spots and look points the page gives its pieces (index.html piece(...) calls)
const SPOTS = [
  ...[2, -2, -6].map(z => [{ x: -3.4, z }, { x: -6, y: 2.05, z }]),
  ...[2, -2, -6].map(z => [{ x: 2.4, z: z + 0.6 }, { x: 4.7, y: 1.4, z }]),
  [{ x: 0, z: -6.7 }, { x: 0, y: 1.1, z: -8.4 }], [{ x: -2.6, z: -6.6 }, { x: -4.7, y: 0.5, z: -8.9 }],
];
const START = { x: 0, z: 5, yaw: 0, pitch: -0.03 };

test("rooms: in every style, from the entrance every piece's spot is reached, facing the piece", () => {
  for (const [style, { floor }] of Object.entries(ROOMS)) {
    for (const [stand, look] of SPOTS) {
      const w = walker(START, floor);
      w.goTo(stand, look);
      let p; for (let t = 0; t <= 600; t++) p = w.frame(t * 16);
      const why = `${style} ${JSON.stringify(stand)} ended at ${p.x.toFixed(2)},${p.z.toFixed(2)}`;
      assert.ok(!p.flying && Math.hypot(p.x - stand.x, p.z - stand.z) < 1e-6, why);
      const d = heading(p.yaw, 1, 0);
      assert.ok(d.dx * (look.x - p.x) + d.dz * (look.z - p.z) > 0.99 * Math.hypot(look.x - p.x, look.z - p.z), why);
    }
  }
});

test("rooms: in the Egyptian hall no walking, sliding or pinching takes you into a column", () => {
  const ev = fc.tuple(fc.integer({ min: 0, max: 3 }), fc.integer({ min: 1, max: 2 }), fc.integer({ min: -900, max: 900 }), fc.integer({ min: -900, max: 900 }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 40 }), events => {
    const w = walker(START, ROOMS.egypt.floor);
    for (const [k, id, a, b] of events) {
      [() => w.pointerDown(id, a, b, a > 0), () => w.pointerMove(id, a, b), () => w.wheel(a, 0, 800), () => w.pointerUp(id, a, b)][k]();
      const p = w.frame(0);
      assert.ok(standable(p.x, p.z, ROOMS.egypt.floor) && COLUMNS.every(([x, z]) => Math.hypot(p.x - x, p.z - z) > COLUMN_R + 0.4), JSON.stringify(p));
    }
  }), { numRuns: 500 });
});

test("rooms: ?room= picks a style by name; anything else is the classic room", () => {
  assert.equal(styleFrom("?room=egypt"), "egypt");
  for (const s of ["", "?room=", "?room=EGYPT", "?room=toString", "?room=__proto__", "?other=egypt", "?room=nope"]) assert.equal(styleFrom(s), "classic", s);
});
