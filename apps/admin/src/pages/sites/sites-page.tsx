import { lazy, Suspense } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { querySite, type PeriodKey } from '../../../../../packages/core/src/workspace.ts';
import { useWorkspace } from '../../providers/workspace.tsx';
import { useSiteText } from '../../locales/site.ts';
import '../../styles/site-sections.css';
const sections = {
  overview: lazy(() => import('./sections/overview.tsx')),
  performance: lazy(() => import('./sections/performance.tsx')),
  feedback: lazy(() => import('./sections/feedback.tsx')),
  returning: lazy(() => import('./sections/returning.tsx')),
  search: lazy(() => import('./sections/search.tsx')),
  issues: lazy(() => import('./sections/issues.tsx')),
  releases: lazy(() => import('./sections/releases.tsx')),
};
type Tab = keyof typeof sections;
const tabs = Object.keys(sections) as Tab[];
const periods: PeriodKey[] = ['today', 'yesterday', '7d', '30d', 'month', 'all'];
export default function SitesPage() {
  const t = useSiteText();
  const { data, mode } = useWorkspace();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    site?: string;
    days?: number;
    tab?: string;
    period?: string;
  };
  if (!data.sites.length)
    return (
      <section className="ad-card ad-empty-card">
        <h1>{t('noSites')}</h1>
        <p className="ad-muted">{t('missingFootnote')}</p>
      </section>
    );
  const site = data.sites.find((s) => s.id === search.site) ?? data.sites[0];
  const tab = tabs.includes(search.tab as Tab) ? (search.tab as Tab) : 'overview';
  const period = periods.includes(search.period as PeriodKey)
    ? (search.period as PeriodKey)
    : search.days === 30
      ? '30d'
      : '7d';
  const query = querySite(site, period);
  const Page = sections[tab];
  const change = (next: { site?: string; tab?: Tab; period?: PeriodKey }) => {
    const nextPeriod = next.period ?? period;
    void navigate({
      to: '/sites',
      search: {
        site: next.site ?? site.id,
        tab: next.tab ?? tab,
        period: nextPeriod,
        days: nextPeriod === '30d' ? 30 : 7,
      },
      resetScroll: false,
    });
  };
  return (
    <div className="sa-site-page">
      <h1 className="ad-sr">
        {site.domain} · {t(tab)}
      </h1>
      <div className="ad-sitenav">
        <label className="ad-site">
          <span className="ad-sr">{t('chooseSite')}</span>
          <select
            aria-label={t('chooseSite')}
            value={site.id}
            onChange={(e) => change({ site: e.target.value })}
          >
            {data.sites.map((s) => (
              <option value={s.id} key={s.id}>
                {s.domain}
              </option>
            ))}
          </select>
        </label>
        <nav className="ad-pages" aria-label={t('sections')}>
          {tabs.map((key) => (
            <button
              type="button"
              className={key === tab ? 'is-on' : ''}
              aria-current={key === tab ? 'page' : undefined}
              onClick={() => change({ tab: key })}
              key={key}
            >
              {t(key)}
            </button>
          ))}
        </nav>
        <span className="sa-source-badge">{t(mode === 'local' ? 'local' : 'demo')}</span>
      </div>
      <div className="ad-toolbar">
        {tab !== 'issues' ? (
          <nav className="ad-seg" aria-label={t('period')}>
            {periods.map((key) => (
              <button
                key={key}
                className={period === key ? 'is-on' : ''}
                aria-pressed={period === key}
                onClick={() => change({ period: key })}
              >
                {t(key)}
              </button>
            ))}
          </nav>
        ) : null}
        <span className="ad-note">
          {tab !== 'issues' ? `${query.from} – ${query.to} · ` : ''}
          {t('dataThrough')}{' '}
          <b>
            {tab === 'issues'
              ? site.time.fetchedAt
              : period === 'today'
                ? `${site.time.today} ${new Intl.DateTimeFormat('en-GB', { timeZone: site.time.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(site.time.fetchedAt))}`
                : site.time.dataThrough}
          </b>{' '}
          · {site.time.timezone}
        </span>
      </div>
      <Suspense
        fallback={
          <div className="ad-card sa-section-loading" role="status">
            …
          </div>
        }
      >
        <div key={`${site.id}:${tab}:${period}`} className="sa-section-enter">
          <Page site={site} query={query} />
        </div>
      </Suspense>
      <p className="ad-footnote sa-data-footnote">
        {site.provenance.source} · {site.provenance.definitionVersion} · {t('missingFootnote')}
      </p>
    </div>
  );
}
