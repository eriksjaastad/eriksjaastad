// The top-down walk to the cabin: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { MAP, find, open, mover, STEP, DIRS, keyboard } from "../public/flashback/outside/maze.js";

// the shortest route from the start to the door, by breadth-first search over open tiles
function route(map = MAP) {
  const start = find("S", map), door = find("D", map), key = p => `${p.x},${p.y}`, back = new Map([[key(start), null]]), queue = [start];
  while (queue.length) {
    const p = queue.shift();
    if (p.x === door.x && p.y === door.y) break;
    for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (open(n.x, n.y, map) && !back.has(key(n))) { back.set(key(n), [p, dir]); queue.push(n); }
    }
  }
  const dirs = []; for (let k = key(door); back.get(k); ) { const [p, dir] = back.get(k); dirs.unshift(dir); k = key(p); }
  return dirs;
}

test("map: one start and one door, every row the same width, closed in by hedge, trees or edges", () => {
  assert.ok(MAP.every(r => r.length === MAP[0].length));
  assert.equal(MAP.join("").split("S").length - 1, 1); assert.equal(MAP.join("").split("D").length - 1, 1);
  for (const [x, y] of [[-1, 0], [0, -1], [MAP[0].length, 5], [3, MAP.length]]) assert.equal(open(x, y), false);
});

test("walking: holding each arrow of the shortest route in turn gets you from the start through the maze to the door", () => {
  const dirs = route();
  assert.ok(dirs.length > 30, `the maze is a real maze (${dirs.length} steps)`);
  const m = mover();
  let p;
  for (const dir of dirs) {  // a quick tap per tile, let go before any frame runs: each still takes its one step
    m.press(dir); m.release(dir); p = m.frame(0);
    while (p.moving) p = m.frame(0.016);
  }
  for (let i = 0; i < 20; i++) p = m.frame(0.016);
  assert.ok(p.inside, JSON.stringify(p));
});

test("walking: holding an arrow keeps you walking a tile per step; letting go stops you on a tile; a hedge stops you facing it", () => {
  const m = mover({ x: 1, y: 9 });  // top-left corner of the maze: open to the right and down
  m.press("right"); let p = m.frame(STEP / 2);
  assert.ok(p.moving && Math.abs(p.x - 1.5) < 1e-9 && p.y === 9, "half a step in, half a tile along");
  for (let i = 0; i < 4; i++) p = m.frame(STEP / 2); assert.ok(Math.abs(p.x - 3.5) < 1e-9, "still held: two more tiles");
  m.release("right"); p = m.frame(STEP); assert.ok(!p.moving && p.x === 4, "let go: finishes the step and stops");
  m.press("up"); p = m.frame(1); assert.ok(!p.moving && p.x === 4 && p.y === 9 && p.facing === "up", "hedge above: turns, doesn't move");
  m.release("up"); m.press("left"); m.release("left"); m.frame(0); p = m.frame(STEP / 2); p = m.frame(STEP / 2);
  assert.ok(!p.moving && p.x === 3, "a tap shorter than a frame: exactly one step");
});

test("walking: the last arrow pressed wins, and letting it go falls back to the one still held", () => {
  const m = mover({ x: 1, y: 9 });
  const step = () => { m.frame(STEP / 2); return m.frame(STEP / 2); };  // frames are capped at 0.1 s
  m.press("right"); m.press("down"); let p = step();
  assert.ok(p.y === 10 && p.x === 1 && p.facing === "down", JSON.stringify(p));
  m.release("down"); p = step();  // the step to (1,11) finishes; right is still held, but (2,11) is hedge
  assert.ok(p.x === 1 && p.y === 11 && !p.moving && p.facing === "right", JSON.stringify(p));
});

test("walking: any presses, releases and frame gaps keep you on open ground and never more than one tile from the last", () => {
  const src = fc.constantFrom("key", "pointer1", "pointer2");
  const ev = fc.oneof(fc.record({ press: fc.constantFrom("up", "down", "left", "right", "jump"), src }), fc.record({ release: fc.constantFrom("up", "down", "left", "right"), src }),
    fc.record({ dt: fc.oneof(fc.double({ min: -1, max: 2 }), fc.constant(NaN), fc.constant(Infinity)) }), fc.constant({ all: true }));
  fc.assert(fc.property(fc.array(ev, { maxLength: 60 }), events => {
    const m = mover();
    let prev = m.frame(0);
    for (const e of events) {
      if (e.press) m.press(e.press, e.src); else if (e.release) m.release(e.release, e.src); else if (e.all) m.releaseAll();
      else {
        const p = m.frame(e.dt), tile = { x: Math.round(p.x), y: Math.round(p.y) };
        assert.ok(open(Math.floor(p.x), Math.floor(p.y)) && open(Math.ceil(p.x), Math.ceil(p.y)), JSON.stringify(p));
        assert.ok(Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y) <= 1 + 1e-9, `${JSON.stringify(prev)} -> ${JSON.stringify(p)}`);
        assert.ok(!p.inside || MAP[tile.y][tile.x] === "D");
        prev = p;
      }
    }
  }), { numRuns: 500 });
});

