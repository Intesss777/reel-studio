// Starter choreography: hook → point → CTA → logo. Uses the reel-studio kit (see skills/reel-studio/references/kit-api.md).
// Times come from the voice: W0(id) is the first spoken word of a scene, VW(id, 'word') any word.
// Replace the [placeholders] with real content; never fill them with invented UI or numbers.

const W0 = (id) => TL.words[id]?.[0]?.t ?? B(id) + 0.3;
const Wn = (id) => TL.words[id]?.at(-1)?.t ?? N(id) - 0.5;
const glow = (s, x, y) => el(s, 'div', 'bg', { background: `radial-gradient(1100px 1200px at ${x}% ${y}%, ${hexA(C.accent, 0.16)}, ${hexA(C.ink, 0)} 60%), ${C.ink}` });

// HOOK — a big two-line statement.
{
  const s = S.hook = scene('hook', null);
  glow(s, 72, 28);
  s._mark = mark(s, C.paper);
  s._head = text(s, 'Каждый день\nодна и та же\nрутина.', 66, 300, 128, 700, C.paper, { lh: 0.98, ls: -0.03 });
  s._sub = text(s, 'Пора это изменить.', 72, 800, 46, 600, C.accent, { lh: 1.1 });
}

// POINT — headline plus a marked placeholder for a real UI fragment.
{
  const s = S.point = scene('point', null);
  glow(s, 20, 70);
  s._mark = mark(s, C.paper);
  s._head = head(s, 'Как это работает\nна настоящем экране.', C.paper);
  s._slot = el(s, 'div', 'abs', { left: '72px', top: '520px', width: '936px', height: '620px', borderRadius: '28px', border: `2px dashed ${hexA(C.paper, 0.35)}` });
  s._slotText = text(s, '[UI: фрагмент интерфейса —\nдобавьте его в project.json "ui"\nи замените рамку на ui(...)]', 120, 740, 34, 500, C.muted, { lh: 1.3 });
  const g = svg(s);
  s._ring = ring(g, 72, 520, 936, 620, C.accent, 3);
}

// CTA — prompt, decoding keyword, brush underline, offer.
{
  const s = S.cta = scene('cta', null);
  glow(s, 80, 80);
  s._mark = mark(s, C.paper);
  s._prompt = text(s, 'Напишите мне слово', 72, 640, 40, 500, C.paper, { lh: 1.1, opacity: 0.9 });
  s._kw = text(s, `«${BRAND.cta?.keyword || 'ДЕМО'}»`, 56, 710, 172, 700, C.accent, { lh: 1.0, ls: -0.03 });
  s._under = brushStroke(s, 70, 935, 640, 17, C.accent);
  s._note = text(s, 'Покажу на вашем примере.', 72, 1000, 38, 500, C.paper, { lh: 1.25, opacity: 0.9 });
}

// OUTRO — optional logo image and the wordmark in the logo color.
{
  const s = S.outro = scene('outro', null);
  glow(s, 50, 44);
  if (BRAND.logo) s._logo = el(s, 'img', 'abs', { left: '405px', top: '675px', width: '270px', height: '270px', borderRadius: '62px', opacity: 0 });
  if (s._logo) s._logo.src = A + BRAND.logo;
  const word = s._word = el(s, 'div', 'txt', { left: 0, width: W + 'px', top: BRAND.logo ? '1000px' : '880px', textAlign: 'center', fontSize: '128px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.035em', color: C.mark });
  s._letters = [...BRAND.name].map((ch) => { const sp = el(word, 'span', '', { display: 'inline-block' }); sp.textContent = ch; return sp; });
}

// ---------- events ----------
const EV = {
  hook: [W0('hook') - 0.1, W0('hook') + 0.35, W0('hook') + 0.7],
  hookSub: Wn('hook') - 0.6,
  point: W0('point') - 0.1,
  slot: W0('point') + 0.6,
  cta: [W0('cta') - 0.1, VW('cta', 'ДЕМО') + 0.1],
  under: [VW('cta', 'ДЕМО') + 0.3, VW('cta', 'ДЕМО') + 0.8],
  note: Wn('cta') - 0.6,
  name: W0('outro') - 0.1,
};
const WINDOWS = {
  hook: [0, N('hook')],
  point: [B('point') - 0.02, N('point')],
  cta: [B('cta') - 0.02, N('cta') + 0.02],
  outro: [B('outro') - 0.02, END + 0.01],
};
const TRANSITIONS = { stairs: [B('point') - 0.43], flashes: [B('outro')], glitch: null };

function projectSeek(t, frame) {
  if (on('hook', t)) {
    const s = S.hook; cam(s, t, 0, N('hook'));
    fadeIn(t, s._mark, 0.2); linesAt(t, s._head, EV.hook, 0.6, 60); linesAt(t, s._sub, [EV.hookSub], 0.5, 24);
  }
  if (on('point', t)) {
    const s = S.point; cam(s, t, B('point'), N('point'));
    fadeIn(t, s._mark, B('point') + 0.2); linesAt(t, s._head, [EV.point, EV.point + 0.1]);
    draw(s._ring, k(t, EV.slot, EV.slot + 0.6, E.inOutCubic)); popIn(t, s._slot, EV.slot, 0.6, 40); linesAt(t, s._slotText, [EV.slot + 0.3], 0.5, 20);
  }
  if (on('cta', t)) {
    const s = S.cta; cam(s, t, B('cta'), N('cta'));
    fadeIn(t, s._mark, B('cta') + 0.15); linesAt(t, s._prompt, [EV.cta[0]], 0.5, 20);
    const kw = `«${BRAND.cta?.keyword || 'ДЕМО'}»`;
    s._kw._lines[0].textContent = scramble(kw, k(t, EV.cta[0] + 0.2, EV.cta[1], E.lin), 77, frame);
    s._kw.style.opacity = k(t, EV.cta[0] + 0.15, EV.cta[0] + 0.3, E.lin);
    brushReveal(s._under, k(t, EV.under[0], EV.under[1], E.inOutCubic));
    linesAt(t, s._note, [EV.note], 0.5, 20);
  }
  if (on('outro', t)) {
    const s = S.outro;
    if (s._logo) { const ic = k(t, B('outro') + 0.2, B('outro') + 0.8, E.outBack); s._logo.style.opacity = clamp((t - B('outro') - 0.15) / 0.12); s._logo.style.transform = `scale(${lerp(0.2, 1, ic)})`; }
    s._letters.forEach((sp, i) => { const q = k(t, EV.name + i * 0.045, EV.name + 0.5 + i * 0.045); sp.style.opacity = q; sp.style.transform = `translateX(${(1 - q) * 140}px)`; sp.style.filter = q < 1 ? `blur(${(1 - q) * 14}px)` : 'none'; });
    s.style.opacity = 1 - k(t, END - 0.9, END - 0.02, E.inOutCubic);
  }
}

function projectCues(add) {
  add(0, 'swell', { dur: 2 });
  EV.hook.forEach((t) => add(t, 'tick', { f: 1900 }));
  add(EV.slot, 'pop', { f: 620 });
  add(EV.cta[0] + 0.2, 'decode', { dur: EV.cta[1] - EV.cta[0] - 0.2 });
  add(EV.under[0], 'brush', { dur: EV.under[1] - EV.under[0] });
  add(B('outro') - 1, 'riser', { dur: 1 });
  add(B('outro'), 'impact', { size: 0.8 });
  add(B('outro') + 0.2, 'logo');
}
