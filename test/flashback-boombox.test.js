// The boombox: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { boombox, TAPE, GAP, WIND, sideLength } from "../public/flashback/boombox.js";
import { song, notesBetween } from "../public/flashback/music.js";

test("boombox: nothing plays until it's on; play runs the tape at 1x and you hear the first song from its start", () => {
  const b = boombox();
  b.press("play"); b.frame(1); assert.deepEqual(b.nowPlaying(), { sound: "none" }); assert.equal(b.state.pos.A, 0);
  b.press("power"); b.press("play"); b.frame(2.5);
  const n = b.nowPlaying(); assert.equal(n.sound, "song"); assert.equal(n.index, 0); assert.ok(Math.abs(n.offset - 2.5) < 1e-9);
  b.press("power"); assert.equal(b.state.motion, "stop", "power off stops the tape");
});

test("boombox: songs are separated by a gap of hiss, and the side ends in silence with the tape stopped", () => {
  const b = boombox(); b.press("power"); b.press("play");
  b.frame(TAPE.A[0].length + 1); assert.deepEqual(b.nowPlaying(), { sound: "hiss" });
  b.frame(GAP); const n = b.nowPlaying(); assert.equal(n.index, 1); assert.ok(Math.abs(n.offset - 1) < 1e-9);
  for (let i = 0; i < 400; i++) b.frame(0.5);
  assert.equal(b.state.motion, "stop"); assert.equal(b.state.pos.A, sideLength("A"));
});

test("boombox: fast-forward and rewind wind at 12x, whir while they do, and stop at either end", () => {
  const b = boombox(); b.press("power"); b.press("ff"); b.frame(1);
  assert.equal(b.state.pos.A, WIND); assert.deepEqual(b.nowPlaying(), { sound: "wind" });
  b.press("rew"); b.frame(0.5); assert.equal(b.state.pos.A, WIND / 2);
  b.frame(10); assert.equal(b.state.pos.A, 0); assert.equal(b.state.motion, "stop");
});

test("boombox: eject stops the tape; the tape turns over only while it's out; each side keeps its own place", () => {
  const b = boombox(); b.press("power"); b.press("play"); b.frame(5);
  b.press("flip"); assert.equal(b.state.side, "A", "can't flip a tape that's in");
  b.press("eject"); assert.equal(b.state.motion, "stop"); assert.equal(b.state.tapeIn, false);
  b.press("play"); assert.equal(b.state.motion, "stop", "no tape, no play");
  b.press("flip"); b.press("eject"); assert.equal(b.state.side, "B"); assert.equal(b.state.tapeIn, true);
  b.press("play"); b.frame(2); assert.equal(b.nowPlaying().song.title, TAPE.B[0].title); assert.equal(b.state.pos.A, 5);
});

test("boombox: switching to radio stops the tape, and the tape keys do nothing there", () => {
  const b = boombox(); b.press("power"); b.press("play"); b.frame(1); b.press("radio");
  assert.equal(b.state.motion, "stop"); b.press("play"); assert.equal(b.state.motion, "stop");
  assert.deepEqual(b.nowPlaying(), { sound: "none" });
  b.press("tape"); b.press("play"); assert.equal(b.state.motion, "play");
});

test("boombox: any key presses and frame gaps keep each side's place on the tape and what you hear consistent", () => {
  const keys = ["power", "tape", "radio", "play", "ff", "rew", "stop", "eject", "flip", "nonsense"];
  fc.assert(fc.property(fc.array(fc.oneof(fc.constantFrom(...keys), fc.oneof(fc.double({ min: -5, max: 30 }), fc.constant(NaN))), { maxLength: 60 }), events => {
    const b = boombox();
    for (const e of events) {
      if (typeof e === "string") b.press(e); else b.frame(e);
      const s = b.state, n = b.nowPlaying();
      for (const side of ["A", "B"]) assert.ok(s.pos[side] >= 0 && s.pos[side] <= sideLength(side));
      if (!s.power || !s.tapeIn || s.mode !== "tape") assert.equal(s.motion, "stop");
      if (n.sound === "song") assert.ok(s.motion === "play" && n.offset >= 0 && n.offset < n.song.length && TAPE[n.side][n.index] === n.song);
      if (s.motion === "stop") assert.equal(n.sound, "none");
    }
  }), { numRuns: 500 });
});

test("music: a seed always makes the same song, notes sorted and inside the loop, frequencies sensible", () => {
  for (const seed of [11, 23, 37, 41, 53, 67]) {
    const a = song(seed), b = song(seed);
    assert.deepEqual(a, b);
    assert.ok(a.bpm >= 84 && a.bpm < 124 && a.length > 0);
    assert.ok(a.notes.every((n, i) => n.t >= 0 && n.t < a.length && (i === 0 || n.t >= a.notes[i - 1].t)));
    assert.ok(a.notes.every(n => ["kick", "snare", "hat"].includes(n.voice) ? n.freq === 0 : n.freq > 30 && n.freq < 2000));
  }
  assert.notDeepEqual(song(11).notes, song(23).notes);
});

test("music: scheduling a loop in any run of back-to-back windows hands out every note exactly once", () => {
  fc.assert(fc.property(fc.integer({ min: 1, max: 99 }), fc.array(fc.double({ min: 0.001, max: 3, noNaN: true }), { minLength: 1, maxLength: 40 }), (seed, steps) => {
    const s = song(seed); let t = 0; const got = [];
    for (const step of steps) { got.push(...notesBetween(s, t, t + step)); t += step; }
    const want = notesBetween(s, 0, t);
    assert.equal(got.length, want.length);
    assert.deepEqual(got.map(n => n.t), want.map(n => n.t));
  }), { numRuns: 200 });
  assert.deepEqual(notesBetween(song(1), 5, 5), []); assert.deepEqual(notesBetween(song(1), NaN, 2), []);
});
