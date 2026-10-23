// Drives the markup in Home.jsx. mount() starts the intro and returns a cleanup
// that stops the animation loop and removes every window listener it added.

// The character: a little TV/monitor (Dad's TI ran on a TV) with a face on its screen.
const SPRITE = [
  "................",
  "..BBBBBBBBBBBB..",
  ".BFFFFFFFFFFFFB.",
  ".BFSSSSSSSSSSFB.",
  ".BFSSESSSSESSFB.",
  ".BFSSESSSSESSFB.",
  ".BFSSSSSSSSSSFB.",
  ".BFSESSSSSSESFB.",
  ".BFSSEEEEEESSFB.",
  ".BFSSSSSSSSSSFB.",
  ".BFFFFFFFFFFFFB.",
  ".BFFFFFFFFKFKFB.",
  ".BFFFFFFFFFFFFB.",
  "..BBBBBBBBBBBB..",
  "...LL......LL...",
  "..LLL......LLL..",
];
const ERAS = [
  { dur: 4400, chrome: "", pal: { B: "#000", F: "#c9c9c9", S: "#2a2fa8", E: "#fff", K: "#d4524d", L: "#000" },
    msgs: ["READY-PRESS ANY KEY TO BEGIN", "LEARN TO TYPE. YOU WILL NEED IT.", "TURN THE TV TO CHANNEL 3.", "PUSH THE HANDSET INTO THE CUPS.", "SKREEEEE-KSSHHHHH."], coupler: 3 },
  { dur: 3200, chrome: "File  Edit  View  Special", pal: { B: "#000", F: ["#000", "#fff"], S: "#fff", E: "#000", K: "#000", L: "#000" },
    msgs: ["Welcome to Macintosh.", "Spell check doesn't know “Sjaastad.”", "Please insert disk 2 of 7.", "This paper is due at 8 a.m."] },
  { dur: 3200, chrome: "Dial-Up Networking", pal: { B: "#000080", F: ["#c0c0c0", "#808080"], S: "#008080", E: "#ffff00", K: "#ff0000", L: "#000080" },
    msgs: ["Connecting at 28.8 kbps…", "Please don't pick up the phone.", "Downloading a 40 KB JPEG. Grab a sandwich.", "Mom, get off the phone."] },
  { dur: 4200, chrome: "", stall: true, pal: { B: "#ff8a28", F: "#2b2f38", S: "#0b2a4a", E: "#fff", K: "#ffb067", L: "#ff8a28" },
    msgs: ["Turn up your speakers.", "Loading 45 MB so you can watch a logo spin.", "Best viewed at 1024×768.", "This loading bar is lying to you."] },
  { dur: 3600, chrome: "", smooth: true,
    msgs: ["Thinking…", "You're absolutely right!", "Three agents reviewed this loading bar. Two passed.", "Okay. Hi."] },
];
const YEARS = [1983, 1992, 1996, 2003, 2026, 2026];

// Side view: a phone handset pressed into the rubber cups of an acoustic coupler.
const COUPLER = [
  "................................",
  ".....HHHHHHHHHHHHHHHHHHHHHH.....",
  "....HhhhhhhhhhhhhhhhhhhhhhhH....",
  "...HHHHHHHHHHHHHHHHHHHHHHHHHH...",
  "..HHHHH..................HHHHH..",
  "..HHHHHH................HHHHHH..",
  "..HHHHHH................HHHHHH..",
  ".RRRRRRRR..............RRRRRRRR.",
  ".RCCCCCCR..............RCCCCCCR.",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "XxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX",
  "XxGxxxxxxxxxxxxxxxxxxxxxxxxxxxxX",
  "XxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
];
const COUPLER_PAL = { H: "#101018", h: "#5a5a68", R: "#3a3a44", C: "#1c1c22", X: "#101018", x: "#cdb68c", G: "#d4524d" };

function blinking(t) { return (t % 3800) < 140; }

function drawPixels(ctx, pal, t, gloss) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.imageSmoothingEnabled = false;
  const closed = blinking(t), u = 32;
  SPRITE.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === ".") return;
    let c = (ch === "E" && closed && (y === 4)) ? pal.S : pal[ch];
    if (Array.isArray(c)) c = c[(x + y) % 2]; // dither, like a 1-bit Mac or a 16-color GIF
    ctx.fillStyle = c; ctx.fillRect(x * u, y * u, u, u);
  }));
  if (gloss) { // Flash-era glass shine
    ctx.globalCompositeOperation = "source-atop";
    const g = ctx.createLinearGradient(0, 32, 0, 260);
    g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 32, 512, 230);
    ctx.globalCompositeOperation = "source-over";
  }
}

