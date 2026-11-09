# Capturing real UI

The product UI is the hero of a product reel. Capture it, never draw it.

1. Run the product locally or use a staging/demo instance with demo data. Never capture real customer data.
2. Capture with Playwright at `deviceScaleFactor: 3` in the theme that matches the reel (dark reel → dark theme), viewport 1280×900, locale and timezone of the audience. Park the mouse in an empty corner so hover states and chart tooltips do not leak into the shot.
3. Save full pages for reference, then cut fragments: a card, a row group, a dialog, a filter bar. Measure edges from the 3× image (the card border is a 1 px lighter line) and crop exactly on the outline. Pieces that sit side by side in the app (metric cards, filter pills) are cut one by one so the reel background, not the app's, shows between them.
4. Register each fragment in `project.json` `ui`: `{ "key": { "src": "<file without @3x.png>", "w": <css width>, "h": <css height> } }` and place it with `ui()` or `uiRow()` at a scale where body text is ≥ 22 px in the frame (usually 1.1–2.1×).
5. Re-capture after product changes; keep the capture script in the project so the next reel is one command.

A capture script skeleton:

```js
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3, colorScheme: 'dark', locale: 'ru-RU' });
const page = await ctx.newPage();
// login with credentials from .env …
await page.goto(`${APP}/admin/inventory`);
await page.mouse.move(1278, 898);           // keep hover states out
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'assets/ui/inventory-rows@3x.png', clip: { x: 300, y: 290, width: 928, height: 412 } });
```
