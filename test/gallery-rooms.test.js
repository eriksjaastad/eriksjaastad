// The gallery's room styles: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { styleFrom, FOOTPRINT, hypostyleColumns, NAVE, AISLE, PANTHEON } from "../public/gallery/rooms.js";

test("rooms: ?room= picks a style by name; anything else is the classic room", () => {
  assert.equal(styleFrom("?room=hypostyle"), "hypostyle"); assert.equal(styleFrom("?room=pantheon"), "pantheon");
  for (const s of ["", "?room=", "?room=PANTHEON", "?room=toString", "?room=__proto__", "?other=pantheon", "?room=egypt"]) assert.equal(styleFrom(s), "classic", s);
});

// the gap between a circle and the footprint rectangle (negative: they overlap)
const gap = ([x, z], r) => Math.hypot(Math.max(FOOTPRINT.minX - x, 0, x - FOOTPRINT.maxX), Math.max(FOOTPRINT.minZ - z, 0, z - FOOTPRINT.maxZ)) - r;

test("hypostyle: every column stands clear of the gallery by at least a metre, about 134 of them, never two in one place", () => {
  const { nave, aisles } = hypostyleColumns();
  for (const c of nave) assert.ok(gap(c, NAVE.r) >= 1, `nave ${c}`);
  for (const c of aisles) assert.ok(gap(c, AISLE.r) >= 1, `aisle ${c}`);
  const all = [...nave, ...aisles];
  assert.equal(nave.length, 12); assert.ok(all.length >= 130 && all.length <= 140, `${all.length}`);
  assert.equal(new Set(all.map(String)).size, all.length);
});

test("pantheon: the whole gallery fits inside the rotunda with room to spare", () => {
  for (const x of [FOOTPRINT.minX, FOOTPRINT.maxX]) for (const z of [FOOTPRINT.minZ, FOOTPRINT.maxZ]) {
    assert.ok(Math.hypot(x - PANTHEON.x, z - PANTHEON.z) <= PANTHEON.r - 8, `${x},${z}`);
  }
});
