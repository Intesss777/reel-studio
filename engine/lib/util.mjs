// Shared helpers: project loading, secrets, ffmpeg and browser discovery, process runner.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ENGINE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const REPO = path.dirname(ENGINE);

export async function loadProject(dir) {
  const root = path.resolve(dir);
  const read = async (f) => JSON.parse(await fs.readFile(path.join(root, f), 'utf8'));
  const project = await read('project.json');
  const brand = await read('brand.json');
  const name = project.name || path.basename(root);
  return { root, name, project, brand, build: path.join(root, 'build') };
}

// Reads KEY=value lines from the repo .env and the project .env into process.env. Never prints values.
export async function loadEnv(root) {
  for (const file of [path.join(REPO, '.env'), path.join(root, '.env')]) {
    let text;
    try { text = await fs.readFile(file, 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  }
}

// build/config.js: the project and brand as globals for the player.
export async function writeConfig(p) {
  await fs.mkdir(p.build, { recursive: true });
  const rootUrl = `${pathToFileURL(p.root).href}/`;
  const cfg = { ...p.project, name: p.name, root: rootUrl, assets: `${rootUrl}assets/`, buildUrl: `${rootUrl}build/` };
  await fs.writeFile(path.join(p.build, 'config.js'), `window.PROJECT = ${JSON.stringify(cfg)};\nwindow.BRAND = ${JSON.stringify(p.brand)};\n`);
}

// script.tsv: "<scene id>\t<voice line>" per line; # starts a comment.
export async function readScript(root) {
  const text = await fs.readFile(path.join(root, 'script.tsv'), 'utf8');
  const out = new Map();
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const i = line.indexOf('\t');
    if (i < 0) throw new Error(`script.tsv: no tab in line "${line.slice(0, 40)}"`);
    out.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
  }
  return out;
}

let ffmpegCache;
export async function ffmpegPath() {
  if (ffmpegCache) return ffmpegCache;
  if (process.env.FFMPEG_PATH) return (ffmpegCache = process.env.FFMPEG_PATH);
  const which = spawnSync('which', ['ffmpeg']);
  if (which.status === 0) return (ffmpegCache = which.stdout.toString().trim());
  try {
    const mod = await import('ffmpeg-static');
    if (mod.default) return (ffmpegCache = mod.default);
  } catch { /* optional dependency not installed */ }
  throw new Error('ffmpeg not found. Install it (macOS: brew install ffmpeg) or set FFMPEG_PATH.');
}

export function run(cmd, args, { capture = false, input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: [input ? 'pipe' : 'ignore', capture ? 'pipe' : 'inherit', capture ? 'pipe' : 'inherit'] });
    let out = '', err = '';
    if (capture) { child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { err += d; }); }
    if (input) { child.stdin.end(input); }
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve({ out, err }) : reject(new Error(`${path.basename(cmd)} exited ${code}\n${err.slice(-1500)}`))));
  });
}

export async function ffmpeg(args, opts) { return run(await ffmpegPath(), ['-hide_banner', '-loglevel', 'error', ...args], opts); }

export async function launchBrowser() {
  const { chromium } = await import('playwright');
  try {
    return await chromium.launch({ headless: true, args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox'] });
  } catch (error) {
    if (/Executable doesn't exist/.test(error.message)) throw new Error('Chromium for Playwright is missing. Run: npm run browsers');
    throw error;
  }
}

// Opens the player for a project and waits until fonts, images and backgrounds are ready.
export async function openPlayer(p, { scale = 1 } = {}) {
  await writeConfig(p);
  const browser = await launchBrowser();
  const width = p.project.format?.width ?? 1080, height = p.project.format?.height ?? 1920;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const safeDecode = (u) => { try { return decodeURIComponent(u); } catch { return u; } };
  page.on('requestfailed', (r) => { if (!r.url().endsWith('/build/tracks.js')) errors.push(`missing file: ${safeDecode(r.url())}`); });
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  const url = `${pathToFileURL(path.join(ENGINE, 'runtime', 'player.html')).href}?project=${encodeURIComponent(pathToFileURL(p.root).href)}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.ready || window.loadError, null, { timeout: 60000 });
  const loadError = await page.evaluate(() => window.loadError);
  if (loadError) throw new Error(loadError);
  await page.evaluate(() => window.ready);
  if (errors.length) throw new Error(`player errors:\n${errors.join('\n')}`);
  const duration = await page.evaluate(() => window.DURATION);
  return { browser, page, duration, width, height, errors };
}

// Seeks and waits for any frame image the seek started decoding.
export async function seekTo(page, t) {
  await page.evaluate(async (x) => { window.__wait = null; window.seek(Math.max(0, x)); if (window.__wait) await window.__wait; }, t);
}

export const exists = async (f) => { try { await fs.access(f); return true; } catch { return false; } };
