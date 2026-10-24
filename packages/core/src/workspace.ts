/** Versioned browser-safe data contract. Counts remain null when a source has no reading. */
export type PeriodKey = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'all';
export type LocalizedText = { en: string; zh: string };
export type Count = number | null;
export const metricKeys = [
  'visitors',
  'visits',
  'pageviews',
  'opens',
  'starts',
  'completions',
  'goals',
  'googleClicks',
  'bingClicks',
  'bounces',
  'durationSeconds',
] as const;
export type MetricKey = (typeof metricKeys)[number];
export type Metrics = Record<MetricKey, Count>;
export type DailyMetrics = Metrics & { date: string };
export type DimensionKey =
  | 'source'
  | 'page'
  | 'country'
  | 'region'
  | 'city'
  | 'device'
  | 'browser'
  | 'os';
export type BreakdownRecord = {
  date: string;
  dimension: DimensionKey;
  name: string;
  visitors: Count;
  opens: Count;
  starts: Count;
  completions: Count;
  goals: Count;
};
/** LCP/INP/CLS are per-day, path, device p75; do not average these percentiles. */
export type PerformanceRecord = {
  date: string;
  path: string;
  device: 'mobile' | 'desktop';
  samples: number;
  lcp: Count;
  inp: Count;
  cls: Count;
  errors: number;
  error: string | null;
};
export type FeedbackRecord = {
  id: string;
  date: string;
  kind: 'bug' | 'idea' | 'praise';
  text: LocalizedText;
  page: string;
  device: string;
  status: 'new' | 'reviewing' | 'resolved';
  issueId: string | null;
  rating: 'much' | 'some' | 'same' | 'worse' | null;
  followup: LocalizedText | null;
};
export type ReturningRecord = {
  date: string;
  newVisitors: Count;
  returningVisitors: Count;
  sameDayReturns: Count;
  days1to7: Count;
  days8to30: Count;
  days31plus: Count;
  newGoals: Count;
  returningGoals: Count;
};
export type SearchRecord = {
  date: string;
  engine: 'google' | 'bing';
  query: string;
  page: string;
  country: string;
  device: 'mobile' | 'desktop';
  clicks: Count;
  impressions: Count;
  position: Count;
  indexed: boolean;
};
export type IssueRecord = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  status: 'open' | 'review' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  kind: 'bug' | 'improvement' | 'decision';
  createdAt: string;
  reviewAt: string | null;
  releaseId: string | null;
  relatedIds: string[];
  evidence: LocalizedText;
};
export type ReleaseRecord = {
  id: string;
  date: string;
  version: string;
  title: LocalizedText;
  description: LocalizedText;
  issueIds: string[];
  changes: LocalizedText[];
};
export type TaskRun = {
  at: string;
  status: 'success' | 'failed';
  durationSeconds: number;
  message: LocalizedText;
};
export type TaskRecord = {
  id: string;
  siteId: string;
  name: LocalizedText;
  status: 'success' | 'failed' | 'running' | 'paused';
  lastRun: string;
  nextRun: string | null;
  schedule: LocalizedText;
  progress: number | null;
  runs: TaskRun[];
  coverage: { from: string; to: string; completed: number; expected: number };
};
export type SiteDataset = {
  id: string;
  name: string;
  domain: string;
  kind: 'tool' | 'content' | 'saas';
  time: { today: string; dataThrough: string; hour: number; timezone: string; fetchedAt: string };
  provenance: {
    source: string;
    quality: 'demo' | 'measured' | 'partial';
    definitionVersion: string;
    visitorDefinition: 'daily-unique-persondays';
    funnelDefinition: 'ordered-session-funnel' | 'independent-event-counts';
  };
  notes: LocalizedText[];
  daily: DailyMetrics[];
  /** Current-hour bins in both days stop at fetchedAt's site-local minute; later today bins are null. */
  hourly: { today: Count[]; yesterday: Count[]; todayGoals: Count[]; yesterdayGoals: Count[] };
  /** Hourly visitors count each day's first-seen visitors, so disjoint bins may be summed. */
  events: { date: string; event: string; name: LocalizedText; visitors: Count; events: Count }[];
  breakdowns: BreakdownRecord[];
  performance: PerformanceRecord[];
  feedback: FeedbackRecord[];
  returning: ReturningRecord[];
  search: SearchRecord[];
  issues: IssueRecord[];
  releases: ReleaseRecord[];
};
export type WorkspaceDataset = {
  schemaVersion: 1;
  generatedAt: string;
  source: 'synthetic' | 'local';
  sites: SiteDataset[];
  tasks: TaskRecord[];
};
export function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
}
export function sumCounts(values: Count[]): Count {
  return !values.length || values.some((value) => value === null)
    ? null
    : values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}
