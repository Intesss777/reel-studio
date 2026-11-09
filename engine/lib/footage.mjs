// Footage: turns video files into frame sequences the player can seek exactly.
// - Recordings shipped as MP4 (assets/rec/<id>.mp4 + <id>.track.json): frames at the project fps, same track.
// - IRL footage (phone video): trimmed, cropped to the frame aspect with zoom headroom, camera keys from project.json.
// Also exports a live recording (build/rec/<id>) to a portable MP4 + track so a project can be shared.
import fs from 'node:fs/promises';
import path from 'node:path';
import { ffmpeg } from './util.mjs';

export async function importFootage(p) {
  const fps = p.project.fps ?? 30;
  const W = p.project.format?.width ?? 1080, H = p.project.format?.height ?? 1920;
  for (const item of p.project.footage || []) {
    const dir = path.join(p.build, 'rec', item.id);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const src = path.join(p.root, item.src);
    const trim = item.trim ? ['-ss', String(item.trim[0]), '-to', String(item.trim[1])] : [];
    let view, vf;
    if (item.track) {
      // Screen recording: keep the native frame (it carries its own camera keys).
      const track = JSON.parse(await fs.readFile(path.join(p.root, item.track), 'utf8'));
      view = track.view;
      vf = `fps=${fps}`;
      await ffmpeg([...trim, '-i', src, '-vf', vf, '-q:v', '2', path.join(dir, 'f-%05d.jpg')]);
      const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.jpg')).sort();
      track.frames = files.map((f, i) => [+(i / fps).toFixed(3), f]);
      await fs.writeFile(path.join(dir, 'track.json'), JSON.stringify(track));
      console.log(`import ${item.id}: ${files.length} frames (recording)`);
      continue;
    }
    // IRL footage: cover-crop to the frame aspect at 1.5x for camera moves.
    const k = item.headroom ?? 1.5;
    view = { width: Math.round(W * k), height: Math.round(H * k) };
    vf = `fps=${fps},scale=${view.width}:${view.height}:force_original_aspect_ratio=increase,crop=${view.width}:${view.height}`;
    await ffmpeg([...trim, '-i', src, '-vf', vf, '-q:v', '3', path.join(dir, 'f-%05d.jpg')]);
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.jpg')).sort();
    const len = files.length / fps;
    // Default camera: the whole frame, then a slow push-in. Keys: [t, cx, cy, scale, duration] in view pixels.
    const camera = item.camera || [[0, view.width / 2, view.height / 2, 1, 0], [0.01, view.width / 2, view.height / 2, 1.08, len]];
    const track = { id: item.id, duration: len, view, frames: files.map((f, i) => [+(i / fps).toFixed(3), f]), cursor: [[0, -100, -100]], clicks: [], typing: [], camera };
    await fs.writeFile(path.join(dir, 'track.json'), JSON.stringify(track));
    console.log(`import ${item.id}: ${files.length} frames (footage, ${len.toFixed(1)} s)`);
  }
}

// build/rec/<id> (variable frame timing) → assets/rec/<id>.mp4 (constant fps) + assets/rec/<id>.track.json.
export async function exportRecording(p, id) {
  const fps = p.project.fps ?? 30;
  const dir = path.join(p.build, 'rec', id);
  const track = JSON.parse(await fs.readFile(path.join(dir, 'track.json'), 'utf8'));
  const lines = [];
  track.frames.forEach(([t, f], i) => {
    const next = track.frames[i + 1]?.[0] ?? track.duration;
    lines.push(`file '${path.join(dir, f)}'`, `duration ${Math.max(1 / fps, next - t).toFixed(4)}`);
  });
  lines.push(`file '${path.join(dir, track.frames.at(-1)[1])}'`);
  const list = path.join(dir, 'concat.txt');
  await fs.writeFile(list, lines.join('\n'));
  const outDir = path.join(p.root, 'assets', 'rec');
  await fs.mkdir(outDir, { recursive: true });
  await ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `fps=${fps},format=yuv420p`, '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-t', String(track.duration), path.join(outDir, `${id}.mp4`)]);
  const { frames, ...rest } = track;
  await fs.writeFile(path.join(outDir, `${id}.track.json`), JSON.stringify(rest));
  await fs.rm(list);
  console.log(`export ${id}: assets/rec/${id}.mp4 (${frames.length} source frames)`);
}

// build/tracks.js: all tracks for the player.
export async function buildTracks(p) {
  const root = path.join(p.build, 'rec');
  const tracks = {};
  let dirs = [];
  try { dirs = await fs.readdir(root, { withFileTypes: true }); } catch { /* no recordings */ }
  for (const d of dirs.filter((x) => x.isDirectory())) {
    try {
      const t = JSON.parse(await fs.readFile(path.join(root, d.name, 'track.json'), 'utf8'));
      tracks[t.id] = { view: t.view, duration: t.duration, frames: t.frames, cursor: t.cursor, clicks: t.clicks, typing: t.typing, camera: t.camera };
    } catch { /* incomplete recording */ }
  }
  await fs.mkdir(p.build, { recursive: true });
  await fs.writeFile(path.join(p.build, 'tracks.js'), `window.REC = ${JSON.stringify(tracks)};\n`);
  console.log(`tracks: ${Object.keys(tracks).join(', ') || 'none'}`);
}
