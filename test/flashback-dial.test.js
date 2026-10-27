// The rotary phone's dial: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { dialer, DIGITS, travel, restAngle, STOP, SLACK, RETURN, LENGTH, lineFor, DIRECTORY } from "../public/flashback/dial.js";

// pull a digit's hole all the way round to the stop in small moves, let go, and let the wheel come home
function dial(d, digit, { short = 0 } = {}) {
  let a = restAngle(digit);
  assert.ok(d.grab(digit, a), `grab ${digit}`);
  const end = a + travel(digit) - short;
  while (a < end) { a = Math.min(end, a + 7); d.drag(a); }
  const got = d.release();
  while (d.rotation > 0) d.frame(0.05);
  return got;
}

test("dial: each hole dials its digit only when pulled to the stop; the 1 is the shortest pull and the 0 the longest", () => {
  for (const digit of DIGITS) { const d = dialer(); assert.equal(dial(d, digit), digit); assert.equal(d.number, digit); }
  assert.ok(travel("1") < travel("5") && travel("5") < travel("0"));
  for (const digit of DIGITS) assert.equal(((restAngle(digit) + travel(digit)) % 360 + 360) % 360, STOP, `${digit} reaches the stop`);
  const d = dialer(); assert.equal(dial(d, "7", { short: SLACK + 5 }), null); assert.equal(d.number, "");
  assert.equal(dial(d, "7", { short: SLACK - 1 }), "7", "within the slack counts");
});

test("dial: the wheel springs back at a steady speed and can't be grabbed until it's home", () => {
  const d = dialer();
  let a = restAngle("0"); d.grab("0", a);
  for (let i = 0; i < 60; i++) { a += 7; d.drag(a); }
  assert.equal(d.rotation, travel("0"), "never past the stop");
  d.release();
  d.frame(0.1); assert.ok(Math.abs(d.rotation - (travel("0") - RETURN * 0.1)) < 1e-9);
  assert.equal(d.grab("1", restAngle("1")), false, "busy while it returns");
  d.frame(10); assert.equal(d.rotation, 0);
  assert.equal(d.grab("1", restAngle("1")), true);
});

test("dial: turning the wrong way does nothing, and the pointer crossing the 180-degree line doesn't jump the wheel", () => {
  const d = dialer();
  d.grab("9", 170); d.drag(150); assert.equal(d.rotation, 0, "anticlockwise stays at rest");
  d.drag(179); d.drag(-179); assert.ok(Math.abs(d.rotation - 31) < 1e-9, `150 -> 179 -> -179 turns it 29 + 2 degrees, not 331 (${d.rotation})`);
  d.drag(NaN); d.drag(Infinity); assert.ok(Math.abs(d.rotation - 31) < 1e-9, "bad samples are ignored");
});

test("dial: seven digits make a number; the notepad's numbers ring their lines, any other seven aren't in service", () => {
  const d = dialer();
  for (const digit of "5550142") dial(d, digit);
  assert.equal(d.number, "5550142"); assert.equal(lineFor(d.number), "time");
  assert.equal(d.grab("1", restAngle("1")), false, "no eighth digit");
  d.hangUp(); assert.equal(d.number, ""); assert.equal(d.grab("1", restAngle("1")), true);
  assert.equal(lineFor("5550177"), "closures"); assert.equal(lineFor("8675309"), "none"); assert.equal(lineFor("555"), null);
  for (const n of ["toString", "__proto__", "555014x"]) assert.equal(lineFor(n), null, `${n}: only real numbers`);
  for (const n of Object.keys(DIRECTORY)) assert.equal(n.length, LENGTH);
});

test("dial: any grabs, drags, releases and frames keep the wheel between rest and the stop and only ever dial digits pulled home", () => {
  const ev = fc.oneof(
    fc.record({ grab: fc.constantFrom(...DIGITS, "x"), at: fc.double({ min: -400, max: 400 }) }),
    fc.record({ drag: fc.oneof(fc.double({ min: -400, max: 400 }), fc.constant(NaN)) }),
    fc.constant({ release: true }), fc.record({ dt: fc.oneof(fc.double({ min: -1, max: 1 }), fc.constant(NaN)) }), fc.constant({ hangUp: true }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 60 }), events => {
    const d = dialer();
    let held = null, maxSeen = 0;
    for (const e of events) {
      if ("grab" in e) { if (d.grab(e.grab, e.at)) { held = e.grab; maxSeen = 0; } }
      else if ("drag" in e) { d.drag(e.drag); }
      else if (e.release) { const before = d.number.length, got = d.release(); if (got) assert.ok(got === held && d.number.length === before + 1); held = null; }
      else if (e.hangUp) { d.hangUp(); held = null; }
      else d.frame(e.dt);
      assert.ok(d.rotation >= 0 && d.rotation <= travel("0"));
      if (held) { maxSeen = Math.max(maxSeen, d.rotation); assert.ok(d.rotation <= travel(held)); }
      assert.ok(d.number.length <= LENGTH && /^[0-9]*$/.test(d.number));
    }
  }), { numRuns: 500 });
});
