import type {
  DashboardSnapshot,
  Period,
  SiteSummary,
} from '../../../../packages/core/src/dashboard.ts';

// Entirely invented data. Never replace with an export from a real account.
const dailyVisits = [
  510, 590, 560, 680, 620, 730, 710, 650, 690, 810, 720, 770, 850, 820, 760, 920, 880, 960, 890,
  850, 990, 940, 1060, 980, 1110, 1050, 1170, 1120, 1240, 1190,
];
const siteTemplates = [
  {
    id: 'tinycanvas',
    name: 'TinyCanvas',
    domain: 'tinycanvas.example',
    kind: 'tool',
    status: 'attention',
    change: 16.8,
    sparkline: [18, 24, 20, 29, 25, 33, 30, 38, 34, 42],
  },
  {
    id: 'fieldnotes',
    name: 'Fieldnotes',
    domain: 'fieldnotes.example',
    kind: 'content',
    status: 'healthy',
    change: 24.2,
    sparkline: [12, 15, 13, 21, 19, 26, 23, 31, 28, 38],
  },
  {
    id: 'orbitkit',
    name: 'OrbitKit',
    domain: 'orbitkit.example',
    kind: 'saas',
    status: 'healthy',
    change: 11.4,
    sparkline: [16, 20, 18, 24, 23, 29, 27, 31, 32, 36],
  },
] satisfies Omit<SiteSummary, 'visits' | 'clicks' | 'goals'>[];

export function getDemoDashboard(period: Period): DashboardSnapshot {
  const offset = 30 - period;
  const daily = dailyVisits.slice(offset).map((visits, i) => ({
    day: `2026-10-${String(i + offset + 1).padStart(2, '0')}`,
    visits,
    previous: Math.round(visits * (0.78 + (i % 5) * 0.018)),
  }));
  const visits = daily.reduce((sum, point) => sum + point.visits, 0);
  const clicks = Math.round(visits * 0.143);
  const goals = Math.round(visits * 0.021);
  const split = (n: number) => [
    Math.round(n * 0.48),
    Math.round(n * 0.31),
    n - Math.round(n * 0.48) - Math.round(n * 0.31),
  ];
  const siteVisits = split(visits),
    siteClicks = split(clicks),
    siteGoals = split(goals);
  const previous = daily.reduce((sum, point) => sum + point.previous, 0);
  return {
    schemaVersion: 1,
    source: 'synthetic',
    quality: 'demo',
    period,
    daily,
    sites: siteTemplates.map((site, i) => ({
      ...site,
      visits: siteVisits[i],
      clicks: siteClicks[i],
      goals: siteGoals[i],
    })),
    totals: { visits, clicks, goals, change: (visits / previous - 1) * 100 },
  };
}

export const searchExamples = [
  { query: 'minimal canvas tool', site: 'TinyCanvas', impressions: 12400, clicks: 620 },
  { query: 'a calmer creative routine', site: 'Fieldnotes', impressions: 8300, clicks: 166 },
  { query: 'starter kit for side projects', site: 'OrbitKit', impressions: 5600, clicks: 336 },
];

// A single site's series sums to the same totals used by the portfolio.
export function getDemoSite(siteId: string, period: Period) {
  const dashboard = getDemoDashboard(period);
  const index = Math.max(
    0,
    dashboard.sites.findIndex((site) => site.id === siteId),
  );
  const site = dashboard.sites[index];
  const allocate = (total: number, weights: number[]) => {
    const sum = weights.reduce((a, b) => a + b, 0);
    let cumulative = 0,
      assigned = 0;
    return weights.map((weight) => {
      cumulative += weight;
      const next = Math.round((total * cumulative) / sum);
      const value = next - assigned;
      assigned = next;
      return value;
    });
  };
  const visits = allocate(
    site.visits,
    dashboard.daily.map((point) => point.visits),
  );
  const goals = allocate(
    site.goals,
    dashboard.daily.map((point) => point.visits),
  );
  const previous = allocate(
    Math.round(site.visits / 1.224),
    dashboard.daily.map((point) => point.previous),
  );
  const daily = dashboard.daily.map((point, i) => ({
    day: point.day,
    visits: visits[i],
    previous: previous[i],
    goals: goals[i],
  }));
  const full = getDemoDashboard(30);
  const fullSite = full.sites[index];
  const todayVisits = Math.round(
    (full.daily.at(-1)!.visits * fullSite.visits) / full.totals.visits,
  );
  const todayGoals = Math.round((todayVisits * fullSite.goals) / fullSite.visits);
  const hourly = allocate(
    todayVisits,
    [8, 6, 5, 4, 4, 5, 7, 9, 10, 9, 12, 14, 13, 16, 15, 18, 19, 11],
  );
  return { site, daily, todayVisits, todayGoals, hourly };
}
