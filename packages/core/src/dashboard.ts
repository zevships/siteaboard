// Public, browser-safe view contracts. No storage, credentials or provider SDKs.
export type Period = 7 | 30;
export type SiteSummary = {
  id: string;
  name: string;
  domain: string;
  kind: 'tool' | 'content' | 'saas';
  visits: number;
  clicks: number;
  goals: number;
  change: number;
  status: 'healthy' | 'attention';
  sparkline: number[];
};
export type DailyPoint = { day: string; visits: number; previous: number };
export type DashboardSnapshot = {
  schemaVersion: 1;
  source: 'synthetic';
  quality: 'demo';
  period: Period;
  sites: SiteSummary[];
  daily: DailyPoint[];
  totals: { visits: number; clicks: number; goals: number; change: number };
};
