import { useMemo } from 'react';

import { usePreferences } from '../providers/preferences.tsx';
type Locale = 'zh-CN' | 'en';

export function useI18n() {
  const { preferences } = usePreferences();
  return {
    locale: preferences.locale,
    t: (zh: string, en = zh) => (preferences.locale === 'zh-CN' ? zh : en),
  };
}

const INT = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
const COMPACT = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const EN_COMPACT = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const EN_WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const dash = '—';

export function fmtInt(v: number | null | undefined): string {
  return v === null || v === undefined || !Number.isFinite(v) ? dash : INT.format(v);
}

export function fmtCount(v: number | null | undefined, locale: Locale = 'zh-CN'): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return dash;
  if (locale === 'en') return Math.abs(v) < 100_000 ? INT.format(v) : EN_COMPACT.format(v);
  return Math.abs(v) < 100_000 ? INT.format(v) : COMPACT.format(v);
}

export function fmtPct(v: number | null | undefined, digits = 1): string {
  return v === null || v === undefined || !Number.isFinite(v) ? dash : `${v.toFixed(digits)}%`;
}

export function fmtRatio(v: number | null | undefined): string {
  return v === null || v === undefined || !Number.isFinite(v) ? dash : v.toFixed(2);
}

export function fmtDuration(seconds: number | null | undefined, locale: Locale = 'zh-CN'): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return dash;
  const s = Math.round(seconds);
  if (locale === 'en') {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  }
  if (s < 60) return `${s} 秒`;
  if (s < 3600) return `${Math.floor(s / 60)} 分 ${s % 60} 秒`;
  return `${Math.floor(s / 3600)} 时 ${Math.floor((s % 3600) / 60)} 分`;
}

export function fmtDay(day: string): string {
  return day.slice(5);
}

export function fmtDayLong(day: string, locale: Locale = 'zh-CN'): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${day.slice(5)} ${(locale === 'en' ? EN_WEEKDAY : WEEKDAY)[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]}`;
}

export function change(
  current: number | null | undefined,
  previous: number | null | undefined,
  kind: 'relative' | 'points' = 'relative',
): number | null {
  if (current === null || current === undefined || previous === null || previous === undefined)
    return null;
  if (kind === 'points') return current - previous;
  return previous === 0 ? null : ((current - previous) / previous) * 100;
}

export function fmtChange(
  v: number | null,
  kind: 'relative' | 'points' = 'relative',
  locale: Locale = 'zh-CN',
): string {
  if (v === null || !Number.isFinite(v)) return dash;
  const sign = v > 0 ? '+' : v < 0 ? '−' : '±';
  const abs = Math.abs(v);
  return kind === 'points'
    ? `${sign}${abs.toFixed(1)} ${locale === 'en' ? 'pp' : '个百分点'}`
    : `${sign}${abs >= 10 ? abs.toFixed(0) : abs.toFixed(1)}%`;
}

export function useFormat() {
  const { locale } = useI18n();
  return useMemo(
    () => ({
      dash,
      change,
      fmtInt,
      fmtPct,
      fmtRatio,
      fmtDay,
      fmtCount: (v: number | null | undefined) => fmtCount(v, locale),
      fmtDuration: (v: number | null | undefined) => fmtDuration(v, locale),
      fmtDayLong: (day: string) => fmtDayLong(day, locale),
      fmtChange: (v: number | null, kind: 'relative' | 'points' = 'relative') =>
        fmtChange(v, kind, locale),
    }),
    [locale],
  );
}
