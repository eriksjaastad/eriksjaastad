// The six doors in the hall, rendered the way the homepage renders them (src/Home/Doors.jsx, swung by src/Home/Home.css):
// which ones show light while shut, which way each one opens, and that opening is a turn on the hinge, not a squeeze.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DOORS } from "../src/Home/hall.js";

const css = readFileSync(new URL("../src/Home/Home.css", import.meta.url), "utf8");
const DRAWING = { memory: "MemoryDoor", cases: "CaseDoor", github: "GithubDoor", gallery: "GalleryDoor", shop: "ShopDoor", cabin: "CabinDoor" };
const ids = DOORS.map(door => door.id);

// door id -> its drawing's markup. Vite loads the JSX as the build would; nothing is served or watched.
let drawn;
before(async () => {
  const vite = await createServer({
    root: fileURLToPath(new URL("..", import.meta.url)), appType: "custom", logLevel: "silent",
    server: { middlewareMode: true, watch: null, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true },
  });
  try {
    const Doors = await vite.ssrLoadModule("/src/Home/Doors.jsx");
    drawn = Object.fromEntries(ids.map(id => [id, renderToStaticMarkup(createElement(Doors[DRAWING[id]]))]));
  } finally {
    await vite.close();
  }
});

// Every leaf of a door: where it's hung across the drawing (%), and how far it swings (the stylesheet's angle unless it sets its own).
const usual = () => Number(css.match(/\.door:hover \.leaf[^{]*\{ transform: rotateY\(var\(--swing, (-?\d+)deg\)\)/)?.[1]);
const leaves = id => [...drawn[id].matchAll(/<svg class="leaf[^"]*" style="--hinge:([\d.]+)%(?:;--swing:(-?\d+)deg)?"/g)]
  .map(([, hinge, swing]) => ({ hinge: Number(hinge), swing: swing === undefined ? usual() : Number(swing) }));
// A positive turn carries the edge to the right of the hinge away from you. So a leaf hung on the left goes into its room
// on a positive swing, and one hung on the right on a negative one.
const intoTheRoom = ({ hinge, swing }) => (hinge < 50) === (swing > 0);

test("every door has a leaf hung on a hinge", () => {
  for (const id of ids) assert.ok(leaves(id).length >= 1, `${id} has a leaf`);
});

test("shut, only the doors with a gap under them put light on the hall floor", () => {
  assert.deepEqual(ids.filter(id => drawn[id].includes('class="pool"')), ["cases", "shop", "cabin"]);
});

test("the light a door lets out through its gap stays hidden until it opens", () => {
  for (const id of ids) assert.ok(drawn[id].includes('class="out"'), `${id} has light to let out`);
  assert.match(css, /\n\.out \{ opacity: 0;/);
  assert.match(css, /\n\.door:hover \.out, \.door:focus-visible \.out \{ opacity: 1;/);
});

test("a door opens by turning on its hinge, seen in perspective, not by getting narrower", () => {
  assert.ok(usual() > 0, "the usual swing is a turn, away from you");
  assert.match(css, /\n\.door \.art \{[^}]*perspective:/);
  assert.match(css, /\n\.leaf \{ transform-origin: var\(--hinge\)/);
  assert.doesNotMatch(css, /\.leaf[^{]*\{[^}]*scale/);
});

test("the memory hatch opens out into the hall, and every other door into its room", () => {
  for (const id of ids) {
    for (const leaf of leaves(id)) assert.equal(intoTheRoom(leaf), id !== "memory", `${id}'s leaf hung at ${leaf.hinge}% swings ${leaf.swing}deg`);
  }
});
