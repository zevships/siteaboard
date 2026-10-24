import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePreferences, resolvedMode } from '../apps/admin/src/lib/preferences.ts';
import { getDemoDashboard } from '../apps/admin/src/data/demo.ts';
import { en } from '../apps/admin/src/locales/en.ts';
import { zhCN } from '../apps/admin/src/locales/zh-CN.ts';
import { navigation } from '../apps/admin/src/app/navigation.ts';

test('malformed or obsolete preferences cannot break startup', () => {
  for (const raw of [
    '{broken',
    'null',
    '42',
    '[]',
    '{"theme":"unknown","mode":"auto","locale":"fr"}',
  ]) {
    assert.deepEqual(parsePreferences(raw, 'zh-TW'), {
      theme: 'ocean',
      mode: 'system',
      locale: 'zh-CN',
    });
  }
  assert.deepEqual(parsePreferences('{"theme":"harbor","mode":"dark","locale":"en"}', 'zh-CN'), {
    theme: 'harbor',
    mode: 'dark',
    locale: 'en',
  });
});
test('system appearance follows the OS without overriding explicit choices', () => {
  assert.equal(resolvedMode('system', true), 'dark');
  assert.equal(resolvedMode('system', false), 'light');
  assert.equal(resolvedMode('light', true), 'light');
  assert.equal(resolvedMode('dark', false), 'dark');
});
test('both locales cover all UI messages and navigation keys', () => {
  assert.deepEqual(Object.keys(zhCN).sort(), Object.keys(en).sort());
  for (const route of navigation) assert.ok(en[route.label] && zhCN[route.label]);
  assert.equal(new Set(navigation.map((route) => route.path)).size, navigation.length);
});
test('demo period, chart, portfolio and totals are consistent and clearly synthetic', () => {
  for (const period of [7, 30] as const) {
    const data = getDemoDashboard(period);
    assert.equal(data.source, 'synthetic');
    assert.equal(data.quality, 'demo');
    assert.equal(data.daily.length, period);
    assert.equal(
      data.daily.reduce((sum, p) => sum + p.visits, 0),
      data.totals.visits,
    );
    for (const key of ['visits', 'clicks', 'goals'] as const)
      assert.equal(
        data.sites.reduce((sum, site) => sum + site[key], 0),
        data.totals[key],
      );
    assert.ok(data.sites.every((site) => site.domain.endsWith('.example')));
    assert.equal(data.daily.at(-1)?.day, '2026-10-30');
  }
  assert.ok(getDemoDashboard(7).totals.visits < getDemoDashboard(30).totals.visits);
});
