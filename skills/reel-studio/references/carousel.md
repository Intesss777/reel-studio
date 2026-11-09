# Carousels

A carousel is read slide by slide at the viewer's pace; a reel is watched in time. Reuse the brand, assets and kit, change the composition.

- Format 1080×1350 (`project.json` `format`), margins 72 px, navigation marker in the same place on every slide.
- One thought and one hero object per slide; headline ≤ 3 lines; the first slide is the hook, the last is the CTA.
- Backgrounds may vary per slide (here variety helps the swipe), still from one family.
- Each slide is a scene whose final state is the slide; animations in `projectSeek` simply end in that state. Scenes without voice use `minLen`; give each ~2 s.
- `carousel <project>` renders `build/carousel/slide-01.png …` at each scene's last frame (or at `carousel.times`).
- Check at phone size: the slide is shown ~1080 px tall on a 6" screen, so body text ≥ 28 px.
