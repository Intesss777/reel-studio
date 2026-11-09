# Copy and voice

## Writing the script

- One scene, one thought. 6–20 words per scene; recordings 8–14 words.
- Say what is on screen, in the same words and order. On-screen text is the spoken text shortened, never a different sentence.
- Specific: what, for whom, how much, how fast. Real numbers from the product or `[FACT NEEDED: …]`; never invent metrics, clients or reviews.
- The words customers use ("накладная", "остатки", "закупщик"), not marketing ("инновационное решение", "в современном мире", "откройте для себя", "не просто X, а Y").
- No rhetorical-question headlines except one hook; no exclamation marks in headings; no emoji in on-screen text.
- Honest limits are part of the pitch: "распознавание в демо-режиме, проверку делает человек".
- One CTA per reel: "Напишите мне слово «КУХНЯ» — покажу демо."
- Choose вы or ты per brand and keep it everywhere (`brand.json` `address`).

## Russian typography on screen

«ёлочки», inner „лапки“; em dash with spaces; non-breaking space after short words and between number and unit (5 000 ₽, 15 мин); ₽ after the number; phone numbers +7 (928) 000-00-00.

## Writing for TTS

- Spell brand names as they sound: "Китчен Флоу".
- Avoid letter-merging pairs that a voice slurs ("пока демо" sounded like one word — "работает в демо-режиме" did not).
- Avoid ambiguous grammar ("сумма в долге поставщику" → "сумма записывается в долг перед поставщиком").
- Short sentences: the timeline inserts a 0.38 s pause between sentences, which gives the calm pace.
- If one phrase fails to synthesise repeatedly, rephrase it slightly; the free service rejects some phrasings.

## Voice providers

| Provider | When | Notes |
|---|---|---|
| `edge` | drafts, free | Microsoft Edge read-aloud voices via the `edge-tts` Python package (`pip install edge-tts`). Unofficial endpoint, flaky, terms unclear for commercial use. Calm male Russian: `ru-RU-DmitryNeural`, pitch `-2Hz`. |
| `elevenlabs` | finals, the author's own cloned voice | Needs a plan with voice cloning and `ELEVENLABS_API_KEY` in `.env`. Returns character timestamps, which the engine groups into words. |
| `manual` | the author records lines | Put `build/vo/<id>.mp3` and `<id>.json` (`{ text, sig, words: [{ w, t, d }] }`) yourself, e.g. from a forced aligner. |

## Cloning the author's voice (ElevenLabs Instant Voice Clone)

1. The author records 1–3 minutes of clean speech: quiet room, no music, one microphone (a phone is fine), the calm pace of the reel — reading the reel script works best.
2. The author creates the voice in their own ElevenLabs account (Voices → Add voice → Instant clone) and agrees to its terms; uploading a person's voice is their decision.
3. Put the voice id in `project.json` `voice.voiceId` and the API key in the project `.env` as `ELEVENLABS_API_KEY`. Never print or commit the key.
4. `voice --force`, then `timeline`, `audio`, `render`. The cloned voice stays in the author's account; a shared repository never contains it.

## Mix

Music sits ≈15 dB under the voice while it speaks and returns between phrases; the voice chain is high-pass 85 Hz, gentle low shelf, presence lift at 3.2 kHz, light compression. Master −14 LUFS, true peak ≤ −1 dBTP. Check with `check`.
