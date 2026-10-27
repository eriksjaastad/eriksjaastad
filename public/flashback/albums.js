// The photo albums and scrapbook on the cabin's chest, and the page-turning rules for reading one.
// Photos are stand-ins until Erik's real ones arrive; a real photo is { src: "/flashback/photos/<file>.jpg", note }.

// a stand-in photo: an SVG print in the book's colour with its number on it, so pages read as waiting, not broken
const standIn = (hue, n) => ({
  src: "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},45%,62%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},50%,32%)"/></linearGradient></defs>` +
    `<rect width="400" height="300" fill="url(#g)"/><text x="200" y="160" font-family="monospace" font-size="22" fill="rgba(255,255,255,.75)" text-anchor="middle">photo ${n} · coming soon</text></svg>`),
  note: `photo ${n} · coming soon`,
});
const book = (title, hue, pages, perPage) => ({
  title, pages: Array.from({ length: pages }, (_, p) => Array.from({ length: perPage }, (_, i) => standIn(hue + p * 9, p * perPage + i + 1))),
});

// keyed by the mesh names in index.html
export const BOOKS = {
  album0: book("Album 1", 210, 6, 4), album1: book("Album 2", 350, 6, 4), album2: book("Album 3", 150, 6, 4),
  album3: book("Album 4", 270, 6, 4), album4: book("Album 5", 30, 6, 4), scrapbook: book("The scrapbook", 320, 8, 3),
};

// Which pages are showing: perView of them at a time (2 = a spread, 1 on a phone), starting from `first`.
// Turning stops at either cover. Changing perView (rotating a phone) keeps the page you were on in view.
export function pager(count, perView) {
  let first = 0;
  return {
    get first() { return first; },
    get showing() { return Array.from({ length: perView }, (_, i) => first + i).filter(i => i < count); },
    get canPrev() { return first > 0; },
    get canNext() { return first + perView < count; },
    next() { if (first + perView < count) first += perView; },
    prev() { if (first > 0) first -= perView; },
    view(n) { perView = n; first -= first % n; },  // round down to the spread holding the page you were on
  };
}
