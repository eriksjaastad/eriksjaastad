// The Flashback cabin's floor plan: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { standable, walker, heading } from "../public/gallery/walk.js";
import { CABIN, START, SPOTS, OPENABLE, hinges, COUNTER, DOORS_FROM, BOX, CRAYON, SITE_COLOURS, crayons } from "../public/flashback/cabin.js";

// the furniture's footprint (index.html): chest x -0.75..0.75 to z -3.4, rollerblades from x 2.4, snowboard in the corner, phone table + chair on the left wall
const inside = (x, z) => (Math.abs(x) < 0.75 && z < -3.35) || (x > 2.35 && z < -3.25) || (x < -2.95 && z > -2.7 && z < -0.75);  // ... and the phone table and chair

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

test("hinges: a tap opens a drawer in 0.4 s, another shuts it, and the others don't move", () => {
  const h = hinges();
  h.toggle("drawer1");
  assert.equal(h.step(0.2).drawer1, 0.5);
  const f = h.step(1);
  assert.ok(f.drawer1 === 1 && OPENABLE.filter(n => n !== "drawer1").every(n => f[n] === 0));
  h.toggle("drawer1"); assert.equal(h.step(0.4).drawer1, 0);
});

test("hinges: any taps and frame gaps keep every part between shut and open, turning round without jumps", () => {
  const ev = fc.oneof(fc.constantFrom(...OPENABLE).map(n => ({ n })), fc.oneof(fc.double({ min: -1, max: 2 }), fc.constant(NaN), fc.constant(Infinity)).map(dt => ({ dt })));
  fc.assert(fc.property(fc.array(ev, { maxLength: 40 }), events => {
    const h = hinges(), want = Object.fromEntries(OPENABLE.map(n => [n, 0]));  // each tap flips what we expect
    let prev = h.step(0);
    for (const e of events) {
      if ("n" in e) { h.toggle(e.n); want[e.n] = 1 - want[e.n]; continue; }
      const f = h.step(e.dt), most = Number.isFinite(e.dt) ? Math.max(0, e.dt) / 0.4 : 0;
      for (const n of OPENABLE) {
        const why = `${n} ${prev[n]} -> ${f[n]} toward ${want[n]} in ${e.dt}`, gap = want[n] - prev[n];
        assert.ok(f[n] >= 0 && f[n] <= 1, why);
        // toward the latest tap's end, by the full step or all the way when that's closer
        assert.ok(Math.abs(f[n] - (prev[n] + Math.sign(gap) * Math.min(Math.abs(gap), most))) < 1e-12, why);
      }
      prev = f;
    }
  }), { numRuns: 500 });
});

test("crayons: 64 in the box, all sharp but one worn stub per site colour, and nothing reaches the cabinet doors' swing", () => {
  const list = crayons();
  assert.equal(list.length, 64);
  assert.deepEqual(list.filter(k => k.worn).map(k => k.colour), SITE_COLOURS);
  assert.ok(list.filter(k => !k.worn).every(k => !SITE_COLOURS.includes(k.colour)));
  for (const k of list) {
    assert.ok(Math.abs(k.x) + CRAYON.r <= BOX.w / 2 && Math.abs(k.z) + CRAYON.r <= BOX.d / 2, "inside the box");
    assert.ok(COUNTER + Math.max(k.top, BOX.flap) < DOORS_FROM, "under the doors as they swing open and shut");
    if (!k.worn) assert.ok(k.top > Math.max(...list.filter(o => o.worn && o.y === k.y).map(o => o.top), -Infinity), "worn ones are shorter");
  }
  for (const [i, a] of list.entries()) for (const b of list.slice(i + 1))
    if (Math.abs(a.y - b.y) < CRAYON.body) assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 2 * CRAYON.r, "no two crayons side by side overlap");
});
