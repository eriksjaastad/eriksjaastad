// Walking rules behind /gallery/: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { ROOM, standable, walk, heading } from "../public/gallery/walk.js";

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
