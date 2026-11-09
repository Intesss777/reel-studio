// reel-studio kit: drawing, timing and motion primitives shared by every project.
// Deterministic: every visual state is computed from seek(t). No CSS animations or timers.
// Loaded as a classic script after build/config.js (PROJECT, BRAND), build/timeline.js (TL) and build/tracks.js (REC).
const W = PROJECT.format?.width ?? 1080, H = PROJECT.format?.height ?? 1920, DURATION = TL.duration;
const C = { ink: '#10100F', paper: '#F4EEE1', accent: '#FF521C', accent2: '#EE4614', muted: '#8C8982', mark: '#FF521C', ...BRAND.colors };
const A = PROJECT.assets;
const UI = PROJECT.ui || {};
const FPS = PROJECT.fps ?? 30;
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

// Stage, fonts and base styles from the brand profile.
{
  const css = document.createElement('style');
  const faces = (BRAND.fonts || []).map((f) => `@font-face { font-family: "${f.family}"; src: url("${A}${f.file}"); font-weight: ${f.weight || '100 900'}; font-style: ${f.style || 'normal'}; font-display: block; }`).join('\n');
  css.textContent = `${faces}
  html, body { margin: 0; background: #000; }
  #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.ink}; font-family: "${BRAND.fontFamily || 'sans-serif'}", sans-serif; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
  .scene { position: absolute; inset: 0; overflow: hidden; display: none; }
  .bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
  .abs { position: absolute; }
  .txt { position: absolute; white-space: pre; margin: 0; }
  .line { display: block; will-change: transform, opacity, filter; }
  .ui { position: absolute; overflow: hidden; }
  .ui img { position: absolute; display: block; }
  svg.overlay { position: absolute; inset: 0; width: ${W}px; height: ${H}px; overflow: visible; pointer-events: none; }
  #flash { position: absolute; inset: 0; background: ${C.paper}; opacity: 0; pointer-events: none; }
  #wipe { position: absolute; inset: 0; pointer-events: none; }
  #wipe div { position: absolute; top: 0; height: ${H}px; }
  #glitch { position: absolute; inset: 0; pointer-events: none; }
  #glitch div { position: absolute; left: 0; width: ${W}px; }
  #iris { position: absolute; border-radius: 50%; background: ${C.ink}; display: none; }
  #grain { position: absolute; inset: -64px; opacity: 0.07; mix-blend-mode: overlay; pointer-events: none; }`;
  document.head.appendChild(css);
}

