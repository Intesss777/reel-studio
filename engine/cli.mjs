#!/usr/bin/env node
// reel-studio command line. Usage: node engine/cli.mjs <command> <project folder> [args]
import fs from 'node:fs/promises';
import path from 'node:path';
import { REPO, loadEnv, loadProject, writeConfig } from './lib/util.mjs';
import { makeVoice } from './lib/voice.mjs';
import { buildTimeline } from './lib/timeline.mjs';
import { renderAudio, renderCarousel, renderStills, renderVideo } from './lib/render.mjs';
import { buildTracks, exportRecording, importFootage } from './lib/footage.mjs';
import { recordFragments } from './lib/record.mjs';
import { makeBackgrounds } from './lib/backgrounds.mjs';
import { check } from './lib/check.mjs';

const HELP = `reel-studio

  init <folder>                 new project from templates/project
  voice <project> [--force]     voice-over per scene (build/vo)
  timeline <project>            scene windows and word times from the voice (build/timeline.js)
  import <project>              recordings MP4 and IRL footage → frame sequences (build/rec)
  record <project> [ids]        record app walkthroughs from record.mjs (use a copy of the data)
  export-rec <project> <id>     live recording → assets/rec/<id>.mp4 + track, to share the project
  tracks <project>              collect recordings into build/tracks.js
  backgrounds <project> [names] background variants from project.json "backgrounds"
  stills <project> <t1,t2,...>  PNG frames at given seconds (build/stills)
  audio <project>               music + effects + voice, normalised (build/soundtrack.wav)
  preview <project>             540 px video with sound
  render <project>              final video with motion blur and sound
  carousel <project>            one PNG per scene (build/carousel)
  check <project>               loudness, duration, voice placement, phone-scale contact sheet
  build <project>               voice → timeline → import → tracks → audio (everything before rendering)
`;

const [cmd, dir, ...rest] = process.argv.slice(2);
if (!cmd || cmd === 'help' || cmd === '--help') { console.log(HELP); process.exit(0); }

if (cmd === 'init') {
  if (!dir) throw new Error('init needs a folder');
  await fs.cp(path.join(REPO, 'templates', 'project'), path.resolve(dir), { recursive: true, errorOnExist: true, force: false });
  console.log(`project created in ${dir}: edit brand.json, project.json, script.tsv and scenes.js`);
  process.exit(0);
}

if (!dir) { console.log(HELP); process.exit(1); }
const p = await loadProject(dir);
await loadEnv(p.root);
const list = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : null);

switch (cmd) {
  case 'voice': await makeVoice(p, { force: rest.includes('--force'), only: list(rest.find((x) => !x.startsWith('--'))) }); break;
  case 'timeline': await buildTimeline(p); await writeConfig(p); break;
  case 'import': await importFootage(p); await buildTracks(p); break;
  case 'record': await recordFragments(p, list(rest[0])); await buildTracks(p); break;
  case 'export-rec': await exportRecording(p, rest[0]); break;
  case 'tracks': await buildTracks(p); break;
  case 'backgrounds': await makeBackgrounds(p, list(rest[0])); break;
  case 'stills': await renderStills(p, list(rest[0]).map(Number)); break;
  case 'audio': await renderAudio(p); break;
  case 'preview': await renderVideo(p, { preview: true }); break;
  case 'render': await renderVideo(p); break;
  case 'carousel': await renderCarousel(p); break;
  case 'check': await check(p); break;
  case 'build':
    await makeVoice(p);
    await buildTimeline(p);
    await writeConfig(p);
    await importFootage(p);
    await buildTracks(p);
    await renderAudio(p);
    break;
  default: console.log(HELP); process.exit(1);
}
