// The boombox's tape deck and switches, kept out of the page so they can be tested in node. The page draws it and
// plays what nowPlaying() says.

// the mixtape: an A side and a B side of stand-in songs (music.js seeds), each a set length on the tape
export const TAPE = {
  A: [{ title: "Side A, song 1", seed: 11, length: 64 }, { title: "Side A, song 2", seed: 23, length: 72 }, { title: "Side A, song 3", seed: 37, length: 60 }],
  B: [{ title: "Side B, song 1", seed: 41, length: 70 }, { title: "Side B, song 2", seed: 53, length: 66 }, { title: "Side B, song 3", seed: 67, length: 58 }],
};
export const GAP = 3;                     // seconds of hiss between songs
export const WIND = 12;                   // fast-forward and rewind run this many times play speed
export const sideLength = side => TAPE[side].reduce((s, t) => s + t.length + GAP, 0);

// power, the TAPE/RADIO switch, and the deck: tape in or ejected, which side faces out, where on that side, and
// what the transport is doing (stop, play, ff, rew). Like the real deck: the keys need power and a tape (eject
// doesn't), eject stops the tape first, the tape only turns over while it's out, and winding stops at either end.
export function boombox() {
  const s = { power: false, mode: "tape", tapeIn: true, side: "A", pos: { A: 0, B: 0 }, motion: "stop" };
  const canRun = () => s.power && s.mode === "tape" && s.tapeIn;
  return {
    get state() { return { ...s, pos: { ...s.pos } }; },
    press(key) {
      switch (key) {
        case "power": s.power = !s.power; if (!s.power) s.motion = "stop"; break;
        case "tape": case "radio": s.mode = key; if (key === "radio") s.motion = "stop"; break;
        case "play": case "ff": case "rew": if (canRun()) s.motion = key; break;
        case "stop": s.motion = "stop"; break;
        case "eject": s.motion = "stop"; s.tapeIn = !s.tapeIn; break;  // press again to put it back in
        case "flip": if (!s.tapeIn) s.side = s.side === "A" ? "B" : "A"; break;
      }
    },
    // the tape moves: play at 1x, winding at WIND x either way; stops on reaching either end of the side
    frame(dt) {
      if (!canRun()) s.motion = "stop";
      if (s.motion === "stop") return;
      const d = (Number.isFinite(dt) ? Math.max(0, dt) : 0) * (s.motion === "rew" ? -WIND : s.motion === "ff" ? WIND : 1);
      const end = sideLength(s.side), p = Math.min(end, Math.max(0, s.pos[s.side] + d));
      s.pos[s.side] = p;
      if ((p >= end && s.motion !== "rew") || (p <= 0 && s.motion === "rew")) s.motion = "stop";
    },
    // what you should hear: a song (and how far into it), the hiss between songs, the whir of winding, or nothing
    nowPlaying() {
      if (!canRun() || s.motion === "stop") return { sound: "none" };
      if (s.motion !== "play") return { sound: "wind" };
      let at = s.pos[s.side];
      for (const [i, t] of TAPE[s.side].entries()) {
        if (at < t.length) return { sound: "song", side: s.side, index: i, song: t, offset: at };
        at -= t.length;
        if (at < GAP) return { sound: "hiss" };
        at -= GAP;
      }
      return { sound: "none" };
    },
  };
}