// ---------- math ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  lin: (p) => p,
  outCubic: (p) => 1 - Math.pow(1 - p, 3),
  inCubic: (p) => p * p * p,
  inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  outExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  inExpo: (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
  outBack: (p) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
};
const k = (t, a, b, ease = E.outExpo) => ease(clamp((t - a) / (b - a)));
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------- dom helpers ----------
const stage = document.getElementById('stage');
function el(parent, tag, cls, css = {}) { const n = document.createElement(tag); if (cls) n.className = cls; Object.assign(n.style, css); parent.appendChild(n); return n; }
const SVGNS = 'http://www.w3.org/2000/svg';
function svg(parent) { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('class', 'overlay'); s.setAttribute('viewBox', `0 0 ${W} ${H}`); parent.appendChild(s); return s; }
function path(s, d, color, width, extra = {}) {
  const p = document.createElementNS(SVGNS, 'path');
  p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', color);
  p.setAttribute('stroke-width', width); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
  for (const [a, v] of Object.entries(extra)) p.setAttribute(a, v);
  s.appendChild(p); p._len = p.getTotalLength(); p.style.strokeDasharray = `${p._len} ${p._len}`; p.style.strokeDashoffset = p._len;
  return p;
}
function draw(p, prog) { p.style.strokeDashoffset = p._len * (1 - clamp(prog)); }
function circle(s, r, color) { const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('r', r); c.setAttribute('fill', color); s.appendChild(c); return c; }
function rrect(x, y, w, h, r) { r = Math.min(r, h / 2, w / 2); return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`; }
function ring(s, x, y, w, h, color = C.accent, width = 3) { return path(s, rrect(x - 1.5, y - 1.5, w + 3, h + 3, Math.min((h + 3) / 2, 48)), color, width); }

function ui(parent, key, x, y, s, radius, crop = null, shadow = 'dark') {
  const u = UI[key]; const c = crop || { x: 0, y: 0, w: u.w, h: u.h };
  const box = el(parent, 'div', 'ui', { left: x + 'px', top: y + 'px', width: c.w * s + 'px', height: c.h * s + 'px', borderRadius: radius + 'px' });
  if (shadow) box.style.boxShadow = shadow === 'dark' ? `0 0 0 1.5px ${hexA(C.paper, 0.13)}, 0 28px 70px rgba(0,0,0,0.55)` : '0 18px 48px rgba(0,0,0,0.24)';
  const img = el(box, 'img', '', { width: u.w * s + 'px', height: u.h * s + 'px', left: -c.x * s + 'px', top: -c.y * s + 'px' });
  img.src = A + (u.file || 'ui/' + u.src + '@3x.png');
  box._x = x; box._y = y; box._s = s;
  return box;
}
// Separate UI pieces placed side by side; the gaps show the reel background, not the app's.
function uiRow(parent, x, y, s, parts, gap) {
  const hs = parts.map((p) => UI[p.key].h * s), H0 = Math.max(...hs);
  const w = parts.reduce((a, p) => a + UI[p.key].w * s, 0) + gap * (parts.length - 1);
  const row = el(parent, 'div', 'abs', { left: x + 'px', top: y + 'px', width: w + 'px', height: H0 + 'px' });
  let cx = 0;
  parts.forEach((p, i) => { ui(row, p.key, cx, (H0 - hs[i]) / 2, s, p.r === 'pill' ? hs[i] / 2 : p.r * s); cx += UI[p.key].w * s + gap; });
  return row;
}
// A brush stroke drawn by hand: an arc rising to the right, uneven width, ragged edges,
// a pressed start and dry bristle gaps only in the tail where the brush lifts off.
let brushId = 0;
function brushStroke(parent, x0, y0, len, seed, color) {
  const r = rng(seed), s = svg(parent), id = 'brush' + (brushId++);
  const N = 120, top = [], bot = [], ph = r() * 6;
  const cy = (u) => y0 + 8 - 24 * u + 9 * Math.sin(u * Math.PI) * -0.6 + 3 * Math.sin(u * Math.PI * 3 + ph) - (u > 0.84 ? 30 * Math.pow((u - 0.84) / 0.16, 2) : 0);
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = x0 + u * len - (u > 0.84 ? 10 * (u - 0.84) / 0.16 : 0);
    const press = u < 0.06 ? 0.55 + 0.45 * Math.sin((u / 0.06) * Math.PI / 2) : 1;
    const lift = u > 0.62 ? Math.max(0.08, 1 - Math.pow((u - 0.62) / 0.38, 1.25) * 0.92) : 1;
    const w = 34 * press * lift * (0.88 + 0.1 * Math.sin(u * 7 + ph) + 0.07 * Math.sin(u * 23 + ph * 2) + 0.04 * Math.sin(u * 57));
    const y = cy(u);
    top.push([x, y - w * (0.46 + 0.06 * Math.sin(u * 13 + ph))]);
    bot.push([x - 3 * u, y + w * (0.54 - 0.06 * Math.sin(u * 13 + ph))]);
  }
  const pts = top.concat(bot.reverse());
  const tail0 = x0 + len * 0.5, tail1 = x0 + len * 0.98;
  s.innerHTML = `<defs>
    <filter id="${id}e" x="-5%" y="-120%" width="110%" height="340%">
      <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="${seed}" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="11" xChannelSelector="R" yChannelSelector="G" result="d1"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="1" seed="${seed + 2}" result="f"/>
      <feDisplacementMap in="d1" in2="f" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="${id}s" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.21" numOctaves="2" seed="${seed + 5}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  7 0 0 0 -3.1"/></filter>
    <linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${tail0}" y1="0" x2="${tail1}" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
      <rect x="0" y="${y0 - 120}" width="1080" height="240" fill="url(#${id}g)"/>
      <rect x="0" y="${y0 - 120}" width="1080" height="240" filter="url(#${id}s)"/></mask>
    <clipPath id="${id}c"><rect x="0" y="0" width="0" height="1920"/></clipPath></defs>
    <g clip-path="url(#${id}c)"><g mask="url(#${id}m)">
      <path filter="url(#${id}e)" fill="${color}" d="M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L')} Z"/></g></g>`;
  s._clip = s.querySelector('clipPath rect'); s._x0 = x0; s._len = len;
  return s;
}
function brushReveal(b, p) { b.style.opacity = p > 0 ? 1 : 0; b._clip.setAttribute('width', Math.max(0, b._x0 - 30 + p * (b._len + 80))); }
function text(parent, str, x, y, size, weight, color, o = {}) {
  const t = el(parent, 'div', 'txt', {
    left: x + 'px', top: y + 'px', fontSize: size + 'px', fontWeight: weight, color,
    lineHeight: (o.lh ?? 1.2), letterSpacing: (o.ls ?? 0) + 'em', opacity: o.opacity ?? 1,
  });
  t._lines = str.split('\n').map((ln) => { const s = el(t, 'span', 'line'); s.textContent = ln; return s; });
  return t;
}
const head = (p, str, color, size = 84, x = 72, y = 236) => text(p, str, x, y, size, 700, color, { lh: 1.0, ls: -0.02 });
function scene(id, bg) {
  const s = el(stage, 'div', 'scene'); s.id = id;
  if (bg) { s._bg = el(s, 'div', 'bg', { backgroundImage: `url(${A}${bg})` }); }
  return s;
}
function mark(s, color, x = 72) { const m = text(s, BRAND.name, x, 112, 30, 600, color, { lh: 1.0, opacity: 0.92 }); m._baseOpacity = 0.92; return m; }

// Reveal helpers.
function linesIn(t, node, start, stagger = 0.09, dur = 0.55, dy = 38) {
  node._lines.forEach((ln, i) => {
    const p = k(t, start + i * stagger, start + i * stagger + dur);
    ln.style.opacity = p; ln.style.transform = `translateY(${(1 - p) * dy}px)`; ln.style.filter = p < 1 ? `blur(${(1 - p) * 8}px)` : 'none';
  });
}
function popIn(t, node, start, dur = 0.6, dy = 70, scale0 = 1) {
  const p = k(t, start, start + dur);
  node.style.opacity = clamp(p * 1.6); node.style.transform = `translateY(${(1 - p) * dy}px) scale(${lerp(scale0, 1, p)})`;
}
function fadeIn(t, node, start, dur = 0.4) { node.style.opacity = k(t, start, start + dur, E.outCubic) * (node._baseOpacity ?? 1); }
// Slow camera push on the whole scene; the background drifts the other way for parallax.
function cam(s, t, a, b, extra = '') { const p = clamp((t - a) / (b - a)); s.style.transform = `${extra} scale(${1 + 0.03 * p})`; }
function bgDrift(t, s, t0, t1) { if (!s._bg) return; const p = clamp((t - t0) / (t1 - t0)); s._bg.style.transform = `scale(${1.07 - 0.07 * E.outCubic(p)})`; }
const GLYPHS = BRAND.glyphs || 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789₽%';
function scramble(target, p, seed, frame) {
  const n = target.length, solved = Math.floor(clamp(p) * (n + 2)) - 1;
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = target[i];
    if (i <= solved || ' «»—"\'.,'.includes(ch)) out += ch;
    else out += GLYPHS[Math.floor(hash(seed * 31 + i, frame) * GLYPHS.length)];
  }
  return out;
}

// ---------- timeline helpers ----------
const S = {};
const SC = TL.scenes;
const B = (id) => SC[id][0];
const N = (id) => SC[id][1];
const END = TL.duration;
// Absolute time of the n-th spoken word that starts with `word` in scene `id`.
function VW(id, word, n = 0) {
  let c = 0;
  for (const x of TL.words[id] || []) if (x.w.toLowerCase().startsWith(word.toLowerCase())) { if (c === n) return x.t; c++; }
  throw new Error(`word ${word} not found in ${id}`);
}
function linesAt(t, node, times, dur = 0.55, dy = 38) {
  node._lines.forEach((ln, i) => {
    const p = k(t, times[Math.min(i, times.length - 1)], times[Math.min(i, times.length - 1)] + dur);
    ln.style.opacity = p; ln.style.transform = `translateY(${(1 - p) * dy}px)`; ln.style.filter = p < 1 ? `blur(${(1 - p) * 8}px)` : 'none';
  });
}
const on = (id, t) => t >= WINDOWS[id][0] - 0.05 && t < WINDOWS[id][1] + 0.05;

// ---------- recordings and footage ----------
// A screen recording framed in a window; the camera leans in before each click.
function makeRecScene(id, { bg, title, x = 40, y = 570, w = 1000, bar = 46, titleY = 440 } = {}) {
  const tr = window.REC[id];
  if (!tr) throw new Error(`no recording track for ${id}: run "reel import" or "reel record"`);
  const vw = tr.view.width, vh = tr.view.height, h = w * vh / vw;
  const s = S[id] = scene(id, bg);
  s._mark = mark(s, C.paper);
  s._title = text(s, title || '', 72, titleY, 60, 700, C.paper, { lh: 1.0, ls: -0.02 });
  s._winBox = { x, y, w, h, bar, k: w / vw };
  const win = s._win = el(s, 'div', 'abs', { left: x + 'px', top: y + 'px', width: w + 'px', height: h + bar + 'px', borderRadius: '26px', overflow: 'hidden', background: '#0d0d0c', boxShadow: `0 0 0 1.5px ${hexA(C.paper, 0.14)}, 0 40px 110px rgba(0,0,0,0.65)`, transformOrigin: '50% 40%' });
  const barEl = el(win, 'div', 'abs', { left: 0, top: 0, width: '100%', height: bar + 'px', background: '#161615', borderBottom: `1px solid ${hexA(C.paper, 0.07)}` });
  const tab = el(barEl, 'div', 'txt', { left: 0, width: '100%', top: '15px', textAlign: 'center', fontSize: '19px', fontWeight: 500, color: C.muted, lineHeight: 1 });
  tab.textContent = `${BRAND.name} — ${title || ''}`;
  const view = el(win, 'div', 'abs', { left: 0, top: bar + 'px', width: w + 'px', height: h + 'px', overflow: 'hidden', background: '#111' });
  s._cam = el(view, 'div', 'abs', { left: 0, top: 0, width: vw + 'px', height: vh + 'px', transformOrigin: '0 0' });
  s._img = el(s._cam, 'img', '', { position: 'absolute', left: 0, top: 0, width: vw + 'px', height: vh + 'px' });
  s._ripple = el(s._cam, 'div', 'abs', { left: 0, top: 0, width: '44px', height: '44px', borderRadius: '50%', border: `3px solid ${C.accent}`, boxSizing: 'border-box', opacity: 0 });
  s._cursor = el(s._cam, 'div', 'abs', { left: 0, top: 0, width: '26px', height: '33px', transformOrigin: '2px 2px', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' });
  s._cursor.innerHTML = `<svg width="26" height="33" viewBox="0 0 27 34"><path d="M2 2 L2 27 L8.5 21 L13 31 L17.5 29 L13 19.5 L22 19.5 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/></svg>`;
  s._track = tr; s._frame = -1;
  return s;
}
function trackIndex(arr, t) {
  if (t <= arr[0][0]) return 0;
  let lo = 0, hi = arr.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m][0] <= t) lo = m; else hi = m - 1; }
  return lo;
}
function camAt(keys, t) {
  const st = (k) => ({ cx: k[1], cy: k[2], s: k[3] });
  const mix = (a, b, e) => ({ cx: lerp(a.cx, b.cx, e), cy: lerp(a.cy, b.cy, e), s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)) });
  let from = st(keys[0]), to = from, t0 = 0, d = 0;
  for (const k of keys.slice(1)) {
    if (k[0] > t) break;
    from = mix(from, to, E.inOutCubic(d ? clamp((k[0] - t0) / d) : 1)); to = st(k); t0 = k[0]; d = k[4];
  }
  return mix(from, to, E.inOutCubic(d ? clamp((t - t0) / d) : 1));
}
function recSeek(id, t) {
  const s = S[id], tr = s._track, a = SC[id][0], lt = t - a, WIN = s._winBox, VW_ = tr.view.width, VH_ = tr.view.height;
  s.style.opacity = k(t, a, a + 0.3, E.lin);
  s.style.transform = 'scale(1.03)';
  const p = k(t, a + 0.05, a + 0.65);
  s._win.style.opacity = clamp(p * 1.6);
  s._win.style.transform = `translateY(${(1 - p) * 90}px) scale(${0.94 + 0.06 * p})`;
  s._win.style.filter = p < 1 ? `blur(${(1 - p) * 10}px)` : 'none';
  fadeIn(t, s._mark, a); linesAt(t, s._title, [a + 0.05], 0.55, 40);
  const fi = trackIndex(tr.frames, lt);
  if (fi !== s._frame) { s._frame = fi; s._img.src = `${PROJECT.buildUrl}rec/${id}/${tr.frames[fi][1]}`; window.__wait = s._img.decode().catch(() => {}); }
  const c = camAt(tr.camera, lt), sc = WIN.k * c.s;
  let tx = WIN.w / 2 - c.cx * sc, ty = WIN.h / 2 - c.cy * sc;
  tx = Math.min(0, Math.max(WIN.w - VW_ * sc, tx)); ty = Math.min(0, Math.max(WIN.h - VH_ * sc, ty));
  s._cam.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
  const cur = tr.cursor, ci = trackIndex(cur, lt), c0 = cur[ci], c1 = cur[Math.min(cur.length - 1, ci + 1)];
  const u = c1[0] > c0[0] ? clamp((lt - c0[0]) / (c1[0] - c0[0])) : 0;
  const x = lerp(c0[1], c1[1], u), y = lerp(c0[2], c1[2], u);
  let press = 0, rip = null;
  for (const [ct, cx, cy] of tr.clicks) { const d = lt - ct; if (d > -0.03 && d < 0.17) press = Math.max(press, 1 - Math.abs(d - 0.05) / 0.12); if (d >= 0 && d < 0.5) rip = [d, cx, cy]; }
  s._cursor.style.transform = `translate(${x - 2}px, ${y - 2}px) scale(${1 - 0.16 * Math.max(0, press)})`;
  if (rip) { const q = rip[0] / 0.5; s._ripple.style.opacity = 1 - q; s._ripple.style.transform = `translate(${rip[1] - 22}px, ${rip[2] - 22}px) scale(${0.3 + 1.3 * E.outCubic(q)})`; }
  else s._ripple.style.opacity = 0;
}

