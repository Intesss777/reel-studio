# Recording a web app walkthrough

Recordings click real buttons: they add items, confirm documents, record payments. Do them against a copy.

## 1. Make a copy of the app and its data

Never point a recording at the user's working database or servers.

- Database: create a separate database from a dump of the working one in the same server, e.g. for PostgreSQL in Docker:
  `docker exec <pg> sh -c 'createdb -U "$POSTGRES_USER" <app>_reel_demo && pg_dump -U "$POSTGRES_USER" -d <app> --no-owner --no-privileges | psql -q -U "$POSTGRES_USER" -d <app>_reel_demo'`
- API: start a second instance on another port with the copy's connection string, its own file storage folder, and without background workers (they may send emails or messages). Rewrite the connection string in memory from the app's `.env`; do not print it.
- Web app: a second dev server on another port pointed at that API (for Vite: `VITE_API_URL=http://localhost:3100 npm run dev -- --port 5273`).
- To re-record after a fragment changed data, drop and recreate the copy, then restart its API.
- Stop the copies when done; tell the user the copy database still exists and offer to drop it.

## 2. Write record.mjs

```js
export default {
  url: process.env.APP_URL || 'http://localhost:5273',
  viewport: { width: 1280, height: 900 },
  scale: 2,
  async login(page, env) { /* fill env.APP_EMAIL / env.APP_PASSWORD, submit, wait for the app */ },
  fragments: {
    r3: {
      route: '/admin/inventory',
      start: { x: 900, y: 660 },
      async run(s, page) {
        const low = page.getByRole('button', { name: /^Мало/ });
        await s.until(s.W('Фильтр') - 0.25);                 // a beat before the word
        s.cam([page.getByRole('button', { name: /^Все позиции/ }), page.getByRole('button', { name: /^В норме/ })], 0.55);
        await s.moveTo(low, 0.55);
        await s.until(s.W('Мало') + 0.15);
        await s.click();
        await s.until(s.W('заказать') - 0.2);
        await s.cam({ text: 'Масло сливочное', minW: 800, minH: 60 }, 0.55, { max: 1.6, pad: 60 });
      },
    },
  },
};
```

Session API (`s`): `W(word, n)` word time relative to the scene · `until(t)` · `move(x, y, dur)` · `moveTo(target, dur, dx, dy)` · `click()` · `type(text, delay)` · `scroll(dy, dur)` · `reveal(target, margin)` smooth scroll-into-view (use it before clicking anything that may be below the fold — wheel scrolling over a nested list scrolls the list, not the page) · `cam(target | 'full', dur, { pad, max, min })` · `rect(target)` · `card(text, minW, minH, match)` with `match` `exact | start | includes`.

Targets: Playwright locators, `{ x, y, width, height }` rects, or `{ text, minW, minH, match }` — the nearest ancestor of that text at least that big (good for "the card that contains …").

## 3. Record and review

`voice` → `timeline` (the recorder needs scene lengths and word times) → `record <project> r1,r2` → look at a few frames in `build/rec/<id>/` and at `build/rec/<id>-error.png` if a fragment failed. Typical fixes: a locator matched two elements (`.first()`), an element outside the viewport (`reveal`), a text with a non-standard hyphen (use `match: 'includes'` on another phrase).

## 4. Share

`export-rec <project> <id>` writes `assets/rec/<id>.mp4` (constant 30 fps, the 2× frames) and `<id>.track.json`. List them in `project.json` `footage` so anyone can `import` and render without the app.
