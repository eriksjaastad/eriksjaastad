// The things you pick up in the cabin: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { ROBOT, pose, turner, inHands, TIP, TAP } from "../public/flashback/toys.js";
import { COUNTER, DOORS_FROM } from "../public/flashback/cabin.js";

test("robot: 0 is the truck and 1 the robot, every pose in between lies between them, and anything else is held at an end", () => {
  for (const p of ROBOT) {
    assert.deepEqual(pose(p, 0), p.truck); assert.deepEqual(pose(p, 1), p.robot);
    assert.deepEqual(pose(p, -3), p.truck); assert.deepEqual(pose(p, 7), p.robot); assert.deepEqual(pose(p, NaN), p.truck);
  }
  fc.assert(fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.integer({ min: 0, max: ROBOT.length - 1 }), (f, i) => {
    const p = ROBOT[i];
    return pose(p, f).every((v, k) => v >= Math.min(p.truck[k], p.robot[k]) - 1e-12 && v <= Math.max(p.truck[k], p.robot[k]) + 1e-12);
  }));
});

test("robot: it stands up tall as a robot and lies long and low as a truck, its parts each named once", () => {
  const top = form => Math.max(...ROBOT.map(p => p[form][1] + p.size[1] / 2));
  assert.ok(top("robot") > 0.14 && top("truck") < 0.08, `robot ${top("robot")}, truck ${top("truck")}`);
  const zs = ROBOT.map(p => p.truck[2]);
  assert.ok(Math.max(...zs) - Math.min(...zs) > 0.1, "the truck is long");
  assert.equal(new Set(ROBOT.map(p => p.name)).size, ROBOT.length);
  assert.ok(COUNTER + top("robot") < DOORS_FROM, "standing on the countertop, it stays under the cabinet doors' swing");
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
