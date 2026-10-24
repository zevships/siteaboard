import { useNavigate, useSearch } from '@tanstack/react-router';
import type { Period } from '../../../../../packages/core/src/dashboard.ts';
import { getDemoDashboard, getDemoSite } from '../../data/demo.ts';
import { usePreferences } from '../../providers/preferences.tsx';
import { PeriodControl } from '../../components/dashboard/period-control.tsx';
import { TrafficChart } from '../../components/dashboard/traffic-chart.tsx';

export default function SitesPage() {
  const { t, number } = usePreferences();
  const search = useSearch({ strict: false }) as { site?: string; days?: Period };
  const navigate = useNavigate();
  const siteId = search.site ?? 'tinycanvas';
  const period = search.days ?? 7;
  const setSiteId = (site: string) => {
    void navigate({ to: '/sites', search: { site, days: period } });
  };
  const setPeriod = (days: Period) => {
    void navigate({ to: '/sites', search: { site: siteId, days } });
  };
  const { site, daily } = getDemoSite(siteId, period);
  const stages = [
    { label: 'stageArrival', event: 'page_view', count: site.visits },
    { label: 'stageOpen', event: 'workspace_open', count: Math.round(site.visits * 0.68) },
    { label: 'stageStart', event: 'action_start', count: Math.round(site.visits * 0.35) },
    { label: 'stageFinish', event: 'action_done', count: Math.round(site.visits * 0.15) },
    { label: 'stageGoal', event: 'export_done', count: site.goals },
  ] as const;
  return (
    <div className="detail-layout">
      <div className="detail-heading">
        <h1 className="sr-only">{t('sitesTitle')}</h1>
        <select
          className="site-select"
          aria-label={t('chooseSite')}
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
        >
          {getDemoDashboard(30).sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.domain}
            </option>
          ))}
        </select>
        <span className="detail-tab">{t('siteOverview')}</span>
        <span className="section-note">{t('demoData')}</span>
      </div>
      <div className="section-toolbar">
        <PeriodControl value={period} onChange={setPeriod} />
        <span className="section-note">
          {period === 7 ? '10-24 → 10-30' : '10-01 → 10-30'} · UTC · {t('sample')}
        </span>
      </div>
      <section className="panel reading-note">
        <h2>{t('readingNotes')}</h2>
        <ol>
          <li>{t('readingOne')}</li>
          <li>{t('readingTwo')}</li>
          <li>{t('readingThree')}</li>
        </ol>
      </section>
      <section className="funnel-strip" aria-label={t('funnel')}>
        {stages.map((stage, index) => (
          <article key={stage.event} className={index === stages.length - 1 ? 'north-star' : ''}>
            <div className="funnel-label">
              <span>{t(stage.label)}</span>
              <code>{stage.event}</code>
            </div>
            <strong>{number(stage.count)}</strong>
            <p>
              {index === 0
                ? t('startingPoint')
                : `${t('previousStep')} ${((stage.count / stages[index - 1].count) * 100).toFixed(1)}%`}
            </p>
            <small>{t('sample')}</small>
            <div className="funnel-track">
              <span style={{ width: `${(stage.count / site.visits) * 100}%` }} />
            </div>
          </article>
        ))}
      </section>
      <section className="panel traffic-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('trafficTitle')}</h2>
            <p>
              {site.domain} · {t('demoData')}
            </p>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              {t('current')}
            </span>
            <span className="previous">
              <i />
              {t('previous')}
            </span>
          </div>
        </div>
        <TrafficChart points={daily} />
      </section>
    </div>
  );
}
