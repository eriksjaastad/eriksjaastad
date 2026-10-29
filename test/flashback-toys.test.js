// The things you pick up in the cabin: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { ROBOT, THINGS, pose, reach, framing, geometry, turner, inHands, TIP, TAP } from "../public/flashback/toys.js";
import { COUNTER, DOORS_FROM } from "../public/flashback/cabin.js";

const ALL = Object.values(THINGS).flatMap(t => t.parts);

test("things: 0 is one form and 1 the other, every pose in between lies between them, and anything else is held at an end", () => {
  for (const p of ALL) {
    assert.deepEqual(pose(p, 0), p.a); assert.deepEqual(pose(p, 1), p.b);
    assert.deepEqual(pose(p, -3), p.a); assert.deepEqual(pose(p, 7), p.b); assert.deepEqual(pose(p, NaN), p.a);
  }
  fc.assert(fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.integer({ min: 0, max: ALL.length - 1 }), (f, i) => {
    const p = ALL[i];
    return pose(p, f).every((v, k) => v >= Math.min(p.a[k], p.b[k]) - 1e-12 && v <= Math.max(p.a[k], p.b[k]) + 1e-12);
  }));
});

test("things: each part named once per thing; on the counter, in either form or changing, nothing reaches the cabinet doors' swing", () => {
  for (const [name, t] of Object.entries(THINGS)) {
    assert.equal(new Set(t.parts.map(p => p.name)).size, t.parts.length, name);
    for (const f of [0, 0.25, 0.5, 0.75, 1]) for (const p of t.parts) assert.ok(COUNTER + pose(p, f)[1] + reach(p) < DOORS_FROM, `${name} ${p.name} at ${f}`);
  }
  // they don't overlap each other on the counter: each is further from the next than their halves' lengths
  const spots = Object.values(THINGS).map(t => t.at[0]).sort((a, b) => a - b);
  spots.slice(1).forEach((x, i) => assert.ok(x - spots[i] > 0.15, `${spots[i]} and ${x}`));
});

test("things: held in your hands, every corner of every part, in any pose and turned any way, stays in the camera's view", () => {
  // the corners of each part's box, which holds every vertex the page draws for it (a cylinder sits inside its box)
  const corners = p => [-1, 1].flatMap(a => [-1, 1].flatMap(b => [-1, 1].map(c => [a * p.size[0] / 2, b * p.size[1] / 2, c * p.size[2] / 2])));
  const rot = ([x, y, z], [rx, ry, rz]) => {  // three.js's XYZ Euler order: z first, then y, then x
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    return [x, y, z];
  };
  for (const [name, t] of Object.entries(THINGS)) {
    const { middle, radius, distance } = framing(t.parts), half = Math.tan(15 * Math.PI / 180);
    fc.assert(fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }), fc.double({ min: -TIP, max: TIP, noNaN: true }), (f, yaw, pitch) => {
      for (const p of t.parts) {
        const [x, y, z, rx, ry, rz] = pose(p, f), off = p.from ?? [0, 0, 0];
        for (const c of corners(p)) {
          const local = rot(c.map((v, i) => v + off[i]), [rx, ry, rz]), at = [local[0] + x, local[1] + y - middle, local[2] + z];
          if (Math.hypot(...at) > radius + 1e-9) return false;
          const [vx, vy, vz] = rot(at, [pitch, yaw, 0]), depth = distance - vz;  // the camera looks down -z from (0, 0, distance)
          if (Math.abs(vx) > depth * half + 1e-9 || Math.abs(vy) > depth * half + 1e-9) return false;
        }
      }
      return true;
    }), { numRuns: 300 });
  }
});

test("things: every cylinder is drawn inside its box, so the box's corners bound what's on screen", () => {
  for (const p of Object.values(THINGS).flatMap(t => t.parts)) {
    const [kind, args] = geometry(p);
    if (kind === "Box") assert.deepEqual(args, p.size);
    else { assert.equal(p.size[0], p.size[2], `${p.name} is round`); assert.equal(2 * args[0], p.size[0]); assert.equal(args[0], args[1]); assert.equal(args[2], p.size[1]); }
  }
});

test("robot: it stands up tall as a robot and lies long and low as a truck", () => {
  const top = form => Math.max(...ROBOT.map(p => p[form][1] + p.size[1] / 2));
  assert.ok(top("b") > 0.14 && top("a") < 0.08, `robot ${top("b")}, truck ${top("a")}`);
  const zs = ROBOT.map(p => p.a[2]);
  assert.ok(Math.max(...zs) - Math.min(...zs) > 0.1, "the truck is long");
});

