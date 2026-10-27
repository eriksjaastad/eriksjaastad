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

export function dialer() {
  let rotation = 0, hold = null, last = 0;
  const digits = [];
  const turn = a => ((a % 360) + 540) % 360 - 180;  // a change of pointer angle, the short way round
  return {
    get rotation() { return rotation; },
    get number() { return digits.join(""); },
    get ready() { return hold === null && rotation === 0 && digits.length < LENGTH; },
    // put a finger in a hole, the pointer at `angle`; refused while the wheel is out or the number is complete
    grab(digit, angle) {
      if (!this.ready || !DIGITS.includes(digit) || !Number.isFinite(angle)) return false;
      hold = digit; last = angle; return true;
    },
    // the pointer moved to `angle`: the wheel follows, never backwards past rest or forwards past the stop
    drag(angle) {
      if (hold === null || !Number.isFinite(angle)) return;
      rotation = Math.min(travel(hold), Math.max(0, rotation + turn(angle - last)));
      last = angle;
    },
    // let go: returns the digit dialed, or null if the pull stopped short
    release() {
      if (hold === null) return null;
      const d = rotation >= travel(hold) - SLACK ? hold : null;
      if (d) digits.push(d);
      hold = null;
      return d;
    },
    // the wheel springs back while nobody holds it; returns the rotation to draw
    frame(dt) {
      if (hold === null && rotation > 0) rotation = Math.max(0, rotation - RETURN * (Number.isFinite(dt) ? Math.max(0, dt) : 0));
      return rotation;
    },
    hangUp() { digits.length = 0; hold = null; },
  };
}
