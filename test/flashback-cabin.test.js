// The Flashback cabin's floor plan: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { standable, walker, heading } from "../public/gallery/walk.js";
import { CABIN, START, SPOTS } from "../public/flashback/cabin.js";

// the furniture's footprint (index.html): chest x -0.75..0.75 to z -3.4, rollerblades from x 2.4, snowboard in the corner
const inside = (x, z) => (Math.abs(x) < 0.75 && z < -3.35) || (x > 2.35 && z < -3.25);

test("cabin: no walking, sliding or pinching takes you off the floor or into the furniture", () => {
  const ev = fc.tuple(fc.integer({ min: 0, max: 3 }), fc.integer({ min: 1, max: 2 }), fc.integer({ min: -900, max: 900 }), fc.integer({ min: -900, max: 900 }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 40 }), events => {
    const w = walker(START, CABIN);
    for (const [k, id, a, b] of events) {
      [() => w.pointerDown(id, a, b, a > 0), () => w.pointerMove(id, a, b), () => w.wheel(a, 0, 800), () => w.pointerUp(id, a, b)][k]();
      const p = w.frame(0);
      assert.ok(standable(p.x, p.z, CABIN) && !inside(p.x, p.z), JSON.stringify(p));
    }
  }), { numRuns: 1000 });
});

test("cabin: from the door every thing you can click is reached, facing it, and the walk then ends", () => {
  assert.ok(standable(START.x, START.z, CABIN));
  for (const [name, { stand, look }] of Object.entries(SPOTS)) {
    const w = walker(START, CABIN);
    w.goTo(stand, look);
    let p; for (let t = 0; t <= 400; t++) p = w.frame(t * 16);
    assert.ok(!p.flying && Math.hypot(p.x - stand.x, p.z - stand.z) < 1e-6, name);
    const d = heading(p.yaw, 1, 0), to = Math.hypot(look.x - p.x, look.z - p.z);
    assert.ok(d.dx * (look.x - p.x) + d.dz * (look.z - p.z) > 0.99 * to, `${name} faces what it looks at`);
  }
});