// Full-bleed footage (IRL video or photo sequence), with optional camera keys in frame pixels.
function makeFootageScene(id, { shade = 0.25 } = {}) {
  const tr = window.REC[id];
  if (!tr) throw new Error(`no footage track for ${id}: run "reel import"`);
  const s = S[id] = scene(id, null);
  s._cam = el(s, 'div', 'abs', { left: 0, top: 0, width: tr.view.width + 'px', height: tr.view.height + 'px', transformOrigin: '0 0' });
  s._img = el(s._cam, 'img', '', { position: 'absolute', left: 0, top: 0, width: tr.view.width + 'px', height: tr.view.height + 'px' });
  s._shade = el(s, 'div', 'abs', { inset: 0, background: `linear-gradient(180deg, ${hexA(C.ink, shade)} 0%, ${hexA(C.ink, 0)} 35%, ${hexA(C.ink, 0)} 60%, ${hexA(C.ink, shade * 2)} 100%)` });
  s._track = tr; s._frame = -1;
  return s;
}
function footageSeek(id, t) {
  const s = S[id], tr = s._track, lt = t - SC[id][0];
  const fi = trackIndex(tr.frames, lt);
  if (fi !== s._frame) { s._frame = fi; s._img.src = `${PROJECT.buildUrl}rec/${id}/${tr.frames[fi][1]}`; window.__wait = s._img.decode().catch(() => {}); }
  const c = camAt(tr.camera, lt), sc = Math.max(W / tr.view.width, H / tr.view.height) * c.s;
  let tx = W / 2 - c.cx * sc, ty = H / 2 - c.cy * sc;
  tx = Math.min(0, Math.max(W - tr.view.width * sc, tx)); ty = Math.min(0, Math.max(H - tr.view.height * sc, ty));
  s._cam.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
}
