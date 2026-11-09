# Project format

A project is a folder. Create one with `node <plugin>/engine/cli.mjs init <folder>`; the full worked example is `examples/kitchenflow/`.

```
my-reel/
  brand.json     identity: name, colors, fonts, logo, CTA, background world, rules
  project.json   format, voice, music, timeline, UI fragments, recordings, footage, backgrounds
  script.tsv     voice line per scene
  scenes.js      choreography (see kit-api.md)
  record.mjs     optional: app walkthrough fragments (see recording.md)
  assets/        bg/, ui/, fonts/, rec/, footage/, logo.svg
  build/         generated, gitignored: vo/, timeline.js, config.js, rec/, stills/, soundtrack.wav, videos
  .env           secrets, gitignored: ELEVENLABS_API_KEY, APP_URL, APP_EMAIL, APP_PASSWORD
```

## brand.json

```json
{
  "name": "KitchenFlow",
  "colors": { "ink": "#10100F", "paper": "#F4EEE1", "accent": "#FF521C", "accent2": "#EE4614", "muted": "#8C8982", "mark": "#C96442" },
  "fontFamily": "Onest",
  "fonts": [{ "family": "Onest", "file": "fonts/Onest-wght.ttf", "weight": "100 900", "preload": [500, 600, 700] }],
  "logo": "logo.svg",
  "language": "ru",
  "address": "вы",
  "cta": { "keyword": "КУХНЯ", "offer": "демо на процессе ресторана" },
  "world": "Graphite paper, one dark volumetric form with an orange rim, embossed contour lines with rare orange threads.",
  "rules": ["Only real screens", "Demo data labelled as demo"]
}
```

- `ink` — the dark base (scene background, iris). `paper` — main text on dark. `accent` — action color: rings, lines, wipes, keyword. `accent2` — the second wipe stripe tone. `muted` — secondary text. `mark` — logo color, also the outro wordmark so icon and name match.
- Fonts: self-hosted files under `assets/fonts/`, Cyrillic coverage and ₽ checked, license file next to the font. `preload` lists the weights the player waits for before the first frame.
- `glyphs` (optional) — characters used by the scramble effect; defaults to Cyrillic capitals, digits, ₽ and %.
- `world`, `rules` — free text for you and for the next session: the background idea and the non-negotiables of this brand.

## project.json

| Key | Meaning |
|---|---|
| `name` | output file prefix |
| `format` | `{ "width": 1080, "height": 1920 }` for reels; `1080×1350` for carousels |
| `fps` | 30 |
| `loudness` | target LUFS, −14 for Reels/Shorts |
| `scenes` | choreography file, default `scenes.js` |
| `voice` | `{ "provider": "edge", "voice": "ru-RU-DmitryNeural", "rate": "+0%", "pitch": "-2Hz" }` or `{ "provider": "elevenlabs", "voiceId": "…", "model": "eleven_multilingual_v2", "settings": { "stability": 0.5, "similarity_boost": 0.8 } }` |
| `music` | `bpm`, `progression` (MIDI chords, one per bar), `drop` (scene where drums start), `outro`, `hats` [from, to], `arp` [from, to] |
| `timeline.order` | scene ids in play order |
| `timeline.beat` | grid step for scene boundaries (0.5 s = one beat at 120 BPM) |
| `timeline.lead` / `defaultLead` | seconds from scene start to the first word |
| `timeline.gap` | pause between sentences (0.38 s reads calm but not slow) |
| `timeline.post` / `defaultPost` | seconds after the last word before the next scene (give recordings and dives more) |
| `timeline.minLen` | minimum scene length |
| `timeline.fixed` | `{ "outro": { "len": 7, "voiceAt": 2.35 } }` — fixed length and voice position |
| `ui` | fragment registry: `{ "capture": { "src": "invoice-capture-card", "w": 952, "h": 144 } }` → `assets/ui/<src>@3x.png`, `w`/`h` in CSS pixels of the capture |
| `recordings` | scenes that show a recording: `{ "r1": { "bg": "bg/bg-01.jpg", "title": "Главный экран" } }`; add `"type": "footage"` for full-bleed IRL video |
| `footage` | video sources to import: `{ "id": "r1", "src": "assets/rec/r1.mp4", "track": "assets/rec/r1.track.json" }` for recordings, `{ "id": "walk", "src": "assets/footage/walk.mov", "trim": [2, 8.5], "camera": [...] }` for IRL |
| `backgrounds` | background generator settings (see backgrounds.md) |
| `carousel.times` | optional explicit slide times |

## script.tsv

```
intro	Накладные, чаты, остатки, закупка, смены, поставщики — всё это в одном приложении, в Китчен Флоу.
s1	Кухня работает. А учёт? Покажу, как собрать всё это в один процесс.
```

One line per scene id, a tab between id and text. Sentences end with `.`, `?` or `!` — the timeline places each sentence separately with the `gap` pause. Write brand names the way they should sound ("Китчен Флоу"); show them correctly on screen. A scene without a line has no voice and uses `minLen`.
