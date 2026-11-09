# Example: KitchenFlow product reel

A 109-second vertical reel for KitchenFlow, a restaurant operations app: a words intro, a hook, five designed frames each followed by a screen recording of the real app (main screen, invoices, stock, purchasing, suppliers), a CTA with a keyword and a logo ending. Voice: Edge TTS `ru-RU-DmitryNeural`.

```bash
node ../../engine/cli.mjs build .     # voice, timeline, recordings import, soundtrack
node ../../engine/cli.mjs stills . 18,44,70
node ../../engine/cli.mjs render .
```

- `scenes.js` — the choreography; read it before writing a new one.
- `record.mjs` — how the recordings were made (needs a running KitchenFlow on a data copy; the recordings are already in `assets/rec/`).
- `project.json` `backgrounds` — how the eight background variants were drawn from `assets/bg/plate.jpg`.

Screens and recordings show KitchenFlow with demo data and belong to its owner; they are here as a reference, not for reuse.
