import type { ReactNode } from 'react';
import { useSiteText } from '../../../locales/site.ts';
import { useFormat } from '../../../lib/reference-format.ts';

export function SectionCard({
  title,
  note,
  children,
  className = '',
}: {
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ad-card ${className}`}>
      <header className="ad-card-head">
        <h2>{title}</h2>
        {note ? <span className="ad-card-sub">{note}</span> : null}
      </header>
      {children}
    </section>
  );
}
export function EmptyData() {
  const t = useSiteText();
  return <p className="ad-empty">{t('empty')}</p>;
}
export function CountRows({
  rows,
  total,
}: {
  rows: { label: string; n: number; tone?: string }[];
  total?: number;
}) {
  const { fmtInt, fmtPct } = useFormat();
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <EmptyData />;
  return (
    <ol className="ad-bars">
      {rows.map((r, i) => (
        <li key={`${r.label}-${i}`} title={`${r.label}: ${fmtInt(r.n)}`}>
          <span
            className="ad-bar"
            style={{ width: `${(r.n / max) * 100}%`, background: r.tone }}
            aria-hidden
          />
          <span className="ad-bar-label">{r.label}</span>
          <span className="ad-bar-value">
            {fmtInt(r.n)}
            {total ? (
              <span className="ad-bar-share"> · {fmtPct((r.n / total) * 100, 0)}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
export function KpiRows({
  rows,
  columns = 4,
}: {
  rows: { label: string; value: ReactNode; sub?: ReactNode }[];
  columns?: number;
}) {
  return (
    <div className={`ad-kpis ${columns === 4 ? 'is-4' : 'is-compact'}`}>
      {rows.map((r) => (
        <div className="ad-kpi" key={r.label}>
          <span className="ad-kpi-label">{r.label}</span>
          <span className="ad-kpi-value">{r.value}</span>
          {r.sub ? <span className="ad-kpi-sub">{r.sub}</span> : null}
        </div>
      ))}
    </div>
  );
}
export const ratio = (n: number | null | undefined, d: number | null | undefined) =>
  n == null || d == null || !d ? null : (n / d) * 100;
