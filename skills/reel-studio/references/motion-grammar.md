# Motion grammar

Derived from a frame-by-frame study of a reference product showreel and tuned on client feedback. Transfer the mechanics, not the look of any reference.

## The core idea

Show the process, not just the result. Each scene builds its meaning step by step on the beat: text appears → an element pops → a line connects → a value resolves → a confirmation lights once. Inside scenes motion is calm and the camera almost still; energy lives in short, sharp transitions on bar lines.

## Rhythm

- 120 BPM: a beat is 0.5 s, a bar 2 s. Scene boundaries snap to beats (the timeline does this).
- Elements enter on beats or on spoken words. Lines of a headline 0.05–0.12 s apart, each rising 38–60 px from blur to sharp in ~0.55 s with `outExpo`.
- Transitions take 0.3–0.6 s and land slightly before the bar line.
- Strong effects (white flash, camera dive, zoom-out flash) two or three times per reel: at the open, mid-reel, and into the logo.

## Easing

- Arrivals: `outExpo` (fast, soft landing). Camera moves and drawn lines: `inOutCubic`. Dives and collapses: `inExpo`. Pops that should feel physical: `outBack`.
- Progress of real processes (typing, counters) may be linear or stepped.

## Camera

- Every frame scene: a slow 3 % push over the scene, the background settling the other way (parallax).
- Recordings: the camera lives inside the app window. Overview at 1× → before a click, lean in to fit the target (≈2×, max 2.3×) over 0.5 s → click (cursor press + accent ripple) → back to overview or on to the next target. Never move the camera and the cursor in different directions at once.
- Footage: one slow push or one keyed move per shot; no shaky zooms.

## Transitions by motivation

1. **Dive into the control** — the cursor clicks a real button, the scene scales ×16 toward it with blur, white flash, the next scene is what the button opens.
2. **Stairs** — 6 vertical accent stripes rise with a 30 ms stagger, hold for 2–3 frames, continue up revealing the next scene.
3. **Circle from a point** — a badge or the click point grows into a circle with an accent edge that contains the next scene.
4. **Iris** — the last dot of a sentence or a chain node swells into a dark circle.
5. **Glitch** — horizontal bands in brand colors slide across for ~0.4 s with a little jitter on both scenes.
6. **Crossfade on a shared background** — frame → its recording: same plate, content swaps in 0.3 s while the window rises from blur.
7. **Zoom-out + blur → flash** — the end of the story collapses into the logo.

## Text on screen

- Headlines 84 px bold (hook up to 140 px), captions 32–46 px, nothing under 22 px in a 1080 frame.
- Safe zones for Reels: nothing important in the top 220 px, the bottom 360 px or the right 150 px.
- No bottom subtitles: short meaning phrases appear inside the composition in sync with the voice.

## Recording grammar

- One idea per fragment, 5–8 s, voice names each action as it happens.
- The cursor moves on eased, slightly curved paths (≈0.45 s), never teleports.
- Before clicking an item off-screen, scroll the page smoothly to bring it to the middle.
- Fragment openings are the product's overview state; endings hold the result for ~1 s so it can be read.
