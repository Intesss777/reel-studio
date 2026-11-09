// Records walkthroughs of a web app, scheduled on the voice-over words.
// The project provides record.mjs: export default { url, viewport, scale, login(page, env), fragments: { id: { route, start, run(s, page) } } }.
// Output per fragment: build/rec/<id>/f-00000.jpg … and track.json (frame times, cursor path, clicks, typing, camera keys).
// SAFETY: point it at a copy of the app's data (see references/recording.md). Fragments may click real buttons.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser, loadEnv } from './util.mjs';
import { readTimeline } from './render.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

function session(page, cdp, view, wordTime) {
  const rec = { cursor: [], clicks: [], typing: [], camera: [], frames: [] };
  let t0 = 0, pos = { x: view.width * 0.85, y: view.height * 0.75 };
  const now = () => (Date.now() - t0) / 1000;
  const api = {
    rec, now, W: wordTime,
    async start(startPos) {
      if (startPos) pos = { ...startPos };
      await page.mouse.move(pos.x, pos.y);
      cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
        rec.frames.push({ ts: metadata.timestamp * 1000, data });
        cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      });
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: view.width * 2, maxHeight: view.height * 2, everyNthFrame: 1 });
      await page.mouse.move(pos.x + 1, pos.y);
      await sleep(500);
      t0 = Date.now();
      rec.cursor.push([0, pos.x, pos.y]);
      rec.camera.push([0, view.width / 2, view.height / 2, 1, 0]);
    },
    get t0() { return t0; },
    async until(t) { const d = t - now(); if (d > 0) await sleep(d * 1000); },
    // Eased, slightly curved cursor path.
    async move(x, y, dur = 0.45) {
      const a = { ...pos }, dist = Math.hypot(x - a.x, y - a.y);
      const nx = -(y - a.y) / (dist || 1), ny = (x - a.x) / (dist || 1), bend = Math.min(60, dist * 0.08);
      const c = { x: (a.x + x) / 2 + nx * bend, y: (a.y + y) / 2 + ny * bend };
      const start = now();
      for (;;) {
        const p = Math.min(1, (now() - start) / dur), e = easeInOut(p);
        const px = (1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * c.x + e * e * x;
        const py = (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * c.y + e * e * y;
        await page.mouse.move(px, py);
        rec.cursor.push([+now().toFixed(3), +px.toFixed(1), +py.toFixed(1)]);
        if (p >= 1) break;
        await sleep(14);
      }
      pos = { x, y };
    },
    async moveTo(target, dur = 0.45, dx = 0, dy = 0) {
      const b = await api.rect(target);
      await api.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, dur);
    },
    async click() {
      rec.clicks.push([+now().toFixed(3), pos.x, pos.y]);
      await page.mouse.down(); await sleep(70); await page.mouse.up();
    },
    async type(text, delay = 45) {
      for (const ch of text) { rec.typing.push([+now().toFixed(3)]); await page.keyboard.type(ch); await sleep(delay); }
    },
    async scroll(dy, dur = 0.45) {
      const startY = await page.evaluate(() => window.scrollY), t = now();
      for (;;) {
        const p = Math.min(1, (now() - t) / dur);
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(startY + dy * easeInOut(p)));
        if (p >= 1) break;
        await sleep(16);
      }
    },
    // Brings a target to the middle of the viewport with the browser's own smooth scroll (works in nested scroll areas).
    async reveal(target, margin = 140, dur = 0.45) {
      const b = await api.rect(target);
      if (b.y >= margin && b.y + b.height <= view.height - margin) return;
      await target.first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await sleep(dur * 1000 + 150);
    },
    // Camera key: 'full', a locator, a rect, a {text} card or an array of them (union). Scale fits the target with padding.
    async cam(target, dur = 0.5, { pad = 36, max = 2.3, min = 1 } = {}) {
      if (target === 'full') { rec.camera.push([+now().toFixed(3), view.width / 2, view.height / 2, 1, dur]); return; }
      const rs = [];
      for (const t of Array.isArray(target) ? target : [target]) rs.push(await api.rect(t));
      const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
      const x1 = Math.max(...rs.map((r) => r.x + r.width)), y1 = Math.max(...rs.map((r) => r.y + r.height));
      const s = Math.max(min, Math.min(max, view.width / (x1 - x0 + 2 * pad), view.height / (y1 - y0 + 2 * pad)));
      rec.camera.push([+now().toFixed(3), +((x0 + x1) / 2).toFixed(1), +((y0 + y1) / 2).toFixed(1), +s.toFixed(3), dur]);
    },
    async rect(target) {
      if (target && typeof target.boundingBox === 'function') {
        const b = await target.first().boundingBox();
        if (!b) throw new Error(`no box for ${target}`);
        return b;
      }
      if (target && typeof target.text === 'string') return api.card(target.text, target.minW, target.minH, target.match);
      return target;
    },
    // The nearest ancestor (at least minW x minH) of an element whose own text matches: 'exact' | 'start' | 'includes'.
    async card(text, minW = 200, minH = 50, match = 'exact') {
      const r = await page.evaluate(([t, mw, mh, mode]) => {
        const leaves = [...document.querySelectorAll('body *')].filter((e) => {
          const s = (e.textContent || '').replace(/\s+/g, ' ').trim();
          const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          const r = e.getBoundingClientRect();
          const ok = mode === 'includes' ? s.includes(t) : mode === 'start' ? s.startsWith(t) : s === t;
          return own && r.width > 0 && r.height > 0 && ok;
        });
        for (const leaf of leaves) {
          let e = leaf;
          while (e && e !== document.body) {
            const r = e.getBoundingClientRect();
            if (r.width >= mw && r.height >= mh) return { x: r.x, y: r.y, width: r.width, height: r.height };
            e = e.parentElement;
          }
        }
        return null;
      }, [text, minW, minH, match]);
      if (!r) throw new Error(`no card for "${text}"`);
      return r;
    },
  };
  return api;
}

