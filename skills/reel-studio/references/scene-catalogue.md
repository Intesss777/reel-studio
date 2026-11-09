# Scene catalogue

Recipes proven in production. Each names where to copy the code from in `examples/kitchenflow/scenes.js`.

## Story shape for a product reel (60–110 s)

intro (words of the problem) → hook frame → main screen recording → feature frame → its recording → … → result frame → CTA → logo. Alternate designed frames with recordings: the frame names the idea in big type, the recording proves it in the real product.

## Frames

**Words intro** (`intro`). The routine as scattered words that decode as they are spoken, each with a small real value under it ("8 055 ₽ · METRO"); thin geometry draws in the back; links connect the words; on "в одном приложении" everything collapses into one glowing point, the product name appears under it on the spoken name, flash. Voice must list exactly the words shown, in the order they appear.

**Hook** (`s1`). Huge 2–3 line question, lines appear on their words; three short pains on the beat after it; a promise line. No UI.

**UI focus** (`s2`). Headline, one large real fragment, a focus ring drawn around the control the voice names, a leader line to a zoomed copy of that control, a short caption, an honest note. Can end with the cursor clicking the control and the camera diving into it (scale ×16 with blur) into a white flash — the transition is the click.

**Steps into a total** (`s3`). One document fragment; rings appear on each line amount as the voice names them; branches carry dots from the amounts to the total; the total ring glows once; a caption explains where the data goes.

**Table → list** (`s4`). Table revealed top-down, rings on the warning badges, a leader with a travelling dot into a second fragment that slides in from the right.

**Typed result** (`s5`). Opens with a circle grown from the previous scene's badge. A list fragment and a dialog; the dialog text appears line by line with a caret (a cover rect shrinks over the real screenshot — the text itself is never redrawn).

**Metrics + chart** (`s6`). Separate metric cards cut from the UI in one row, the chart revealed left to right by a shrinking cover, a ring on the "demo data" badge with a caption saying the numbers are demo.

**Chain** (`s7`). A vertical line drawn through nodes that light up on the spoken words, a label and a small real fragment at each node; ends with the last node swelling into an iris.

**CTA** (`s8`). "Напишите мне слово", the keyword decoding from random glyphs on the spoken word, a brush underline, the offer in one line; a slight zoom-out and blur into the logo flash.

**Logo** (`outro`). Particles fly into the center, the app icon pops (outBack), its glyph draws with strokes, the wordmark slides in letter by letter on the spoken name, everything fades out.

## Recordings

**App window** (`r1…r5`). The previous frame's background, the section title, a window with the real app recorded at 2×, camera keys from the recording: overview → lean in before each click → back. 5–8 s, one idea per fragment, voice names each action as it happens.

## IRL

**Footage** (`type: "footage"`). Full-bleed phone video cropped to 9:16 with 1.5× headroom, a slow push or keyed moves, captions (2–6 words) that appear on spoken words, top and bottom shade for legibility. Use for the author's life/travel layer and for "the problem in the real world" (a kitchen, a stack of invoices).

**Photo** — the same scene type with a still image converted to a 3–5 s clip (`ffmpeg -loop 1 -t 4 -i photo.jpg photo.mp4`) and a slow push-in.

## Transitions

| Transition | Motivation | Where |
|---|---|---|
| Stairs wipe (6 accent stripes up) | chapter change on a bar line | into feature frames |
| Click → dive → flash | the user's action opens the next screen | after a UI focus frame |
| Circle from a badge | the warning opens its consequence | table → purchase |
| Glitch bands | system switches mode | purchase → owner view |
| Iris from the last node | the chain closes | chain → CTA |
| Crossfade on the same background | frame → its recording | every recording |
| Zoom-out + blur → flash | the end, collapse into the brand | CTA → logo |
