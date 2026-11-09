// KitchenFlow reel — scene choreography. Uses the reel-studio kit (engine/runtime/kit.js).
// Every event time comes from the voice-over words (VW) or scene boundaries (B, N), so picture, voice and sound stay in sync.

// INTRO: kitchen routine as scattered, scrambling words with real demo values, pulled into one point.
{
  const s = S.intro = scene('intro', 'bg/plate.jpg');
  el(s, 'div', 'bg', { background: 'radial-gradient(1200px 1300px at 62% 46%, rgba(255,82,28,0.14), rgba(16,16,15,0) 60%), rgba(16,16,15,0.5)' });
  const g = s._geo = svg(s);
  s._circle = path(g, 'M 1600 760 A 620 620 0 1 0 1599.9 760', 'rgba(244,238,225,0.22)', 1.5);
  s._hline = path(g, 'M -20 1180 H 1100', 'rgba(244,238,225,0.18)', 1.5);
  s._vline = path(g, 'M 300 -20 V 1940', 'rgba(244,238,225,0.18)', 1.5);
  s._arc = path(g, 'M 980 140 A 620 620 0 0 1 1540 520', C.accent, 4);
  s._words = [
    { t: -0.2, w: 'накладные', x: 84, y: 470, size: 96, n: '8 055 ₽ · METRO', ny: 584 },
    { t: 0.50, w: 'остатки', x: 470, y: 770, size: 74, n: 'масло 1,8 кг · мин. 2,5', ny: 862 },
    { t: 1.00, w: 'закупка', x: 104, y: 1010, size: 112, n: '8 позиций', ny: 1140 },
    { t: 1.50, w: 'смены', x: 610, y: 1272, size: 64, n: '30 закрыто', ny: 1348 },
    { t: 1.75, w: 'поставщики', x: 84, y: 1430, size: 78, n: 'долг поставщику', ny: 1522 },
    { t: 2.00, w: 'чаты', x: 640, y: 330, size: 86, n: 'WhatsApp', ny: 430 },
  ].map((d, i) => {
    const grp = el(s, 'div', 'abs', { left: 0, top: 0, width: W + 'px', height: H + 'px', transformOrigin: '540px 960px' });
    const word = text(grp, d.w, d.x, d.y, d.size, 700, C.paper, { lh: 1.0, ls: -0.03 });
    const num = text(grp, d.n, d.x + 6, d.ny, 28, 500, C.accent, { lh: 1.0 });
    return { ...d, i, grp, word, num };
  });
  const links = svg(s);
  const P = s._words.map((d) => [d.x + d.size * 2.2, d.y + d.size * 0.55]);
  const order = [0, 5, 1, 2, 3, 4, 0];
  s._links = order.slice(1).map((b, j) => { const a = order[j]; const [x1, y1] = P[a], [x2, y2] = P[b]; return path(links, `M${x1} ${y1} C${x1 + 260} ${y1 + 40} ${x2 - 260} ${y2 - 40} ${x2} ${y2}`, 'rgba(244,238,225,0.35)', 1.5); });
  s._links.svg = links;
  s._core = el(s, 'div', 'abs', { left: '540px', top: '960px', width: '0px', height: '0px', borderRadius: '50%', background: C.accent, boxShadow: `0 0 40px ${C.accent}` });
  s._name = el(s, 'div', 'txt', { left: 0, width: W + 'px', top: '1010px', textAlign: 'center', fontSize: '46px', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.01em', color: C.paper, opacity: 0 });
  s._nameLetters = [...'KitchenFlow'].map((ch) => { const sp = el(s._name, 'span', '', { display: 'inline-block' }); sp.textContent = ch; return sp; });
}

// 01 — hook.
{
  const s = S.s1 = scene('s1', 'bg/bg-01.jpg');
  s._mark = mark(s, C.paper);
  s._head = text(s, 'Кухня\nработает.\nА учёт?', 66, 236, 140, 700, C.paper, { lh: 0.96, ls: -0.03 });
  s._pains = ['Накладные — в папке.', 'Остатки — в голове.', 'Закупка — в чатах.'].map((p, i) => text(s, p, 72, 700 + i * 70, 46, 600, C.paper, { lh: 1.1 }));
  s._promise = text(s, 'Покажу, как собрать это\nв один процесс.', 72, 990, 46, 700, C.paper, { lh: 1.1 });
}

// 02 — invoice photo, ends with a dive into the real «Фото накладной» button.
{
  const s = S.s2 = scene('s2', 'bg/bg-02.jpg');
  s._mark = mark(s, C.paper);
  s._head = head(s, 'Начните с фото\nтоварной накладной.', C.paper);
  const sc = 1000 / 952;
  s._card = ui(s, 'capture', 40, 700, sc, 25);
  s._callout = ui(s, 'capture', 520, 960, 3, 48, { x: 776, y: 49, w: 156, h: 46 });
  s._caption = text(s, 'Снимок вместо\nперепечатки.', 72, 970, 44, 600, C.paper, { lh: 1.1 });
  s._note = text(s, 'Распознавание работает в демо-режиме.\nПроверку делает человек.', 72, 1250, 34, 500, C.paper, { lh: 1.25, opacity: 0.82 });
  const g = svg(s);
  s._ring = ring(g, 40 + 780 * sc - 10, 700 + 53 * sc - 10, 148 * sc + 20, 38 * sc + 20);
  const cx = 40 + 854 * sc;
  s._lead = path(g, `M${cx} ${700 + 91 * sc + 10} C${cx} 900 754 890 754 957`, C.accent, 3);
  s._pulse = el(s, 'div', 'abs', { left: '520px', top: '960px', width: '468px', height: '138px', borderRadius: '69px', border: `3px solid ${C.accent}`, opacity: 0, boxSizing: 'border-box' });
  s._cursor = el(s, 'div', 'abs', { left: 0, top: 0, width: '54px', height: '68px', opacity: 0 });
  s._cursor.innerHTML = '<svg width="54" height="68" viewBox="0 0 27 34"><path d="M2 2 L2 27 L8.5 21 L13 31 L17.5 29 L13 19.5 L22 19.5 Z" fill="#F4EEE1" stroke="#10100F" stroke-width="2" stroke-linejoin="round"/></svg>';
}

// 03 — the invoice broken into steps: three real line totals flow into 8 055 ₽, then «Проведена».
{
  const s = S.s3 = scene('s3', 'bg/bg-03.jpg');
  s._mark = mark(s, C.paper);
  s._head = head(s, 'Проверьте.\nЗатем подтвердите.', C.paper);
  s._caption = text(s, 'После подтверждения товар — на склад,\nсумма — в долг перед поставщиком.', 84, 446, 34, 500, C.paper, { lh: 1.25, opacity: 0.86 });
  s._card = ui(s, 'confirmed', 84, 600, 1.5, 36, null, 'dark');
  const g = svg(s);
  const rows = [1081, 1205, 1329];
  s._amountRings = rows.map((cy) => ring(g, 852, cy - 21, 94, 42));
  s._branches = rows.map((cy) => path(g, `M948 ${cy} H1010 Q1036 ${cy} 1036 ${cy - 26} V771 Q1036 745 1010 745 H350`, C.accent, 3));
  s._dots = rows.map(() => circle(g, 7, C.accent));
  s._totalRing = ring(g, 221, 723, 125, 44);
  s._glow = el(s, 'div', 'abs', { left: '216px', top: '718px', width: '135px', height: '54px', borderRadius: '27px', boxShadow: `0 0 36px 10px ${C.accent}`, opacity: 0 });
  s._lead = path(g, 'M273 540 V626.5', C.accent, 3);
  s._leadDot = circle(g, 5, C.accent); s._leadDot.setAttribute('cx', 273); s._leadDot.setAttribute('cy', 631.5);
}

// 04 — stock: shortages ringed, linked to the purchase-side list.
{
  const s = S.s4 = scene('s4', 'bg/bg-04.jpg');
  s._mark = mark(s, C.paper);
  s._head = head(s, 'Что заканчивается —\nвидно сразу.', C.paper);
  s._table = ui(s, 'invRows', 20, 480, 1.12, 20);
  s._list = ui(s, 'shortage', 24, 990, 1.95, 39);
  const g = svg(s);
  const bx = 20 + 705 * 1.12 - 9, bw = 58 * 1.12 + 18, bh = 20 * 1.12 + 18;
  s._r1 = ring(g, bx, 480 + 258 * 1.12 - 9, bw, bh);
  s._r2 = ring(g, bx, 480 + 340 * 1.12 - 9, bw, bh);
  const lx = bx + bw / 2;
  s._l1 = path(g, `M${lx} ${480 + 278 * 1.12 + 12} V${480 + 340 * 1.12 - 12}`, C.accent, 3);
  s._l2 = path(g, `M${lx} ${480 + 360 * 1.12 + 12} C${lx} 950 609 950 609 987`, C.accent, 3);
  s._dot = circle(g, 7, C.accent);
  s._b1 = ring(g, 298, 1219, 116, 56);
  s._b2 = ring(g, 275, 1364, 116, 56);
}

// 05 — purchase: list, then the real message for the buyer appears line by line.
{
  const s = S.s5 = scene('s5', 'bg/bg-05.jpg');
  s._mark = mark(s, C.paper);
  s._head = head(s, 'Из дефицита —\nв готовую закупку.', C.paper);
  s._list = ui(s, 'listTop', 40, 450, 1.3, 26);
  s._dialog = ui(s, 'msgDialog', 230, 770, 1.85, 44);
  const sc = 1.85;
  s._cover = el(s._dialog, 'div', 'abs', { left: 28 * sc + 'px', width: (408 - 28) * sc + 'px', top: 116 * sc + 'px', height: (330 - 116) * sc + 'px', background: 'rgb(33,33,33)' });
  s._lineTops = [116, 158, 178, 198, 218, 238, 258, 278, 298, 330];
  s._caret = el(s._dialog, 'div', 'abs', { width: '4px', height: 16 * sc + 'px', background: C.paper, left: 36 * sc + 'px', top: 120 * sc + 'px', opacity: 0 });
}

// 06 — owner overview: key metrics, the chart drawn left to right, demo label ringed.
{
  const s = S.s6 = scene('s6', 'bg/bg-06.jpg');
  s._mark = mark(s, C.paper);
  s._head = head(s, 'Владелец видит\nкартину целиком.', C.paper);
  s._metrics = uiRow(s, 46, 480, 2.1, [{ key: 'cardRevenue', r: 20 }, { key: 'cardMargin', r: 20 }], 22);
  s._metricCards = [...s._metrics.children];
  const sc = 1.08;
  s._chart = ui(s, 'chart', 26, 770, sc, 26);
  s._cover = el(s._chart, 'div', 'abs', { left: 88 * sc + 'px', top: 108 * sc + 'px', width: (934 - 88) * sc + 'px', height: (360 - 108) * sc + 'px', background: 'rgb(23,23,23)', transformOrigin: '100% 50%' });
  s._caption = text(s, 'Цифры на экране — демо-данные.', 72, 700, 32, 500, C.paper, { lh: 1.1, opacity: 0.86 });
  const g = svg(s);
  const fx = 26 + 96 * sc - 10;
  s._ring = ring(g, fx, 770 + 26 * sc - 10, 94 * sc + 20, 18 * sc + 20);
  s._lead = path(g, `M${fx + 50} 744 V${770 + 26 * sc - 13}`, C.accent, 3);
}

// 07 — one chain: the line draws through document, stock and purchase.
{
  const s = S.s7 = scene('s7', 'bg/bg-07.jpg');
  s._mark = mark(s, C.paper);
  s._head = head(s, 'Меньше ручных\nпереносов.', C.paper);
  const g = svg(s);
  s._flow = path(g, 'M300 566 V1026', C.accent, 4);
  s._steps = [
    { y: 540, label: 'Документ', key: 'confirmedStatus', s: 1.25, r: 24 },
    { y: 790, label: 'Склад', key: 'invFilter', s: 2.0, r: 40 },
    { y: 1000, label: 'Закупка', key: 'msgText', s: 1.55, r: 20 },
  ].map((st) => ({
    ...st,
    node: (() => { const c = circle(g, 11, C.accent); c.setAttribute('cx', 300); c.setAttribute('cy', st.y + 26); return c; })(),
    lab: text(s, st.label, 340, st.y, 48, 700, C.paper, { lh: 1.1, ls: -0.01 }),
    frag: st.key === 'invFilter'
      ? uiRow(s, 340, st.y + 68, 2.0, [{ key: 'pillAll', r: 'pill' }, { key: 'pillLow', r: 'pill' }, { key: 'pillOk', r: 'pill' }], 16)
      : ui(s, st.key, 340, st.y + 68, st.s, st.r, null, 'dark'),
  }));
  s._dot = circle(g, 8, C.accent);
  s._caption = text(s, 'Важные решения\nподтверждает человек.', 340, 1450, 34, 500, C.paper, { lh: 1.2 });
}

// 08 — CTA.
{
  const s = S.s8 = scene('s8', 'bg/bg-08.jpg');
  s._mark = mark(s, C.paper);
  s._head = head(s, 'Покажу, как это\nбудет работать\nв вашем ресторане.', C.paper, 84);
  s._prompt = text(s, 'Напишите мне слово', 72, 740, 40, 500, C.paper, { lh: 1.1, opacity: 0.9 });
  s._kw = text(s, '«КУХНЯ»', 52, 818, 172, 700, C.accent, { lh: 1.0, ls: -0.03 });
  const g = svg(s);
  s._under = brushStroke(s, 70, 1040, 700, 17, C.accent);
  s._note = text(s, 'Покажу демо и разберём\nваш процесс приёмки и закупок.', 72, 1090, 38, 500, C.paper, { lh: 1.25, opacity: 0.9 });
}

// OUTRO: particles gather into the real app icon, then the wordmark.
{
  const s = S.outro = scene('outro', 'bg/plate.jpg');
  el(s, 'div', 'bg', { background: 'radial-gradient(900px 900px at 50% 44%, rgba(201,100,66,0.24), rgba(16,16,15,0) 62%), rgba(16,16,15,0.62)' });
  const r = rng(7);
  s._parts = Array.from({ length: 140 }, () => {
    const a = r() * Math.PI * 2, d = 520 + r() * 1100, size = 6 + r() * 14;
    const hot = r() < 0.82;
    const n = el(s, 'div', 'abs', { width: size + 'px', height: size + 'px', borderRadius: '50%', background: hot ? C.accent : C.paper, left: 0, top: 0, boxShadow: hot ? `0 0 ${size * 1.6}px ${C.accent}` : 'none' });
    return { n, x0: 540 + Math.cos(a) * d, y0: 810 + Math.sin(a) * d, delay: r() * 0.8, size };
  });
  const icon = s._icon = el(s, 'div', 'abs', { left: '405px', top: '675px', width: '270px', height: '270px', borderRadius: '62px', overflow: 'hidden', opacity: 0, boxShadow: '0 30px 90px rgba(0,0,0,0.5)' });
  icon.innerHTML = `<svg width="270" height="270" viewBox="0 0 512 512"><rect width="512" height="512" fill="#c96442"/><g fill="none" stroke="#fffdfb" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" transform="translate(116 116) scale(11.6667)">
    <path pathLength="1" d="M11.9831 14.0001V3.00006M11.9831 14.0001C10.3247 14.0001 8.98038 15.4355 8.98038 16.6251C8.98038 18.3751 10.3247 21.0001 11.9831 21.0001C13.6414 21.0001 14.9857 18.3751 14.9857 16.6251C14.9857 15.4355 13.6414 14.0001 11.9831 14.0001Z"/>
    <path pathLength="1" d="M4.97841 10.0283V21M3.68615 3.12945L2.90347 3.20753C2.33225 3.26452 1.92596 3.78885 2.01382 4.35564L2.6828 8.67118C2.79612 9.40225 3.426 10.0106 4.16644 10.0106H5.7904C6.53083 10.0106 7.16071 9.40225 7.27404 8.67118L7.94301 4.35564C8.03087 3.78885 7.62458 3.26452 7.05336 3.20753L6.27337 3.12962C5.41311 3.04368 4.54642 3.04363 3.68615 3.12945Z"/>
    <path pathLength="1" d="M17.996 13.8182V3.02594C19.1545 3.34592 21.0815 4.55268 21.4006 7.52842L21.9737 12.0424C22.0743 12.8351 21.8727 13.6261 21.0846 13.7616C20.4244 13.8751 19.4229 13.9122 17.996 13.8182ZM17.996 13.8182V21.0001"/></g></svg>`;
  s._glyphs = [...icon.querySelectorAll('path')];
  s._glyphs.forEach((p) => { p.style.strokeDasharray = '1 1'; p.style.strokeDashoffset = 1; });
  const word = s._word = el(s, 'div', 'txt', { left: 0, width: W + 'px', top: '1000px', textAlign: 'center', fontSize: '128px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.035em', color: C.mark });
  s._letters = [...'KitchenFlow'].map((ch) => { const sp = el(word, 'span', '', { display: 'inline-block' }); sp.textContent = ch; return sp; });
}


// ---------- events ----------
const b1 = B('s1'), b2 = B('s2'), b3 = B('s3'), b4 = B('s4'), b5 = B('s5'), b6 = B('s6'), b7 = B('s7'), b8 = B('s8'), b9 = B('outro');

// Every event time lives here, so the picture and the sound use the same moments.
const EV = (() => {
  const e = {};
  // On-screen order of the words: накладные, остатки, закупка, смены, поставщики, чаты.
  e.introWords = ['Накладные', 'остатки', 'закупка', 'смены', 'поставщики', 'чаты'].map((w) => VW('intro', w) - 0.08);
  e.introLinks = VW('intro', 'всё') - 0.15;
  e.pull = [VW('intro', 'одном') - 0.05, VW('intro', 'Китчен') - 0.02];
  e.introName = VW('intro', 'Китчен') - 0.05;
  e.core = [b1 - 0.38, b1 - 0.04];
  e.s1Head = [VW('s1', 'Кухня') - 0.12, VW('s1', 'работает') - 0.12, VW('s1', 'А') - 0.1];
  e.s1Pains = [0, 1, 2].map((i) => VW('s1', 'учёт') + 0.45 + i * 0.22);
  e.s1Promise = [VW('s1', 'Покажу') - 0.1, VW('s1', 'один') - 0.1];
  e.s2Card = b2 + 0.35; e.s2Head = VW('s2', 'Начинаем') - 0.15;
  e.s2Ring = VW('s2', 'фото') - 0.05; e.s2Lead = VW('s2', 'накладной'); e.s2Callout = e.s2Lead + 0.25; e.s2Caption = e.s2Lead + 0.45;
  e.s2Note = [VW('s2', 'Распознавание') - 0.1, VW('s2', 'проверку') - 0.1];
  e.s2Cursor = [b3 - 1.85, b3 - 1.05]; e.s2Press = b3 - 0.97; e.s2Dive = [b3 - 0.85, b3 - 0.05];
  e.s3Head = b3 + 0.1; e.s3Card = b3 + 0.3;
  const p1 = VW('s3', 'позиции'), p3 = VW('s3', 'цены');
  e.s3Rings = [p1 - 0.05, (p1 + p3) / 2 - 0.05, p3 - 0.05];
  e.s3Branch = VW('s3', 'Подтверждаем'); e.s3Total = e.s3Branch + 0.75;
  e.s3Lead = VW('s3', 'товар') - 0.1; e.s3Caption = [VW('s3', 'товар') + 0.05, VW('s3', 'сумма') + 0.05];
  e.s4Head = b4 + 0.1; e.s4Table = [b4 + 0.35, b4 + 1.1];
  const z = VW('s4', 'заканчивается');
  e.s4Rings = [z - 0.1, z + 0.25]; e.s4Links = [z + 0.3, z + 0.5]; e.s4List = z + 0.85; e.s4Badges = [z + 1.75, z + 2.1];
  e.s5Circle = [b5 - 0.4, b5 - 0.02]; e.s5Head = b5 - 0.05; e.s5List = b5 + 0.35; e.s5Dialog = VW('s5', 'Сообщение') - 0.2;
  e.s5Type = VW('s5', 'закупщику'); e.s5Step = 0.16;
  e.glitch = [b6 - 0.25, b6 + 0.18];
  e.s6Head = b6 + 0.1; e.s6Metrics = VW('s6', 'выручку') - 0.25; e.s6Chart = VW('s6', 'маржу') - 0.2;
  e.s6Draw = [VW('s6', 'одном'), VW('s6', 'одном') + 1.3]; e.s6Ring = VW('s6', 'Данные') - 0.05; e.s6Caption = VW('s6', 'демонстрационные') - 0.3;
  e.s7Head = b7 + 0.1; e.s7Nodes = [VW('s7', 'Документ') - 0.05, VW('s7', 'склад') - 0.05, VW('s7', 'закупка') - 0.05];
  e.s7Caption = [VW('s7', 'важные') - 0.1, VW('s7', 'остаются') - 0.1];
  e.iris = [b8 - 0.4, b8 - 0.01];
  e.s8Head = b8 + 0.05; e.s8Prompt = VW('s8', 'Напишите') - 0.1; e.s8Decode = [VW('s8', 'слово') - 0.05, VW('s8', 'Кухня') + 0.15];
  e.s8Under = [VW('s8', 'Кухня') + 0.3, VW('s8', 'Кухня') + 0.8]; e.s8Note = VW('s8', 'покажу') - 0.1; e.s8Zoom = [b9 - 0.45, b9];
  e.outParts = b9 + 0.1; e.outIcon = b9 + 1.45; e.outGlyph = b9 + 1.7; e.outLetters = VW('outro', 'Китчен') - 0.1; e.outFade = [END - 0.95, END - 0.02];
  return e;
})();
S.intro._words.forEach((d, i) => { d.t = EV.introWords[i]; });

const WINDOWS = { intro: [0, b1], s1: [b1 - 0.05, N('s1') + 0.35], s2: [b2 - 0.02, b3 + 0.02], s3: [b3 - 0.02, N('s3') + 0.35], s4: [b4 - 0.02, N('s4') + 0.35], s5: [b5 - 0.4, N('s5') + 0.35], s6: [b6 - 0.02, N('s6') + 0.35], s7: [b7 - 0.02, b8], s8: [b8 - 0.03, b9 + 0.02], outro: [b9 - 0.02, END + 0.01] };

// Global transitions run by the kit: stairs wipe into s2, s4, s7; flashes on b1, b3, b9; glitch into s6.
const TRANSITIONS = { stairs: [b2 - 0.43, b4 - 0.43, b7 - 0.43], flashes: [b1, b3, b9], glitch: EV.glitch };

function projectSeek(t, frame) {

  // INTRO
  if (on('intro', t)) {
    const s = S.intro;
    draw(s._circle, k(t, 0.0, 1.8, E.outCubic)); draw(s._hline, k(t, 0.3, 1.3, E.outCubic)); draw(s._vline, k(t, 0.5, 1.5, E.outCubic)); draw(s._arc, k(t, 1.0, 2.0, E.outExpo));
    const pull = k(t, EV.pull[0], EV.pull[1], E.inExpo);
    s._geo.style.transformOrigin = '540px 960px';
    s._geo.style.transform = `scale(${1 - 0.85 * pull})`; s._geo.style.opacity = 1 - pull;
    for (const d of s._words) {
      const p = k(t, d.t, d.t + 0.45, E.outCubic);
      d.word._lines[0].textContent = scramble(d.w, k(t, d.t, d.t + 0.5, E.lin), d.i + 1, frame);
      d.word.style.opacity = p * 0.95;
      d.num._lines[0].textContent = scramble(d.n, k(t, d.t + 0.2, d.t + 0.7, E.lin), d.i + 11, frame);
      d.num.style.opacity = k(t, d.t + 0.2, d.t + 0.5, E.outCubic);
      const drift = Math.sin(t * 1.3 + d.i) * 6;
      const dx = (540 - (d.x + d.size * 2)) * pull, dy = (960 - (d.y + d.size / 2)) * pull;
      d.grp.style.transform = `translate(${dx}px, ${dy + drift}px) scale(${1 - 0.8 * pull})`;
      d.grp.style.filter = pull > 0 ? `blur(${pull * 14}px)` : 'none';
      d.grp.style.opacity = 1 - k(t, EV.pull[1] - 0.22, EV.pull[1], E.lin);
    }
    s._links.forEach((p, i) => draw(p, k(t, EV.introLinks + i * 0.08, EV.introLinks + 0.55 + i * 0.08, E.outCubic)));
    s._links.svg.style.transformOrigin = '540px 960px';
    s._links.svg.style.transform = `scale(${1 - 0.85 * pull})`; s._links.svg.style.opacity = 1 - pull;
    const core = 22 * k(t, EV.pull[1] - 0.12, EV.pull[1] + 0.2, E.outBack) + 240 * k(t, EV.core[0], EV.core[1], E.inExpo);
    s._name.style.opacity = 1 - k(t, EV.core[0] + 0.1, EV.core[1], E.lin);
    s._nameLetters.forEach((sp, i) => { const q = k(t, EV.introName + i * 0.03, EV.introName + 0.4 + i * 0.03); sp.style.opacity = q; sp.style.transform = `translateY(${(1 - q) * 18}px)`; sp.style.filter = q < 1 ? `blur(${(1 - q) * 8}px)` : 'none'; });
    Object.assign(s._core.style, { width: core + 'px', height: core + 'px', left: 540 - core / 2 + 'px', top: 960 - core / 2 + 'px', opacity: core > 0 ? 1 : 0 });
  }

  // S1 — hook
  if (on('s1', t)) {
    const s = S.s1; bgDrift(t, s, b1, N('s1')); cam(s, t, b1, N('s1'));
    fadeIn(t, s._mark, b1 + 0.3); linesAt(t, s._head, EV.s1Head, 0.6, 60);
    s._pains.forEach((p, i) => { const q = k(t, EV.s1Pains[i], EV.s1Pains[i] + 0.5); p.style.opacity = q; p.style.transform = `translateX(${(1 - q) * -40}px)`; });
    linesAt(t, s._promise, EV.s1Promise);
  }

  // S2 — invoice photo, ends with a dive into the real «Фото накладной» button
  if (on('s2', t)) {
    const s = S.s2; bgDrift(t, s, b2, b3);
    fadeIn(t, s._mark, b2 + 0.2); linesAt(t, s._head, [EV.s2Head, EV.s2Head + 0.1]);
    popIn(t, s._card, EV.s2Card);
    draw(s._ring, k(t, EV.s2Ring, EV.s2Ring + 0.4, E.inOutCubic)); draw(s._lead, k(t, EV.s2Lead, EV.s2Lead + 0.4, E.inOutCubic));
    popIn(t, s._callout, EV.s2Callout, 0.5, 30, 0.86);
    linesAt(t, s._caption, [EV.s2Caption, EV.s2Caption + 0.1]); linesAt(t, s._note, EV.s2Note, 0.5, 24);
    const mv = k(t, EV.s2Cursor[0], EV.s2Cursor[1], E.inOutCubic);
    const cx = lerp(930, 790, mv), cy = lerp(1560, 1052, mv);
    const press = k(t, EV.s2Press, EV.s2Press + 0.08, E.outCubic) - k(t, EV.s2Press + 0.12, EV.s2Press + 0.24, E.outCubic);
    s._cursor.style.opacity = k(t, EV.s2Cursor[0] - 0.1, EV.s2Cursor[0] + 0.1, E.lin) * (1 - k(t, EV.s2Dive[0] + 0.15, EV.s2Dive[0] + 0.3, E.lin));
    s._cursor.style.transform = `translate(${cx}px, ${cy}px) scale(${1 - press * 0.12})`;
    s._callout.style.transform += ` scale(${1 - press * 0.035})`;
    const pr = k(t, EV.s2Press + 0.07, EV.s2Press + 0.57, E.outCubic);
    s._pulse.style.opacity = pr > 0 && pr < 1 ? (1 - pr) : 0; s._pulse.style.transform = `scale(${1 + pr * 0.35})`;
    const dive = k(t, EV.s2Dive[0], EV.s2Dive[1], E.inExpo);
    s.style.transformOrigin = '754px 1029px';
    cam(s, t, b2, b3, `scale(${1 + dive * 16})`);
    s.style.filter = dive > 0.02 ? `blur(${dive * 18}px)` : 'none';
  } else { S.s2.style.transform = 'none'; S.s2.style.filter = 'none'; }

  // S3 — the invoice broken into steps
  if (on('s3', t)) {
    const s = S.s3; bgDrift(t, s, b3, N('s3')); cam(s, t, b3, N('s3'));
    fadeIn(t, s._mark, b3 + 0.2); linesAt(t, s._head, [EV.s3Head, EV.s3Head + 0.1]);
    popIn(t, s._card, EV.s3Card, 0.7, 90);
    s._amountRings.forEach((r, i) => draw(r, k(t, EV.s3Rings[i], EV.s3Rings[i] + 0.35, E.inOutCubic)));
    s._branches.forEach((br, i) => {
      draw(br, k(t, EV.s3Branch + i * 0.08, EV.s3Branch + 0.55 + i * 0.08, E.inOutCubic));
      const q = k(t, EV.s3Branch + 0.1 + i * 0.08, EV.s3Branch + 0.7 + i * 0.08, E.inOutCubic);
      const pt = br.getPointAtLength(br._len * q);
      s._dots[i].setAttribute('cx', pt.x); s._dots[i].setAttribute('cy', pt.y);
      s._dots[i].style.opacity = q > 0 && q < 1 ? 1 : 0;
    });
    draw(s._totalRing, k(t, EV.s3Total, EV.s3Total + 0.3, E.inOutCubic));
    s._glow.style.opacity = (k(t, EV.s3Total + 0.25, EV.s3Total + 0.5, E.outCubic) - k(t, EV.s3Total + 0.6, EV.s3Total + 1.3, E.inOutCubic)) * 0.55;
    draw(s._lead, k(t, EV.s3Lead, EV.s3Lead + 0.3, E.inOutCubic)); s._leadDot.style.opacity = k(t, EV.s3Lead + 0.25, EV.s3Lead + 0.35, E.lin);
    linesAt(t, s._caption, EV.s3Caption, 0.5, 20);
  }

  // S4 — stock
  if (on('s4', t)) {
    const s = S.s4; bgDrift(t, s, b4, N('s4')); cam(s, t, b4, N('s4'));
    fadeIn(t, s._mark, b4 + 0.2); linesAt(t, s._head, [EV.s4Head, EV.s4Head + 0.1]);
    const rv = k(t, EV.s4Table[0], EV.s4Table[1], E.outCubic);
    s._table.style.opacity = clamp(rv * 3); s._table.style.clipPath = `inset(0 0 ${(1 - rv) * 100}% 0 round 20px)`;
    draw(s._r1, k(t, EV.s4Rings[0], EV.s4Rings[0] + 0.35, E.inOutCubic)); draw(s._r2, k(t, EV.s4Rings[1], EV.s4Rings[1] + 0.35, E.inOutCubic));
    draw(s._l1, k(t, EV.s4Links[0], EV.s4Links[0] + 0.2, E.inOutCubic)); draw(s._l2, k(t, EV.s4Links[1], EV.s4Links[1] + 0.45, E.inOutCubic));
    const q = k(t, EV.s4Links[1] + 0.05, EV.s4Links[1] + 0.55, E.inOutCubic); const pt = s._l2.getPointAtLength(s._l2._len * q);
    s._dot.setAttribute('cx', pt.x); s._dot.setAttribute('cy', pt.y); s._dot.style.opacity = q > 0 && q < 1 ? 1 : 0;
    const ls = k(t, EV.s4List, EV.s4List + 0.7);
    s._list.style.opacity = clamp(ls * 2); s._list.style.transform = `translateX(${(1 - ls) * 260}px)`;
    draw(s._b1, k(t, EV.s4Badges[0], EV.s4Badges[0] + 0.35, E.inOutCubic)); draw(s._b2, k(t, EV.s4Badges[1], EV.s4Badges[1] + 0.35, E.inOutCubic));
  }

  // S5 — purchase message, revealed by a circle from the first «Мало» badge
  if (on('s5', t)) {
    const s = S.s5; bgDrift(t, s, b5, N('s5'));
    const rr = k(t, EV.s5Circle[0], EV.s5Circle[1], E.inCubic) * 2300;
    s.style.clipPath = t < EV.s5Circle[1] ? `circle(${rr}px at 351px 1255px)` : 'none';
    if (t >= EV.s5Circle[0] && t < EV.s5Circle[1]) Object.assign(reveal.style, { display: 'block', width: 2 * rr + 'px', height: 2 * rr + 'px', left: 351 - rr + 'px', top: 1255 - rr + 'px' }); else reveal.style.display = 'none';
    fadeIn(t, s._mark, b5); linesAt(t, s._head, [EV.s5Head, EV.s5Head + 0.1]);
    popIn(t, s._list, EV.s5List);
    popIn(t, s._dialog, EV.s5Dialog, 0.6, 50, 0.94);
    const sc = 1.85, steps = s._lineTops.length - 1;
    const idx = clamp(Math.floor((t - EV.s5Type) / EV.s5Step) + 1, 0, steps);
    const top = s._lineTops[idx];
    s._cover.style.top = top * sc + 'px'; s._cover.style.height = Math.max(0, (330 - top) * sc) + 'px';
    const typingEnd = EV.s5Type + steps * EV.s5Step;
    s._caret.style.opacity = t > EV.s5Type - 0.05 && t < typingEnd + 0.6 && Math.floor(t * 4) % 2 === 0 ? 0.9 : 0;
    s._caret.style.top = (top + 3) * sc + 'px'; s._caret.style.left = 30 * sc + 'px';
    const jit = t > EV.glitch[0] + 0.03 && t < b6 ? (hash(frame, 5) - 0.5) * 60 : 0;
    cam(s, t, b5, N('s5'), `translateX(${jit}px)`);
  } else { S.s5.style.clipPath = 'none'; S.s5.style.transform = 'none'; reveal.style.display = 'none'; }

  // S6 — owner overview
  if (on('s6', t)) {
    const s = S.s6; bgDrift(t, s, b6, N('s6'));
    const jit = t > b6 && t < EV.glitch[1] ? (hash(frame, 9) - 0.5) * 50 * (1 - (t - b6) / (EV.glitch[1] - b6)) : 0;
    cam(s, t, b6, N('s6'), `translateX(${jit}px)`);
    fadeIn(t, s._mark, b6 + 0.2); linesAt(t, s._head, [EV.s6Head, EV.s6Head + 0.1]);
    s._metricCards.forEach((c, i) => popIn(t, c, EV.s6Metrics + i * 0.12, 0.6, 50, 0.96));
    popIn(t, s._chart, EV.s6Chart, 0.6, 60);
    s._cover.style.transform = `scaleX(${1 - k(t, EV.s6Draw[0], EV.s6Draw[1], E.inOutCubic)})`;
    draw(s._ring, k(t, EV.s6Ring, EV.s6Ring + 0.35, E.inOutCubic)); draw(s._lead, k(t, EV.s6Ring + 0.35, EV.s6Ring + 0.55, E.inOutCubic));
    linesAt(t, s._caption, [EV.s6Caption], 0.5, 18);
  } else { S.s6.style.transform = 'none'; }

  // S7 — one chain: nodes light up on the spoken words
  if (on('s7', t)) {
    const s = S.s7; bgDrift(t, s, b7, b8); cam(s, t, b7, b8);
    fadeIn(t, s._mark, b7 + 0.2); linesAt(t, s._head, [EV.s7Head, EV.s7Head + 0.1]);
    const [a0, a1, a2] = EV.s7Nodes, mid = 250 / 460;
    const fl = t < a1 ? mid * k(t, a0, a1, E.inOutCubic) : mid + (1 - mid) * k(t, a1, a2, E.inOutCubic);
    draw(s._flow, fl);
    const pt = s._flow.getPointAtLength(s._flow._len * fl);
    s._dot.setAttribute('cx', pt.x); s._dot.setAttribute('cy', pt.y); s._dot.style.opacity = t > a0 && fl < 1 ? 1 : 0;
    s._steps.forEach((st, i) => {
      const a = EV.s7Nodes[i];
      st.node.setAttribute('r', 11 * k(t, a, a + 0.35, E.outBack));
      linesAt(t, st.lab, [a + 0.03], 0.5, 20);
      popIn(t, st.frag, a + 0.12, 0.6, 40, 0.96);
    });
    linesAt(t, s._caption, EV.s7Caption, 0.5, 18);
  }
  const ir = k(t, EV.iris[0], EV.iris[1], E.inCubic);
  if (t >= EV.iris[0] && t < EV.iris[1] + 0.02) { const r = ir * 2300; Object.assign(iris.style, { display: 'block', width: 2 * r + 'px', height: 2 * r + 'px', left: 294 - r + 'px', top: 1028 - r + 'px' }); }
  else iris.style.display = 'none';

  // S8 — CTA
  if (on('s8', t)) {
    const s = S.s8; bgDrift(t, s, b8, b9);
    fadeIn(t, s._mark, b8 + 0.15); linesAt(t, s._head, [EV.s8Head, EV.s8Head + 0.1, EV.s8Head + 0.2], 0.6, 50);
    linesAt(t, s._prompt, [EV.s8Prompt], 0.5, 20);
    s._kw._lines[0].textContent = scramble('«КУХНЯ»', k(t, EV.s8Decode[0], EV.s8Decode[1], E.lin), 77, frame);
    s._kw.style.opacity = k(t, EV.s8Decode[0] - 0.05, EV.s8Decode[0] + 0.1, E.lin);
    brushReveal(s._under, k(t, EV.s8Under[0], EV.s8Under[1], E.inOutCubic));
    linesAt(t, s._note, [EV.s8Note, EV.s8Note + 0.1], 0.5, 20);
    const z = k(t, EV.s8Zoom[0], EV.s8Zoom[1], E.inCubic);
    s.style.transformOrigin = '540px 960px';
    cam(s, t, b8, b9, `scale(${1 - 0.12 * z})`); s.style.filter = z > 0.02 ? `blur(${z * 16}px)` : 'none';
  } else { S.s8.style.transform = 'none'; S.s8.style.filter = 'none'; }

  // OUTRO — particles gather into the app icon, then the wordmark lands with the spoken name
  if (on('outro', t)) {
    const s = S.outro;
    for (const p of s._parts) {
      const q = k(t, EV.outParts + p.delay, EV.outParts + p.delay + 0.75, E.inCubic);
      p.n.style.transform = `translate(${lerp(p.x0, 540, q) - p.size / 2}px, ${lerp(p.y0, 810, q) - p.size / 2}px) scale(${1 - 0.6 * q})`;
      p.n.style.opacity = k(t, EV.outParts + p.delay * 0.5, EV.outParts + 0.3 + p.delay * 0.5, E.lin) * (q < 1 ? 1 : 0);
    }
    const ic = k(t, EV.outIcon, EV.outIcon + 0.6, E.outBack);
    s._icon.style.opacity = clamp((t - EV.outIcon + 0.05) / 0.12);
    s._icon.style.transform = `scale(${lerp(0.2, 1, ic) * (1 + 0.025 * k(t, EV.outIcon + 1, END, E.lin))})`;
    s._glyphs.forEach((g, i) => { g.style.strokeDashoffset = 1 - k(t, EV.outGlyph + i * 0.12, EV.outGlyph + 0.7 + i * 0.12, E.inOutCubic); });
    s._letters.forEach((sp, i) => {
      const q = k(t, EV.outLetters + i * 0.045, EV.outLetters + 0.5 + i * 0.045);
      sp.style.opacity = q; sp.style.transform = `translateX(${(1 - q) * 140}px)`; sp.style.filter = q < 1 ? `blur(${(1 - q) * 14}px)` : 'none';
    });
    s.style.opacity = 1 - k(t, EV.outFade[0], EV.outFade[1], E.inOutCubic);
  }
}

function projectCues(add) {
  EV.introWords.forEach((t, i) => add(t, 'decode', { dur: 0.5, pan: i % 2 ? 0.35 : -0.35 }));
  add(0.0, 'swell', { dur: 2.0 });
  add(EV.introLinks, 'sweep', { dur: 0.7 });
  add(EV.pull[1], 'pop', { f: 760 });
  add(b1 - 1.5, 'riser', { dur: 1.5 });
  add(b1, 'impact', { size: 0.8 });
  EV.s1Head.forEach((t) => add(t, 'tick', { f: 1900 }));
  EV.s1Pains.forEach((t) => add(t, 'tick', { f: 2300 }));
  add(EV.s1Promise[0], 'tick', { f: 1700 });
  add(EV.s2Card, 'pop', { f: 520 });
  add(EV.s2Ring, 'pop', { f: 900 }); add(EV.s2Lead, 'sweep', { dur: 0.4 }); add(EV.s2Callout, 'pop', { f: 700 });
  add(EV.s2Cursor[0], 'air', { dur: 0.8 });
  add(EV.s2Press, 'click');
  add(EV.s2Dive[0], 'riser', { dur: EV.s2Dive[1] - EV.s2Dive[0] + 0.05 });
  add(b3, 'impact', { size: 0.7 });
  add(EV.s3Card, 'pop', { f: 480 });
  EV.s3Rings.forEach((t, i) => add(t, 'pop', { f: 880 * Math.pow(1.122, i * 2) }));
  add(EV.s3Branch, 'sweep', { dur: 0.6 });
  [0, 1, 2].forEach((i) => add(EV.s3Branch + 0.7 + i * 0.08, 'tick', { f: 2600 }));
  add(EV.s3Total + 0.1, 'chime');
  add(EV.s3Lead, 'tick', { f: 2000 });
  add(EV.s4Table[0], 'sweep', { dur: 0.7 });
  EV.s4Rings.forEach((t, i) => add(t, 'pop', { f: 1000 + i * 180 }));
  add(EV.s4Links[1], 'sweep', { dur: 0.45 });
  add(EV.s4List, 'whoosh', { dur: 0.5, soft: true });
  EV.s4Badges.forEach((t, i) => add(t, 'pop', { f: 1200 + i * 150 }));
  add(EV.s5Circle[0], 'whoosh', { dur: 0.45 });
  add(EV.s5List, 'pop', { f: 500 }); add(EV.s5Dialog, 'pop', { f: 620 });
  for (let i = 0; i < 9; i++) add(EV.s5Type + i * EV.s5Step, 'key', { i });
  add(EV.s6Metrics, 'pop', { f: 560 }); add(EV.s6Metrics + 0.12, 'pop', { f: 640 }); add(EV.s6Chart, 'pop', { f: 460 });
  add(EV.s6Draw[0], 'sweep', { dur: EV.s6Draw[1] - EV.s6Draw[0] });
  add(EV.s6Ring, 'pop', { f: 1100 });
  EV.s7Nodes.forEach((t, i) => { add(t, 'pop', { f: 660 * Math.pow(1.189, i * 2) }); add(t + 0.12, 'tick', { f: 2200 }); });
  add(EV.iris[0], 'whoosh', { dur: 0.42, low: true });
  add(b8, 'thump');
  add(EV.s8Decode[0], 'decode', { dur: EV.s8Decode[1] - EV.s8Decode[0] });
  add(EV.s8Decode[1], 'click');
  add(EV.s8Under[0], 'brush', { dur: EV.s8Under[1] - EV.s8Under[0] });
  add(b9 - 1.0, 'riser', { dur: 1.0 });
  add(b9, 'impact', { size: 0.85 });
  add(EV.outParts, 'shimmer', { dur: 1.4 });
  add(EV.outIcon, 'logo');
  for (let i = 0; i < 11; i++) add(EV.outLetters + i * 0.045 + 0.2, 'tick', { f: 2800 + i * 60, g: 0.5 });
}