test("turning: a drag spins and tips it, the tip stops at the limit, only the grabbing finger counts, and a still press is a tap", () => {
  const t = turner(0, 0);
  assert.ok(t.grab(100, 100, 1)); assert.equal(t.grab(0, 0, 2), false, "a second finger can't take it");
  t.move(150, 100, 2); assert.equal(t.yaw, 0, "the other finger is ignored");
  t.move(150, 100, 1); assert.ok(Math.abs(t.yaw - 0.5) < 1e-12);
  t.move(150, 10000, 1); assert.equal(t.pitch, TIP); t.move(150, -10000, 1); assert.equal(t.pitch, -TIP);
  t.move(NaN, 5, 1); assert.ok(Number.isFinite(t.yaw) && Number.isFinite(t.pitch));
  assert.equal(t.release(150, -10000, 2), false); assert.equal(t.release(150, -10000, 1), false, "a long drag is no tap");
  assert.ok(t.grab(0, 0, 3)); t.move(TAP / 2, 0, 3); assert.equal(t.release(TAP / 2, 0, 3), true, "a press that barely moves is a tap");
  assert.ok(t.grab(0, 0, 6)); t.move(2, 0, 6); assert.equal(t.release(20, 0, 6), false, "where it lifts counts");
  assert.ok(t.grab(0, 0, 4)); t.cancel(4); assert.ok(t.grab(0, 0, 5), "a cancelled finger lets go");
  fc.assert(fc.property(fc.array(fc.tuple(fc.double({ noNaN: false }), fc.double())), moves => {
    const u = turner(); u.grab(0, 0);
    for (const [x, y] of moves) u.move(x, y);
    return Math.abs(u.pitch) <= TIP && !Number.isNaN(u.pitch);
  }));
});

// the page's events, as the browser sends them, to a stand-in canvas
function hands() {
  const el = new EventTarget(), taps = [], captured = [];
  el.setPointerCapture = id => captured.push(id);
  const h = inHands(el, () => taps.push(1));
  const send = (type, x, y, id = 1, samples) => el.dispatchEvent(Object.assign(new Event(type), { clientX: x, clientY: y, pointerId: id, getCoalescedEvents: samples && (() => samples) }));
  return { h, taps, captured, send };
}

test("in your hands: a press and lift in place is a tap; a drag, even one whose samples come coalesced or that lifts far away, isn't", () => {
  let r = hands(); r.send("pointerdown", 10, 10); r.send("pointerup", 12, 10);
  assert.deepEqual(r.taps, [1]); assert.deepEqual(r.captured, [1]);
  r = hands(); r.send("pointerdown", 10, 10); r.send("pointermove", 12, 10); r.send("pointerup", 30, 10);
  assert.deepEqual(r.taps, [], "lifting 20 px away is a drag");
  r = hands(); r.send("pointerdown", 10, 10); r.send("pointermove", 10, 10, 1, [{ clientX: 60, clientY: 10 }, { clientX: 10, clientY: 10 }]); r.send("pointerup", 10, 10);
  assert.deepEqual(r.taps, [], "out and back within one event is a drag");
  assert.ok(Math.abs(r.h.yaw - 0.5) < 1e-12, "and every sample turned it");
  r = hands(); r.send("pointerdown", 10, 10, 1); r.send("pointerdown", 10, 10, 2); r.send("pointerup", 10, 10, 2);
  assert.deepEqual(r.taps, [], "a second finger's tap is ignored");
});

test("in your hands: a press interrupted by closing, losing focus, cancel or lost capture changes nothing when it lifts, and the next press works", () => {
  for (const stop of [r => r.h.drop(), r => r.send("pointercancel", 0, 0), r => r.send("lostpointercapture", 0, 0)]) {
    const r = hands(); r.send("pointerdown", 10, 10); stop(r); r.send("pointerup", 10, 10);
    assert.deepEqual(r.taps, [], "the late lift does nothing");
    r.send("pointerdown", 10, 10, 2); r.send("pointerup", 10, 10, 2);
    assert.deepEqual(r.taps, [1], "a new finger can pick it up again");
  }
  const r = hands(); r.send("pointerdown", 0, 0); r.send("pointermove", 100, 0); r.send("pointerup", 100, 0);
  const yaw = r.h.yaw; r.h.drop(); assert.equal(r.h.yaw, yaw, "dropping keeps how it was turned");
  r.h.reset(); assert.notEqual(r.h.yaw, yaw, "picking it up again starts fresh");
});
