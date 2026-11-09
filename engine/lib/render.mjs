// Rendering: stills, soundtrack (with loudness normalisation), preview and full video, carousel slides.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ffmpeg, ffmpegPath, openPlayer, readScript, run, seekTo } from './util.mjs';

export async function renderStills(p, times, { dir } = {}) {
  const { browser, page } = await openPlayer(p);
  const out = dir || path.join(p.build, 'stills');
  await fs.mkdir(out, { recursive: true });
  const files = [];
  for (const t of times) {
    await seekTo(page, t);
    const file = path.join(out, `t-${t.toFixed(2).padStart(6, '0')}.png`);
    await page.screenshot({ path: file });
    files.push(file);
  }
  await browser.close();
  console.log(`stills: ${files.length} → ${out}`);
  return files;
}

// Carousel: one PNG per scene, taken just before each scene ends (or at project.carousel.times).
export async function renderCarousel(p) {
  const tl = await readTimeline(p);
  const times = p.project.carousel?.times || Object.values(tl.scenes).map(([, b]) => +(b - 0.1).toFixed(2));
  const files = await renderStills(p, times, { dir: path.join(p.build, 'carousel') });
  for (const [i, f] of files.entries()) await fs.rename(f, path.join(path.dirname(f), `slide-${String(i + 1).padStart(2, '0')}.png`));
  console.log(`carousel: ${files.length} slides`);
}

export async function renderAudio(p, { solo = null } = {}) {
  const { browser, page } = await openPlayer(p, { scale: 0.25 });
  const vo = {};
  for (const id of (await readScript(p.root)).keys()) {
    try { vo[id] = (await fs.readFile(path.join(p.build, 'vo', `${id}.mp3`))).toString('base64'); } catch { /* scene without voice */ }
  }
  const res = await page.evaluate(([v, s]) => window.renderAudio(v, { solo: s }), [vo, solo]);
  await browser.close();
  const pcm = Buffer.concat(res.chunks.map((c) => Buffer.from(c, 'base64')));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
  header.writeUInt32LE(res.sampleRate, 24); header.writeUInt32LE(res.sampleRate * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  const raw = path.join(p.build, solo ? `stem-${solo}.wav` : 'soundtrack-raw.wav');
  await fs.writeFile(raw, Buffer.concat([header, pcm]));
  if (solo) { console.log(`stem ${solo}: peak ${res.peak.toFixed(3)}`); return raw; }
  // Two-pass loudness normalisation for Reels/Shorts: -14 LUFS integrated, -1 dBTP.
  const target = p.project.loudness ?? -14;
  // The measurement is printed at info level, so this call runs ffmpeg without the quiet flags.
  const { err } = await run(await ffmpegPath(), ['-hide_banner', '-i', raw, '-af', `loudnorm=I=${target}:TP=-1.0:LRA=11:print_format=json`, '-f', 'null', '-'], { capture: true });
  let m;
  try { m = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1)); } catch { m = null; }
  const out = path.join(p.build, 'soundtrack.wav');
  const filter = m ? `loudnorm=I=${target}:TP=-1.0:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true` : `loudnorm=I=${target}:TP=-1.0:LRA=11`;
  await ffmpeg(['-y', '-i', raw, '-af', filter, '-ar', '48000', '-c:a', 'pcm_s16le', out]);
  await fs.rm(raw, { force: true });
  console.log(`soundtrack: ${m ? `measured ${m.input_i} LUFS → ` : ''}${target} LUFS → ${out}`);
  return out;
}

async function encoder(file, { width, height, fps, sub }) {
  const filters = sub > 1 ? `tmix=frames=${sub},select='not(mod(n\\,${sub}))',` : '';
  // Chrome JPEGs are full-range BT.601; deliver limited-range BT.709.
  const vf = `${filters}scale=in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p`;
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps * sub), '-c:v', 'mjpeg', '-i', '-',
    '-vf', vf, '-r', String(fps), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-s', `${width}x${height}`, '-movflags', '+faststart', file];
  const child = spawn(await ffmpegPath(), args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) => child.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg exited ${c}`)))));
  return { child, done };
}

export async function renderVideo(p, { preview = false } = {}) {
  const scale = preview ? 0.5 : 1, sub = preview ? 1 : 3;
  const fps = p.project.fps ?? 30;
  const { browser, page, duration, width, height } = await openPlayer(p, { scale });
  const tmp = path.join(p.build, `${preview ? 'preview' : 'full'}-silent.tmp.mp4`);
  const { child, done } = await encoder(tmp, { width: width * scale, height: height * scale, fps, sub });
  const total = Math.round(duration * fps * sub), started = Date.now();
  for (let i = 0; i < total; i++) {
    await seekTo(page, (i - (sub - 1) / 2) / (fps * sub));
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!child.stdin.write(buf)) await new Promise((r) => child.stdin.once('drain', r));
    if (i % (fps * sub * 10) === 0) console.log(`frame ${i}/${total} · ${((Date.now() - started) / 1000).toFixed(0)} s`);
  }
  child.stdin.end();
  await done;
  await browser.close();
  const out = path.join(p.build, `${p.name}-${preview ? 'preview-540' : `${width}x${height}`}.mp4`);
  const sound = path.join(p.build, 'soundtrack.wav');
  try {
    await fs.access(sound);
    await ffmpeg(['-y', '-i', tmp, '-i', sound, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
    await fs.rm(tmp);
  } catch {
    await fs.rename(tmp, out);
    console.log('no soundtrack.wav yet: video written without sound (run "reel audio" first)');
  }
  console.log(`video: ${out}`);
  return out;
}

export async function readTimeline(p) {
  const text = await fs.readFile(path.join(p.build, 'timeline.js'), 'utf8');
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
}