test("walking: a long pause between frames moves you at most 0.1 s worth; once on the door, no arrow walks you off it", () => {
  let m = mover({ x: 1, y: 9 }); m.press("right");
  let p = m.frame(10); assert.ok(p.x - 1 <= 0.1 / STEP + 1e-9, `after a 10 s gap: ${p.x}`);
  const door = find("D");
  m = mover({ x: door.x, y: door.y + 1 }); m.press("up"); m.frame(0); p = m.frame(0.1); p = m.frame(0.1);
  assert.ok(p.inside, "stepped onto the door");
  m.release("up"); m.press("down"); for (let i = 0; i < 10; i++) p = m.frame(0.1);
  assert.ok(p.inside && p.x === door.x && p.y === door.y, JSON.stringify(p));
});

test("walking: a held key's autorepeat adds nothing, so letting go stops after the current step", () => {
  const m = mover({ x: 1, y: 9 }), half = () => m.frame(STEP / 2);
  m.press("right"); let p;
  for (let i = 0; i < 4; i++) { m.press("right"); p = half(); }  // repeat keydowns while held, two tiles' worth
  m.press("right"); m.release("right");  // one more repeat lands mid-step, just before the key comes up
  p = half(); p = half(); p = half();
  assert.ok(!p.moving && p.x === 4, `finished the step under way and stopped at ${p.x}, not a tile further`);
});

test("walking: each input owns its hold: two holding the same way keep you going until both let go", () => {
  for (const [a, b] of [["key", "pointer1"], ["pointer1", "pointer2"]]) {
    const m = mover({ x: 1, y: 9 }), half = () => m.frame(STEP / 2);
    m.press("right", a); m.press("right", b); half(); half();
    m.release("right", a); let p; for (let i = 0; i < 6; i++) p = half();
    assert.ok(p.x >= 4, `${a}+${b}: still walking three tiles after ${a} lets go (${p.x})`);
    m.release("right", b); m.release("right", b); for (let i = 0; i < 3; i++) p = half();
    assert.ok(!p.moving, `${a}+${b}: stops once both let go`);
  }
  const m = mover({ x: 1, y: 9 }); m.press("right", "pointer1"); m.release("right", "key");  // a release by an input that never pressed
  let p; for (let i = 0; i < 6; i++) p = m.frame(STEP / 2);
  assert.ok(p.x >= 4, `is ignored: still walking (${p.x})`);
});

// keyboard events as the browser sends them; `still` says whether the walker is walking after a few half-steps
const ev = (key, code, mods = {}) => ({ key, code, ...mods });
function rig(start) {
  const m = mover(start), k = keyboard(m), half = () => m.frame(STEP / 2);
  const settle = n => { let p; for (let i = 0; i < n; i++) p = half(); return p; };
  return { m, k, settle };
}
const PAIRS = { up: ["ArrowUp", "Numpad8", "8", { x: 17, y: 15 }], down: ["ArrowDown", "Numpad2", "2", { x: 17, y: 13 }],
  left: ["ArrowLeft", "Numpad4", "4", { x: 17, y: 9 }], right: ["ArrowRight", "Numpad6", "6", { x: 1, y: 9 }] };

test("keys: an arrow and its number-pad twin (NumLock off) are separate holds; either can let go first", () => {
  for (const [dir, [arrow, pad, , start]] of Object.entries(PAIRS)) {
    for (const [first, second] of [[arrow, pad], [pad, arrow]]) {
      const { m, k, settle } = rig(start);
      assert.equal(k.down(ev(arrow, first)), true); assert.equal(k.down(ev(arrow, second)), true);
      settle(2); k.up(ev(arrow, first));
      let p = settle(2);
      assert.ok(p.moving || Math.abs(p.x - start.x) + Math.abs(p.y - start.y) >= 2, `${dir}: still walking after ${first} lets go`);
      k.up(ev(arrow, second)); p = settle(4);
      assert.ok(!p.moving, `${dir}: stops once ${second} lets go too`);
    }
  }
});

