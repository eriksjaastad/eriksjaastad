// The rotary phone's dial, kept out of the page so it can be tested in node. Angles are degrees, clockwise, as on
// screen. Ten finger holes sit round the wheel; you put a finger in one and turn the wheel clockwise until the hole
// meets the metal finger stop, let go, and the wheel springs back. Only a pull that reaches the stop dials its digit,
// and you can't start the next one until the wheel is home.

export const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
export const STOP = 30;      // where the finger stop sits (about four o'clock)
export const FIRST = 60;     // the 1 hole is this far round from the stop
export const GAP = 30;       // between neighbouring holes
export const SLACK = 6;      // a pull counts if it ends within this of the stop
export const RETURN = 420;   // how fast the wheel springs back, degrees a second
export const LENGTH = 7;     // a local number

// how far a digit's hole has to turn to reach the stop (1 is shortest, 0 longest), and where it sits at rest
export const travel = d => FIRST + DIGITS.indexOf(d) * GAP;
export const restAngle = d => STOP - travel(d);

// the numbers on the notepad by the phone; anything else isn't in service
export const DIRECTORY = { "5550142": "time", "5550177": "closures" };
export const lineFor = number => Object.hasOwn(DIRECTORY, number) ? DIRECTORY[number] : number.length === LENGTH && /^[0-9]+$/.test(number) ? "none" : null;

// Pulses: as the wheel springs back from a dialed digit it clicks once per pulse, one for 1 up to ten for 0. The
// pulse points sit half a gap after the blank sector, a gap apart; a digit's return passes exactly its count of them.
const PULSE_AT = k => FIRST / 2 + k * GAP;

export function dialer() {
  let rotation = 0, hold = null, owner = null, last = 0, dialed = 0;  // dialed: the travel of the digit springing back
  const digits = [];
  const turn = a => ((a % 360) + 540) % 360 - 180;  // a change of pointer angle, the short way round
  const drag = angle => { if (Number.isFinite(angle)) { rotation = Math.min(travel(hold), Math.max(0, rotation + turn(angle - last))); last = angle; } };
  return {
    get rotation() { return rotation; },
    get number() { return digits.join(""); },
    get ready() { return hold === null && rotation === 0 && digits.length < LENGTH; },
    // a finger (pointer `id`) goes into a hole at `angle`; refused while the wheel is out, the number is complete,
    // or another finger already holds it
    grab(digit, angle, id = 0) {
      if (!this.ready || !DIGITS.includes(digit) || !Number.isFinite(angle)) return false;
      hold = digit; owner = id; last = angle; return true;
    },
    // the holding finger moved to `angle`: the wheel follows, never backwards past rest or forwards past the stop;
    // any other finger is ignored
    drag(angle, id = 0) { if (hold !== null && id === owner) drag(angle); },
    // the holding finger lifts at `angle` (its last move counts): returns the digit dialed, or null if short
    release(angle, id = 0) {
      if (hold === null || id !== owner) return null;
      drag(angle);
      const d = rotation >= travel(hold) - SLACK ? hold : null;
      if (d) { digits.push(d); dialed = rotation; } else dialed = 0;
      hold = null; owner = null;
      return d;
    },
    // the finger's pull was interrupted (pointercancel): nothing dials, the wheel goes home without pulses
    cancel(id = 0) { if (hold !== null && id === owner) { hold = null; owner = null; dialed = 0; } },
    // the wheel springs back while nobody holds it; returns the rotation to draw and how many pulses it passed
    frame(dt) {
      let pulses = 0;
      if (hold === null && rotation > 0) {
        const before = rotation;
        rotation = Math.max(0, rotation - RETURN * (Number.isFinite(dt) ? Math.max(0, dt) : 0));
        if (dialed) for (let k = 0; PULSE_AT(k) < dialed; k++) if (PULSE_AT(k) <= before && PULSE_AT(k) > rotation) pulses++;
        if (rotation === 0) dialed = 0;
      }
      return { rotation, pulses };
    },
    hangUp() { digits.length = 0; hold = null; owner = null; },
  };
}

// What a call sounds like, in seconds from the moment the last digit is home. Ringback is the US cadence, two
// seconds on and four off; the line answers half a second after the second ring ends, never during one.
export const RINGS = [[0, 2], [6, 2]];
export const ANSWER = 8.5;
// The time line names the time at its tone, a 10-second mark at least `lead` seconds after it starts speaking (the
// sentence takes about that long), and sounds the tone exactly then. Returns { toneAt (ms), words } for Seattle.
export function atTheTone(startMs, lead = 7) {
  const toneAt = Math.ceil((startMs + lead * 1000) / 10000) * 10000;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
    .formatToParts(new Date(toneAt)).map(p => [p.type, p.value]));
  const secs = Number(parts.second);
  return { toneAt, words: `${parts.hour}:${parts.minute} ${parts.dayPeriod}${secs ? ` and ${secs} seconds` : " exactly"}` };
}

// Place a call. Every tone is scheduled on the audio clock up front, so the ring cadence and the time line's tone
// can't drift if timers fire late (a busy or background tab); the voice waits on a timer, and if that timer fires
// early by the audio clock (they can disagree) it waits the rest, so it never speaks over a ring. Dependencies are
// passed in so node tests can run it on a fake clock:
//   now() audio-clock seconds · wall() epoch ms · tone(freqs, at, length, gain) at an audio time ·
//   later(seconds, fn) a timer · speak(text) · temp() Seattle's temperature or null
// Returns cancel(), which stops the timers this call set (the page stops the sounds).
export const SIT = [913.8, 1370.6, 1776.7];  // the three rising "not in service" tones
export const SAYINGS = {
  none: "We're sorry. The number you have dialed is not in service. Please check the number and dial again.",
  closures: "School closure information. Due to snow and ice, all Seattle area schools are closed today. Stay home, have some cocoa, and don't forget your mittens. Again: all schools are closed today.",
};
export function placeCall(line, { now, wall, tone, later, speak, temp }) {
  const t0 = now(), timers = [];
  let live = true;
  // run fn once the audio clock reaches t0 + when; a timer that fires early by that clock waits the rest
  const at = (when, fn) => timers.push(later(Math.max(0, t0 + when - now()), () => {
    if (!live) return;
    if (t0 + when - now() > 1e-3) at(when, fn); else fn();
  }));
  if (line === "none") {
    SIT.forEach((f, i) => tone([f], t0 + 0.3 + i * 0.33, 0.28, 0.08));
    at(1.4, () => speak(SAYINGS.none));
  } else {
    for (const [s, len] of RINGS) tone([440, 480], t0 + s, len, 0.08);
    at(ANSWER, () => {
      if (line !== "time") { speak(SAYINGS.closures); return; }
      const { toneAt, words } = atTheTone(wall()), t = temp();
      speak(`At the tone, Seattle time will be ${words}. ${t === null ? "The temperature isn't available right now." : `The temperature is ${t} degrees.`}`);
      tone([1000], now() + (toneAt - wall()) / 1000, 0.5, 0.06);  // on the audio clock, at the moment it names
    });
  }
  return { cancel() { live = false; } };
}
