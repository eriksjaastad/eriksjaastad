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
  const ev = fc.tuple(fc.integer({ min: 0, max: 4 }), fc.integer({ min: -900, max: 900 }), fc.integer({ min: -900, max: 900 }), fc.integer({ min: 1, max: 3 }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 30 }), events => {
    const w = at();
    let t = 0;  // a frame after every event, so walks to a (possibly unreachable) spot run too
    for (const [k, a, b, id] of events) {  // up to three pointers, so pinches and their slides walk too
      [() => w.pointerDown(id, a, b, a > 0), () => w.pointerMove(id, a, b), () => w.wheel(a, 0, 800), () => w.pointerUp(id), () => w.goTo({ x: a / 90, z: b / 90 }, { x: 0, y: 1, z: -9 })][k]();
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

test("pinch: spreading two fingers walks forward, pinching walks back, moving both slides; a third finger stops it", () => {
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const two = () => { const w = at(); w.pointerDown(1, 0, 0, false); w.pointerDown(2, 100, 0, false); return w; };
  let w = two(); w.pointerMove(1, -30, 0); w.pointerMove(2, 130, 0); let p = w.frame(0);
  assert.ok(near(p.z, -0.6) && near(p.x, 0) && p.yaw === 0, "spread 60 px walks 0.6 m forward without turning");
  w = two(); w.pointerMove(1, 20, 0); w.pointerMove(2, 80, 0); p = w.frame(0);
  assert.ok(near(p.z, 0.4) && near(p.x, 0), "pinch 40 px walks back");
  w = two(); w.pointerMove(1, 0, 20); w.pointerMove(2, 100, 20); p = w.frame(0);
  assert.ok(near(p.z, -0.2) && near(p.x, 0), "both fingers 20 px down walks forward like a sliding drag");
  w = two(); w.pointerMove(1, 20, 0); w.pointerMove(2, 120, 0); assert.ok(near(w.frame(0).x, -0.2), "both 20 px right slides left");
  w = two(); w.pointerDown(3, 50, 50, false); w.pointerMove(2, 400, 0); w.pointerMove(3, 0, 300);
  p = w.frame(0); assert.ok(p.x === 0 && p.z === 0 && p.yaw === 0, "three fingers do nothing");
  w = at(); w.pointerDown(1, 0, 0, false); w.pointerDown(2, 300, 0, false); p = w.frame(0);
  assert.ok(p.x === 0 && p.z === 0 && p.yaw === 0, "a second finger landing far away does not move you");
});

test("pinch: two fingers come out the same in either event order, beside a wall or the book stand, and move once", () => {
  const gestures = { slide: [20, 120], spread: [-30, 130] };  // where fingers 1 and 2 (from x 0 and 100) move to
  for (const spot of [{ x: 0, z: 5.45 }, { x: 0.65, z: -8.4 }, { x: -5.45, z: 0 }, { x: 0, z: -9.45 }, { x: 0, z: 0 }]) {
    for (const [name, to] of Object.entries(gestures)) {
      const ends = [[1, 2], [2, 1]].map(order => {
        const w = walker({ ...spot, yaw: 0, pitch: 0 });
        w.pointerDown(1, 0, 0, false); w.pointerDown(2, 100, 0, false);
        for (const id of order) w.pointerMove(id, to[id - 1], 0);
        const p = w.frame(0);
        assert.deepEqual(w.frame(16), p, "the next frame does not move again");
        return p;
      });
      const why = `${name} at ${JSON.stringify(spot)}`;
      assert.deepEqual(ends[0], ends[1], why);
      assert.ok(standable(ends[0].x, ends[0].z, ROOM), why);
      if (name === "slide") assert.ok(Math.abs(ends[0].z - spot.z) < 1e-9, why);  // a sideways slide never walks forward
    }
  }
});

test("pinch: a pinch lands before whatever moves you next, with or without a frame in between", () => {
  const near = (a, b) => ["x", "z", "yaw"].every(k => Math.abs(a[k] - b[k]) < 1e-9);
  // each case: where you stand, a two-finger gesture (fingers start at x 0 and 100), then an input whose result
  // depends on order: a turn (one finger left), the wheel beside a plinth, a tap's walk to a piece
  const cases = {
    look: [{ x: 0, z: 0 }, [[1, -30], [2, 130]], w => { w.pointerUp(2, 130, 0); w.pointerMove(1, 70, 0); }],
    wheel: [{ x: 3.85, z: 2 }, [[1, -60], [2, 40]], w => w.wheel(-83, 0, 800)],
    // lifts with bad samples (NaN) walk nothing themselves, so the tap's walk to a piece is the next thing that moves you
    tap: [{ x: 0, z: 0 }, [[1, -30], [2, 130]], w => {
      w.pointerUp(1, NaN, NaN); w.pointerUp(2, NaN, NaN); w.pointerDown(3, 5, 5, false, true);
      assert.equal(w.pointerUp(3, NaN, NaN), true); w.goTo(...SPOTS[0]);
    }],
  };
  for (const [name, [spot, gesture, next]] of Object.entries(cases)) {
    const [a, b] = [false, true].map(frameBetween => {
      const w = walker({ ...spot, yaw: 0, pitch: 0 });
      w.pointerDown(1, 0, 0, false); w.pointerDown(2, 100, 0, false);
      for (const [id, x] of gesture) w.pointerMove(id, x, 0);
      if (frameBetween) w.frame(0);
      next(w);
      return w.frame(0);
    });
    assert.ok(near(a, b) && a.flying === b.flying, `${name}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  }
});

test("pinch: two fingers moving take over from a walk to a piece even if they end where they began; a tap after a pinch still walks", () => {
  for (const axis of [0, 1]) {
    const w = at(); w.goTo(...SPOTS[0]);
    w.pointerDown(1, 0, 0, false); w.pointerDown(2, 100, 0, false);
    w.pointerMove(2, 100 + 30 * (1 - axis), 30 * axis); w.pointerMove(2, 100, 0);
    assert.equal(w.frame(0).flying, false, `out and back on axis ${axis}`);
  }
  const w = at();
  w.pointerDown(1, 0, 0, false); w.pointerDown(2, 100, 0, false); w.pointerMove(2, 160, 0);
  w.pointerUp(1, 0, 0); w.pointerUp(2, 160, 0); w.goTo(...SPOTS[0]);
  assert.equal(w.frame(0).flying, true, "the pinch before the tap does not cancel the walk the tap started");
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

const tapAt = (w, moves, up = moves.at(-1) ?? [0, 0]) => { w.pointerDown(1, 0, 0, false, true); for (const [x, y] of moves) w.pointerMove(1, x, y); return w.pointerUp(1, ...up); };

test("tap: one primary pointer that barely moved is a tap; a drag, out-and-back, far release, right-drag, pinch or cancel is not", () => {
  const w = at();
  assert.equal(tapAt(w, [[3, 0]]), true);
  assert.equal(tapAt(w, [[7, 0]]), false);
  assert.equal(tapAt(w, [[4, 0], [0, 0]]), false);         // 8 px out and back ends where it began
  assert.equal(tapAt(w, [[2, 0]], [20, 0]), false);        // released 18 px from the last sample
  assert.equal(tapAt(w, [[2, 0]], [NaN, 0]), true);        // a bad release sample is ignored, not trusted
  assert.equal(tapAt(w, [[NaN, 0], [50, 0]]), false);      // ...and does not stop later travel counting
  w.pointerDown(1, 0, 0, true, true); assert.equal(w.pointerUp(1, 0, 0), false);   // right/shift-drag
  w.pointerDown(1, 0, 0, false, false); assert.equal(w.pointerUp(1, 0, 0), false); // not the main button
  // pinch: each finger moves only a little, then they lift one at a time
  for (const second of [false, true]) {
    w.pointerDown(1, 0, 0, false, true); w.pointerDown(2, 50, 0, false, second); w.pointerMove(1, 3, 0);
    assert.equal(w.pointerUp(1, 3, 0), false); assert.equal(w.pointerUp(2, 50, 0), false);
  }
  w.pointerDown(1, 0, 0, false, true); w.pointerCancel(1); assert.equal(w.pointerUp(1, 0, 0), false);
  assert.equal(tapAt(w, []), true);  // nothing left over from the gestures above
});

test("tap: losing focus mid-press does not swallow the next click", () => {
  const w = at();
  w.pointerDown(1, 0, 0, false, true); w.blur();  // released outside the window: no pointerup arrives
  assert.equal(tapAt(w, []), true);
});

test("tap: any gesture that ever had two pointers down is never a tap", () => {
  const ev = fc.tuple(fc.constantFrom("down", "down", "up", "up", "move", "cancel"), fc.integer({ min: 1, max: 2 }), fc.integer({ min: -1, max: 1 }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 12 }), events => {
    const w = at(), live = new Set();
    let multi = false;
    for (const [k, id, x] of events) {
      if (k === "down") { if (live.has(id)) continue; live.add(id); multi ||= live.size > 1; w.pointerDown(id, x, 0, false, true); }
      else if (k === "move") w.pointerMove(id, x, 0);
      else if (!live.has(id)) continue;
      else if (k === "cancel") { live.delete(id); w.pointerCancel(id); }
      else { live.delete(id); const tap = w.pointerUp(id, x, 0); if (multi) assert.equal(tap, false); }
      if (!live.size) multi = false;
    }
  }), { numRuns: 500 });  // short, dense sequences: two fingers down then lifted happens often
});

test("goTo: tapping a movement key between frames still stops the walk", () => {
  for (const key of ["w", "ArrowLeft", "q"]) {
    const w = walker({ x: 0, z: 5, yaw: 0, pitch: 0 }); w.goTo(...SPOTS[6]); run(w, 5);
    w.keyDown({ key }); w.keyUp(key);
    assert.equal(run(w, 1, 1000).flying, false, key);
  }
  const w = walker({ x: 0, z: 5, yaw: 0, pitch: 0 }); w.goTo(...SPOTS[6]); run(w, 5);
  w.keyDown({ key: "Shift" }); w.keyUp("Shift"); assert.equal(run(w, 1, 1000).flying, true);
});

test("goTo: the head turns gradually on the way and never tips past +-1.45, even over a piece at your feet", () => {
  let w = walker({ x: 0, z: 5, yaw: 0, pitch: 0 }); w.goTo(...SPOTS[0]);
  const mid = run(w, 10);
  assert.ok(mid.flying && mid.yaw > 0.01 && mid.yaw < Math.PI / 2 - 0.01, JSON.stringify(mid));
  w = walker({ x: 0, z: 0, yaw: 0, pitch: 0 }); w.goTo({ x: 0, z: 0 }, { x: 0, y: 0, z: -1e-4 });
  assert.ok(Math.abs(run(w, 100).pitch) <= 1.45);
});
