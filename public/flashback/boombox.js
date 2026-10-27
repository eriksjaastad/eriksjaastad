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
      for (const n of notesBetween(tunes.get(t.seed), lo - start, hi - start)) {
        const pos = start + n.t;
        out.push({ ...n, pos, dur: Math.min(n.dur, start + t.length - pos) });  // no note rings past its song's end
      }
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

// The player: turns the deck into sound. Everything is scheduled on the audio clock up to AHEAD seconds ahead, so
// the page can feed it from a plain timer (not screen redraws) and still never be late; a key that really changes
// the transport cancels what was scheduled and schedules again from that instant (the opening notes included); a key
// that changes nothing (PLAY while playing) leaves the sound alone. `out` is the page's audio:
//   now() audio-clock seconds · note(n, at) a note starting at an audio time · bed(kind, at) the background sound
//   from that time on: "hiss" between songs, "wind" while winding, "none" · cancel() stop everything scheduled
export const AHEAD = 2.5;
export function player(deck, out) {
  let cursor = null;  // the tape position notes and beds are scheduled up to, while playing
  function pump() {
    const t = out.now(), st = deck.at(t);
    if (st.motion !== "play") { cursor = null; return; }
    const here = st.pos[st.side], end = sideLength(st.side), ahead = Math.min(end, here + AHEAD), from = Math.max(cursor ?? here, here);
    if (!(ahead > from)) return;
    const when = pos => t + (pos - here);
    for (const n of notesOnTape(st.side, from, ahead)) out.note(n, when(n.pos));
    // the hiss in each gap between songs, and silence once the side runs out
    let start = 0;
    for (const song of TAPE[st.side]) {
      const gapAt = start + song.length, gapEnd = gapAt + GAP;
      if (gapAt >= from && gapAt < ahead) out.bed("hiss", when(gapAt));
      if (gapEnd >= from && (gapEnd < ahead || (gapEnd === end && ahead === end))) out.bed("none", when(gapEnd));  // incl. the side's end
      if (from > gapAt && from < gapEnd && cursor === null) out.bed("hiss", t);  // started in a gap
      start = gapEnd;
    }
    cursor = ahead;
  }
  return {
    pump,
    press(key) {
      const t = out.now(), before = deck.at(t);
      deck.press(key, t);
      const after = deck.at(t);
      if (before.motion === after.motion && before.side === after.side && before.tapeIn === after.tapeIn) return;
      out.cancel(); cursor = null;
      if (after.motion === "ff" || after.motion === "rew") {  // the whir, from now until the tape reaches the end it's heading for
        const left = after.motion === "ff" ? sideLength(after.side) - after.pos[after.side] : after.pos[after.side];
        out.bed("wind", t); out.bed("none", t + left / WIND);
      }
      pump();
    },
  };
}
