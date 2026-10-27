// The boombox's tape deck and switches, kept out of the page so they can be tested in node. Time is the audio
// clock: every key press and question carries the time, and the tape's position is worked out from when the
// transport last changed, so it can't drift from the music however unevenly the page's frames arrive.
import { song, notesBetween } from "./music.js";

// the mixtape: an A side and a B side of stand-in songs (music.js seeds), each a set length on the tape
export const TAPE = {
  A: [{ title: "Side A, song 1", seed: 11, length: 64 }, { title: "Side A, song 2", seed: 23, length: 72 }, { title: "Side A, song 3", seed: 37, length: 60 }],
  B: [{ title: "Side B, song 1", seed: 41, length: 70 }, { title: "Side B, song 2", seed: 53, length: 66 }, { title: "Side B, song 3", seed: 67, length: 58 }],
};
export const GAP = 3;                     // seconds of hiss between songs
export const WIND = 12;                   // fast-forward and rewind run this many times play speed
export const sideLength = side => TAPE[side].reduce((s, t) => s + t.length + GAP, 0);
const SPEED = { stop: 0, play: 1, ff: WIND, rew: -WIND };
const TAPE_KEYS = ["play", "ff", "rew", "stop", "eject", "flip"];

// The notes recorded on a side between two tape positions, each with its tape position `pos`: only inside songs
// (the gaps are blank), each note exactly once however the span is cut up.
const tunes = new Map();
export function notesOnTape(side, from, to) {
  const out = [];
  if (!(to > from)) return out;
  let start = 0;
  for (const t of TAPE[side]) {
    const lo = Math.max(from, start), hi = Math.min(to, start + t.length);
    if (hi > lo) {
      if (!tunes.has(t.seed)) tunes.set(t.seed, song(t.seed));
      for (const n of notesBetween(tunes.get(t.seed), lo - start, hi - start)) out.push({ ...n, pos: start + n.t });
    }
    start += t.length + GAP;
  }
  return out;
}

// Power, the TAPE/RADIO switch, and the deck: tape in or ejected, which side faces out, each side's place, and the
// transport (stop, play, ff, rew). Like the real deck: the tape keys only work in tape mode; play and winding need
// power and a tape in; eject stops the tape first and works without power; the tape only turns over while it's out;
// winding and play stop at the ends of the side.
export function boombox() {
  const s = { power: false, mode: "tape", tapeIn: true, side: "A", pos: { A: 0, B: 0 }, motion: "stop", since: 0 };
  const canRun = () => s.power && s.mode === "tape" && s.tapeIn;
  // bring the tape up to time t (the audio clock never goes backwards; a time from the past changes nothing)
  function settle(t) {
    if (!Number.isFinite(t) || t <= s.since) return;
    const v = SPEED[s.motion];
    if (v) {
      const end = sideLength(s.side), p = s.pos[s.side] + v * (t - s.since);
      s.pos[s.side] = Math.min(end, Math.max(0, p));
      if (p >= end || p <= 0) s.motion = "stop";
    }
    s.since = t;
  }
  return {
    // the state at time t
    at(t) { settle(t); return { ...s, pos: { ...s.pos } }; },
    press(key, t) {
      settle(t);
      if (TAPE_KEYS.includes(key) && s.mode !== "tape") return;
      switch (key) {
        case "power": s.power = !s.power; if (!s.power) s.motion = "stop"; break;
        case "tape": case "radio": s.mode = key; if (key === "radio") s.motion = "stop"; break;
        case "play": case "ff": case "rew": if (canRun()) s.motion = key; break;
        case "stop": s.motion = "stop"; break;
        case "eject": s.motion = "stop"; s.tapeIn = !s.tapeIn; break;  // press again to put it back in
        case "flip": if (!s.tapeIn) s.side = s.side === "A" ? "B" : "A"; break;
      }
    },
    // what you hear at time t: a song (and how far into it), the hiss between songs, the whir of winding, or nothing
    nowPlaying(t) {
      settle(t);
      if (!canRun() || s.motion === "stop") return { sound: "none" };
      if (s.motion !== "play") return { sound: "wind" };
      let at = s.pos[s.side];
      for (const [i, song] of TAPE[s.side].entries()) {
        if (at < song.length) return { sound: "song", side: s.side, index: i, song, offset: at };
        at -= song.length;
        if (at < GAP) return { sound: "hiss" };
        at -= GAP;
      }
      return { sound: "none" };
    },
  };
}
