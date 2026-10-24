import { test, expect } from '@playwright/test';

test('content workspace preserves dense structure, views, filters, detail navigation and themes', async ({
  page,
}, info) => {
  const errors: string[] = [],
    outside: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:4310/') && !r.url().startsWith('data:'))
      outside.push(r.url());
  });
  await page.goto('./#/content');
  await expect(page.getByRole('heading', { name: 'Content workspace', exact: true })).toBeVisible();
  await expect(page.locator('.cx-story')).toHaveCount(13);
  await expect(page.locator('.cx-wt')).toHaveCount(36);
  await page.locator('.own-social summary').click();
  await expect(page.locator('.own-social-account')).toHaveCount(3);
  await expect(page.locator('.own-social-body')).toContainText('—');
  await page.locator('.own-social summary').click();
  for (const mode of ['light', 'dark']) {
    await page.getByLabel('Appearance', { exact: true }).selectOption(mode);
    await page.screenshot({
      path: `.local/screenshots/content-${info.project.name}-${mode}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
  await page.locator('.cx-story').nth(2).click();
  await expect(page.locator('.cx-wt')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await page.getByLabel('Search posts and creators', { exact: true }).fill('NO_MATCH_HERE');
  await expect(page.getByText('No content matches these filters.')).toBeVisible();
  await page.getByLabel('Search posts and creators', { exact: true }).fill('');
  await page.getByRole('combobox', { name: 'Sort', exact: true }).selectOption('oldest');
  await expect(page.locator('.cx-dayhead').first()).toContainText('10-22');
  await page.getByRole('combobox', { name: 'Sort', exact: true }).selectOption('newest');
  const firstPost = page.locator('.cx-wt').first();
  await firstPost.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const title = await dialog.getAttribute('aria-label');
  await page.keyboard.press('ArrowRight');
  await expect(dialog).not.toHaveAttribute('aria-label', title!);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(firstPost).toBeFocused();
  await page.getByRole('button', { name: /^Feed / }).click();
  await expect(page.locator('.cx-post')).toHaveCount(36);
  await page.getByRole('button', { name: /^Roster / }).click();
  await expect(page.locator('.cx-tile')).toHaveCount(12);
  await page.locator('.cx-tile-name button').first().click();
  await expect(page.getByRole('dialog')).toContainText('Collected posts');
  await page.keyboard.press('Escape');
  if (info.project.name !== 'desktop') {
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Filters', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.cx-side')).not.toBeVisible();
  }
  await page.getByRole('button', { name: /^Media wall / }).click();
  await page.getByLabel('Language', { exact: true }).selectOption('zh-CN');
  await expect(page.getByRole('heading', { name: '内容运营', exact: true })).toBeVisible();
  await page.screenshot({
    path: `.local/screenshots/content-${info.project.name}-zh.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.cx-view').evaluate((e) => getComputedStyle(e).animationName)).toBe(
    'none',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
});

test('content saves, entity relationships and intake are functional in-memory demonstrations', async ({
  page,
}) => {
  await page.goto('./#/content');
  await page.getByRole('button', { name: 'My saved', exact: true }).click();
  const savedCount = await page.locator('.cx-post').count();
  expect(savedCount).toBe(8);
  await page.locator('.content-feed-art').first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Saved', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.cx-post')).toHaveCount(savedCount - 1);
  await page.getByRole('button', { name: /^List / }).click();
  await expect(page.locator('.content-saved-list article')).toHaveCount(savedCount - 1);
  await page.getByRole('button', { name: 'Knowledge entities', exact: true }).click();
  await expect(page.locator('.content-entity')).toHaveCount(6);
  await page.getByLabel('Find an entity').fill('Canvas');
  await expect(page.locator('.content-entity')).toHaveCount(1);
  await page.locator('.content-entity').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Island kit ↗' }).click();
  await expect(page.getByRole('dialog')).toHaveAttribute('aria-label', 'Island kit');
  await page.getByRole('dialog').locator('.content-related').first().click();
  await expect(page.getByRole('dialog').locator('.cx-vstage')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.content-intake summary').click();
  await page.getByLabel('Title or creator name').fill('Synthetic test note');
  await page.getByRole('button', { name: 'Add demo draft', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('No database write or external call');
  await page.getByRole('button', { name: /^Cards / }).click();
  await page.getByLabel('Search posts and creators', { exact: true }).fill('Synthetic test note');
  await expect(page.locator('.cx-post')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'My saved', exact: true }).click();
  await expect(page.locator('.cx-post')).toHaveCount(savedCount);
});