export function sumMetrics(rows: DailyMetrics[]): Metrics {
  return Object.fromEntries(
    metricKeys.map((key) => [key, sumCounts(rows.map((row) => row[key]))]),
  ) as Metrics;
}
export function relativeChange(current: Count, previous: Count): Count {
  return current === null || previous === null || previous === 0
    ? null
    : (current - previous) / previous;
}
export function querySite(site: SiteDataset, period: PeriodKey) {
  let to = site.time.dataThrough;
  let from = to;
  if (period === 'today') to = from = site.time.today;
  else if (period === 'yesterday') to = from = shiftDate(site.time.today, -1);
  else if (period === '7d') from = shiftDate(to, -6);
  else if (period === '30d') from = shiftDate(to, -29);
  else if (period === 'month') from = to.slice(0, 8) + '01';
  else from = site.daily[0]?.date ?? to;
  const count = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000)
    throw new Error('Unsupported date range');
  const previousTo = shiftDate(from, -1);
  const previousFrom = shiftDate(previousTo, 1 - count);
  const empty = (date: string): DailyMetrics =>
    ({ date, ...Object.fromEntries(metricKeys.map((key) => [key, null])) }) as DailyMetrics;
  const byDate = new Map(site.daily.map((row) => [row.date, row]));
  const range = (start: string) =>
    Array.from({ length: count }, (_, index) => {
      const date = shiftDate(start, index);
      return byDate.get(date) ?? empty(date);
    });
  const current = range(from);
  const previous = range(previousFrom);
  // Today has only hourly visitors/goals. Other fields have no same-cut reading.
  if (period === 'today') {
    current[0] = {
      ...empty(from),
      visitors: sumCounts(site.hourly.today.slice(0, site.time.hour + 1)),
      goals: sumCounts(site.hourly.todayGoals.slice(0, site.time.hour + 1)),
    };
    previous[0] = {
      ...empty(previousFrom),
      visitors: sumCounts(site.hourly.yesterday.slice(0, site.time.hour + 1)),
      goals: sumCounts(site.hourly.yesterdayGoals.slice(0, site.time.hour + 1)),
    };
  }
  return {
    period,
    from,
    to,
    previousFrom,
    previousTo,
    current,
    previous,
    totals: sumMetrics(current),
    previousTotals: sumMetrics(previous),
    sameCutHour: period === 'today' ? site.time.hour : null,
  };
}

// Validation runs at the API boundary and again before data enters React.
type Check = (value: unknown, path: string) => void;
function fail(path: string): never {
  throw new Error(`Invalid workspace field: ${path}`);
}
const string: Check = (value, path) => {
  if (typeof value !== 'string' || value.length > 10000) fail(path);
};
const nonempty: Check = (value, path) => {
  string(value, path);
  if (!value) fail(path);
};
const number: Check = (value, path) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(path);
};
const integer: Check = (value, path) => {
  number(value, path);
  if (!Number.isSafeInteger(value)) fail(path);
};
const bool: Check = (value, path) => {
  if (typeof value !== 'boolean') fail(path);
};
const oneOf =
  (...allowed: unknown[]): Check =>
  (value, path) => {
    if (!allowed.includes(value)) fail(path);
  };
