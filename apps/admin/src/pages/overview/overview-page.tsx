import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { Period } from '../../../../../packages/core/src/dashboard.ts';
import { usePreferences } from '../../providers/preferences.tsx';
import { getDemoDashboard } from '../../data/demo.ts';
import { SiteOperations } from '../../components/dashboard/site-operations.tsx';
import { ReviewList } from '../../components/dashboard/review-list.tsx';
import { TaskList } from '../../components/dashboard/task-list.tsx';
import { PeriodControl } from '../../components/dashboard/period-control.tsx';
import { HorizonArt } from '../../components/dashboard/horizon-art.tsx';
import { SiteTable } from '../../components/dashboard/site-table.tsx';

export default function OverviewPage() {
  const { t } = usePreferences();
  const [period, setPeriod] = useState<Period>(7);
  const [siteId, setSiteId] = useState('tinycanvas');
  const snapshot = getDemoDashboard(period);
  return (
    <div className="home-layout">
      <header className="day-summary">
        <HorizonArt />
        <div>
          <p>{t('demoClock')}</p>
          <h1>{t('overviewTitle')}</h1>
        </div>
        <div className="summary-links">
          <Link to="/activity">
            <strong className="warning">3</strong>
            {t('itemsToReview')}
          </Link>
          <Link to="/sites">
            <strong>3</strong>
            {t('sitesTracked')}
          </Link>
          <Link to="/connections">
            <span className="status-dot" />
            {t('demoWorkspace')}
          </Link>
        </div>
      </header>
      <div className="section-toolbar">
        <div className="site-switcher" role="group" aria-label={t('yourSites')}>
          {snapshot.sites.map((site) => (
            <button
              key={site.id}
              aria-pressed={siteId === site.id}
              onClick={() => setSiteId(site.id)}
            >
              {site.name}
            </button>
          ))}
        </div>
        <PeriodControl value={period} onChange={setPeriod} />
      </div>
      <SiteOperations siteId={siteId} period={period} />
      <div className="work-columns">
        <section className="panel inbox-panel">
          <div className="panel-heading">
            <h2>
              {t('toReview')} <span className="count-badge">3</span>
            </h2>
            <Link className="text-link" to="/activity">
              {t('viewActivity')} →
            </Link>
          </div>
          <ReviewList />
        </section>
        <TaskList />
      </div>
      <section className="panel portfolio-panel">
        <div className="panel-heading">
          <h2>{t('allSites')}</h2>
          <span className="section-note">
            {t(period === 7 ? 'days7' : 'days30')} · {t('demoData')}
          </span>
        </div>
        <SiteTable sites={snapshot.sites} />
      </section>
    </div>
  );
}
