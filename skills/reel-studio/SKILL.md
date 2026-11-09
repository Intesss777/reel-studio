---
name: reel-studio
description: Produce branded vertical reels (Instagram Reels, YouTube Shorts, TikTok) and carousels with real product UI, screen recordings of web apps, IRL phone footage, voice-over and motion design, rendered to MP4/PNG by a deterministic engine. Use this skill whenever the user wants a reel, short, promo video, product demo video, motion design, carousel, video ad or "ролик / рилс / карусель / шортс / монтаж / моушн / озвучка" for any brand or product — even when they only describe the idea ("покажи мой сервис в видео", "сделай ролик из этих скриншотов", "смонтируй видео с моей поездки"), when they want to change an existing reel (voice, timing, design, music), or when they ask how to make the next reel in the same style.
---

# reel-studio

You turn a product or a story into a finished vertical video: scenes on a beat grid, voice that drives timing, real UI shown large, recordings with a camera that leans in, sound design, loudness-normalised master. The engine is in `engine/` of this plugin; every project is a folder with `brand.json`, `project.json`, `script.tsv`, `scenes.js` and `assets/`. The worked example is `examples/kitchenflow/` — read it before writing a new `scenes.js`.

Plugin root: the directory two levels above this file. CLI: `node <plugin>/engine/cli.mjs <command> <project>`. Run `node <plugin>/engine/cli.mjs help` for the command list.

## Why it is built this way

- **Voice drives time.** Every scene length and every on-screen event comes from voice-over word timings (`VW('s3', 'Подтверждаем')`). Picture, voice and sound effects use the same event times, so they never drift, and re-voicing a line re-times the whole reel automatically.
- **Deterministic rendering.** The player computes every frame from `seek(t)`: no CSS animations or timers. Renders are repeatable, stills match the video, motion blur is real sub-frame blending.
- **Real product, never a mock.** Viewers and clients trust a demo only if the UI is the actual product. Capture real screens at 3×, cut meaningful fragments, show them large.

## Workflow

Work in this order. Show the user the result of each gate before moving on; do not re-brief what the user already decided.

1. **Brief** — what the reel sells, to whom, the one CTA, length (30–60 s for cold audience, up to ~110 s for a product walkthrough), language and address (вы/ты). If a project or `brand.json` already exists, reuse it.
2. **Brand profile** — `brand.json`: name, colors (`ink`, `paper`, `accent`, `accent2`, `muted`, `mark`), font, logo, CTA keyword, the background "world". See `references/project-format.md`. A new client gets a new direction from their own business; never reuse the previous project's look.
3. **Script** — `script.tsv`, one voice line per scene. Short sentences, specific, the words a customer uses. Read `references/copy-and-voice.md`.
4. **Storyboard** — scene list in `project.json` `timeline.order`: hook → problem → product in action (frame, then recording) → result → CTA → logo. Pick scene types from `references/scene-catalogue.md`.
5. **Assets** — UI fragments (`references/capture-ui.md`), app recordings on a data copy (`references/recording.md`), IRL footage (`references/footage.md`), backgrounds (`references/backgrounds.md`).
6. **Voice and timeline** — `voice`, then `timeline`. Check every scene length; tune `lead`, `post`, `minLen` in `project.json`.
7. **Choreography** — write `scenes.js` with the kit (`references/kit-api.md`), anchored on spoken words.
8. **Review stills at phone scale** — `stills` at the key moment of every scene, look at them at 375 px width, fix what you see before rendering video.
9. **Sound** — `audio` (music on the beat grid, effects on events, voice ducking, −14 LUFS).
10. **Video** — `preview` (540 px) to check motion, then `render` (1080×1920, motion blur), then `check`.
11. **Carousel** (if asked) — same project with `format` 1080×1350 and slide-shaped scenes; `carousel`.

Commands: `voice`, `timeline`, `import`, `record`, `export-rec`, `tracks`, `backgrounds`, `stills`, `audio`, `preview`, `render`, `carousel`, `check`, `build`, `init`.

