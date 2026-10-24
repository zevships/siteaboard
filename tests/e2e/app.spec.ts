import { test, expect } from '@playwright/test';

test('home works at a Pages subpath with synthetic data and no external requests', async ({
  page,
}) => {
  const errors: string[] = [],
    outside: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4310/') && !request.url().startsWith('data:'))
      outside.push(new URL(request.url()).origin);
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Good afternoon' })).toBeVisible();
  await expect(page.getByText('tinycanvas.example').first()).toBeVisible();
  const before = await page
    .locator('.operations-grid > .metric-panel')
    .nth(1)
    .locator('.metric-pair strong')
    .first()
    .textContent();
  await page.getByRole('button', { name: 'Last 30 days', exact: true }).click();
  await expect(
    page.locator('.operations-grid > .metric-panel').nth(1).locator('.metric-pair strong').first(),
  ).not.toHaveText(before!);
  await page.getByRole('button', { name: 'Fieldnotes', exact: true }).click();
  await expect(page.locator('.site-title h2')).toHaveText('fieldnotes.example');
  await page.locator('.pill-links').getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page.getByLabel('Choose site', { exact: true })).toHaveValue('fieldnotes');
  await page.getByRole('button', { name: 'Last 7 days', exact: true }).click();
  await page.getByRole('button', { name: 'View data table' }).click();
  await expect(page.locator('.chart-table tbody tr')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Hide data table' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('theme, appearance and locale persist across routes and reloads', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Color theme', { exact: true }).selectOption('sunset');
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await page.getByLabel('Language', { exact: true }).selectOption('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sunset');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.goto('./#/guides');
  await expect(page.getByRole('heading', { name: '操作指南' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('主题配色', { exact: true })).toHaveValue('sunset');
  await expect(page.getByLabel('明暗模式', { exact: true })).toHaveValue('dark');
  await page.getByLabel('明暗模式', { exact: true }).selectOption('system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
});

test('all independent pages and deep-link refresh work', async ({ page }) => {
  for (const [path, heading] of [
    ['sites', 'Site overview'],
    ['search', 'Search performance'],
    ['activity', 'Issues and improvements'],
    ['connections', 'Connections and tasks'],
    ['guides', 'Playbooks'],
  ]) {
    await page.goto(`./#/${path}`);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.goto('./#/does-not-exist');
  await expect(page.getByRole('heading', { name: 'This page isn’t aboard yet.' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to overview' }).click();
  await expect(page.getByRole('heading', { name: 'Good afternoon' })).toBeVisible();
});

test('restricted browser storage does not prevent using the app', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    });
  });
  await page.goto('./');
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await page.getByLabel('Language', { exact: true }).selectOption('zh-CN');
  await expect(page.getByRole('heading', { name: '下午好' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
});

test('responsive navigation and screenshots', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByLabel('Appearance', { exact: true }).selectOption('light');
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('button', { name: 'Close navigation' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.locator('nav').getByRole('link', { name: 'Connections' }).click();
    await expect(page.getByRole('heading', { name: 'Connections and tasks' })).toBeVisible();
    await expect(page.locator('.main-column')).not.toHaveAttribute('inert');
    await page.goto('./');
  }
  await expect(page.getByRole('heading', { name: 'Good afternoon' })).toBeVisible();
  await page.screenshot({
    path: `.local/screenshots/${testInfo.project.name}-light.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByLabel('Language', { exact: true }).selectOption('zh-CN');
  await expect(page.getByRole('heading', { name: '下午好' })).toBeVisible();
  await page.screenshot({
    path: `.local/screenshots/${testInfo.project.name}-light-zh.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByLabel('主题配色', { exact: true }).selectOption('harbor');
  await page.getByLabel('明暗模式', { exact: true }).selectOption('dark');
  await expect(page.getByRole('heading', { name: '下午好' })).toBeVisible();
  await page.screenshot({
    path: `.local/screenshots/${testInfo.project.name}-dark-zh.png`,
    fullPage: true,
    animations: 'disabled',
  });
});

test('site selector and period keep the detail journey and chart in sync', async ({
  page,
}, testInfo) => {
  await page.goto('./#/sites');
  await expect(page.getByRole('heading', { name: 'Site overview' })).toBeVisible();
  const first = await page.locator('.funnel-strip article').first().locator('strong').textContent();
  await page.getByLabel('Choose site', { exact: true }).selectOption('orbitkit');
  await expect(page.locator('.funnel-strip article').first().locator('strong')).not.toHaveText(
    first!,
  );
  await page.getByRole('button', { name: 'Last 30 days', exact: true }).click();
  await page.getByRole('button', { name: 'View data table' }).click();
  await expect(page.locator('.chart-table tbody tr')).toHaveCount(30);
  await page.getByRole('button', { name: 'Hide data table' }).click();
  await page.reload();
  await expect(page.getByLabel('Choose site', { exact: true })).toHaveValue('orbitkit');
  await expect(page.getByRole('button', { name: 'Last 30 days', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Appearance', { exact: true }).selectOption('light');
  await page.getByLabel('Language', { exact: true }).selectOption('zh-CN');
  await expect(page.getByRole('heading', { name: '站点概览' })).toBeVisible();
  await page.screenshot({
    path: `.local/screenshots/${testInfo.project.name}-detail.png`,
    fullPage: true,
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