export async function recordFragments(p, only = null) {
  await loadEnv(p.root);
  const mod = (await import(pathToFileURL(path.join(p.root, 'record.mjs')).href)).default;
  const tl = await readTimeline(p);
  const view = mod.viewport || { width: 1280, height: 900 };
  const browser = await launchBrowser();
  const ctx = await browser.newContext({ viewport: view, deviceScaleFactor: mod.scale || 2, colorScheme: mod.colorScheme || 'dark', locale: mod.locale || 'ru-RU', timezoneId: mod.timezoneId || 'Europe/Moscow' });
  if (mod.login) { const lp = await ctx.newPage(); await mod.login(lp, process.env); await lp.close(); }
  const ids = only || Object.keys(mod.fragments);
  for (const id of ids) {
    const frag = mod.fragments[id];
    if (!tl.scenes[id]) throw new Error(`scene ${id} is not in the timeline`);
    const duration = tl.scenes[id][1] - tl.scenes[id][0];
    const wordTime = (word, n = 0) => {
      let c = 0;
      for (const x of tl.words[id] || []) if (x.w.toLowerCase().startsWith(word.toLowerCase())) { if (c === n) return x.t - tl.scenes[id][0]; c++; }
      throw new Error(`word ${word} not in ${id}`);
    };
    const page = await ctx.newPage();
    await page.goto(mod.url + frag.route);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await sleep(700);
    const cdp = await ctx.newCDPSession(page);
    const s = session(page, cdp, view, wordTime);
    await s.start(frag.start);
    const dir = path.join(p.build, 'rec', id);
    try { await frag.run(s, page); } catch (error) {
      console.error(`${id} failed at ${s.now().toFixed(2)}s: ${error.message.split('\n')[0]}`);
      await fs.mkdir(dir, { recursive: true });
      await page.screenshot({ path: path.join(p.build, 'rec', `${id}-error.png`) });
    }
    await s.until(duration);
    await cdp.send('Page.stopScreencast');
    await sleep(150);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const frames = s.rec.frames.map((f) => ({ t: (f.ts - s.t0) / 1000, data: f.data })).sort((a, b) => a.t - b.t);
    let first = frames.findIndex((f) => f.t >= 0);
    if (first < 0) first = frames.length;
    const kept = frames.slice(Math.max(0, first - 1)).map((f, i) => ({ ...f, t: i === 0 ? 0 : f.t }));
    const list = [];
    for (const [i, f] of kept.entries()) {
      const name = `f-${String(i).padStart(5, '0')}.jpg`;
      await fs.writeFile(path.join(dir, name), Buffer.from(f.data, 'base64'));
      list.push([+f.t.toFixed(3), name]);
    }
    const track = { id, duration, view, frames: list, cursor: s.rec.cursor, clicks: s.rec.clicks, typing: s.rec.typing, camera: s.rec.camera };
    await fs.writeFile(path.join(dir, 'track.json'), JSON.stringify(track));
    console.log(`${id}: ${list.length} frames, ${s.rec.clicks.length} clicks, ${s.rec.camera.length} camera keys, ${duration}s`);
    await page.close();
  }
  await browser.close();
}
