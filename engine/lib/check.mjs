// Pre-delivery checks on the rendered video: duration, streams, loudness, a phone-scale contact sheet,
// and a voice-versus-scene report (every voice segment must sit inside its scene window).
import fs from 'node:fs/promises';
import path from 'node:path';
import { ffmpeg, ffmpegPath, run } from './util.mjs';
import { readTimeline } from './render.mjs';

export async function check(p) {
  const tl = await readTimeline(p);
  const width = p.project.format?.width ?? 1080, height = p.project.format?.height ?? 1920;
  const video = path.join(p.build, `${p.name}-${width}x${height}.mp4`);
  const problems = [];
  // Voice segments inside their scenes.
  for (const seg of tl.vo) {
    const [a, b] = tl.scenes[seg.key];
    const end = seg.at + (seg.src1 - seg.src0);
    if (seg.at < a - 0.05 || end > b + 0.05) problems.push(`voice of ${seg.key} runs outside its scene (${seg.at.toFixed(2)}–${end.toFixed(2)} vs ${a}–${b})`);
  }
  try { await fs.access(video); } catch { console.log(`no video yet at ${video}: run "reel render"`); report(problems); return; }
  const { err } = await run(await ffmpegPath(), ['-hide_banner', '-i', video, '-map', '0:a?', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { capture: true });
  const I = err.match(/I:\s+(-?[\d.]+) LUFS/g)?.at(-1)?.match(/-?[\d.]+/)?.[0];
  const peak = err.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.at(-1)?.match(/-?[\d.]+/)?.[0];
  const dur = err.match(/Duration: ([\d:.]+)/)?.[1];
  console.log(`video: ${path.basename(video)} · duration ${dur} · loudness ${I ?? 'n/a'} LUFS · true peak ${peak ?? 'n/a'} dBFS`);
  if (!I) problems.push('no audio stream');
  else if (Math.abs(Number(I) - (p.project.loudness ?? -14)) > 1) problems.push(`loudness ${I} LUFS is off target`);
  if (peak && Number(peak) > -0.9) problems.push(`peak ${peak} dBFS is too hot`);
  // Phone-scale contact sheet: one frame every 2 s at 270 px width (what a 375 px phone shows, shrunk).
  const sheet = path.join(p.build, 'check-contact.png');
  const cols = 10;
  await ffmpeg(['-y', '-i', video, '-vf', `fps=1/2,scale=270:-2,tile=${cols}x${Math.ceil(tl.duration / 2 / cols)}`, '-frames:v', '1', sheet]);
  console.log(`contact sheet: ${sheet}`);
  report(problems);
}

function report(problems) {
  if (!problems.length) console.log('check: no problems found by the automatic checks (still review readability, copy and safe zones by eye)');
  else { console.log('check: problems'); for (const x of problems) console.log(`  - ${x}`); process.exitCode = 1; }
}
