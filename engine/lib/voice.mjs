// Voice-over per scene with word timings. Providers: edge (free, unofficial), elevenlabs (your cloned voice), manual.
// Output: build/vo/<scene>.mp3 and build/vo/<scene>.json { text, sig, words: [{ w, t, d }] }.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ENGINE, readScript, run } from './util.mjs';

export async function makeVoice(p, { force = false, only = null } = {}) {
  const cfg = p.project.voice || { provider: 'edge', voice: 'ru-RU-DmitryNeural' };
  const dir = path.join(p.build, 'vo');
  await fs.mkdir(dir, { recursive: true });
  const lines = await readScript(p.root);
  const sig = JSON.stringify({ provider: cfg.provider, voice: cfg.voice || cfg.voiceId, rate: cfg.rate, pitch: cfg.pitch, model: cfg.model, settings: cfg.settings });
  for (const [id, text] of lines) {
    if (only && !only.includes(id)) continue;
    const jf = path.join(dir, `${id}.json`), af = path.join(dir, `${id}.mp3`);
    try {
      const old = JSON.parse(await fs.readFile(jf, 'utf8'));
      if (!force && old.text === text && old.sig === sig) { console.log(`voice ${id}: up to date`); continue; }
    } catch { /* not generated yet */ }
    if (cfg.provider === 'manual') throw new Error(`voice ${id}: provider "manual" expects build/vo/${id}.mp3 and ${id}.json with word timings`);
    const res = cfg.provider === 'elevenlabs' ? await elevenlabs(text, cfg) : await edge(text, cfg);
    await fs.writeFile(af, res.audio);
    await fs.writeFile(jf, JSON.stringify({ text, sig, words: res.words }, null, 1));
    console.log(`voice ${id}: ${res.words.length} words, ${(res.words.at(-1).t + res.words.at(-1).d).toFixed(2)} s`);
  }
}

async function edge(text, cfg) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'reel-voice-'));
  const audio = path.join(tmp, 'a.mp3'), words = path.join(tmp, 'w.json');
  const env = process.env.EDGE_TTS_PYTHONPATH ? { PYTHONPATH: process.env.EDGE_TTS_PYTHONPATH } : {};
  Object.assign(process.env, env);
  await run(process.env.PYTHON || 'python3', [path.join(ENGINE, 'lib', 'edge_tts_words.py'), `--voice=${cfg.voice || 'ru-RU-DmitryNeural'}`, `--rate=${cfg.rate || '+0%'}`, `--pitch=${cfg.pitch || '+0Hz'}`, `--audio=${audio}`, `--words=${words}`], { input: text });
  const out = { audio: await fs.readFile(audio), words: JSON.parse(await fs.readFile(words, 'utf8')) };
  await fs.rm(tmp, { recursive: true, force: true });
  return out;
}

// ElevenLabs text-to-speech with character timestamps, grouped into words.
async function elevenlabs(text, cfg) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set. Put it in the project .env (never commit it).');
  if (!cfg.voiceId) throw new Error('project.json voice.voiceId is required for ElevenLabs');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: cfg.model || 'eleven_multilingual_v2', ...(cfg.settings ? { voice_settings: cfg.settings } : {}) }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const a = json.alignment;
  const words = [];
  let cur = null;
  const isWordChar = (ch) => /[\p{L}\p{N}-]/u.test(ch);
  a.characters.forEach((ch, i) => {
    if (isWordChar(ch)) {
      if (!cur) cur = { w: '', t: a.character_start_times_seconds[i], end: 0 };
      cur.w += ch; cur.end = a.character_end_times_seconds[i];
    } else if (cur) { words.push({ w: cur.w, t: cur.t, d: cur.end - cur.t }); cur = null; }
  });
  if (cur) words.push({ w: cur.w, t: cur.t, d: cur.end - cur.t });
  return { audio: Buffer.from(json.audio_base64, 'base64'), words };
}
