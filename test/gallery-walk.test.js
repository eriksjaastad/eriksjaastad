// Walking rules behind /gallery/: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { ROOM, standable, walk, heading, wheelMeters, walker, EYE } from "../public/gallery/walk.js";

const coord = fc.double({ min: -20, max: 20, noNaN: true });
const start = fc.tuple(fc.double({ min: ROOM.minX, max: ROOM.maxX, noNaN: true }), fc.double({ min: ROOM.minZ, max: ROOM.maxZ, noNaN: true }))
  .filter(([x, z]) => standable(x, z, ROOM)).map(([x, z]) => ({ x, z }));

test("no sequence of moves leaves the floor or enters a plinth, the stand or the chest", () => {
  fc.assert(fc.property(start, fc.array(fc.tuple(coord, coord), { maxLength: 20 }), (p, moves) => {
    for (const [dx, dz] of moves) p = walk(p, dx, dz);
    assert.ok(standable(p.x, p.z, ROOM), JSON.stringify(p));
  }));
});

test("a long move straight at the book stand stops in front of it instead of jumping across", () => {
  const p = walk({ x: 0, z: -7 }, 0, -2.3);  // stand at z -8.4, r 0.6; the floor behind it is open
  assert.ok(p.z > -8.4 + 0.6 - 1e-9, JSON.stringify(p));
});

test("a sideways move along a wall slides instead of sticking", () => {
  const p = walk({ x: 0, z: 0 }, 9, 1);
  assert.ok(Math.abs(p.z - 1) < 1e-9, JSON.stringify(p));
  assert.ok(p.x <= ROOM.maxX && p.x > 5);
});

test("absurd deltas leave you where you were or bounded", () => {
  for (const d of [NaN, Infinity, -Infinity]) assert.deepEqual(walk({ x: 0, z: 0 }, d, 0), { x: 0, z: 0 });
});

test("one call walks at most 10 m however large the finite delta", () => {
  const from = { x: -3, z: 5.4 };  // a clear 15 m lane down the room
  const p = walk(from, 0, -1e6);
  const moved = Math.hypot(p.x - from.x, p.z - from.z);
  assert.ok(moved <= 10 + 1e-9 && moved > 9.9, String(moved));
});

test("heading: yaw 0 walks down -z, right is +x", () => {
  const f = heading(0, 1, 0), r = heading(0, 0, 1);
  assert.ok(Math.abs(f.dx) < 1e-12 && f.dz === -1);
  assert.ok(r.dx === 1 && Math.abs(r.dz) < 1e-12);
});

test("wheel: a Firefox line notch walks as far as the same pixels; output is bounded", () => {
  assert.equal(wheelMeters(3, 1, 800), wheelMeters(48, 0, 800));
  assert.equal(wheelMeters(1, 2, 800), wheelMeters(120, 0, 800));  // a page is clamped
  assert.ok(wheelMeters(-48, 0, 800) > 0 && wheelMeters(NaN, 0, 800) === 0);  // scroll up walks forward
});

const at = () => walker({ x: 0, z: 0, yaw: 0, pitch: 0 }), walkFor = (w, ms) => { w.frame(0); return w.frame(ms); };

test("walker: any input keeps eye height, no roll, pitch within +-1.45 and floor under you", () => {
  const ev = fc.tuple(fc.integer({ min: 0, max: 3 }), fc.integer({ min: -900, max: 900 }), fc.integer({ min: -900, max: 900 }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 30 }), events => {
    const w = at();
    for (const [k, a, b] of events) [() => w.pointerDown(1, a, b, a > 0), () => w.pointerMove(1, a, b), () => w.wheel(a, 0, 800), () => w.pointerUp(1)][k]();
    const p = w.frame(16);
    assert.ok(p.y === EYE && p.roll === 0 && Math.abs(p.pitch) <= 1.45 && standable(p.x, p.z, ROOM), JSON.stringify(p));
  }));
});

test("walker: held keys stop on blur and on a modifier in either order; a long gap moves one capped frame", () => {
  let w = at(); w.keyDown({ key: "w" }); w.blur(); assert.equal(walkFor(w, 16).z, 0);
  w = at(); w.keyDown({ key: "W" }); w.keyDown({ key: "Meta", metaKey: true }); assert.equal(walkFor(w, 16).z, 0);
  w = at(); w.keyDown({ key: "w", ctrlKey: true }); assert.equal(walkFor(w, 16).z, 0);
  w = at(); w.keyDown({ key: "w" }); assert.ok(Math.abs(walkFor(w, 10000).z + 2.6 * 0.05) < 1e-9);
});

test("walker: after two fingers become one, the next 1 px move turns 1 px worth", () => {
  const w = at();
  w.pointerDown(1, 0, 0, false); w.pointerDown(2, 50, 0, false);
  w.pointerMove(1, 200, 0); w.pointerUp(2); w.pointerMove(1, 201, 0);
  assert.ok(Math.abs(w.frame(0).yaw - 0.005) < 1e-12);
});

