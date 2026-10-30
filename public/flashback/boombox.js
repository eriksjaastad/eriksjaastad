// The boombox's tape deck and switches, kept out of the page so they can be tested in node. Time is the audio
// clock: every key press and question carries the time, and the tape's position is worked out from when the
// transport last changed, so it can't drift from the music however unevenly the page's frames arrive.

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

// The player: turns the deck into sound. Each side of the tape is recorded once (the page renders each song's loop
// offline, like dubbing a cassette), so playing is starting that side at the tape's position: the page schedules
// the rest of the side (each song's loop for its length, the hiss in the gaps) on the audio clock in one go, with
// nothing left to feed later and the side's end as the end of the sound. A key that really changes the transport
// (motion, side, tape in/out) cancels what is sounding and starts again from that instant, using the same time and
// position the deck used; a key that changes nothing (PLAY while playing) leaves the sound alone. PLAY on a side not recorded yet holds the
// tape where it is (it doesn't run silently) until the recording is ready, then plays from exactly there; any other
// key meanwhile drops the hold. A side whose recording fails keeps its own error (the other side is unaffected) and
// drops a hold for it; PLAY on it again records it again. `out` is the page's audio:
//   now() audio-clock seconds · ready(side) is that side recorded yet · record(side) start recording it (the page
//   calls player.recorded(side) when done, or player.failed(side, why)) · play(side, at, from) start the side at
//   audio time `at` from tape position `from` · wind(at, until) the whir of winding between two audio times · cancel() stop everything sounding
export function player(deck, out) {
  let waiting = null;  // the side PLAY is held for while it's recorded
  const errors = { A: null, B: null };  // why each side couldn't be recorded, until it is
  function start(t) {
    const st = deck.at(t), side = st.side, pos = st.pos[side];
    if (st.motion === "play") {
      if (out.ready(side)) out.play(side, t, pos);
      else { waiting = side; errors[side] = null; deck.press("stop", t); out.record(side); }
    }
    else if (st.motion === "ff") out.wind(t, t + (sideLength(side) - pos) / WIND);
    else if (st.motion === "rew") out.wind(t, t + pos / WIND);
  }
  return {
    get waiting() { return waiting; },
    error: side => errors[side],
    press(key) {
      if (key !== "play") waiting = null;  // any other key drops a held PLAY
      const t = out.now(), before = deck.at(t);
      deck.press(key, t);
      const after = deck.at(t);
      if (before.motion === after.motion && before.side === after.side && before.tapeIn === after.tapeIn) return;
      waiting = null;
      out.cancel();
      start(t);
    },
    // a side finished recording: if PLAY is held for it, play from where the tape is held
    recorded(side) {
      errors[side] = null;
      if (waiting !== side || !out.ready(side)) return;
      const t = out.now(), st = deck.at(t);
      waiting = null;
      if (st.side !== side || !st.tapeIn) return;  // (keys that change these drop the hold anyway)
      deck.press("play", t);  // needs power and tape mode, as ever; if they're gone, start() finds nothing playing
      start(t);
    },
    // a side couldn't be recorded: keep why for that side, and stop holding PLAY for it
    failed(side, why) { errors[side] = why; if (waiting === side) waiting = null; },
  };
}
