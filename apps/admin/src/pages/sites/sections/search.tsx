import { Fragment, useState } from 'react';
import { LineChart } from '../../../components/reference/line-chart.tsx';
import { useFormat } from '../../../lib/reference-format.ts';
import { useSiteText } from '../../../locales/site.ts';
import { SectionCard, EmptyData, ratio } from './shared.tsx';
import { add, groupBy, inRange, type SectionProps } from './model.ts';
import type { SearchRecord } from '../../../../../../packages/core/src/workspace.ts';

function summary(rows: SearchRecord[]) {
  const clicks = add(rows.map((r) => r.clicks)),
    impressions = add(rows.map((r) => r.impressions));
  const position =
    rows.length && rows.every((r) => r.position !== null && r.impressions !== null) && impressions
      ? rows.reduce((n, r) => n + r.position! * r.impressions!, 0) / impressions
      : null;
  const pageLatest = [...groupBy(rows, (r) => r.page)].map(
    ([, group]) => group.slice().sort((a, b) => b.date.localeCompare(a.date))[0],
  );
  return {
    clicks,
    impressions,
    position,
    ctr: ratio(clicks, impressions),
    indexed: pageLatest.length ? pageLatest.filter((r) => r.indexed).length : null,
  };
}
export default function SearchSection({ site, query }: SectionProps) {
  const t = useSiteText();
  const { fmtInt, fmtPct, fmtRatio } = useFormat();
  const [engine, setEngine] = useState<'google' | 'bing'>('google');
  const [metric, setMetric] = useState<'clicks' | 'impressions'>('clicks');
  const [text, setText] = useState('');
  const [sort, setSort] = useState<'clicks' | 'impressions' | 'ctr' | 'position' | 'term'>(
    'clicks',
  );
  const [country, setCountry] = useState('');
  const [device, setDevice] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const allRows = site.search.filter((r) => inRange(r.date, query));
  const rows = allRows.filter(
    (r) =>
      r.engine === engine &&
      (!country || r.country === country) &&
      (!device || r.device === device),
  );
  const groups = [
    ...groupBy(
      rows.filter((r) => r.query.toLowerCase().includes(text.toLowerCase())),
      (r) => r.query,
    ),
  ]
    .map(([term, records]) => ({ term, records, ...summary(records) }))
    .sort((a, b) =>
      sort === 'term'
        ? a.term.localeCompare(b.term)
        : sort === 'position'
          ? (a.position ?? Infinity) - (b.position ?? Infinity)
          : (b[sort] ?? -1) - (a[sort] ?? -1),
    );
  const dates = query.current.map((r) => r.date);
  const pageRows = [...groupBy(rows, (r) => r.page)]
    .map(([page, records]) => ({ page, records, ...summary(records) }))
    .sort((a, b) => (b.clicks ?? -1) - (a.clicks ?? -1));
  return (
    <div className="sa-site-stack">
      <div className="ad-grid">
        {(['google', 'bing'] as const).map((key, i) => {
          const s = summary(allRows.filter((r) => r.engine === key));
          return (
            <SectionCard key={key} title={key === 'google' ? 'Google' : 'Bing'}>
              <div className="ad-mini">
                <div>
                  <span className="ad-kpi-label">{t('clicks')}</span>
                  <strong className="ad-kpi-value">{fmtInt(s.clicks)}</strong>
                  <span className="ad-kpi-sub">
                    {query.from} – {query.to}
                  </span>
                </div>
                <div>
                  <span className="ad-kpi-label">{t('impressions')}</span>
                  <strong className="ad-kpi-value">{fmtInt(s.impressions)}</strong>
                  <span className="ad-kpi-sub">CTR {fmtPct(s.ctr)}</span>
                </div>
                <div>
                  <span className="ad-kpi-label">{t('indexed')}</span>
                  <strong className="ad-kpi-value" style={{ color: `var(--ad-s${i + 1})` }}>
                    {fmtInt(s.indexed)}
                  </strong>
                  <span className="ad-kpi-sub">{t('page')}</span>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
      <SectionCard title={t('searchDaily')}>
        <div className="sa-chart-toolbar">
          <div className="ad-seg" role="group" aria-label={t('clicks')}>
            {(['clicks', 'impressions'] as const).map((key) => (
              <button
                key={key}
                className={metric === key ? 'is-on' : ''}
                aria-pressed={metric === key}
                onClick={() => setMetric(key)}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
        <LineChart
          ticks={dates.map((d) => d.slice(5))}
          titles={dates}
          series={(['google', 'bing'] as const).map((key, i) => ({
            key,
            label: key === 'google' ? 'Google' : 'Bing',
            tone: i === 0 ? 's1' : 's2',
            values: dates.map((date) =>
              add(allRows.filter((r) => r.engine === key && r.date === date).map((r) => r[metric])),
            ),
          }))}
          format={fmtInt}
          caption={t('searchDaily')}
        />
      </SectionCard>
      <SectionCard title={t('queries')}>
        <div className="sa-table-filters">
          <label>
            {t('engine')}
            <select
              value={engine}
              onChange={(e) => {
                setEngine(e.target.value as typeof engine);
                setExpanded(null);
              }}
            >
              <option value="google">Google</option>
              <option value="bing">Bing</option>
            </select>
          </label>
          <label>
            {t('country')}
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{t('all')}</option>
              {[...new Set(allRows.map((r) => r.country))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            {t('device')}
            <select value={device} onChange={(e) => setDevice(e.target.value)}>
              <option value="">{t('all')}</option>
              {[...new Set(allRows.map((r) => r.device))].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            {t('sort')}
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="clicks">{t('clicks')}</option>
              <option value="impressions">{t('impressions')}</option>
              <option value="ctr">CTR</option>
              <option value="position">{t('position')}</option>
              <option value="term">{t('termAsc')}</option>
            </select>
          </label>
          <input
            type="search"
            aria-label={t('searchQuery')}
            placeholder={t('searchQuery')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        {groups.length ? (
          <div className="ad-table-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t('query')}</th>
                  <th>{t('clicks')}</th>
                  <th>{t('impressions')}</th>
                  <th>CTR</th>
                  <th>{t('position')}</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((r) => (
                  <Fragment key={r.term}>
                    <tr>
                      <td>
                        <button
                          type="button"
                          className="ad-row-toggle"
                          aria-expanded={expanded === r.term}
                          onClick={() => setExpanded(expanded === r.term ? null : r.term)}
                        >
                          <span aria-hidden>{expanded === r.term ? '▾' : '▸'}</span>
                          {r.term}
                        </button>
                      </td>
                      <td>{fmtInt(r.clicks)}</td>
                      <td>{fmtInt(r.impressions)}</td>
                      <td>{fmtPct(r.ctr)}</td>
                      <td>{fmtRatio(r.position)}</td>
                    </tr>
                    {expanded === r.term ? (
                      <tr>
                        <td colSpan={5} className="sa-query-detail">
                          <div className="sa-query-parts">
                            {[
                              ...groupBy(
                                r.records,
                                (record) => `${record.page} · ${record.country} · ${record.device}`,
                              ),
                            ].map(([label, records]) => (
                              <div key={label}>
                                <span>{label}</span>
                                <b>
                                  {fmtInt(summary(records).clicks)} {t('clicks')}
                                </b>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyData />
        )}
      </SectionCard>
      <SectionCard title={t('indexStatus')} note={t('indexNote')}>
        {pageRows.length ? (
          <div className="ad-table-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t('page')}</th>
                  <th>{t('clicks')}</th>
                  <th>{t('impressions')}</th>
                  <th>{t('indexed')}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.page}>
                    <td>{r.page}</td>
                    <td>{fmtInt(r.clicks)}</td>
                    <td>{fmtInt(r.impressions)}</td>
                    <td>
                      <span className={r.indexed ? 'ad-good' : 'ad-muted'}>
                        {r.indexed ? '✓' : '—'}
                      </span>
                    </td>
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
