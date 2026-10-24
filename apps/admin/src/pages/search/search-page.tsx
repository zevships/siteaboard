import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useWorkspace } from '../../providers/workspace.tsx';
import { useI18n, useFormat } from '../../lib/reference-format.ts';
import { querySite, sumCounts } from '../../../../../packages/core/src/workspace.ts';
export default function SearchPage() {
  const { data } = useWorkspace();
  const { t } = useI18n();
  const { fmtCount } = useFormat();
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState('all');
  const rows = data.sites
    .flatMap((site) => {
      const range = querySite(site, '7d');
      const grouped = new Map<string, typeof site.search>();
      site.search
        .filter(
          (r) =>
            r.date >= range.from &&
            r.date <= range.to &&
            (engine === 'all' || r.engine === engine) &&
            r.query.toLowerCase().includes(query.toLowerCase()),
        )
        .forEach((row) => {
          const key = `${row.engine}-${row.query}`;
          grouped.set(key, [...(grouped.get(key) ?? []), row]);
        });
      return [...grouped.values()].map((records) => ({
        site,
        query: records[0].query,
        engine: records[0].engine,
        clicks: sumCounts(records.map((r) => r.clicks)),
        impressions: sumCounts(records.map((r) => r.impressions)),
      }));
    })
    .sort((a, b) => (b.clicks ?? -1) - (a.clicks ?? -1));
  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{t('搜索表现', 'Search performance')}</h1>
          <p>
            {t(
              '各站点近 7 天的搜索词；点击与站点访问分别统计。',
              'Search queries across sites, last 7 days. Clicks and site visits are different measures.',
            )}
          </p>
        </div>
      </header>
      <section className="ad-card">
        <div className="ad-toolbar">
          <input
            className="ad-input"
            aria-label={t('搜索词筛选', 'Filter queries')}
            placeholder={t('搜索关键词…', 'Find a query…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ad-seg">
            {['all', 'google', 'bing'].map((key) => (
              <button
                key={key}
                className={engine === key ? 'is-on' : ''}
                aria-pressed={engine === key}
                onClick={() => setEngine(key)}
              >
                {key === 'all' ? t('全部', 'All') : key === 'google' ? 'Google' : 'Bing'}
              </button>
            ))}
          </div>
        </div>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{t('搜索词', 'Query')}</th>
                <th>{t('站点', 'Site')}</th>
                <th>{t('来源', 'Source')}</th>
                <th>{t('展示', 'Impressions')}</th>
                <th>{t('点击', 'Clicks')}</th>
                <th>CTR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.site.id}-${row.engine}-${row.query}`}>
                  <td>{row.query}</td>
                  <td>
                    <Link
                      to="/sites"
                      search={{ site: row.site.id, tab: 'search', period: '7d', days: 7 }}
                    >
                      {row.site.name} →
                    </Link>
                  </td>
                  <td>{row.engine === 'google' ? 'Google' : 'Bing'}</td>
                  <td>{fmtCount(row.impressions)}</td>
                  <td>{fmtCount(row.clicks)}</td>
                  <td>
                    {row.clicks !== null && row.impressions
                      ? `${((row.clicks / row.impressions) * 100).toFixed(1)}%`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <p>{t('没有匹配的搜索词', 'No matching queries')}</p>}
      </section>
    </>
  );
}
