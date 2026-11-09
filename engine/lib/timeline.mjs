// Builds build/timeline.js from the voice-over word timings.
// Every scene gets a window on the beat grid; voice sentences are placed with fixed pauses; word times become absolute.
import fs from 'node:fs/promises';
import path from 'node:path';

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Splits the TTS words into the sentences of the text by matching letters, so tokenizer differences do not matter.
function sentences(text, words) {
  const parts = text.split(/(?<=[.?!…])\s+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  let i = 0;
  for (const [k, part] of parts.entries()) {
    const target = norm(part);
    const group = [];
    let got = '';
    while (i < words.length && (got.length < target.length || k === parts.length - 1)) {
      group.push(words[i]); got += norm(words[i].w); i += 1;
      if (k < parts.length - 1 && got.length >= target.length) break;
    }
    if (group.length) out.push(group);
  }
  return out;
}

export async function buildTimeline(p) {
  const c = p.project.timeline || {};
  const order = c.order;
  if (!order?.length) throw new Error('project.json timeline.order is empty');
  const beat = c.beat ?? 60 / (p.project.music?.bpm ?? 120);
  const gap = c.gap ?? 0.38;
  const scenes = {}, segments = [], wordsAbs = {};
  let t = 0;
  for (const id of order) {
    const start = t;
    const fixed = c.fixed?.[id];
    let data = null;
    try { data = JSON.parse(await fs.readFile(path.join(p.build, 'vo', `${id}.json`), 'utf8')); } catch { /* scene without voice */ }
    const placed = [];
    let voiceEnd = start;
    if (data) {
      let cursor = start + (fixed?.voiceAt ?? c.lead?.[id] ?? c.defaultLead ?? 0.3);
      const sents = sentences(data.text, data.words);
      sents.forEach((sent, k) => {
        const speech0 = sent[0].t, speech1 = sent.at(-1).t + sent.at(-1).d;
        const src0 = Math.max(0, speech0 - 0.08);
        const next = sents[k + 1]?.[0]?.t;
        const src1 = next === undefined ? speech1 + 0.18 : Math.min(speech1 + 0.12, (speech1 + next) / 2);
        const dest = cursor - (speech0 - src0);
        segments.push({ key: id, src0: +src0.toFixed(3), src1: +src1.toFixed(3), at: +dest.toFixed(3) });
        for (const w of sent) placed.push({ w: w.w, t: +(dest + (w.t - src0)).toFixed(3) });
        cursor = dest + (speech1 - src0) + gap;
      });
      voiceEnd = cursor - gap;
    }
    let len;
    if (fixed?.len) len = fixed.len;
    else {
      const need = data ? voiceEnd - start + (c.post?.[id] ?? c.defaultPost ?? 0.8) : 0;
      len = Math.max(c.minLen?.[id] ?? c.defaultMinLen ?? 3, need);
    }
    len = Math.ceil(len / beat - 1e-6) * beat;
    scenes[id] = [+start.toFixed(3), +(start + len).toFixed(3)];
    wordsAbs[id] = placed;
    t = start + len;
  }
  const tl = { duration: +t.toFixed(3), beat, scenes, vo: segments, words: wordsAbs };
  await fs.mkdir(p.build, { recursive: true });
  await fs.writeFile(path.join(p.build, 'timeline.js'), `window.TL = ${JSON.stringify(tl, null, 1)};\n`);
  console.log(`timeline: ${tl.duration} s`);
  for (const id of order) {
    const [a, b] = scenes[id], w = wordsAbs[id];
    console.log(`  ${id.padEnd(8)} ${a.toFixed(2).padStart(7)} → ${b.toFixed(2).padStart(7)}  (${(b - a).toFixed(1)} s)${w.length ? `  voice ${w[0].t.toFixed(2)}–${w.at(-1).t.toFixed(2)}` : ''}`);
  }
  return tl;
}
