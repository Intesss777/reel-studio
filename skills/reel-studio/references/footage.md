# IRL footage and photos

For the author's life layer (travel, work in a café, the city) and for "the problem in the real world" (a kitchen, a pile of invoices).

## Shooting (iPhone)

- 4K 30 fps, 1× or 0.5× lens, exposure locked on the subject, no digital zoom.
- Vertical if the shot only lives in reels; horizontal if it also serves YouTube — the importer crops to 9:16 with headroom.
- 3–6 s per shot of steady motion (walk, pan, hands at work); one action per shot.
- Natural light, highlights not clipped; colour the whole reel the same way (the Lightroom presets of the project, if any).

## Importing

```json
"recordings": { "walk": { "type": "footage" } },
"footage": [
  { "id": "walk", "src": "assets/footage/IMG_4120.MOV", "trim": [1.2, 5.8],
    "camera": [[0, 810, 1440, 1, 0], [0.2, 810, 1300, 1.12, 4.4]] }
]
```

`import` extracts frames at the project fps, cover-cropped to the frame aspect at 1.5× (1620×2880 for 1080×1920) so the camera can move without upscaling. Camera keys are `[t, cx, cy, scale, duration]` in those pixels; default is a slow 8 % push-in. Make the scene length match the trimmed clip (`minLen` / `fixed`).

## Captions over footage

Short phrases (2–6 words) that appear on the spoken word, in the upper or middle third, never at the bottom (platform UI). Use the kit `text` + `linesAt`; the footage scene adds a top and bottom shade for legibility. No bottom subtitles.

## Photos

Turn a photo into a clip, then import it like footage: `ffmpeg -loop 1 -t 4 -i photo.jpg -vf fps=30 -pix_fmt yuv420p assets/footage/photo.mp4`. One slow push or a pan along the subject.
