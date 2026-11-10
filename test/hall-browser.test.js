// The hall and the way home, in a real browser: the parts only a browser can show. Headless Chromium (playwright-core)
// opens the site from a Vite dev server started for the test, so the memory door is really clicked, a door is really
// reached for, and the character is really measured on every page.
// The browser is installed once per machine: `npx playwright-core install chromium`. Without it these tests fail.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("..", import.meta.url));
// every section page: public/<path>/index.html is served at /<path>/
const PAGES = readdirSync(`${root}public`, { recursive: true }).filter(file => file.endsWith("index.html")).map(file => `/${file.slice(0, -"index.html".length)}`).sort();

let vite, browser, origin;
before(async () => {
  // its own dependency cache, so it never disturbs a dev server already running in this checkout
  vite = await createServer({ root, logLevel: "silent", cacheDir: "node_modules/.vite-test", server: { host: "127.0.0.1", port: 0 } });
  await vite.listen();
  origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await vite?.close();
});

// A page of the site in a fresh browser profile that has already seen the intro (it plays once per browser).
// Nothing outside the dev server is fetched (the web fonts, the 3D pages' three.js): none of it moves what is checked here.
async function open(path, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => localStorage.setItem("introSeen", "1"));
  await context.route(url => url.origin !== origin, route => route.abort());
  const page = await context.newPage();
  await page.goto(origin + path, { waitUntil: "domcontentloaded" });
  return page;
}
const WAIT = { timeout: 8000 };

test("the memory door pushes the homepage away and brings the graph forward, and Back undoes it", { timeout: 30000 }, async () => {
  const page = await open("/");
  await page.locator("#memoryLink").click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector("#home")).opacity === "0", null, WAIT);
  assert.equal(new URL(page.url()).pathname, "/memory/", "the address is the memory page's, with no page load");
  assert.deepEqual(await page.evaluate(() => [getComputedStyle(document.querySelector("#memory")).visibility, document.querySelector("#home").inert]), ["visible", true]);
  await page.goBack();
  await page.waitForFunction(() => getComputedStyle(document.querySelector("#home")).opacity === "1", null, WAIT);
  assert.equal(new URL(page.url()).pathname, "/");
  await page.context().close();
});

test("reaching for a door turns its leaf into the room and lets its light out; the memory hatch turns out into the hall", { timeout: 30000 }, async () => {
  const page = await open("/");
  const style = (selector, property) => page.locator(selector).first().evaluate((el, property) => getComputedStyle(el)[property], property);
  // The third number of a leaf's matrix is -sin(its angle): below zero once the edge right of the hinge has gone away
  // from you, above zero once it has come towards you. Resolves when the leaf has turned well past a crack that way.
  const turned = (id, away) => page.waitForFunction(([selector, away]) => {
    const matrix = getComputedStyle(document.querySelector(selector)).transform.split(",");
    return matrix.length === 16 && (away ? Number(matrix[2]) < -0.4 : Number(matrix[2]) > 0.4);
  }, [`.door.${id} .leaf:not(.back)`, away], WAIT);

  assert.equal(await style(".door.cases .leaf", "transform"), "none", "shut until reached for");
  assert.equal(await style(".door.cases .out", "opacity"), "0", "and no light through a gap that isn't there");
  assert.notEqual(await style(".door.cases .art", "perspective"), "none", "seen in perspective, so a turn isn't a squeeze");

  await page.locator(".door.cases .art").hover();
  await turned("cases", true);
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".door.cases .out")).opacity === "1", null, WAIT);

  await page.locator(".door.memory .art").hover();
  await turned("memory", false);
  await page.context().close();
});

for (const width of [1440, 390]) {
  test(`at ${width}px wide the way home stands on the same spot in the window's top-left corner on every page`, { timeout: 60000 }, async () => {
    const spots = {};
    for (const path of PAGES) {
      const page = await open(path, { width, height: 900 });
      spots[path] = await page.locator("a.home").evaluate(home => { const { left, top } = home.getBoundingClientRect(); return [Math.round(left), Math.round(top)]; });
      await page.context().close();
    }
    const [left, top] = spots[PAGES[0]];
    assert.ok(left <= 40 && top <= 40, `in the corner, not at ${left}, ${top}`);
    assert.deepEqual(spots, Object.fromEntries(PAGES.map(path => [path, [left, top]])));
  });
}
