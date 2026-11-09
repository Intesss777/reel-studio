// Background variants for one reel: the same plate (texture, light, form) with a different contour-line bundle per scene.
// project.json "backgrounds": { plate, out, width, height, accentRgb, glowRgb, edgeRgb, shape, defaults: {...}, scenes: { name: { seed, guide, n, accentLines } } }
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ENGINE, launchBrowser } from './util.mjs';

export async function makeBackgrounds(p, only = null) {
  const cfg = p.project.backgrounds;
  if (!cfg) throw new Error('project.json has no "backgrounds" section');
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  await page.goto(pathToFileURL(path.join(ENGINE, 'runtime', 'bg-lines.html')).href);
  await page.waitForFunction(() => window.genReady);
  const plate = pathToFileURL(path.join(p.root, cfg.plate)).href;
  const outDir = path.join(p.root, cfg.out || 'assets/bg');
  await fs.mkdir(outDir, { recursive: true });
  const base = { spacing: 24, offset: 0, warp: 78, scale: 270, spread: 0.45, width: cfg.width, height: cfg.height, accentRgb: cfg.accentRgb, glowRgb: cfg.glowRgb, edgeRgb: cfg.edgeRgb, shape: cfg.shape, ...cfg.defaults };
  for (const [name, scene] of Object.entries(cfg.scenes)) {
    if (only && !only.includes(name)) continue;
    const url = await page.evaluate((c) => window.renderBg(c), { ...base, ...scene, plate });
    const file = path.join(outDir, `${name}.png`);
    await fs.writeFile(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`background ${name} → ${path.relative(p.root, file)}`);
  }
  await browser.close();
}
