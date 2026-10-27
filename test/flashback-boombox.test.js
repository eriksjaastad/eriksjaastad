// The boombox: node --test. Times are audio-clock seconds.
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { boombox, TAPE, GAP, WIND, sideLength, notesOnTape } from "../public/flashback/boombox.js";
import { song, notesBetween } from "../public/flashback/music.js";

test("boombox: nothing plays until it's on; play runs the tape in step with the clock from the first song's start", () => {
  const b = boombox();
  b.press("play", 0); assert.deepEqual(b.nowPlaying(1), { sound: "none" }); assert.equal(b.at(1).pos.A, 0);
  b.press("power", 1); b.press("play", 1);
  const n = b.nowPlaying(3.5); assert.equal(n.sound, "song"); assert.equal(n.index, 0); assert.ok(Math.abs(n.offset - 2.5) < 1e-9);
  assert.ok(Math.abs(b.at(5.5).pos.A - 4.5) < 1e-9, "a two-second wait is two seconds of tape, however the frames came");
  b.press("power", 6); assert.equal(b.at(6).motion, "stop", "power off stops the tape");
  b.at(3); assert.ok(Math.abs(b.at(7).pos.A - 5) < 1e-9, "a time from the past changes nothing");
});

test("boombox: songs are separated by a gap of hiss, and the side ends in silence with the tape stopped at its end", () => {
  const b = boombox(); b.press("power", 0); b.press("play", 0);
  assert.deepEqual(b.nowPlaying(TAPE.A[0].length + 1), { sound: "hiss" });
  const n = b.nowPlaying(TAPE.A[0].length + GAP + 1); assert.equal(n.index, 1); assert.ok(Math.abs(n.offset - 1) < 1e-9);
  const s = b.at(10000); assert.equal(s.motion, "stop"); assert.equal(s.pos.A, sideLength("A"));
});

test("boombox: fast-forward and rewind wind at 12x, whir while they do, and stop at either end", () => {
  const b = boombox(); b.press("power", 0); b.press("ff", 0);
  assert.equal(b.at(1).pos.A, WIND); assert.deepEqual(b.nowPlaying(1), { sound: "wind" });
  b.press("rew", 1); assert.equal(b.at(1.5).pos.A, WIND / 2);
  assert.equal(b.at(20).pos.A, 0); assert.equal(b.at(20).motion, "stop");
  b.press("ff", 20); assert.equal(b.at(500).pos.A, sideLength("A")); assert.equal(b.at(500).motion, "stop");
});

test("boombox: eject stops the tape and works without power; the tape turns over only while it's out; each side keeps its place", () => {
  const b = boombox(); b.press("power", 0); b.press("play", 0);
  b.press("flip", 5); assert.equal(b.at(5).side, "A", "can't flip a tape that's in");
  b.press("eject", 5); assert.equal(b.at(5).motion, "stop"); assert.equal(b.at(5).tapeIn, false);
  b.press("play", 5); assert.equal(b.at(5).motion, "stop", "no tape, no play");
  b.press("flip", 5); b.press("power", 5); b.press("eject", 5);
  assert.equal(b.at(5).side, "B"); assert.equal(b.at(5).tapeIn, true, "eject works with the power off");
  b.press("power", 6); b.press("play", 6);
  assert.equal(b.nowPlaying(8).song.title, TAPE.B[0].title); assert.equal(b.at(8).pos.A, 5);
});

test("boombox: in radio mode every tape key does nothing, with the tape in or out", () => {
  for (const tapeIn of [true, false]) {
    const b = boombox(); b.press("power", 0); if (!tapeIn) b.press("eject", 0);
    b.press("play", 0); b.press("radio", 1);
    const before = b.at(1);
    for (const k of ["play", "ff", "rew", "stop", "eject", "flip"]) b.press(k, 1);
    assert.deepEqual(b.at(1), before, `tape ${tapeIn ? "in" : "out"}`);
    assert.deepEqual(b.nowPlaying(2), { sound: "none" });
    b.press("tape", 2); if (!tapeIn) b.press("eject", 2); b.press("play", 2); assert.equal(b.at(2).motion, "play");
  }
});

test("boombox: any key presses at any times keep each side's place on the tape and what you hear consistent", () => {
  const keys = ["power", "tape", "radio", "play", "ff", "rew", "stop", "eject", "flip", "nonsense"];
  fc.assert(fc.property(fc.array(fc.tuple(fc.constantFrom(...keys), fc.oneof(fc.double({ min: 0, max: 30, noNaN: true }), fc.constant(NaN))), { maxLength: 60 }), events => {
    const b = boombox(); let t = 0;
    for (const [k, dt] of events) {
      if (Number.isFinite(dt)) t += dt;
      b.press(k, Number.isFinite(dt) ? t : dt);
      const s = b.at(t), n = b.nowPlaying(t);
      for (const side of ["A", "B"]) assert.ok(s.pos[side] >= 0 && s.pos[side] <= sideLength(side));
      if (!s.power || !s.tapeIn || s.mode !== "tape") assert.equal(s.motion, "stop");
      if (n.sound === "song") assert.ok(s.motion === "play" && n.offset >= 0 && n.offset < n.song.length && TAPE[n.side][n.index] === n.song);
      if (s.motion === "stop") assert.equal(n.sound, "none");
    }
  }), { numRuns: 500 });
});

test("tape: playing straight through, ticking at any times (long gaps too), schedules every note exactly once, from the very first", () => {
  // the page's scheduler: each tick, the notes from the cursor to a quarter second ahead of the tape, then the cursor moves
  fc.assert(fc.property(fc.array(fc.double({ min: 0.001, max: 2, noNaN: true }), { minLength: 1, maxLength: 120 }), gaps => {
    const b = boombox(); b.press("power", 0); b.press("play", 0);
    let t = 0, cursor = b.at(0).pos.A; const got = [];
    const tick = () => { const s = b.at(t), end = s.motion === "play" ? Math.min(sideLength("A"), s.pos.A + 0.25) : s.pos.A;
      got.push(...notesOnTape("A", cursor, end)); cursor = Math.max(cursor, end); };
    tick(); for (const g of gaps) { t += g; tick(); }
    const want = notesOnTape("A", 0, cursor);
    assert.deepEqual(got.map(n => n.pos), want.map(n => n.pos));
    if (cursor > 0.01) assert.equal(got[0].pos, 0, "the opening note");
  }), { numRuns: 200 });
});

test("tape: notes live only inside songs, never in the gaps, and each song starts from its own first note", () => {
  const all = notesOnTape("A", 0, sideLength("A"));
  let start = 0;
  for (const t of TAPE.A) {
    const inSong = all.filter(n => n.pos >= start && n.pos < start + t.length);
    assert.equal(inSong[0].pos, start, `${t.title} starts on its first note`);
    assert.equal(all.filter(n => n.pos >= start + t.length && n.pos < start + t.length + GAP).length, 0, "the gap is blank");
    start += t.length + GAP;
  }
  assert.deepEqual(notesOnTape("A", 5, 5), []); assert.deepEqual(notesOnTape("A", NaN, 5), []);
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
    assert.deepEqual(got.map(n => n.t), notesBetween(s, 0, t).map(n => n.t));
  }), { numRuns: 200 });
  assert.deepEqual(notesBetween(song(1), 5, 5), []); assert.deepEqual(notesBetween(song(1), NaN, 2), []);
});
