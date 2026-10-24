import { test, expect } from '@playwright/test';

test('home uses complete site groups, keeps reference geometry, and makes no outside calls', async ({
  page,
}) => {
  const errors: string[] = [],
    outside: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:4310/') && !r.url().startsWith('data:'))
      outside.push(r.url());
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Good afternoon' })).toBeVisible();
  await expect(page.locator('.hm-site')).toHaveCount(3);
  await expect(page.locator('.hm-bar')).toHaveCount(72);
  await expect(page.locator('.hm-site').first().locator('.hm-side-tiles')).toBeVisible();
  const geometry = await page
    .locator('.hm-site')
    .first()
    .evaluate((e) => ({
      radius: getComputedStyle(e).borderRadius,
      padding: getComputedStyle(e).padding,
      chartHeight: e.querySelector('.hm-bars')!.getBoundingClientRect().height,
    }));
  expect(geometry.chartHeight).toBe(64);
  expect(geometry.radius).toBe('14px');
  await page.locator('.hm-kinds').getByRole('button', { name: /Task/ }).click();
  await expect(page.locator('.hm-todos li')).toHaveCount(1);
  await page.locator('.hm-kinds').getByRole('button', { name: /All/ }).click();
  await expect(page.locator('.hm-todos li')).toHaveCount(10);
  await page
    .locator('[data-site="fieldnotes"] .hm-site-nav')
    .getByRole('link', { name: 'Overview', exact: true })
    .click();
  await expect(page.getByLabel('Choose site', { exact: true })).toHaveValue('fieldnotes');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
});

test('appearance, palette, locale, system and unavailable storage', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Color theme', { exact: true }).selectOption('sunset');
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await page.getByLabel('Language', { exact: true }).selectOption('zh-CN');
  await page.goto('./#/guides');
  await expect(page.getByRole('heading', { name: '操作指南' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('主题配色', { exact: true })).toHaveValue('sunset');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await page.getByLabel('明暗模式', { exact: true }).selectOption('system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    });
  });
  await page.reload();
  await page.getByLabel('Language', { exact: true }).selectOption('zh-CN');
  await page.locator('.ad-brand').click();
  await expect(page.getByRole('heading', { name: '下午好' })).toBeVisible();
});

