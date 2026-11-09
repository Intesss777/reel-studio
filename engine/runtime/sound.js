// reel-studio soundtrack: original music on the project's beat grid, effects on the shared event cues
// (window.cues) and the voice-over mix with ducking. Rendered offline, deterministic, no third-party samples.
// Music settings come from PROJECT.music: bpm, progression (MIDI chords), and the scenes where drums, hats and arpeggio play.
// window.renderAudio({ intro: <base64 mp3>, s1: ..., outro: ... }) -> { sampleRate, channels, chunks: [base64 int16 PCM] }
(() => {
  const SR = 48000;
  const MUSIC = PROJECT.music || {};
  const BEAT = 60 / (MUSIC.bpm || 120), BAR = BEAT * 4;
  const PROG = MUSIC.progression || [
    [38, 50, 57, 60, 64, 65], // Dm9
    [34, 46, 53, 57, 60, 62], // Bbmaj9
    [31, 43, 50, 53, 57, 58], // Gm9
    [33, 45, 52, 57, 62, 64], // Asus4
  ];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

  window.renderAudio = async function renderAudio(voB64, opts = {}) {
    const TLd = window.TL, END = TLd.duration, sc = TLd.scenes;
    const ids = Object.keys(sc), at = (id, edge = 0) => (sc[id] ? sc[id][edge] : null);
    const b1 = at(MUSIC.drop || ids[1]), b9 = at(MUSIC.outro || ids[ids.length - 1]) ?? END;
    const [hat0, hat1] = (MUSIC.hats || [ids[2], ids[ids.length - 2]]).map((id) => at(id));
    const [arp0, arp1] = (MUSIC.arp || [ids[3], ids[ids.length - 2]]).map((id) => at(id));
    const b2 = hat0, b8 = hat1, b3 = arp0, arpEnd = arp1 + 2;
    const ctx = new OfflineAudioContext(2, Math.ceil((END + 0.3) * SR), SR);
    const r = rng(2024);

    // ---- buses ----
    const master = ctx.createGain(); master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 6; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    const reverb = ctx.createConvolver();
    { const len = Math.floor(SR * 3.2), ir = ctx.createBuffer(2, len, SR); const rr = rng(9);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (rr() * 2 - 1) * Math.exp(-i / (SR * 0.85)); }
      reverb.buffer = ir; }
    const revOut = ctx.createGain(); revOut.gain.value = 0.55; reverb.connect(revOut); revOut.connect(master);
    const music = ctx.createGain(); music.gain.value = 1.1;
    const duck = ctx.createGain(); music.connect(duck); duck.connect(master);
    const sfx = ctx.createGain(); sfx.gain.value = 0.85; sfx.connect(master);
    const sfxRev = ctx.createGain(); sfxRev.gain.value = 0.25; sfx.connect(sfxRev); sfxRev.connect(reverb);

    const noiseBuf = ctx.createBuffer(1, SR * 2, SR);
    { const d = noiseBuf.getChannelData(0); const rn = rng(5); for (let i = 0; i < d.length; i++) d[i] = rn() * 2 - 1; }

    // ---- primitives ----
    function env(g, t, peak, a, d, hold = 0) {
      g.gain.setValueAtTime(0.0001, Math.max(0, t));
      g.gain.linearRampToValueAtTime(peak, t + a);
      if (hold) g.gain.setValueAtTime(peak, t + a + hold);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
    }
    function panNode(p, dest) { const n = ctx.createStereoPanner(); n.pan.value = p; n.connect(dest); return n; }
    function tone(t, type, f0, f1, dur, peak, a, d, dest = sfx, pan = 0, glide = dur) {
      if (t + a + d < 0) return;
      const o = ctx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, Math.max(0, t));
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, Math.max(0, t) + glide);
      const g = ctx.createGain(); env(g, t, peak, a, d);
      o.connect(g); g.connect(pan ? panNode(pan, dest) : dest);
      o.start(Math.max(0, t)); o.stop(t + a + d + 0.05);
    }
    function noise(t, dur, type, f0, f1, q, peak, a, dest = sfx, pan = 0, panTo = null) {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(f0, Math.max(0, t)); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain(); env(g, t, peak, a, Math.max(0.01, dur - a));
      const p = ctx.createStereoPanner(); p.pan.setValueAtTime(pan, Math.max(0, t)); if (panTo !== null) p.pan.linearRampToValueAtTime(panTo, t + dur);
      s.connect(f); f.connect(g); g.connect(p); p.connect(dest);
      s.start(Math.max(0, t), r() * 1.5); s.stop(t + dur + 0.05);
    }

    // ---- music ----
    const padFilter = ctx.createBiquadFilter(); padFilter.type = 'lowpass'; padFilter.Q.value = 0.6;
    padFilter.frequency.setValueAtTime(320, 0); padFilter.frequency.exponentialRampToValueAtTime(1700, b1 - 0.05);
    padFilter.frequency.setValueAtTime(1150, b1 + 0.05); padFilter.frequency.setValueAtTime(1150, b9); padFilter.frequency.exponentialRampToValueAtTime(800, END);
    const padBus = ctx.createGain(); padBus.gain.value = 1; padFilter.connect(padBus); padBus.connect(music);
    const padRev = ctx.createGain(); padRev.gain.value = 0.35; padBus.connect(padRev); padRev.connect(reverb);
    const bars = Math.ceil(END / BAR);
    let outroChord = false;
    for (let bar = 0; bar < bars; bar++) {
      const t0 = bar * BAR, last = t0 >= b9;
      if (last && outroChord) continue; // the closing chord rings once until the end
      if (last) outroChord = true;
      const chord = last ? PROG[0] : PROG[bar % 4];
      chord.slice(1).forEach((m, i) => {
        for (const det of [-7, 7]) {
          const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det;
          const g = ctx.createGain();
          const start = Math.max(0, t0 - 0.1), stop = last ? END : t0 + BAR + 1.0;
          g.gain.setValueAtTime(0.0001, start); g.gain.linearRampToValueAtTime(0.022, start + 0.7);
          g.gain.setValueAtTime(0.022, Math.min(stop - 0.05, t0 + BAR)); g.gain.exponentialRampToValueAtTime(0.0001, stop);
          o.connect(g); g.connect(panNode((i % 2 ? 0.3 : -0.3) * (det > 0 ? 1 : -1), padFilter));
          o.start(start); o.stop(stop + 0.05);
        }
      });
    }
    // Drums and bass between the first flash and the outro.
    for (let tb = b1; tb < b9 - 0.01; tb += BEAT) {
      const beatIdx = Math.round(tb / BEAT);
      const chord = PROG[Math.floor(tb / BAR) % 4];
      if (beatIdx % 2 === 0) {
        tone(tb, 'sine', 130, 45, 0.12, 0.55, 0.004, 0.42, music);
        noise(tb, 0.012, 'highpass', 2500, 2500, 0.7, 0.05, 0.001, music);
        tone(tb + 0.02, 'sine', hz(chord[0] + 12), hz(chord[0] + 12), 0.6, 0.16, 0.02, 0.55, music);
      }
      if (tb >= b2 && tb < b8) {
        const off = tb + 0.25;
        noise(off, 0.05, 'highpass', 8000, 8000, 0.8, 0.03 + 0.012 * r(), 0.002, music, 0.25);
      }
      if (tb >= b3 && tb < arpEnd) {
        for (const half of [0, 0.25]) {
          const n = chord[2 + ((beatIdx * 2 + (half ? 1 : 0)) % 4)] + 12;
          tone(tb + half, 'triangle', hz(n), hz(n), 0.25, 0.02, 0.005, 0.24, music, half ? 0.3 : -0.3);
        }
      }
    }
    // Duck the music under the voice.
    const vo = TLd.vo.map((s) => [s.at, s.at + (s.src1 - s.src0)]).sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const [a, b] of vo) { if (merged.length && a - merged[merged.length - 1][1] < 0.5) merged[merged.length - 1][1] = Math.max(b, merged[merged.length - 1][1]); else merged.push([a, b]); }
    duck.gain.setValueAtTime(1, 0);
    for (const [a, b] of merged) {
      duck.gain.setValueAtTime(1, Math.max(0, a - 0.15)); duck.gain.linearRampToValueAtTime(0.5, Math.max(0.01, a - 0.02));
      duck.gain.setValueAtTime(0.5, b); duck.gain.linearRampToValueAtTime(1, b + 0.3);
    }

    // ---- effects ----
    const FX = {
      decode: (c) => { const n = Math.floor(c.dur / 0.03); for (let j = 0; j < n; j++) tone(c.t + j * 0.03 + r() * 0.01, 'square', 600 + r() * 2600, 600 + r() * 2600, 0.02, 0.022, 0.002, 0.018, sfx, c.pan || 0); tone(c.t + c.dur, 'sine', 1800, 1800, 0.06, 0.05, 0.003, 0.08, sfx, c.pan || 0); },
      swell: (c) => noise(c.t, c.dur, 'lowpass', 200, 1400, 0.7, 0.05, c.dur * 0.6),
      sweep: (c) => { tone(c.t, 'sine', 520, 1100, c.dur, 0.025, c.dur * 0.3, c.dur * 0.7); noise(c.t, c.dur, 'bandpass', 900, 4200, 1.2, 0.03, c.dur * 0.4, sfx, -0.3, 0.3); },
      riser: (c) => { noise(c.t, c.dur, 'highpass', 300, 7500, 0.8, 0.2, c.dur * 0.95); tone(c.t, 'sine', 180, 820, c.dur, 0.035, c.dur * 0.95, 0.05); },
      impact: (c) => { const s = c.size; tone(c.t, 'sine', 78, 46, 0.3, 0.85 * s, 0.004, 1.4); noise(c.t, 0.4, 'lowpass', 2200, 300, 0.7, 0.45 * s, 0.003); const g = ctx.createGain(); g.gain.value = 0.6 * s; g.connect(reverb); noise(c.t, 0.3, 'bandpass', 1200, 400, 0.8, 0.3 * s, 0.003, g); },
      tick: (c) => { const g = c.g ?? 1; tone(c.t, 'sine', c.f, c.f, 0.03, 0.045 * g, 0.002, 0.04); noise(c.t, 0.006, 'highpass', 3200, 3200, 0.7, 0.035 * g, 0.001); },
      pop: (c) => { tone(c.t, 'sine', c.f, c.f * 1.35, 0.16, 0.08, 0.004, 0.16, sfx, 0, 0.04); tone(c.t, 'triangle', c.f * 2, c.f * 2.7, 0.1, 0.018, 0.004, 0.1, sfx, 0, 0.04); },
      whoosh: (c) => { const lo = c.low ? 150 : 400, hi = c.low ? 800 : 2600; noise(c.t, c.dur, 'bandpass', lo, hi, 0.9, c.soft ? 0.12 : 0.26, c.dur * 0.55, sfx, -0.6, 0.6); },
      air: (c) => noise(c.t, c.dur, 'highpass', 2000, 3500, 0.7, 0.018, c.dur * 0.5),
      brush: (c) => { noise(c.t, c.dur, 'bandpass', 2600, 1100, 0.9, 0.16, 0.03, sfx, -0.4, 0.4); noise(c.t, c.dur * 0.8, 'highpass', 5200, 3800, 0.7, 0.05, 0.02, sfx, -0.4, 0.4); },
      click: (c) => { noise(c.t, 0.008, 'bandpass', 3000, 3000, 2, 0.32, 0.001); noise(c.t + 0.075, 0.007, 'bandpass', 3600, 3600, 2, 0.2, 0.001); tone(c.t, 'sine', 2400, 2400, 0.01, 0.04, 0.001, 0.015); },
      chime: (c) => { const g = ctx.createGain(); g.gain.value = 1; g.connect(sfx); const send = ctx.createGain(); send.gain.value = 0.5; g.connect(send); send.connect(reverb);
        tone(c.t, 'triangle', 880, 880, 0.9, 0.08, 0.004, 0.9, g); tone(c.t + 0.09, 'triangle', 1318.5, 1318.5, 1.1, 0.075, 0.004, 1.1, g); tone(c.t + 0.09, 'sine', 2637, 2637, 0.6, 0.018, 0.004, 0.6, g); },
      key: (c) => { noise(c.t, 0.014, 'bandpass', 1800 + r() * 1500, 1800, 1.5, 0.11, 0.001, sfx, (r() - 0.5) * 0.4); tone(c.t, 'sine', 180, 140, 0.02, 0.03, 0.001, 0.03); },
      glitch: (c) => { let tt = c.t; while (tt < c.t + c.dur) { const d = 0.02 + r() * 0.03; tone(tt, 'square', 100 + r() * 1900, 100 + r() * 1900, d, 0.045, 0.001, d); if (r() < 0.5) noise(tt, d, 'bandpass', 500 + r() * 4000, 500 + r() * 4000, 2, 0.08, 0.001, sfx, (r() - 0.5)); tt += d + r() * 0.015; } tone(c.t, 'sine', 1200, 80, c.dur, 0.05, 0.005, c.dur); },
      thump: (c) => { tone(c.t, 'sine', 70, 40, 0.4, 0.55, 0.004, 0.5); noise(c.t, 0.2, 'lowpass', 500, 200, 0.7, 0.18, 0.003); },
      shimmer: (c) => { for (let j = 0; j < 46; j++) { const u = Math.sqrt(r()); tone(c.t + u * c.dur, 'sine', 2000 + r() * 4200, 2000 + r() * 4200, 0.25, 0.022, 0.003, 0.25, sfx, (r() - 0.5) * 1.2); } },
      logo: (c) => { FX.impact({ t: c.t, size: 0.45 }); const g = ctx.createGain(); g.gain.value = 1; g.connect(sfx); const send = ctx.createGain(); send.gain.value = 0.6; g.connect(send); send.connect(reverb);
        [74, 77, 81, 84, 88].forEach((m, i) => tone(c.t + i * 0.035, 'triangle', hz(m), hz(m), 2.6, 0.028, 0.02, 2.6, g, (i - 2) * 0.2)); tone(c.t, 'sine', 73.4, 73.4, 1.6, 0.3, 0.01, 1.6); },
    };
    for (const c of window.cues()) { const fn = FX[c.type]; if (!fn) throw new Error('unknown cue ' + c.type); fn(c); }

    // ---- voice ----
    const voIn = ctx.createGain();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 85;
    const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 3200; pres.Q.value = 1; pres.gain.value = 2.5;
    const warm = ctx.createBiquadFilter(); warm.type = 'lowshelf'; warm.frequency.value = 220; warm.gain.value = 1.5;
    const vComp = ctx.createDynamicsCompressor(); vComp.threshold.value = -24; vComp.ratio.value = 3; vComp.attack.value = 0.005; vComp.release.value = 0.15; vComp.knee.value = 6;
    const voOut = ctx.createGain(); voOut.gain.value = 1.9;
    voIn.connect(hp); hp.connect(warm); warm.connect(pres); pres.connect(vComp); vComp.connect(voOut); voOut.connect(master);
    const voRev = ctx.createGain(); voRev.gain.value = 0.05; voOut.connect(voRev); voRev.connect(reverb);
    const buffers = {};
    for (const [key, b64] of Object.entries(voB64)) {
      const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      buffers[key] = await ctx.decodeAudioData(u8.buffer);
    }
    for (const s of TLd.vo) {
      const src = ctx.createBufferSource(); src.buffer = buffers[s.key];
      const g = ctx.createGain(); const len = s.src1 - s.src0;
      g.gain.setValueAtTime(0, s.at); g.gain.linearRampToValueAtTime(1, s.at + 0.015); g.gain.setValueAtTime(1, s.at + len - 0.04); g.gain.linearRampToValueAtTime(0, s.at + len);
      src.connect(g); g.connect(voIn); src.start(s.at, s.src0, len);
    }

    if (opts.solo) { if (opts.solo !== 'music') { music.gain.value = 0; padRev.gain.value = 0; } if (opts.solo !== 'sfx') { sfx.gain.value = 0; } if (opts.solo !== 'voice') { voOut.gain.value = 0; } }
    // Final fade with the picture.
    master.gain.setValueAtTime(0.55, END - 1.6); master.gain.linearRampToValueAtTime(0.0001, END);

    const out = await ctx.startRendering();
    const L = out.getChannelData(0), R = out.getChannelData(1);
    const pcm = new Int16Array(L.length * 2);
    let peak = 0;
    for (let i = 0; i < L.length; i++) {
      const a = Math.max(-1, Math.min(1, L[i])), b = Math.max(-1, Math.min(1, R[i]));
      peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
      pcm[i * 2] = a * 32767; pcm[i * 2 + 1] = b * 32767;
    }
    const u8 = new Uint8Array(pcm.buffer), chunks = [], step = 3 * 262144;
    for (let i = 0; i < u8.length; i += step) { let s = ''; const part = u8.subarray(i, i + step); for (let j = 0; j < part.length; j += 8192) s += String.fromCharCode.apply(null, part.subarray(j, j + 8192)); chunks.push(btoa(s)); }
    return { sampleRate: SR, channels: 2, frames: L.length, peak, chunks };
  };
})();
