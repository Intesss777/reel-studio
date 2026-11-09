# Kit API (scenes.js)

`scenes.js` is a classic script that runs after `engine/runtime/kit.js`. Everything below is a global. Coordinates are frame pixels (1080×1920). The example `examples/kitchenflow/scenes.js` uses every primitive; copy patterns from it.

## What scenes.js must define

```js
// 1. Build scenes once (DOM): one block per scene id from timeline.order (except recordings, which the kit builds).
{ const s = S.s1 = scene('s1', 'bg/bg-01.jpg'); s._head = head(s, 'Кухня\nработает.', C.paper); }

// 2. Event times — all from words (VW) or scene bounds (B start, N end).
const b1 = B('s1'), b2 = B('s2');
const EV = { s1Head: [VW('s1', 'Кухня') - 0.12, VW('s1', 'работает') - 0.12] };

// 3. When each scene is visible: [from, to]. A frame followed by a recording stays 0.35 s longer for the crossfade.
const WINDOWS = { s1: [b1 - 0.05, N('s1') + 0.35], s2: [b2 - 0.02, N('s2')] };

// 4. Global transitions the kit runs: stairs wipes, white flashes, glitch.
const TRANSITIONS = { stairs: [b2 - 0.43], flashes: [b1], glitch: null };

// 5. Per-frame state.
function projectSeek(t, frame) {
  if (on('s1', t)) { const s = S.s1; bgDrift(t, s, b1, N('s1')); cam(s, t, b1, N('s1')); linesAt(t, s._head, EV.s1Head, 0.6, 60); }
}

// 6. Sound effects on the same events.
function projectCues(add) { EV.s1Head.forEach((t) => add(t, 'tick', { f: 1900 })); }
```

## Timing

| Function | Use |
|---|---|
| `VW(id, word, n = 0)` | absolute time of the n-th spoken word starting with `word` in scene `id` |
| `B(id)`, `N(id)` | scene start / end |
| `END` | reel duration |
| `k(t, a, b, ease = E.outExpo)` | progress 0→1 between `a` and `b` |
| `E.lin`, `E.outCubic`, `E.inCubic`, `E.inOutCubic`, `E.outExpo`, `E.inExpo`, `E.outBack` | easings |
| `clamp`, `lerp`, `rng(seed)`, `hash(a, b)` | math; `hash(frame, n)` for per-frame jitter |
| `on(id, t)` | is scene `id` inside its window (with 50 ms margin) |

## Building blocks

| Function | Draws |
|---|---|
| `scene(id, bg)` | a scene layer, `bg` relative to `assets/` (or null) |
| `mark(s, color, x = 72)` | brand name, top left |
| `head(s, text, color, size = 84, x = 72, y = 236)` | headline; `\n` splits lines (each line animates separately) |
| `text(s, str, x, y, size, weight, color, { lh, ls, opacity })` | any text block, lines in `_lines` |
| `ui(s, key, x, y, scale, radius, crop?, shadow = 'dark')` | a real UI fragment from `PROJECT.ui[key]`; `crop` in fragment CSS px |
| `uiRow(s, x, y, scale, [{ key, r }], gap)` | separate fragments side by side; `r: 'pill'` for fully rounded |
| `svg(s)`, `path(svg, d, color, width)`, `draw(path, p)` | lines drawn by progress |
| `ring(svg, x, y, w, h, color?)` | rounded focus ring around a rect (draw it with `draw`) |
| `circle(svg, r, color)` | dot (set `cx`, `cy`) |
| `brushStroke(s, x0, y0, len, seed, color)`, `brushReveal(b, p)` | hand-painted underline revealed left to right |
| `scramble(target, p, seed, frame)` | text that decodes from random glyphs |
| `el(parent, tag, cls, css)` | raw element |
| `hexA(hex, alpha)` | rgba from a brand color |

## Motion helpers (call inside projectSeek)

| Function | Effect |
|---|---|
| `linesAt(t, node, [times], dur = 0.55, dy = 38)` | text lines rise with blur→sharp at given times (one time per line) |
| `linesIn(t, node, start, stagger, dur, dy)` | the same with a fixed stagger |
| `popIn(t, node, start, dur = 0.6, dy = 70, scale0 = 1)` | element rises and fades in |
| `fadeIn(t, node, start, dur = 0.4)` | opacity only |
| `cam(s, t, a, b, extra = '')` | slow 3 % push on the whole scene; `extra` prepends transforms (dive, jitter) |
| `bgDrift(t, s, a, b)` | background settles from 107 % to 100 % (parallax against `cam`) |
| `draw(path, k(t, a, b, E.inOutCubic))` | draw a line or ring |

Overlays available to project code: `reveal` (accent circle edge for circular reveals), `iris` (dark circle growing from a point), `flash`, `wipe`. See the s5 circle reveal and the s7 iris in the example.

## Recordings and footage

Declared in `project.json` `recordings`; the kit builds and animates them, you only add the scene id to `timeline.order` and `WINDOWS` is extended automatically.

- `makeRecScene(id, { bg, title, x, y, w, bar, titleY })` — window with the recording, title above it, camera inside the window, cursor and click ripple drawn by the kit.
- `makeFootageScene(id, { shade })` — full-bleed footage with camera keys; add captions in `scenes.js` with `text` + `linesAt` on spoken words.

## Sound cue types (projectCues)

`tick {f, g}` soft UI tick · `pop {f}` element appears · `click` mouse click · `key` typing · `sweep {dur}` line drawing · `whoosh {dur, soft, low}` transition · `air {dur}` cursor travel or zoom · `riser {dur}` build-up · `impact {size}` flash · `thump` dark cut · `chime` confirmation · `decode {dur, pan}` scramble · `glitch {dur}` · `brush {dur}` · `shimmer {dur}` particles · `logo` final hit · `swell {dur}` intro bed.
