// Walking rules behind /gallery/: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { ROOM, standable, walk, heading, wheelMeters, walker, EYE, tapGesture } from "../public/gallery/walk.js";

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
  const ev = fc.tuple(fc.integer({ min: 0, max: 4 }), fc.integer({ min: -900, max: 900 }), fc.integer({ min: -900, max: 900 }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 30 }), events => {
    const w = at();
    let t = 0;  // a frame after every event, so walks to a (possibly unreachable) spot run too
    for (const [k, a, b] of events) {
      [() => w.pointerDown(1, a, b, a > 0), () => w.pointerMove(1, a, b), () => w.wheel(a, 0, 800), () => w.pointerUp(1), () => w.goTo({ x: a / 90, z: b / 90 }, { x: 0, y: 1, z: -9 })][k]();
      w.frame(t += 16);
    }
    const p = w.frame(t + 16);
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


test("walker: each control moves the view the way it says, and a released key stops", () => {
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  let w = at(); w.wheel(-48, 0, 800); assert.ok(near(w.frame(0).z, -48 * 0.006));         // scroll up walks forward
  w = at(); w.pointerDown(1, 0, 0, true); w.pointerMove(1, 0, 20);                          // slide-drag down walks forward
  assert.ok(near(w.frame(0).z, -0.2));
  w = at(); w.pointerDown(1, 0, 0, true); w.pointerMove(1, 20, 0); assert.ok(near(w.frame(0).x, -0.2));
  for (const [key, field, sign] of [["ArrowUp", "z", -1], ["ArrowDown", "z", 1], ["ArrowLeft", "x", -1], ["ArrowRight", "x", 1], ["a", "x", -1], ["d", "x", 1]]) {
    w = at(); w.keyDown({ key }); assert.ok(near(walkFor(w, 50)[field], sign * 2.6 * 0.05), key);
  }
  w = at(); w.keyDown({ key: "q" }); assert.ok(near(walkFor(w, 50).yaw, 300 * 0.05 * 0.005));
  w = at(); w.keyDown({ key: "E" }); assert.ok(near(walkFor(w, 50).yaw, -300 * 0.05 * 0.005));
  w = at(); w.keyDown({ key: "W" }); const moved = walkFor(w, 50).z; w.keyUp("w");
  assert.ok(moved < 0 && w.frame(100).z === moved);
});

// the standing spots and look points the page gives its pieces (index.html piece(...) calls)
const SPOTS = [
  ...[2, -2, -6].map(z => [{ x: -3.4, z }, { x: -6, y: 2.05, z }]),
  ...[2, -2, -6].map(z => [{ x: 2.4, z: z + 0.6 }, { x: 4.7, y: 1.4, z }]),
  [{ x: 0, z: -6.7 }, { x: 0, y: 1.1, z: -8.4 }], [{ x: -2.6, z: -6.6 }, { x: -4.7, y: 0.5, z: -8.9 }],
];
const run = (w, frames, t = 0) => { let p; for (let i = 0; i <= frames; i++) p = w.frame(t + i * 16); return p; };
const facing = (p, look) => { const d = heading(p.yaw, 1, 0); return Math.hypot(look.x - p.x, look.z - p.z) * Math.hypot(d.dx, d.dz) - (d.dx * (look.x - p.x) + d.dz * (look.z - p.z)); };

test("goTo: from the entrance every piece's spot is reached, facing the piece, and the walk then ends", () => {
  for (const [stand, look] of SPOTS) {
    const w = walker({ x: 0, z: 5, yaw: 0, pitch: 0 }); w.goTo(stand, look);
    const p = run(w, 600);
    assert.ok(Math.hypot(p.x - stand.x, p.z - stand.z) < 1e-6 && facing(p, look) < 1e-6 && !p.flying, JSON.stringify([stand, p]));
  }
});

test("goTo: the head turns the short way round, even after many turns", () => {
  const w = walker({ x: -3.4, z: 2, yaw: 6 * Math.PI + 1.4, pitch: 0 }); w.goTo({ x: -3.4, z: 2 }, { x: -6, y: 1.75, z: 2 });
  assert.ok(Math.abs(run(w, 100).yaw - (6 * Math.PI + Math.PI / 2)) < 1e-6);
});

test("goTo: any input of yours takes over; a zero nudge does not; asking again after an interruption still arrives", () => {
  const [stand, look] = SPOTS[6];
  for (const act of [w => w.wheel(-10, 0, 800), w => { w.pointerDown(1, 0, 0, false); w.pointerMove(1, 5, 0); }, w => w.keyDown({ key: "a" })]) {
    const w = walker({ x: 0, z: 5, yaw: 0, pitch: 0 }); w.goTo(stand, look); run(w, 10);
    act(w); assert.equal(run(w, 1, 1000).flying, false); w.keyUp("a"); w.pointerUp(1);
    w.goTo(stand, look); const p = run(w, 600, 2000);
    assert.ok(Math.hypot(p.x - stand.x, p.z - stand.z) < 1e-6);
  }
  const w = walker({ x: 0, z: 5, yaw: 0, pitch: 0 }); w.goTo(stand, look); run(w, 5);
  w.pointerDown(1, 0, 0, false); w.pointerMove(1, 0, 0); w.wheel(NaN, 0, 800); assert.equal(run(w, 1, 1000).flying, true);
});

test("goTo: a spot that can't be reached ends the walk on the floor instead of trying forever", () => {
  const w = walker({ x: 0, z: 5, yaw: 0, pitch: 0 }); w.goTo({ x: 4.7, z: -2 }, { x: 4.7, y: 1, z: -3 });  // inside a plinth
  const p = run(w, 2000);
  assert.ok(!p.flying && standable(p.x, p.z, ROOM), JSON.stringify(p));
});

test("tap: one primary pointer that barely moved is a tap; a drag, a right-drag, a pinch or a cancel is not", () => {
  const t = tapGesture();
  t.down(1, 0, 0, true); t.move(1, 3, 0); assert.equal(t.up(1), true);
  t.down(1, 0, 0, true); t.move(1, 7, 0); assert.equal(t.up(1), false);
  t.down(1, 0, 0, false); assert.equal(t.up(1), false);
  // pinch: each finger moves only a little, then they lift one at a time
  t.down(1, 0, 0, true); t.down(2, 50, 0, true); t.move(1, 3, 0); assert.equal(t.up(2), false); assert.equal(t.up(1), false);
  t.down(1, 0, 0, true); t.down(2, 50, 0, true); t.cancel(2); assert.equal(t.up(1), false);
  t.down(1, 0, 0, true); t.cancel(1); assert.equal(t.up(1), false);
  t.down(1, 0, 0, true); assert.equal(t.up(1), true);  // nothing left over from the gestures above
});
test("tap: any gesture that ever had two pointers down is never a tap", () => {
  const ev = fc.oneof(
    fc.record({ k: fc.constant("down"), id: fc.integer({ min: 1, max: 3 }), primary: fc.boolean() }),
    fc.record({ k: fc.constant("move"), id: fc.integer({ min: 1, max: 3 }), x: fc.integer({ min: -20, max: 20 }) }),
    fc.record({ k: fc.constant("up"), id: fc.integer({ min: 1, max: 3 }) }),
    fc.record({ k: fc.constant("cancel"), id: fc.integer({ min: 1, max: 3 }) }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 30 }), events => {
    const t = tapGesture(), live = new Set();
    let multi = false;
    for (const e of events) {
      if (e.k === "down") { if (live.has(e.id)) continue; live.add(e.id); if (live.size > 1) multi = true; t.down(e.id, 0, 0, e.primary); }
      else if (e.k === "move") t.move(e.id, e.x, 0);
      else if (!live.has(e.id)) continue;
      else if (e.k === "cancel") { live.delete(e.id); t.cancel(e.id); if (!live.size) multi = false; }
      else { live.delete(e.id); const tap = t.up(e.id); if (multi) assert.equal(tap, false); if (!live.size) multi = false; }
    }
  }));
});

test("goTo: the head turns gradually on the way and never tips past +-1.45, even over a piece at your feet", () => {
  let w = walker({ x: 0, z: 5, yaw: 0, pitch: 0 }); w.goTo(...SPOTS[0]);
  const mid = run(w, 10);
  assert.ok(mid.flying && mid.yaw > 0.01 && mid.yaw < Math.PI / 2 - 0.01, JSON.stringify(mid));
  w = walker({ x: 0, z: 0, yaw: 0, pitch: 0 }); w.goTo({ x: 0, z: 0 }, { x: 0, y: 0, z: -1e-4 });
  assert.ok(Math.abs(run(w, 100).pitch) <= 1.45);
});