test('seven site tabs, periods, actual chart tooltip and persistent context', async ({ page }) => {
  await page.goto('./#/sites');
  await expect(page.getByLabel('Choose site', { exact: true })).toBeVisible();
  await page.getByLabel('Choose site', { exact: true }).selectOption('orbitkit');
  const sectionNav = page.getByRole('navigation', { name: 'Site sections' });
  await expect(sectionNav.getByRole('button')).toHaveCount(7);
  for (const name of [
    'Performance',
    'Feedback',
    'Returning',
    'Search',
    'Issues',
    'Releases',
    'Overview',
  ]) {
    await sectionNav.getByRole('button', { name, exact: true }).click();
    await expect(page.getByLabel('Choose site', { exact: true })).toHaveValue('orbitkit');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByRole('button', { name: 'Last 30 days', exact: true }).click();
  const chart = page.locator('.ad-table-view').first();
  await chart.locator('summary').click();
  await expect(chart.locator('tbody tr')).toHaveCount(30);
  await chart.locator('summary').click();
  const plot = page.locator('svg [tabindex="0"]').first();
  await plot.focus();
  await page.keyboard.press('Home');
  await expect(page.locator('.ad-tip').first()).toBeVisible();
  const first = await page.locator('.ad-tip').first().textContent();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.ad-tip').first()).not.toHaveText(first!);
  await page.reload();
  await expect(page.getByLabel('Choose site', { exact: true })).toHaveValue('orbitkit');
  await expect(page.getByRole('button', { name: 'Last 30 days', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('search filters, issue selection and release disclosure work', async ({ page }) => {
  await page.goto('./#/sites?site=tinycanvas&tab=search&period=7d');
  await page.getByRole('searchbox', { name: 'Filter queries' }).fill('NO_SUCH_QUERY');
  await expect(page.getByText('No data in this range')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Filter queries' }).fill('');
  const query = page.locator('.ad-row-toggle').first();
  await query.click();
  await expect(query).toHaveAttribute('aria-expanded', 'true');
  await page
    .getByRole('navigation', { name: 'Site sections' })
    .getByRole('button', { name: 'Issues', exact: true })
    .click();
  const issue = page.locator('.ad-issue').first();
  await issue.focus();
  await expect(issue).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#site-issue-detail')).toContainText('Evidence');
  await page
    .getByRole('navigation', { name: 'Site sections' })
    .getByRole('button', { name: 'Releases', exact: true })
    .click();
  const release = page.locator('.ad-row-toggle').first();
  await release.click();
  await expect(release).toHaveAttribute('aria-expanded', 'true');
});

test('tasks display animation, simulation, history and reduced-motion safely', async ({ page }) => {
  await page.goto('./#/connections');
  await expect(page.locator('.tk-task')).toHaveCount(4);
  await expect(page.locator('.tk-task.is-running')).toHaveCount(1);
  expect(
    await page.locator('.tk-task.is-running').evaluate((e) => getComputedStyle(e).animationName),
  ).toContain('tk-around');
  const task = page
    .locator('.tk-task')
    .filter({
      has: page
        .getByRole('button', { name: 'Simulate run', exact: true })
        .filter({ visible: true }),
    })
    .first();
  await task.getByRole('button', { name: 'Simulate run', exact: true }).click();
  await expect(task).toHaveClass(/is-running/);
  await expect(task.getByRole('status')).toContainText('Demo animation complete', {
    timeout: 6000,
  });
  await page.locator('.tk-hist-bar').first().click();
  await expect(page.locator('.tk-log-body')).toBeVisible();
  await page
    .getByRole('group', { name: 'Filter runs' })
    .getByRole('button', { name: 'Failed', exact: true })
    .click();
  await expect(page.locator('.ad-table tbody')).not.toContainText('Success');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await page.locator('.tk-task.is-running').evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('none');
  await page.goto('./');
  expect(
    await page
      .locator('.hm-pulse')
      .first()
      .evaluate((e) => getComputedStyle(e, '::after').animationName),
  ).toBe('none');
  expect(
    await page
      .locator('.hm-bar')
      .first()
      .evaluate((e) => getComputedStyle(e, '::after').animationName),
  ).toBe('none');
});

test('responsive navigation, screenshots and main pages', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Good afternoon' })).toBeVisible();
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('button', { name: 'Close navigation' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  }
  for (const mode of ['light', 'dark']) {
    await page.getByLabel('Appearance', { exact: true }).selectOption(mode);
    await page.screenshot({
      path: `.local/screenshots/${info.project.name}-${mode}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
  await page.getByLabel('Language', { exact: true }).selectOption('zh-CN');
  await page.getByLabel('明暗模式', { exact: true }).selectOption('light');
  await page.screenshot({
    path: `.local/screenshots/${info.project.name}-light-zh.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByLabel('明暗模式', { exact: true }).selectOption('dark');
  await page.screenshot({
    path: `.local/screenshots/${info.project.name}-dark-zh.png`,
    fullPage: true,
    animations: 'disabled',
  });
  for (const path of ['sites', 'search', 'activity', 'connections', 'guides']) {
    await page.goto(`./#/${path}`);
    await expect(page.locator('main')).not.toBeEmpty();
    await page.reload();
    await expect(
      page
        .locator(
          path === 'sites'
            ? '.ad-funnel'
            : path === 'search'
              ? '.ad-input'
              : path === 'activity'
                ? '.hm-inbox'
                : path === 'connections'
                  ? '.tk-task'
                  : '.guide-card',
        )
        .first(),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `.local/screenshots/${info.project.name}-${path}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
  await page.goto('./#/does-not-exist');
  await expect(page.locator('.empty-state')).toBeVisible();
});