const nullable =
  (check: Check): Check =>
  (value, path) => {
    if (value !== null) check(value, path);
  };
const array =
  (check: Check, max = 100000): Check =>
  (value, path) => {
    if (!Array.isArray(value) || value.length > max) fail(path);
    value.forEach((entry, index) => check(entry, `${path}[${index}]`));
  };
const object =
  (shape: Record<string, Check>): Check =>
  (value, path) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path);
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) if (!(key in shape)) fail(`${path}.${key}`);
    for (const [key, check] of Object.entries(shape)) check(record[key], `${path}.${key}`);
  };
const date: Check = (value, path) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail(path);
};
const timestamp: Check = (value, path) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    fail(path);
};
const id: Check = (value, path) => {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value)) fail(path);
};
const localized = object({ en: nonempty, zh: nonempty });
const count = nullable(integer);
const measurement = nullable(number);
const dailyShape = { date, ...Object.fromEntries(metricKeys.map((key) => [key, count])) };
const siteCheck = object({
  id,
  name: nonempty,
  domain: nonempty,
  kind: oneOf('tool', 'content', 'saas'),
  time: object({
    today: date,
    dataThrough: date,
    hour: integer,
    timezone: nonempty,
    fetchedAt: timestamp,
  }),
  provenance: object({
    source: nonempty,
    quality: oneOf('demo', 'measured', 'partial'),
    definitionVersion: nonempty,
    visitorDefinition: oneOf('daily-unique-persondays'),
    funnelDefinition: oneOf('ordered-session-funnel', 'independent-event-counts'),
  }),
  notes: array(localized, 100),
  daily: array(object(dailyShape), 10000),
  hourly: object({
    today: array(count, 24),
    yesterday: array(count, 24),
    todayGoals: array(count, 24),
    yesterdayGoals: array(count, 24),
  }),
  events: array(object({ date, event: nonempty, name: localized, visitors: count, events: count })),
  breakdowns: array(
    object({
      date,
      dimension: oneOf('source', 'page', 'country', 'region', 'city', 'device', 'browser', 'os'),
      name: nonempty,
      visitors: count,
      opens: count,
      starts: count,
      completions: count,
      goals: count,
    }),
  ),
  performance: array(
    object({
      date,
      path: nonempty,
      device: oneOf('mobile', 'desktop'),
      samples: integer,
      lcp: measurement,
      inp: measurement,
      cls: measurement,
      errors: integer,
      error: nullable(string),
    }),
  ),
  feedback: array(
    object({
      id,
      date,
      kind: oneOf('bug', 'idea', 'praise'),
      text: localized,
      page: string,
      device: string,
      status: oneOf('new', 'reviewing', 'resolved'),
      issueId: nullable(id),
      rating: nullable(oneOf('much', 'some', 'same', 'worse')),
      followup: nullable(localized),
    }),
  ),
  returning: array(
    object({
      date,
      newVisitors: count,
      returningVisitors: count,
      sameDayReturns: count,
      days1to7: count,
      days8to30: count,
      days31plus: count,
      newGoals: count,
      returningGoals: count,
    }),
  ),
  search: array(
    object({
      date,
      engine: oneOf('google', 'bing'),
      query: string,
      page: nonempty,
      country: nonempty,
      device: oneOf('mobile', 'desktop'),
      clicks: count,
      impressions: count,
      position: measurement,
      indexed: bool,
    }),
  ),
  issues: array(
    object({
      id,
      title: localized,
      description: localized,
      status: oneOf('open', 'review', 'resolved'),
      priority: oneOf('high', 'medium', 'low'),
      kind: oneOf('bug', 'improvement', 'decision'),
      createdAt: date,
      reviewAt: nullable(date),
      releaseId: nullable(id),
      relatedIds: array(id, 100),
      evidence: localized,
    }),
  ),
  releases: array(
    object({
      id,
      date,
      version: nonempty,
      title: localized,
      description: localized,
      issueIds: array(id, 100),
      changes: array(localized, 100),
    }),
  ),
});
const workspaceCheck = object({
  schemaVersion: oneOf(1),
  generatedAt: timestamp,
  source: oneOf('synthetic', 'local'),
  sites: array(siteCheck, 100),
  tasks: array(
    object({
      id,
      siteId: id,
      name: localized,
      status: oneOf('success', 'failed', 'running', 'paused'),
      lastRun: timestamp,
      nextRun: nullable(timestamp),
      schedule: localized,
      progress: nullable(number),
      runs: array(
        object({
          at: timestamp,
          status: oneOf('success', 'failed'),
          durationSeconds: number,
          message: localized,
        }),
        1000,
      ),
      coverage: object({ from: date, to: date, completed: integer, expected: integer }),
    }),
    1000,
  ),
});
function uniqueIds(rows: { id: string }[], path: string) {
  if (new Set(rows.map((row) => row.id)).size !== rows.length) fail(path);
}
export function validateWorkspace(value: unknown): asserts value is WorkspaceDataset {
  workspaceCheck(value, 'workspace');
  const workspace = value as WorkspaceDataset;
  uniqueIds(workspace.sites, 'sites.id');
  uniqueIds(workspace.tasks, 'tasks.id');
  const sites = new Set(workspace.sites.map((site) => site.id));
  for (const task of workspace.tasks) {
    if (!sites.has(task.siteId)) fail('task.siteId');
    if (task.progress !== null && task.progress > 1) fail('task.progress');
    if (task.coverage.completed > task.coverage.expected || task.coverage.from > task.coverage.to)
      fail('task.coverage');
  }
  for (const site of workspace.sites) {
    const path = `site.${site.id}`;
    if (site.time.hour > 23 || site.time.dataThrough >= site.time.today) fail(`${path}.time`);
    try {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en', {
          timeZone: site.time.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          hourCycle: 'h23',
        })
          .formatToParts(new Date(site.time.fetchedAt))
          .map((part) => [part.type, part.value]),
      );
      if (
        `${parts.year}-${parts.month}-${parts.day}` !== site.time.today ||
        Number(parts.hour) !== site.time.hour
      )
        fail(`${path}.time.cutoff`);
    } catch {
      fail(`${path}.time.timezone`);
    }
    if (!/^[a-zA-Z0-9.-]+(?::\d+)?$/.test(site.domain)) fail(`${path}.domain`);
    if (
      site.daily.length &&
      Date.parse(site.time.dataThrough) - Date.parse(site.daily[0].date) > 9999 * 86400000
    )
      fail(`${path}.daily.range`);
    if (
      site.daily.some(
        (row, index) =>
          row.date > site.time.dataThrough || (index > 0 && row.date <= site.daily[index - 1].date),
      )
    )
      fail(`${path}.daily.date`);
    for (const [key, values] of Object.entries(site.hourly)) {
      if (values.length !== 24) fail(`${path}.hourly.${key}`);
      if (
        (key === 'today' || key === 'todayGoals') &&
        values.some((value, hour) => hour > site.time.hour && value !== null)
      )
        fail(`${path}.hourly.${key}.cutoff`);
    }
    uniqueIds(site.issues, `${path}.issues.id`);
    uniqueIds(site.feedback, `${path}.feedback.id`);
    uniqueIds(site.releases, `${path}.releases.id`);
    const issues = new Set(site.issues.map((row) => row.id));
    const releases = new Set(site.releases.map((row) => row.id));
    for (const row of site.issues)
      if (
        row.relatedIds.some((id) => !issues.has(id)) ||
        (row.releaseId !== null && !releases.has(row.releaseId))
      )
        fail(`${path}.issues.reference`);
    for (const row of site.feedback)
      if (row.issueId !== null && !issues.has(row.issueId)) fail(`${path}.feedback.issueId`);
    for (const row of site.releases)
      if (row.issueIds.some((id) => !issues.has(id))) fail(`${path}.releases.issueIds`);
  }
}
