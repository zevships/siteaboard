import { useState } from 'react';
import { LineChart } from '../../../components/reference/line-chart.tsx';
import { useSiteText } from '../../../locales/site.ts';
import { useFormat } from '../../../lib/reference-format.ts';
import { SectionCard, EmptyData, ratio } from './shared.tsx';
import { inRange, type SectionProps } from './model.ts';

type Metric = 'lcp' | 'inp' | 'cls';
const limits: Record<Metric, [number, number]> = {
  lcp: [2500, 4000],
  inp: [200, 500],
  cls: [0.1, 0.25],
};
const display = (metric: Metric, n: number | null) =>
  n === null
    ? '—'
    : metric === 'cls'
      ? n.toFixed(3)
      : metric === 'lcp'
        ? `${(n / 1000).toFixed(2)} s`
        : `${Math.round(n)} ms`;
export default function PerformanceSection({ site, query }: SectionProps) {
  const t = useSiteText();
  const { fmtInt, fmtPct } = useFormat();
  const rows = site.performance.filter((r) => inRange(r.date, query));
  const paths = [...new Set(rows.map((r) => r.path))];
  const devices = [...new Set(rows.map((r) => r.device))];
  const [path, setPath] = useState(paths[0] ?? '/');
  const [device, setDevice] = useState<string>(devices[0] ?? 'mobile');
  const [metric, setMetric] = useState<Metric>('lcp');
  const selected = rows
    .filter((r) => r.path === path && r.device === device)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = selected.at(-1);
  const samples = selected.length ? selected.reduce((n, r) => n + r.samples, 0) : null;
  const errors = selected.length ? selected.reduce((n, r) => n + r.errors, 0) : null;
  return (
    <div className="ad-perf-page">
      <div className="ad-perf-intro">
        <div>
          <h2>{t('fieldPerformance')}</h2>
          <p>{t('performanceNote')}</p>
        </div>
        <div className="ad-perf-filters">
          <label>
            {t('page')}
            <select aria-label={t('page')} value={path} onChange={(e) => setPath(e.target.value)}>
              {paths.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            {t('device')}
            <select
              aria-label={t('device')}
              value={device}
              onChange={(e) => setDevice(e.target.value)}
            >
              {devices.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="ad-perf-tiles">
        {(['lcp', 'inp', 'cls'] as const).map((key) => {
          const value = latest?.[key] ?? null;
          const state =
            value === null
              ? 'missing'
              : value <= limits[key][0]
                ? 'good'
                : value <= limits[key][1]
                  ? 'needs'
                  : 'poor';
          return (
            <button
              className={`ad-perf-tile sa-metric-button${metric === key ? ' is-on' : ''}`}
              type="button"
              key={key}
              onClick={() => setMetric(key)}
              aria-pressed={metric === key}
            >
              <span className="ad-kpi-label">{key.toUpperCase()} · P75</span>
              <strong className="ad-kpi-value">{display(key, value)}</strong>
              <span className={`sa-quality is-${state}`}>
                {t(state)} · {latest?.date ?? '—'}
              </span>
            </button>
          );
        })}
        <div className="ad-perf-tile">
          <span className="ad-kpi-label">{t('sampleCount')}</span>
          <strong className="ad-kpi-value">{fmtInt(samples)}</strong>
          <span className="ad-kpi-sub">
            {t('issues')} {fmtInt(errors)} · {fmtPct(ratio(errors, samples))}
          </span>
        </div>
      </div>
      <SectionCard title={`${metric.toUpperCase()} · ${t('daily')}`} note={t('lowerBetter')}>
        <LineChart
          ticks={selected.map((r) => r.date.slice(5))}
          titles={selected.map((r) => r.date)}
          series={[
            {
              key: metric,
              label: `${metric.toUpperCase()} P75`,
              tone: 's1',
              area: true,
              values: selected.map((r) => r[metric]),
            },
          ]}
          format={(n) => display(metric, n)}
          caption={`${metric.toUpperCase()} P75`}
        />
        <div className="ad-perf-legend">
          <span>
            <i className="is-good" />
            {t('good')} ≤ {display(metric, limits[metric][0])}
          </span>
          <span>
            <i className="is-needs" />
            {t('needs')} ≤ {display(metric, limits[metric][1])}
          </span>
          <span>
            <i className="is-poor" />
            {t('poor')}
          </span>
        </div>
      </SectionCard>
      <SectionCard title={t('details')}>
        {selected.length ? (
          <div className="ad-table-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t('time')}</th>
                  <th>{t('page')}</th>
                  <th>{t('device')}</th>
                  <th>{t('sampleCount')}</th>
                  <th>LCP P75</th>
                  <th>INP P75</th>
                  <th>CLS P75</th>
                  <th>{t('issues')}</th>
                </tr>
              </thead>
              <tbody>
                {selected
                  .slice()
                  .reverse()
                  .map((r) => (
                    <tr key={`${r.date}:${r.path}:${r.device}`}>
                      <td>{r.date}</td>
                      <td>{r.path}</td>
                      <td>{r.device}</td>
                      <td>{fmtInt(r.samples)}</td>
                      <td>{display('lcp', r.lcp)}</td>
                      <td>{display('inp', r.inp)}</td>
                      <td>{display('cls', r.cls)}</td>
                      <td title={r.error ?? undefined}>{fmtInt(r.errors)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyData />
        )}
      </SectionCard>
    </div>
  );
}
