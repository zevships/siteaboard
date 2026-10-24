import {
  querySite,
  sumCounts,
  type BreakdownRecord,
  type Count,
  type LocalizedText,
  type SiteDataset,
} from '../../../../../../packages/core/src/workspace.ts';
import { usePreferences } from '../../../providers/preferences.tsx';
export type SiteQuery = ReturnType<typeof querySite>;
export type SectionProps = { site: SiteDataset; query: SiteQuery };
export function useLocalized() {
  const { preferences } = usePreferences();
  return (value: LocalizedText) => value[preferences.locale === 'zh-CN' ? 'zh' : 'en'];
}
export function inRange(date: string, query: SiteQuery) {
  return date.slice(0, 10) >= query.from && date.slice(0, 10) <= query.to;
}
export function groupBreakdowns(rows: BreakdownRecord[]) {
  return [...groupBy(rows, (row) => row.name)]
    .map(([name, group]) => ({
      name,
      visitors: sumCounts(group.map((r) => r.visitors)),
      opens: sumCounts(group.map((r) => r.opens)),
      starts: sumCounts(group.map((r) => r.starts)),
      completions: sumCounts(group.map((r) => r.completions)),
      goals: sumCounts(group.map((r) => r.goals)),
    }))
    .sort((a, b) => (b.visitors ?? -1) - (a.visitors ?? -1));
}
export function add(values: Count[]) {
  return sumCounts(values);
}

export function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const group = groups.get(k);
    if (group) group.push(row);
    else groups.set(k, [row]);
  }
  return groups;
}