## Rules that came from real client feedback

These are not style preferences of the engine; each one fixed a result a client rejected.

- **Show the real UI large.** A 1280-px desktop screen shrunk into a phone frame is unreadable; capture at 3× and use fragments (a card, a row, a dialog) scaled so body text is ≥ 22 px in the 1080 frame. When two fragments overlap, keep at least 60 % of the back one visible.
- **Cut UI pieces along their outlines.** Cards or pills captured together show the app's own background between them, which clashes with the reel background. Cut each piece separately (`uiRow`) and round it with its own radius.
- **One background world per reel.** Varied backgrounds work in a carousel (one slide at a time) but make a reel restless. Use one plate and vary only a secondary element (e.g. contour lines) per scene. Backgrounds can be abstract compositions; decoration must support meaning, never compete with the UI.
- **The voice reads what is on screen.** If words appear on screen, the voice says those words, in that order, and each word appears as it is spoken. A frame that shows one list while the voice says another reads as an error.
- **Every transition has a motivation.** A click dives into the button, a badge grows into a circle that opens the next scene, the last point swells into an iris. Strong effects (flash, dive) at most two or three times per reel. See `references/motion-grammar.md`.
- **Recordings: the camera leans in before the click.** Hover → camera zooms toward the target (≈2×) → click with a ripple → camera returns to the overview. 5–8 s per fragment, alternating with designed frames ("frame about X → recording of X").
- **Honest product claims.** Never invent metrics, customers, reviews or capabilities. Demo data and demo features are labelled as demo on screen and in the voice.
- **CTA = one keyword.** The keyword decodes on screen as it is spoken; a hand-drawn brush underline (uneven width, dry tail), not a ruler line.
- **Logo ending.** Icon and wordmark in the same brand color, moderate size (icon ≈ 270 px, wordmark ≈ 128 px in a 1080 frame).
- **No template tells.** No tracked-caps eyebrow over every heading, no 01/02/03 when it is not a sequence, no "→" after every caption, no gradient blobs, no emoji. Build hierarchy with scale and position.
- **Sound.** Music ≈ 15 dB under the voice while it speaks; a click on every click, a soft tick on text reveals, an impact on flashes; master −14 LUFS, true peak ≤ −1 dBTP.
- **Russian typography.** «ёлочки», em dash with spaces, ₽ after the number with a non-breaking space, numbers grouped with a space. `lang="ru"`.

## Safety

- App recordings click real buttons. Record only against a copy of the data (separate database and server); the user's working data and servers stay untouched. `references/recording.md` has the copy procedure.
- Secrets (TTS keys, app passwords) live in the project `.env`, which is gitignored. Read them from the environment; never print or commit them.
- Sending a voice sample or script text to a cloud TTS is sending user data to a third party: confirm with the user first.

## When something breaks

- `player errors: missing file …` — a path in `scenes.js` or `project.json` does not exist under `assets/`.
- `word X not found in s3` — the voice line changed; update the word anchors in `scenes.js`.
- Edge TTS "No audio was received" — the free service is flaky; `voice` retries 20×, re-run it, or rephrase the line.
- A recording action lands off-screen — use `s.reveal(target)` before `moveTo`; scroll with the page, not the wheel over a nested list.

## References

| File | Read when |
|---|---|
| `references/project-format.md` | creating or editing `brand.json`, `project.json`, `script.tsv` |
| `references/kit-api.md` | writing `scenes.js` |
| `references/scene-catalogue.md` | choosing scene types for a storyboard |
| `references/motion-grammar.md` | timing, transitions, camera, rhythm |
| `references/copy-and-voice.md` | writing the script, choosing or cloning a voice |
| `references/capture-ui.md` | capturing real UI fragments |
| `references/recording.md` | recording a web app walkthrough |
| `references/footage.md` | IRL phone footage and photos |
| `references/backgrounds.md` | building the background world |
| `references/carousel.md` | carousels |
| `references/qa-checklist.md` | before showing a render to the user |
