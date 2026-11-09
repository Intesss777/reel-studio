# reel-studio

A Claude Code plugin and a rendering engine for branded vertical reels and carousels: real product UI shown large, screen recordings of your web app with a camera that leans in before every click, IRL phone footage, voice-over that drives the timing, original music and sound design, a −14 LUFS master.

You describe the reel; Claude follows the `reel-studio` skill: brief → brand profile → script → storyboard → assets → voice → timeline → choreography → stills review → sound → video → checks.

**По-русски.** Плагин для Claude Code и движок для вертикальных рилсов и каруселей. Настоящий интерфейс продукта крупно, записи экрана с камерой, которая приближается к кнопке перед кликом, IRL-видео, озвучка, по которой строится весь тайминг, своя музыка и звуки. Каждый новый проект — своя палитра и шрифты в `brand.json`, а движок и правила общие. Пример — рилс KitchenFlow в `examples/kitchenflow`.

## Install the plugin

```
/plugin marketplace add <your-github-user>/reel-studio
/plugin install reel-studio@reel-studio
```

Or clone the repository and point Claude Code at it as a local marketplace: `/plugin marketplace add ./reel-studio`.

## Requirements

- Node.js ≥ 20 or Bun ≥ 1.2.
- `npm install` (or `bun install`), then `npm run browsers` once to download Chromium for Playwright.
- ffmpeg: the system one if installed (`brew install ffmpeg`), otherwise the optional `ffmpeg-static` package installed with the dependencies. You can also set `FFMPEG_PATH`.
- Voice: `pip install edge-tts` for the free Edge voices, or an ElevenLabs API key for your own cloned voice.

## Quick start

```bash
node engine/cli.mjs init my-reel
node engine/cli.mjs build my-reel          # voice → timeline → import → tracks → audio
node engine/cli.mjs stills my-reel 2,6,10  # check key frames
node engine/cli.mjs render my-reel         # build/my-reel-1080x1920.mp4
node engine/cli.mjs check my-reel
```

Run the example:

```bash
node engine/cli.mjs build examples/kitchenflow
node engine/cli.mjs preview examples/kitchenflow
```

All commands: `node engine/cli.mjs help`.

## How a project looks

```
my-reel/
  brand.json     name, colors, fonts, logo, CTA keyword, background world, brand rules
  project.json   format, voice, music, timeline, UI fragments, recordings, footage, backgrounds
  script.tsv     one voice line per scene
  scenes.js      choreography written with the kit
  record.mjs     optional: app walkthrough recordings
  assets/        bg/, ui/, fonts/, rec/, footage/, logo.svg
  build/         generated (gitignored)
  .env           secrets (gitignored)
```

Details: `skills/reel-studio/references/`.

## Your own voice

Clone your voice in your ElevenLabs account (1–3 minutes of clean speech), put the voice id in `project.json` (`"voice": { "provider": "elevenlabs", "voiceId": "…" }`) and `ELEVENLABS_API_KEY` in the project `.env`. The clone stays in your account; this repository never contains voice files or rendered videos.

## Recording your app

`record` drives a real browser through your app and clicks real buttons, so run it against a copy of your app and its data. `skills/reel-studio/references/recording.md` describes how to make the copy.

## Licenses and notes

- Code: MIT (see `LICENSE`).
- Onest font in `examples/` and `templates/`: SIL Open Font License 1.1 (`OFL.txt` next to the font).
- `ffmpeg-static` (optional dependency) downloads an ffmpeg build under GPL; prefer a system ffmpeg if that matters for you.
- Edge TTS uses Microsoft's read-aloud service through an unofficial client (`edge-tts`); check its terms before commercial use, or use ElevenLabs or your own recordings.
- The KitchenFlow example contains screenshots and screen recordings of the KitchenFlow product with demo data, shown with the product owner's permission. Do not reuse them for other products.
- Music and sound effects are synthesised in the browser; no third-party samples.
