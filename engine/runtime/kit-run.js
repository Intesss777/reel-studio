// reel-studio runtime: overlays, recordings, transitions, seek(t), sound cues, readiness.
// Loaded after the project's scenes.js, which defines its scenes, WINDOWS, TRANSITIONS, projectSeek(t, frame) and projectCues(add).
for (const [id, cfg] of Object.entries(PROJECT.recordings || {})) {
  if (cfg.type === 'footage') makeFootageScene(id, cfg); else makeRecScene(id, cfg);
  WINDOWS[id] = [SC[id][0] - 0.02, SC[id][1] + 0.02];
}

// ---------- global overlays ----------
// ---------- global overlays ----------
const wipe = el(stage, 'div', ''); wipe.id = 'wipe';
const cols = Array.from({ length: 6 }, (_, i) => el(wipe, 'div', '', { left: i * W / 6 + 'px', width: W / 6 + 1 + 'px', background: i % 2 ? C.accent2 : C.accent }));
const glitch = el(stage, 'div', ''); glitch.id = 'glitch';
const gr = rng(11);
const bands = Array.from({ length: 14 }, () => ({ n: el(glitch, 'div', '', { top: Math.floor(gr() * (H - 40)) + 'px', height: Math.floor(8 + gr() * 90) + 'px', background: [C.accent, C.paper, C.muted, C.accent2][Math.floor(gr() * 4)] }), dir: gr() < 0.5 ? -1 : 1, d: gr() * 0.12, sp: 0.6 + gr() * 0.8 }));
const iris = el(stage, 'div', ''); iris.id = 'iris'; iris.style.boxShadow = `0 0 0 5px ${C.accent}`;
const reveal = el(stage, 'div', 'abs', { borderRadius: '50%', border: `5px solid ${C.accent}`, boxSizing: 'border-box', display: 'none', pointerEvents: 'none' });
const flash = el(stage, 'div', ''); flash.id = 'flash';
const grain = el(stage, 'canvas', ''); grain.id = 'grain'; grain.width = 304; grain.height = 524;
Object.keys(TL.scenes).forEach((id, i) => { S[id].style.zIndex = i + 1; });
[wipe, glitch, iris, reveal, flash].forEach((n) => { n.style.zIndex = 50; }); grain.style.zIndex = 60;
{ const ctx = grain.getContext('2d'); const img = ctx.createImageData(304, 524); const r = rng(3); for (let i = 0; i < img.data.length; i += 4) { const v = Math.floor(r() * 255); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } ctx.putImageData(img, 0, 0); grain.style.width = (W + 128) + 'px'; grain.style.height = (H + 128) + 'px'; grain.style.imageRendering = 'pixelated'; }

const TR = Object.assign({ stairs: [], flashes: [], glitch: null }, typeof TRANSITIONS === 'undefined' ? {} : TRANSITIONS);
function stairs(t) {
  let any = false;
  for (const t0 of TR.stairs) {
    if (t < t0 - 0.01 || t > t0 + 0.9) continue;
    any = true;
    cols.forEach((c, i) => {
      const a = t0 + i * 0.03;
      const up = k(t, a, a + 0.25, E.outCubic), out = k(t, a + 0.47, a + 0.72, E.inCubic);
      c.style.transform = `translateY(${(1 - up) * H - out * H}px)`;
    });
  }
  wipe.style.display = any ? 'block' : 'none';
}

function seek(t) {
  const frame = Math.round(t * FPS);
  for (const [id, [a, b]] of Object.entries(WINDOWS)) S[id].style.display = t >= a && t < b ? 'block' : 'none';
  projectSeek(t, frame);
  for (const [id, cfg] of Object.entries(PROJECT.recordings || {})) if (on(id, t)) (cfg.type === 'footage' ? footageSeek : recSeek)(id, t);
  stairs(t);
  flash.style.opacity = Math.max(0, ...TR.flashes.map((f) => k(t, f - 0.18, f - 0.02, E.inCubic) - k(t, f, f + 0.45, E.outCubic)));
  const g = TR.glitch, gOn = !!g && t > g[0] && t < g[1];
  glitch.style.display = gOn ? 'block' : 'none';
  if (gOn) bands.forEach((bd) => { const p = clamp((t - g[0] - bd.d) / (0.3 * bd.sp)); bd.n.style.transform = `translateX(${bd.dir * lerp(-W - 20, W + 20, p)}px)`; bd.n.style.opacity = p > 0 && p < 1 ? 0.92 : 0; });
  grain.style.transform = `translate(${(hash(frame, 1) - 0.5) * 64}px, ${(hash(frame, 2) - 0.5) * 64}px)`;
}

// Sound cues share the event times with the picture; sound.js turns them into music, effects and the voice mix.
function cues() {
  const c = [];
  const add = (t, type, o = {}) => c.push({ t, type, ...o });
  if (typeof projectCues === 'function') projectCues(add);
  TR.stairs.forEach((t) => add(t, 'whoosh', { dur: 0.75 }));
  if (TR.glitch) add(TR.glitch[0], 'glitch', { dur: TR.glitch[1] - TR.glitch[0] });
  for (const [id, cfg] of Object.entries(PROJECT.recordings || {})) {
    const a = SC[id][0], tr = window.REC[id];
    if (cfg.type === 'footage') continue;
    add(a + 0.03, 'whoosh', { dur: 0.45, soft: true });
    tr.clicks.forEach(([ct]) => add(a + ct, 'click'));
    tr.typing.forEach(([tt], i) => add(a + tt, 'key', { i }));
    let prev = 1;
    tr.camera.slice(1).forEach(([ct, , , sc, d]) => { if (Math.abs(sc - prev) > 0.25) add(a + ct, 'air', { dur: Math.max(0.35, d) }); prev = sc; });
  }
  return c;
}

window.seek = seek;
window.cues = cues;
window.DURATION = DURATION;
window.ready = (async () => {
  for (const f of BRAND.fonts || []) for (const w of f.preload || [400, 600, 700]) await document.fonts.load(`${w} 40px "${f.family}"`);
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
  const bgs = [...document.querySelectorAll('.bg')].map((b) => b.style.backgroundImage).filter((u) => u.startsWith('url(')).map((u) => u.slice(5, -2));
  await Promise.all(bgs.map((src) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = src; })));
  seek(0);
  return true;
})();
