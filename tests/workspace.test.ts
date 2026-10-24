import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demoWorkspace } from '../apps/admin/src/data/workspace.ts';
import {
  metricKeys,
  querySite,
  relativeChange,
  sumCounts,
  validateWorkspace,
} from '../packages/core/src/workspace.ts';
import type { PeriodKey } from '../packages/core/src/workspace.ts';

test('synthetic workspace is complete, deterministic, and reconciles every dimension and source', () => {
  validateWorkspace(demoWorkspace);
  assert.equal(demoWorkspace.source, 'synthetic');
  for (const site of demoWorkspace.sites) {
    assert.match(site.domain, /\.example$/);
    assert.equal(site.daily.length, 84);
    for (const day of site.daily) {
      for (const dimension of [
        'source',
        'page',
        'country',
        'region',
        'city',
        'device',
        'browser',
        'os',
      ]) {
        for (const metric of ['visitors', 'opens', 'starts', 'completions', 'goals'] as const) {
          assert.equal(
            sumCounts(
              site.breakdowns
                .filter((row) => row.date === day.date && row.dimension === dimension)
                .map((row) => row[metric]),
            ),
            day[metric],
          );
        }
      }
      for (const engine of ['google', 'bing'] as const)
        assert.equal(
          sumCounts(
            site.search
              .filter((row) => row.date === day.date && row.engine === engine)
              .map((row) => row.clicks),
          ),
          day[engine === 'google' ? 'googleClicks' : 'bingClicks'],
        );
      const returning = site.returning.find((row) => row.date === day.date)!;
      assert.equal(sumCounts([returning.newVisitors, returning.returningVisitors]), day.visitors);
      assert.equal(
        sumCounts([returning.days1to7, returning.days8to30, returning.days31plus]),
        returning.returningVisitors,
      );
      assert.equal(sumCounts([returning.newGoals, returning.returningGoals]), day.goals);
    }
  }
});
test('periods compare adjacent equal date windows, and incomplete history stays unavailable', () => {
  const site = demoWorkspace.sites[0];
  const expectations = {
    today: ['2026-10-24', '2026-10-24', '2026-10-23'],
    yesterday: ['2026-10-23', '2026-10-23', '2026-10-22'],
    '7d': ['2026-10-17', '2026-10-23', '2026-10-10'],
    '30d': ['2026-09-24', '2026-10-23', '2026-08-25'],
    month: ['2026-10-01', '2026-10-23', '2026-09-08'],
    all: ['2026-08-01', '2026-10-23', '2026-05-09'],
  };
  for (const [period, dates] of Object.entries(expectations)) {
    const result = querySite(site, period as PeriodKey);
    assert.deepEqual([result.from, result.to, result.previousFrom], dates);
    assert.equal(result.current.length, result.previous.length);
    for (const metric of metricKeys)
      assert.equal(result.totals[metric], sumCounts(result.current.map((row) => row[metric])));
  }
  assert.equal(querySite(site, 'all').previousTotals.visitors, null);
  const withGap = structuredClone(site);
  withGap.daily = withGap.daily.filter((row) => row.date !== '2026-10-20');
  assert.equal(querySite(withGap, '7d').current.length, 7);
  assert.equal(querySite(withGap, '7d').totals.visitors, null);
});
test('today uses first-seen hourly buckets at the same minute, not full-yesterday counts or inferred metrics', () => {
  const site = structuredClone(demoWorkspace.sites[0]);
  const today = querySite(site, 'today');
  assert.equal(today.totals.visitors, sumCounts(site.hourly.today.slice(0, 18)));
  assert.equal(today.previousTotals.visitors, sumCounts(site.hourly.yesterday.slice(0, 18)));
  assert.equal(today.totals.pageviews, null);
  site.hourly.today[5] = null;
  assert.equal(querySite(site, 'today').totals.visitors, null);
  assert.equal(relativeChange(5, 0), null);
  assert.equal(relativeChange(0, 5), -1);
  assert.equal(sumCounts([]), null);
});
test('boundary validator rejects malformed data, unknown fields, broken references, and misleading cutoff', () => {
  const invalid = [
    (data: typeof demoWorkspace) => {
      data.schemaVersion = 2 as 1;
    },
    (data: typeof demoWorkspace) => {
      data.sites[0].daily[0].visitors = -1;
    },
    (data: typeof demoWorkspace) => {
      data.sites[0].daily[0].visits = NaN;
    },
    (data: typeof demoWorkspace) => {
      data.sites[0].time.today = '2026-02-31';
    },
    (data: typeof demoWorkspace) => {
      data.sites[0].hourly.today[23] = 0;
    },
    (data: typeof demoWorkspace) => {
      data.sites[0].issues[0].releaseId = 'missing';
    },
    (data: typeof demoWorkspace) => {
      data.sites[0].daily.reverse();
    },
    (data: typeof demoWorkspace) => {
      Object.assign(data, { unexpected: 'not allowed' });
    },
    (data: typeof demoWorkspace) => {
      data.sites[0].time.timezone = 'invalid-zone';
    },
  ];
  for (const mutate of invalid) {
    const data = structuredClone(demoWorkspace);
    mutate(data);
    assert.throws(() => validateWorkspace(data), /Invalid workspace field/);
  }
  for (const value of [null, {}, [], 1, 'wrong']) assert.throws(() => validateWorkspace(value));
});

test('capture time and cutoff use the site timezone including a different UTC calendar date', () => {
  const data = structuredClone(demoWorkspace);
  const site = data.sites[0];
  site.time.timezone = 'America/Los_Angeles';
  site.time.fetchedAt = '2026-10-25T00:30:00Z';
  validateWorkspace(data); // Oct 24 17:30 in Los Angeles.
  site.time.fetchedAt = '2026-10-24T00:30:00Z';
  assert.throws(() => validateWorkspace(data));
  site.time.fetchedAt = '2026-10-25T01:30:00Z';
  assert.throws(() => validateWorkspace(data));
});

test('task history agrees with latest snapshot status and timestamp', () => {
  for (const task of demoWorkspace.tasks) {
    assert.equal(task.runs.at(-1)?.at, task.lastRun);
    if (task.status === 'success' || task.status === 'failed')
      assert.equal(task.runs.at(-1)?.status, task.status);
  }
});