test("keys: a number-pad arrow let go after NumLock turned on (its keyup now says a digit) still stops you", () => {
  for (const [dir, [arrow, pad, digit, start]] of Object.entries(PAIRS)) {
    const { k, settle } = rig(start);
    k.down(ev(arrow, pad)); settle(1); k.up(ev(digit, pad));
    assert.ok(!settle(6).moving, dir);
  }
});

test("keys: digits and other keys don't walk and aren't taken from the page; arrow keys are", () => {
  const { k, settle } = rig({ x: 1, y: 9 });
  for (const [key, code] of [["6", "Numpad6"], ["a", "KeyA"], ["Enter", "Enter"], [" ", "Space"]]) assert.equal(k.down(ev(key, code)), false, key);
  assert.equal(settle(4).x, 1);
  assert.equal(k.down(ev("ArrowRight", "ArrowRight")), true);
});

test("keys: with Cmd, Ctrl or Alt an arrow is a shortcut: it walks nowhere, stays the browser's, and drops keyboard holds but not touch", () => {
  for (const mod of ["metaKey", "ctrlKey", "altKey"]) {
    let { k, settle } = rig({ x: 1, y: 9 });
    assert.equal(k.down(ev("ArrowRight", "ArrowRight", { [mod]: true })), false, `${mod}+Right is the browser's`);
    assert.equal(settle(4).x, 1, `${mod}+Right walks nowhere`);
    ({ k, settle } = rig({ x: 1, y: 9 }));
    k.down(ev("ArrowRight", "ArrowRight")); settle(1);
    k.down(ev("Meta", "MetaLeft", { [mod]: true }));  // then the arrow's keyup never comes (macOS with Cmd held)
    let p = settle(6); assert.ok(!p.moving && p.x <= 2, `${mod} down stops a held arrow without its keyup (${p.x})`);
    const r = rig({ x: 1, y: 9 });
    r.m.press("right", "pointer1"); r.k.down(ev("ArrowRight", "ArrowRight")); r.settle(1);
    r.k.down(ev("Control", "ControlLeft", { [mod]: true }));
    p = r.settle(6); assert.ok(p.x >= 3, `${mod} leaves a finger's hold walking (${p.x})`);
  }
});

test("keys: autorepeat keydowns while held add nothing, so letting go stops after the step under way", () => {
  const { k, settle } = rig({ x: 1, y: 9 });
  k.down(ev("ArrowRight", "ArrowRight"));
  for (let i = 0; i < 4; i++) { k.down(ev("ArrowRight", "ArrowRight")); settle(1); }
  k.down(ev("ArrowRight", "ArrowRight")); k.up(ev("ArrowRight", "ArrowRight"));
  const p = settle(3); assert.ok(!p.moving && p.x === 4, `${p.x}`);
});

test("keys: a key tapped and let go before the next frame still takes its one step; a shortcut cancels one not yet walked", () => {
  let { k, settle } = rig({ x: 1, y: 9 });
  k.down(ev("ArrowRight", "ArrowRight")); k.up(ev("ArrowRight", "ArrowRight"));
  let p = settle(3); assert.ok(!p.moving && p.x === 2, `one step (${p.x})`);
  ({ k, settle } = rig({ x: 1, y: 9 }));
  k.down(ev("ArrowRight", "ArrowRight")); k.up(ev("ArrowRight", "ArrowRight")); k.down(ev("Meta", "MetaLeft", { metaKey: true }));
  p = settle(3); assert.equal(p.x, 1, "Cmd right after: no step");
});

test("keys: a shortcut cancels only keyboard taps: a D-pad tap followed by Cmd, Ctrl or Alt in the same frame still steps", () => {
  for (const [dir, [, , , start]] of Object.entries(PAIRS)) {
    for (const mod of ["metaKey", "ctrlKey", "altKey"]) {
      for (const liftFirst of [true, false]) {  // the finger lifted before the modifier, or after it
        const { m, k, settle } = rig(start);
        m.press(dir, "pointer1"); if (liftFirst) m.release(dir, "pointer1");
        k.down(ev("Meta", "MetaLeft", { [mod]: true }));
        if (!liftFirst) m.release(dir, "pointer1");
        const p = settle(3);
        assert.ok(!p.moving && Math.abs(p.x - start.x) + Math.abs(p.y - start.y) === 1, `${dir} ${mod} lift ${liftFirst ? "before" : "after"}: one step (${p.x},${p.y})`);
      }
    }
  }
});
