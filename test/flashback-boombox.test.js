// The boombox: node --test. Times are audio-clock seconds.
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { boombox, TAPE, GAP, WIND, sideLength, player } from "../public/flashback/boombox.js";
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

test("music: a seed always makes the same song, notes sorted and inside the loop, frequencies sensible", () => {
  for (const seed of [11, 23, 37, 41, 53, 67]) {
    const a = song(seed), b = song(seed);
    assert.deepEqual(a, b);
    assert.ok(a.bpm >= 84 && a.bpm < 124 && a.length > 0);
    assert.ok(a.notes.every((n, i) => n.t >= 0 && n.t < a.length && (i === 0 || n.t >= a.notes[i - 1].t)));
    assert.ok(a.notes.every(n => ["kick", "snare", "hat"].includes(n.voice) ? n.freq === 0 : n.freq > 30 && n.freq < 2000));
  }
  assert.notDeepEqual(song(11).notes, song(23).notes);
  const tempos = new Set(Object.values(TAPE).flat().map(t => song(t.seed).bpm));
  assert.ok(tempos.size >= 4, `the mixtape's songs move at different speeds (${[...tempos]})`);
});

test("music: scheduling a loop in any run of back-to-back windows hands out every note exactly once", () => {
  fc.assert(fc.property(fc.integer({ min: 1, max: 99 }), fc.array(fc.double({ min: 0.001, max: 3, noNaN: true }), { minLength: 1, maxLength: 40 }), (seed, steps) => {
    const s = song(seed); let t = 0; const got = [];
    for (const step of steps) { got.push(...notesBetween(s, t, t + step)); t += step; }
    assert.deepEqual(got.map(n => n.t), notesBetween(s, 0, t).map(n => n.t));
  }), { numRuns: 200 });
  assert.deepEqual(notesBetween(song(1), 5, 5), []); assert.deepEqual(notesBetween(song(1), NaN, 2), []);
});

// a recording stand-in for the page's audio. The clock can be set to advance a little every time it's read (a
// handler that takes time), and sides can start unrecorded.
function rig({ tick = 0, recorded = ["A", "B"] } = {}) {
  let t = 0;
  const ready = new Set(recorded), log = { plays: [], winds: [], records: [], cancels: [] };
  const out = {
    now: () => { const v = t; t += tick; return v; },
    ready: side => ready.has(side), record: side => log.records.push(side),
    play: (side, at, from) => log.plays.push({ side, at, from }), wind: (at, until) => log.winds.push({ at, until }), cancel: () => log.cancels.push(t),
  };
  const deck = boombox(), p = player(deck, out);
  return { deck, p, log, ready, go: dt => { t += dt; }, get t() { return t; } };
}

test("player: PLAY starts the side from the tape's position at the instant of the press, even when the clock moves during the handler", () => {
  for (const tick of [0, 1 / 48000, 0.01]) {
    const r = rig({ tick }); r.p.press("power"); r.go(0.5); r.p.press("play");
    const [play] = r.log.plays;
    assert.equal(play.side, "A"); assert.equal(play.from, 0, `tick ${tick}: from the very start of the tape`);
    assert.ok(play.at <= 0.5 + 2 * tick, `tick ${tick}: at the press (${play.at})`);
    r.go(30); r.p.press("stop"); r.go(5); r.p.press("play");
    const resume = r.log.plays.at(-1), pos = r.deck.at(r.t).pos.A;
    assert.ok(Math.abs(resume.from - (30 + tick * 3)) < 0.05 && resume.from <= pos, `tick ${tick}: resumes where it stopped (${resume.from})`);
  }
});

test("player: resuming anywhere, in a song or in a gap, is one play of the recorded side from that place, with nothing else to start or stop", () => {
  for (const side of ["A", "B"]) {
    let start = 0;
    for (const song of TAPE[side]) {
      for (const at of [start + 1, start + song.length + 1]) {  // inside a song, inside the gap after it
        const r = rig(); r.p.press("power");
        if (side === "B") { r.p.press("eject"); r.p.press("flip"); r.p.press("eject"); }
        r.p.press("ff"); r.go(at / WIND); r.p.press("stop"); r.p.press("play");
        assert.deepEqual(r.log.plays.map(p => p.side), [side]); assert.ok(Math.abs(r.log.plays[0].from - at) < 1e-9);
        assert.equal(r.log.winds.length, 1, "only the whir of the fast-forward");
      }
      start += song.length + GAP;
    }
  }
});

