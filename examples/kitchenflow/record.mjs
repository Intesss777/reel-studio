// KitchenFlow walkthrough recordings for the reel (scenes r1–r5).
// Requires a running KitchenFlow instance on a COPY of its data. Set APP_URL, APP_EMAIL, APP_PASSWORD in this folder's .env.
// Each fragment schedules its actions on the voice words: s.W('word') is when that word starts, relative to the scene.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  url: process.env.APP_URL || 'http://localhost:5273',
  viewport: { width: 1280, height: 900 },
  scale: 2,
  async login(page, env) {
    if (!env.APP_EMAIL || !env.APP_PASSWORD) throw new Error('Set APP_EMAIL and APP_PASSWORD in examples/kitchenflow/.env');
    await page.goto(`${this.url}/login`);
    await page.locator('input[name="email"]').fill(env.APP_EMAIL);
    await page.locator('input[name="password"]').fill(env.APP_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  },
  fragments: {
    r1: {
      route: '/admin',
      start: { x: 1120, y: 640 },
      async run(s, page) {
        const card = (t) => ({ text: t, minW: 200, minH: 50 });
        await s.until(s.W('выручка') - 0.45);
        s.cam([card('Выручка'), card('Валовая маржа')], 0.55);
        await s.moveTo(card('Выручка'), 0.5, 40, 6);
        await s.until(s.W('маржа') - 0.3);
        await s.moveTo(card('Валовая маржа'), 0.35, 40, 6);
        await s.until(s.W('закупки') - 0.35);
        s.cam([card('Закупки'), card('Закрыто смен')], 0.5);
        await s.moveTo(card('Закупки'), 0.35, 40, 6);
        await s.until(s.W('смены') - 0.3);
        await s.moveTo(card('Закрыто смен'), 0.35, 40, 6);
        await s.until(s.W('Переключаю') - 0.15);
        const week = page.getByRole('button', { name: 'Неделя' });
        await s.cam([page.getByRole('button', { name: 'День' }), page.getByRole('button', { name: 'Год' })], 0.55, { max: 2.3 });
        await s.moveTo(week, 0.6);
        await s.until(s.W('неделю') + 0.05);
        await s.click();
        await s.until(s.W('неделю') + 0.75);
        await s.cam([card('Выручка'), card('Закрыто смен')], 0.6, { pad: 30 });
        await s.move(900, 560, 0.6);
      },
    },
    r2: {
      route: '/admin/invoices',
      start: { x: 1000, y: 720 },
      async run(s, page) {
        const archive = page.getByRole('button', { name: 'Весь архив' });
        await s.until(s.W('Архив') - 0.3);
        s.cam([page.getByRole('button', { name: 'Сегодня' }), archive], 0.55, { max: 2.3 });
        await s.moveTo(archive, 0.5);
        await s.until(s.W('накладных') + 0.25);
        await s.click();
        await s.until(s.W('накладных') + 0.7);
        s.cam('full', 0.45);
        await s.scroll(380, 0.5);
        await s.until(s.W('Открываю') - 0.5);
        const row = page.locator('button:visible, a:visible, [role="button"]:visible', { hasText: 'METRO' }).first();
        await s.moveTo(row, 0.45);
        await s.until(s.W('Открываю') + 0.05);
        await s.click();
        await s.until(s.W('поставщик') - 0.25);
        await s.cam({ text: 'Открыть оригинал', minW: 500, minH: 300 }, 0.55, { max: 2.2, pad: 24 });
        await s.until(s.W('статус') - 0.2);
        await s.moveTo(page.getByText('Проведена', { exact: true }).last(), 0.4);
      },
    },
    r3: {
      route: '/admin/inventory',
      start: { x: 900, y: 660 },
      async run(s, page) {
        const low = page.getByRole('button', { name: /^Мало/ });
        await s.until(s.W('Фильтр') - 0.25);
        s.cam([page.getByRole('button', { name: /^Все позиции/ }), page.getByRole('button', { name: /^В норме/ })], 0.55, { max: 2.3 });
        await s.moveTo(low, 0.55);
        await s.until(s.W('Мало') + 0.15);
        await s.click();
        await s.until(s.W('заказать') - 0.2);
        await s.cam({ text: 'Масло сливочное', minW: 800, minH: 60 }, 0.55, { max: 1.6, pad: 60 });
        await s.until(s.W('карточке') - 0.55);
        await s.moveTo(page.getByRole('button', { name: 'Масло сливочное', exact: true }), 0.45);
        await s.until(s.W('карточке'));
        await s.click();
        await s.until(s.W('приход') - 0.45);
        const income = page.getByRole('button', { name: 'Приход' });
        await s.cam([income, page.getByRole('button', { name: 'Пересчёт' }), page.getByText('История движений')], 0.55, { max: 2.2, pad: 30 });
        await s.moveTo(income, 0.4);
        await s.until(s.W('списания') - 0.15);
        await s.moveTo(page.getByRole('button', { name: 'Списать' }), 0.3);
        await s.until(s.W('пересчёт') - 0.15);
        await s.moveTo(page.getByRole('button', { name: 'Пересчёт' }), 0.3);
      },
    },
    r4: {
      route: '/admin/purchases',
      start: { x: 640, y: 720 },
      async run(s, page) {
        const add = page.getByRole('button', { name: 'Добавить Брокколини' });
        await s.until(s.W('Добавляю') - 0.4);
        s.cam({ text: 'Брокколини', minW: 450, minH: 30 }, 0.5, { max: 2.2, pad: 40 });
        await s.moveTo(add, 0.45);
        await s.until(s.W('товар') + 0.05);
        await s.click();
        await s.until(s.W('товар') + 0.4);
        s.cam('full', 0.4);
        const inc = page.getByRole('button', { name: /Увеличить Брокколини/ });
        await inc.waitFor({ timeout: 5000 });
        await s.reveal(inc, 260, 0.45);
        await s.cam(page.locator('div').filter({ has: inc }).filter({ hasText: 'Брокколини' }).last(), 0.45, { max: 2.2, pad: 30 });
        await s.moveTo(inc, 0.35);
        await s.until(s.W('количество') - 0.05);
        await s.click();
        await sleep(260);
        await s.click();
        await s.until(s.W('сообщение') - 0.7);
        s.cam('full', 0.35);
        const prep = page.getByRole('button', { name: /Подготовить для WhatsApp/ });
        await s.reveal(prep, 120, 0.4);
        await s.moveTo(prep, 0.35);
        await s.until(s.W('поставщику') - 0.1);
        await s.click();
        await page.getByRole('dialog').waitFor({ timeout: 5000 });
        await s.until(s.W('готово') - 0.2);
        await s.cam(page.getByRole('dialog'), 0.6, { max: 1.8, pad: 24 });
        await s.move(s.rec.cursor.at(-1)[1] + 60, s.rec.cursor.at(-1)[2] + 120, 0.6);
      },
    },
    r5: {
      route: '/admin/suppliers',
      start: { x: 760, y: 760 },
      async run(s, page) {
        const line = { text: 'Накладная', minW: 500, minH: 40, exact: true };
        await s.until(s.W('Накладная') - 0.35);
        const lineBox = await s.card('подтверждённой накладной', 500, 40, 'includes');
        s.cam(lineBox, 0.55, { max: 2.3, pad: 24 });
        await s.move(lineBox.x + lineBox.width - 60, lineBox.y + lineBox.height / 2, 0.5);
        await s.until(s.W('поставщику') - 0.1);
        s.cam({ text: 'Текущий долг', minW: 500, minH: 50 }, 0.55, { max: 2.3, pad: 24 });
        await s.until(s.W('Отмечаю') - 0.45);
        s.cam('full', 0.45);
        await s.moveTo(page.getByRole('button', { name: 'Оплата' }), 0.45);
        await s.until(s.W('оплату') - 0.1);
        await s.click();
        await page.getByRole('dialog').waitFor({ timeout: 5000 });
        await page.locator('[role="dialog"] input[name="amount"]').focus();
        await page.keyboard.press('Meta+A');
        await s.type('20000', 40);
        await s.moveTo(page.getByRole('button', { name: 'Зафиксировать оплату' }), 0.3);
        await s.click();
        await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
        await s.until(s.W('уменьшился') - 0.25);
        await s.cam({ text: 'Текущий долг', minW: 500, minH: 50 }, 0.55, { max: 2.3, pad: 24 });
        await s.moveTo({ text: 'Текущий долг', minW: 150, minH: 40 }, 0.45, 0, 10);
        void line;
      },
    },
  }
};
