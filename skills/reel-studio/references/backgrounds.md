# Background world

## Principles

- One world per reel. A plate (texture, light, one dominant form) shared by all scenes; scenes differ in a secondary element only. Varied backgrounds are for carousels.
- The world comes from the client's business (materials, tools, place), not from the previous project. Abstract compositions are welcome — large circles, arcs, planes, thin construction lines, paint and paper texture — as long as they frame the UI and the story instead of competing with them.
- Dark worlds keep the UI as the brightest object; light worlds need the UI fragments to carry their own shadow.
- Leave quiet zones where headlines and UI go (left and center for a right-handed form).

## Making the plate

1. Generate art plates with an image model, or photograph a real material. Prompt for the art layer only: "portrait 9:16, no text, no letters, no numbers, no logo, no interface, no screens, no charts". Name the palette as hex values and the material, light and composition. Never ask the model for UI; real screenshots are composited later.
2. Pick the plate the client likes most and remove secondary elements you want to vary (clone/heal in an editor, or synthesise paper texture from a clean patch).
3. Save it as `assets/bg/plate.jpg` (1080×1920, JPEG q≈2).

## Variants with contour lines

`backgrounds` in `project.json` draws embossed contour-line bundles (groove shadow, broken light edge, rare accent threads) over the plate, a different bundle per scene:

```json
"backgrounds": {
  "plate": "assets/bg/plate.jpg", "out": "assets/bg", "width": 1080, "height": 1920,
  "accentRgb": [255, 98, 44], "glowRgb": [230, 70, 20], "edgeRgb": [206, 203, 196],
  "shape": [[574, 0], [633, 115], ...],
  "defaults": { "spacing": 24, "warp": 78, "scale": 270, "spread": 0.45 },
  "scenes": { "bg-01": { "seed": 11, "guide": [[880, 430], [935, 760], [1010, 1100], [480, 1660], [-140, 1800]], "n": 8, "accentLines": [1, 3, -2] } }
}
```

- `guide` — the path the bundle follows, in frame pixels; route it through the margins the scene's layout leaves free.
- `n` — lines on each side; `spacing` px between them (irregular ±); `warp`/`scale` — waviness; `accentLines` — which line indices get accent threads.
- `shape` — polygon kept clean (e.g. the plate's main form).
- Colours from the brand: `accentRgb` = accent, `edgeRgb` = paper.

Run `backgrounds <project> [names]`, review all variants side by side, adjust guides.
