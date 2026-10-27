// Reading the cabin's albums: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { BOOKS, pager } from "../public/flashback/albums.js";

test("pager: a spread at a time, stopping at both covers, with an odd last page on its own", () => {
  const p = pager(5, 2);
  assert.deepEqual(p.showing, [0, 1]); assert.equal(p.canPrev, false);
  p.prev(); assert.deepEqual(p.showing, [0, 1]);
  p.next(); p.next(); assert.deepEqual(p.showing, [4]); assert.equal(p.canNext, false);
  p.next(); assert.deepEqual(p.showing, [4]);
  p.prev(); assert.deepEqual(p.showing, [2, 3]);
});

test("pager: turning a phone keeps the page you were on in view", () => {
  const p = pager(6, 1); p.next(); p.next(); p.next();     // on page 4 of 6
  p.view(2); assert.deepEqual(p.showing, [2, 3]);
  p.view(1); assert.deepEqual(p.showing, [2]);
});

test("pager: any turns and rotations show 1-2 real pages in order, the first a multiple of the view, and the flags tell the truth", () => {
  const ev = fc.constantFrom("next", "prev", 1, 2);
  fc.assert(fc.property(fc.integer({ min: 1, max: 12 }), fc.constantFrom(1, 2), fc.array(ev, { maxLength: 30 }), (count, start, events) => {
    const p = pager(count, start);
    let per = start;
    for (const e of events) {
      if (typeof e === "number") { per = e; p.view(e); } else p[e]();
      const s = p.showing;
      assert.ok(s.length >= 1 && s.length <= per && s[0] === p.first && p.first % per === 0, JSON.stringify({ s, per }));
      assert.ok(s.every((v, i) => v === s[0] + i && v < count));
      assert.equal(p.canPrev, p.first > 0); assert.equal(p.canNext, s.at(-1) < count - 1);
    }
  }), { numRuns: 500 });
});

test("books: every album and the scrapbook has pages of photos, each with a picture and a note", () => {
  for (const [name, b] of Object.entries(BOOKS)) {
    assert.ok(b.title && b.pages.length > 0, name);
    for (const page of b.pages) assert.ok(page.length > 0 && page.every(p => p.src && p.note), name);
  }
});