test("player: winding whirs from the press until the tape reaches the end it's heading for, exactly", () => {
  const r = rig(); r.p.press("power"); r.p.press("play"); r.go(10); r.p.press("ff");
  assert.deepEqual(r.log.winds.at(-1), { at: 10, until: 10 + (sideLength("A") - 10) / WIND });
  r.go(1); r.p.press("rew");
  assert.deepEqual(r.log.winds.at(-1), { at: 11, until: 11 + (10 + WIND) / WIND });
});

test("player: PLAY on a side not yet recorded holds the tape where it is, then plays from exactly there once it's recorded", () => {
  let r = rig({ recorded: [] }); r.p.press("power"); r.p.press("ff"); r.go(1); r.p.press("play");
  assert.deepEqual(r.log.records, ["A"]); assert.equal(r.log.plays.length, 0); assert.equal(r.p.waiting, "A");
  r.go(5); assert.equal(r.deck.at(r.t).pos.A, WIND, "the tape doesn't run while it waits");
  r.ready.add("A"); r.p.recorded();
  assert.deepEqual(r.log.plays, [{ side: "A", at: 6, from: WIND }]); assert.equal(r.deck.at(r.t).motion, "play"); assert.equal(r.p.waiting, null);
  for (const k of ["stop", "ff", "eject", "radio", "power", "tape"]) {
    r = rig({ recorded: [] }); r.p.press("power"); r.p.press("play"); r.go(1); r.p.press(k);
    assert.equal(r.p.waiting, null, `${k} drops the hold`);
    if (k === "radio") r.p.press("tape");
    r.ready.add("A"); r.p.recorded(); assert.equal(r.log.plays.length, 0, `${k}: nothing starts later`);
  }
  r = rig({ recorded: [] }); r.p.press("power"); r.p.press("play"); r.p.press("play");
  assert.equal(r.p.waiting, "A", "PLAY again while held keeps waiting"); r.ready.add("A"); r.p.recorded(); assert.equal(r.log.plays.length, 1);
});

test("player: a key that changes nothing keeps the sound; stop, winding, eject, radio and power off cancel it", () => {
  const r = rig(); r.p.press("power"); r.p.press("play"); r.go(1);
  const cancels = r.log.cancels.length;
  for (const k of ["play", "tape", "flip", "nonsense"]) r.p.press(k);
  assert.equal(r.log.cancels.length, cancels); assert.equal(r.log.plays.length, 1);
  for (const k of ["stop", "ff", "rew", "eject", "radio", "power"]) {
    const x = rig(); x.p.press("power"); x.p.press("play"); x.go(1); const before = x.log.cancels.length; x.p.press(k);
    assert.equal(x.log.cancels.length, before + 1, k);
  }
});

test("player: any keys at any times: every sound started matches the deck at that instant", () => {
  const keys = ["power", "tape", "radio", "play", "ff", "rew", "stop", "eject", "flip"];
  fc.assert(fc.property(fc.array(fc.tuple(fc.constantFrom(...keys), fc.double({ min: 0, max: 40, noNaN: true })), { maxLength: 40 }), events => {
    const r = rig();
    for (const [k, dt] of events) {
      r.go(dt); const plays = r.log.plays.length, winds = r.log.winds.length; r.p.press(k);
      const st = r.deck.at(r.t);
      if (r.log.plays.length > plays) { const p = r.log.plays.at(-1); assert.ok(st.motion === "play" && p.side === st.side && Math.abs(p.from - st.pos[st.side]) < 1e-9); }
      if (r.log.winds.length > winds) { const w = r.log.winds.at(-1); assert.ok((st.motion === "ff" || st.motion === "rew") && w.until >= w.at); }
    }
  }), { numRuns: 500 });
});