function drawCoupler(ctx, t) {
  ctx.clearRect(0, 0, 512, 512);
  ctx.imageSmoothingEnabled = false;
  const u = 16, top = 200, ledOn = Math.floor(t / 300) % 2;
  COUPLER.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === "." || (ch === "G" && !ledOn)) return;
    ctx.fillStyle = COUPLER_PAL[ch]; ctx.fillRect(x * u, top + y * u, u, u);
  }));
  // the screech: a jagged waveform above the handset
  ctx.fillStyle = "#fff";
  const phase = Math.floor(t / 90);
  for (let c = 9; c < 23; c++) ctx.fillRect(c * u, top - u * (3 + (c + phase) % 3), u, u);
}

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// 2026: the same TV, grown soft. Antenna light = "thinking".
function drawSmooth(ctx, t, lk, reduce) {
  ctx.clearRect(0, 0, 512, 512);
  const bob = reduce ? 0 : Math.sin(t / 420) * 8;
  ctx.save(); ctx.translate(0, bob);
  ctx.strokeStyle = "#e0795c"; ctx.lineWidth = 8; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(256, 92); ctx.quadraticCurveTo(262, 60, 282, 44); ctx.stroke();
  const pulse = reduce ? 1 : .6 + .4 * Math.sin(t / 260);
  ctx.fillStyle = "#ffc46b"; ctx.shadowColor = "#ffc46b"; ctx.shadowBlur = 24 * pulse;
  ctx.beginPath(); ctx.arc(284, 40, 13, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = "#e0795c"; rr(ctx, 178, 368, 40, 46, 20); ctx.fill(); rr(ctx, 294, 368, 40, 46, 20); ctx.fill();
  const g = ctx.createLinearGradient(96, 90, 416, 390);
  g.addColorStop(0, "#ffb08a"); g.addColorStop(1, "#ff7b57");
  ctx.fillStyle = g; rr(ctx, 92, 88, 328, 296, 112); ctx.fill();
  ctx.fillStyle = "#1d1b28"; rr(ctx, 140, 136, 232, 172, 70); ctx.fill();
  const ex = lk.x * 14, ey = lk.y * 10, closed = blinking(t);
  ctx.fillStyle = "#fff";
  for (const cx of [214, 298]) { ctx.beginPath(); ctx.ellipse(cx + ex, 212 + ey, 17, closed ? 3 : 26, 0, 0, 7); ctx.fill(); }
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(256 + ex * .6, 252 + ey, 22, .25 * Math.PI, .75 * Math.PI); ctx.stroke();
  ctx.fillStyle = "rgba(255,90,110,.35)";
  ctx.beginPath(); ctx.ellipse(124, 300, 16, 10, 0, 0, 7); ctx.ellipse(388, 300, 16, 10, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#ffe1cf"; ctx.beginPath(); ctx.arc(372, 346, 8, 0, 7); ctx.arc(396, 346, 8, 0, 7); ctx.fill();
  ctx.restore();
}

export function mount() {
  const $ = id => document.getElementById(id);
  const intro = $("intro"), home = $("home"), msgEl = $("msg"), chrome = $("chrome"), screen = $("screen");
  const sctx = $("sprite").getContext("2d"), bctx = $("buddy").getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0, start = 0, era = -1, lastMsg = "", look = { x: 0, y: 0 }, pausedAt = null;

  function setEra(i) {
    era = i; intro.className = "e" + i; lastMsg = "";
    chrome.textContent = ERAS[i].chrome;
    screen.classList.toggle("scan", i < 3);
  }

  function setMsg(text, i) {
    if (text === lastMsg) return;
    lastMsg = text; msgEl.innerHTML = "";
    const s = document.createElement("span"); s.textContent = text;
    if (i === 4 && text.endsWith("…")) s.className = "thinking";
    msgEl.append(s);
  }

  function frame(now) {
    const t = now - start;
    let acc = 0, i = 0;
    while (i < ERAS.length && t > acc + ERAS[i].dur) acc += ERAS[i++].dur;
    if (i >= ERAS.length) return finish();
    if (i !== era) setEra(i);
    const e = ERAS[i];
    const local = (t - acc) / e.dur;
    const shown = e.stall ? Math.min(local / .55, .99) : local; // Flash bar races to 99% and sits there
    const p = (i + shown) / ERAS.length;
    $("fill").style.width = (p * 100) + "%";
    $("fill").style.setProperty("--full", (100 / Math.max(p, .001)) + "%");
    $("cover").style.width = ((1 - p) * 100) + "%";
    $("year").textContent = Math.floor(YEARS[i] + (YEARS[i + 1] - YEARS[i]) * shown);
    const mi = Math.min(e.msgs.length - 1, Math.floor(local * e.msgs.length));
    setMsg(e.msgs[mi], i);
    if (e.coupler !== undefined && mi >= e.coupler) drawCoupler(sctx, t);
    else if (e.smooth) drawSmooth(sctx, t, { x: Math.sin(t / 700), y: 0 }, reduce);
    else drawPixels(sctx, e.pal, t, i === 3);
    raf = requestAnimationFrame(frame);
  }

  // Ambient motes: slow glowing specks that drift up and ease away from the cursor.
  const mc = $("motes"), mctx = mc.getContext("2d");
  let motes = [], mouse = { x: -999, y: -999 };
  function seedMotes() {
    mc.width = innerWidth * devicePixelRatio; mc.height = innerHeight * devicePixelRatio;
    motes = Array.from({ length: 46 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: .8 + Math.random() * 2.2, v: .08 + Math.random() * .22, ph: Math.random() * 6.28,
      c: Math.random() < .6 ? "255,106,0" : "255,196,107", a: .15 + Math.random() * .35, dx: 0, dy: 0,
    }));
  }
  function drawMotes(now) {
    mctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    mctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const m of motes) {
      m.y -= m.v; if (m.y < -10) { m.y = innerHeight + 10; m.x = Math.random() * innerWidth; }
      const sway = Math.sin(now / 1800 + m.ph) * 14;
      const ddx = m.x + sway - mouse.x, ddy = m.y - mouse.y, d = Math.hypot(ddx, ddy);
      const push = d < 130 ? (130 - d) / 130 * 26 : 0;
      m.dx += ((push ? ddx / d * push : 0) - m.dx) * .05;
      m.dy += ((push ? ddy / d * push : 0) - m.dy) * .05;
      const tw = .75 + .25 * Math.sin(now / 900 + m.ph * 3);
      mctx.fillStyle = `rgba(${m.c},${m.a * tw})`;
      mctx.shadowColor = `rgba(${m.c},.8)`; mctx.shadowBlur = m.r * 5;
      mctx.beginPath(); mctx.arc(m.x + sway + m.dx, m.y + m.dy, m.r, 0, 7); mctx.fill();
    }
    mctx.shadowBlur = 0;
  }

  function homeLoop(now) {
    drawSmooth(bctx, now, look, reduce);
    if (!reduce) drawMotes(now);
    raf = requestAnimationFrame(homeLoop);
  }

  // Pausing freezes the clock: on resume, start shifts forward by the time spent paused.
  function togglePause() {
    if (pausedAt === null) {
      pausedAt = performance.now(); cancelAnimationFrame(raf);
      $("pause").textContent = "Resume";
    } else {
      start += performance.now() - pausedAt; pausedAt = null;
      $("pause").textContent = "Pause";
      raf = requestAnimationFrame(frame);
    }
  }

  function finish() {
    cancelAnimationFrame(raf);
    pausedAt = null; $("pause").textContent = "Pause";
    intro.hidden = true; home.hidden = false; mc.hidden = reduce;
    if (!reduce) seedMotes();
    raf = requestAnimationFrame(homeLoop);
  }

  function run() {
    cancelAnimationFrame(raf);
    pausedAt = null; $("pause").textContent = "Pause";
    home.hidden = true; intro.hidden = false; mc.hidden = true;
    era = -1; start = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function onPointer(ev) {
    mouse = { x: ev.clientX, y: ev.clientY };
    const r = $("buddy").getBoundingClientRect();
    if (!r.width) return;
    const dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    look = { x: dx / Math.max(d, 200), y: dy / Math.max(d, 200) };
  }
  function onResize() { if (!mc.hidden) seedMotes(); }
  function onKey(ev) {
    if (intro.hidden) return;
    if (ev.key === " ") { ev.preventDefault(); if (document.activeElement !== $("pause")) togglePause(); return; }
    if (era === 0 && pausedAt === null && ev.key.length === 1) finish(); // PRESS ANY KEY really works
  }

  addEventListener("pointermove", onPointer);
  addEventListener("resize", onResize);
  addEventListener("keydown", onKey);
  $("skip").addEventListener("click", finish);
  $("pause").addEventListener("click", togglePause);
  $("replay").addEventListener("click", run);

  reduce ? finish() : run();

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("pointermove", onPointer);
    removeEventListener("resize", onResize);
    removeEventListener("keydown", onKey);
  };
}
