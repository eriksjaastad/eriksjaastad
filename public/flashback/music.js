// Stand-in songs for the boombox, made up from a seed so nothing copyrighted ships: a '90s-ish loop of drums, bass,
// chords and a melody over a four-chord progression. A song is a list of notes in one loop; notesBetween() gives the
// notes starting in a window of time, looping (the boombox renders one loop of each song from it).

// a small seeded random number generator, so the same seed is always the same song
function rng(seed) {
  let s = Math.imul(seed, 2654435761) >>> 0 || 1;  // spread small seeds out; raw xorshift starts tiny for them
  const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  for (let i = 0; i < 4; i++) next();
  return next;
}
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const PROGRESSIONS = [[0, 5, 3, 4], [0, 3, 4, 4], [5, 3, 0, 4], [0, 4, 5, 3]];  // scale degrees: I-vi-IV-V and friends
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

// one loop of a song: { bpm, length (seconds), notes: [{ t, dur, freq, voice }] } sorted by t; voices are
// kick, snare, hat (noise drums), bass, chord, lead
export function song(seed) {
  const r = rng(seed), bpm = 84 + Math.floor(r() * 40), beat = 60 / bpm, key = 48 + Math.floor(r() * 7);
  const prog = PROGRESSIONS[Math.floor(r() * PROGRESSIONS.length)], bars = 4, notes = [];
  const scale = deg => key + MAJOR[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);
  const lead = Array.from({ length: 8 }, () => Math.floor(r() * 7));  // a short motif, varied per bar
  for (let bar = 0; bar < bars; bar++) {
    const root = prog[bar], t0 = bar * 4 * beat;
    for (let b = 0; b < 4; b++) {
      const t = t0 + b * beat;
      notes.push({ t, dur: 0.12, freq: 0, voice: b % 2 ? "snare" : "kick" });
      notes.push({ t: t + beat / 2, dur: 0.05, freq: 0, voice: "hat" });
      notes.push({ t, dur: beat * 0.9, freq: hz(scale(root) - 12), voice: "bass" });
    }
    for (const d of [0, 2, 4]) notes.push({ t: t0, dur: 4 * beat * 0.95, freq: hz(scale(root + d)), voice: "chord" });
    for (let i = 0; i < 8; i++) if (r() < 0.75) notes.push({ t: t0 + i * beat / 2, dur: beat / 2 * 0.9, freq: hz(scale(root + lead[i] + (bar % 2)) + 12), voice: "lead" });
  }
  notes.sort((a, b) => a.t - b.t);
  return { bpm, length: bars * 4 * beat, notes };
}

// the notes of a looping song that start in [from, to) seconds from the song's start, each with its absolute time
export function notesBetween(s, from, to) {
  const out = [];
  if (!(to > from) || !Number.isFinite(from) || !Number.isFinite(to)) return out;
  for (let loop = Math.floor(from / s.length); loop * s.length < to; loop++) {
    for (const n of s.notes) {
      const t = loop * s.length + n.t;
      if (t >= from && t < to) out.push({ ...n, t });
    }
  }
  return out;
}
