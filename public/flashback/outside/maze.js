// The walk to the cabin, seen from above: the map and the rules for moving on it, kept out of the page so they can
// be tested in node. One character is one 8 px tile; the page draws them.

// T tree · R roof · C cabin wall · W lit window · D the door · , grass · f flowers · # hedge · . path · S start
export const MAP = [
  "TTTTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTTTTTT",
  "TTTTTTTRRRRRRTTTTTTT",
  "TTTTTTTRRRRRRTTTTTTT",
  "TTTTTT,CWDCWC,TTTTTT",
  "TT,,,,,,,,,,,,,,,,TT",
  "T,,f,,,,,,,,,,,f,,,T",
  "T,,,,,,,,,,,,,,,,,,T",
  "#########.##########",
  "#.....#...........##",
  "#.###.###########.##",
  "#.#...#.....#.....##",
  "#.#.###.###.#.######",
  "#.#.....#.....#...##",
  "#.#############.#.##",
  "#...............#S##",
  "####################",
  "####################",
];
const OPEN = new Set([".", ",", "f", "S", "D"]);

export function find(ch, map = MAP) {
  for (let y = 0; y < map.length; y++) { const x = map[y].indexOf(ch); if (x >= 0) return { x, y }; }
  return null;
}
export const open = (x, y, map = MAP) => y >= 0 && y < map.length && x >= 0 && x < map[y].length && OPEN.has(map[y][x]);

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// The keyboard, fed DOM key events, driving a mover. Each physical key (event.code) owns its own hold: the
// direction comes from what the key means when pressed (an arrow, or a number-pad arrow with NumLock off), and its
// keyup releases whatever that key holds, whatever the key means by then (NumLock may have changed). As in the
// gallery (walk.js keyDown), a modifier means a shortcut (Cmd+Left is Back) and macOS drops keyups while Cmd is
// held, so a modified key walks nowhere and drops every keyboard hold; touch holds carry on. down() says whether
// the page should preventDefault (only for the keys it uses).
const ARROWS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
export function keyboard(me) {
  const source = ({ code, key }) => `key:${code || key}`;
  return {
    down(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) { me.drop(s => s.startsWith("key:"), true); return false; }
      const dir = ARROWS[e.key];
      if (!dir) return false;
      me.press(dir, source(e));
      return true;
    },
    up(e) { const s = source(e); me.drop(x => x === s); },
  };
}

export const STEP = 0.14;  // seconds to walk one tile

// Hold a direction and you keep walking that way, a tile at a time; the last direction pressed (and still held)
// wins. A press let go before the next frame still takes its one step. Each input (a key, a finger) owns its own
// hold, so two holding the same way keep you walking until both let go; pressing again what an input already holds
// (a key's autorepeat) changes nothing. Walls stop you but you still turn to face them. frame(dt) returns where to draw you, in tiles, part-way
// through a step, and `inside` once you have stepped onto the door.
export function mover(start = find("S"), map = MAP) {
  const held = [];  // [dir, source] in the order pressed
  let at = { ...start }, to = null, t = 0, facing = "up", tapped = null;  // tapped: [dir, source] not yet walked
  const release = (dir, source = "key") => { const i = held.findIndex(([d, s]) => d === dir && s === source); if (i >= 0) held.splice(i, 1); };
  return {
    press(dir, source = "key") {
      if (!DIRS[dir] || held.some(([d, s]) => d === dir && s === source)) return;
      held.push([dir, source]); tapped = [dir, source];
    },
    release,
    releaseAll() { held.length = 0; tapped = null; },
    // let go of every hold whose source passes `test`; with cancelTap, also of a tap not yet walked from such a source
    drop(test, cancelTap = false) {
      for (let i = held.length - 1; i >= 0; i--) if (test(held[i][1])) held.splice(i, 1);
      if (cancelTap && tapped && test(tapped[1])) tapped = null;
    },
    frame(dt) {
      t += Number.isFinite(dt) ? Math.min(0.1, Math.max(0, dt)) : 0;  // a frame after a pause can't skip the maze
      for (;;) {
        if (to) {
          if (t < STEP) break;
          t -= STEP; at = to; to = null;
        }
        const dir = held.at(-1)?.[0] ?? tapped?.[0]; tapped = null;
        if (!dir || map[at.y][at.x] === "D") { t = 0; break; }
        facing = dir;
        const [dx, dy] = DIRS[dir];
        if (!open(at.x + dx, at.y + dy, map)) { t = 0; break; }
        to = { x: at.x + dx, y: at.y + dy };
      }
      const k = to ? t / STEP : 0;
      return { x: at.x + (to ? (to.x - at.x) * k : 0), y: at.y + (to ? (to.y - at.y) * k : 0), facing, moving: !!to, inside: !to && map[at.y][at.x] === "D" };
    },
  };
}
