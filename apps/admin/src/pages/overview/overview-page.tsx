import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { Period } from '../../../../../packages/core/src/dashboard.ts';
import { usePreferences } from '../../providers/preferences.tsx';
import { getDemoDashboard } from '../../data/demo.ts';
import { PageHeading } from '../../components/ui/page-heading.tsx';
import { Icon, type IconName } from '../../components/ui/icon.tsx';
import { TrafficChart } from '../../components/dashboard/traffic-chart.tsx';
import { SiteTable } from '../../components/dashboard/site-table.tsx';
import { ReviewList } from '../../components/dashboard/review-list.tsx';

export default function OverviewPage() {
  const { t, number } = usePreferences();
  const [period, setPeriod] = useState<Period>(30);
  const snapshot = getDemoDashboard(period);
  const stats: {
    label: 'visits' | 'clicks' | 'conversions' | 'review';
    value: number;
    icon: IconName;
  }[] = [
    { label: 'visits', value: snapshot.totals.visits, icon: 'globe' },
    { label: 'clicks', value: snapshot.totals.clicks, icon: 'search' },
    { label: 'conversions', value: snapshot.totals.goals, icon: 'target' },
    { label: 'review', value: 3, icon: 'clock' },
  ];
  return (
    <>
      <PageHeading title={t('overviewTitle')} description={t('overviewSubtitle')}>
        <div className="range-selector" role="group" aria-label={t('dateRange')}>
          {([7, 30] as const).map((days) => (
            <button key={days} onClick={() => setPeriod(days)} aria-pressed={period === days}>
              {t(days === 7 ? 'days7' : 'days30')}
            </button>
          ))}
        </div>
      </PageHeading>
      <section className="stat-grid" aria-label={t('overview')}>
        {stats.map((stat, i) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-top">
              <span>{t(stat.label)}</span>
              <Icon name={stat.icon} size={18} />
            </div>
            <div className="stat-value">
              {number(stat.value)}
              {i === 0 && (
                <span className="stat-change">
                  <Icon name="up" size={13} />
                  {snapshot.totals.change.toFixed(1)}%
                </span>
              )}
            </div>
            <p>{i === 0 ? t('compared') : i === 3 ? t('nextSteps') : t('acrossSites')}</p>
          </article>
        ))}
      </section>
      <section className="panel traffic-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('trafficTitle')}</h2>
            <p>
              {t('trafficSubtitle')} <span className="dot-separator">·</span> {t('demoData')}
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
        <TrafficChart points={snapshot.daily} />
      </section>
      <div className="overview-bottom">
        <section className="panel portfolio-panel">
          <div className="panel-heading">
            <div>
              <h2>{t('portfolio')}</h2>
              <p>{t('portfolioSubtitle')}</p>
            </div>
            <Link to="/sites" className="icon-link" aria-label={t('viewSites')}>
              <Icon name="arrow" size={19} />
            </Link>
          </div>
          <SiteTable sites={snapshot.sites} />
          <div className="panel-footer">
            <span>
              <span className="status-dot" />
              {t('demoData')}
            </span>
            <Link to="/sites" className="text-link">
              {t('viewSites')}
              <Icon name="arrow" size={14} />
            </Link>
          </div>
        </section>
        <section className="panel radar-panel">
          <div className="panel-heading">
            <div>
              <h2>
                {t('toReview')}
                <span className="count-badge">3</span>
              </h2>
              <p>{t('demoActions')}</p>
            </div>
            <Link to="/activity" className="icon-link" aria-label={t('viewActivity')}>
              <Icon name="arrow" size={19} />
            </Link>
          </div>
          <ReviewList />
        </section>
      </div>
      <section className="agent-banner">
        <div className="agent-orbit" aria-hidden="true">
          <Icon name="sparkle" size={24} />
        </div>
        <div>
          <h2>
            {t('agentTitle')}
            <span className="badge neutral">{t('planned')}</span>
          </h2>
          <p>{t('agentText')}</p>
        </div>
        <Link to="/guides" className="button secondary">
          {t('agentCta')}
          <Icon name="arrow" size={16} />
        </Link>
      </section>
    </>
  );
}
