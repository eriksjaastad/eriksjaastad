// The house style every page shares (public/site.css) and the hall's six doors (src/Home/hall.js):
// each page loads the one stylesheet and carries the one way home, and every door leads to a page that exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { DOORS } from "../src/Home/hall.js";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const PAGES = [
  "public/case-studies/index.html", "public/case-studies/image-workflow/index.html", "public/websites/index.html",
  "public/gallery/index.html", "public/flashback/index.html", "public/flashback/outside/index.html", "public/memory/index.html",
];

for (const page of PAGES) {
  test(`${page} loads the house stylesheet and has one way home`, () => {
    const html = read(page);
    assert.equal(html.split('<link rel="stylesheet" href="/site.css">').length - 1, 1, "links /site.css once");
    assert.equal(html.split('<a class="home" href="/"').length - 1, 1, "one home link, to /");
  });

  test(`${page} takes its typefaces and orange from the house stylesheet`, () => {
    const html = read(page);
    for (const own of ["--display:", "--mono:", "--neon:", "JetBrains"]) assert.ok(!html.includes(own), `no ${own} of its own`);
  });
}

test("the homepage loads the house stylesheet", () => {
  assert.ok(read("index.html").includes('<link rel="stylesheet" href="/site.css">'));
});

test("the memory page is its template plus the graph data, nothing else", () => {
  const withoutData = path => read(path).split("\n").filter(line => !line.includes('id="graph"')).join("\n");
  assert.equal(withoutData("public/memory/index.html"), withoutData("scripts/memory-graph/memory-graph.template.html"));
});

test("the hall has six doors, each with its own id, name and light", () => {
  assert.equal(DOORS.length, 6);
  for (const key of ["id", "href", "name", "light"]) assert.equal(new Set(DOORS.map(d => d[key])).size, 6, `six different ${key}s`);
});

test("every door goes where its card went", () => {
  assert.deepEqual(DOORS.map(d => d.href), ["/memory/", "/case-studies/", "https://github.com/eriksjaastad", "/gallery/", "/websites/", "/flashback/outside/"]);
});

test("a door inside the site leads to a page that exists", () => {
  for (const { href } of DOORS.filter(d => d.href.startsWith("/"))) {
    assert.ok(existsSync(new URL(`../public${href}index.html`, import.meta.url)), `${href} has a page`);
  }
});
