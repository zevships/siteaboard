import { Link } from '@tanstack/react-router';
import { usePreferences } from '../../providers/preferences.tsx';
import { getDemoSite } from '../../data/demo.ts';
import type { Period } from '../../../../../packages/core/src/dashboard.ts';
import { SiteAvatar } from './site-table.tsx';

export function SiteOperations({ siteId, period }: { siteId: string; period: Period }) {
  const { t, number } = usePreferences();
  const { site, daily, todayVisits, todayGoals, hourly } = getDemoSite(siteId, period);
  const maxHour = Math.max(...hourly) * 1.25;
  const maxDay = Math.max(...daily.map((point) => point.visits));
  return (
    <section className="panel operations-card">
      <header className="site-head">
        <SiteAvatar site={site} />
        <div className="site-title">
          <h2>{site.domain}</h2>
          <p>
            <span className="status-dot" />
            {t('fixtureUpdated')}
          </p>
        </div>
        <div className="pill-links">
          <Link to="/sites" search={{ site: siteId, days: period }}>
            {t('siteOverview')}
          </Link>
          <Link to="/search">{t('search')}</Link>
          <Link to="/activity">{t('activity')}</Link>
        </div>
      </header>
      <div className="operations-grid">
        <section className="metric-panel">
          <header>
            <h3>{t('today')}</h3>
            <span>{t('untilTime')}</span>
          </header>
          <div className="metric-pair">
            <div>
              <span>{t('visits')}</span>
              <strong className="stat-value">{number(todayVisits)}</strong>
              <small className="positive">{t('sample')}</small>
            </div>
            <div>
              <span>{t('conversions')}</span>
              <strong>{number(todayGoals)}</strong>
              <small className="positive">{t('sample')}</small>
            </div>
          </div>
          <div className="hour-bars" role="img" aria-label={t('hourChart')}>
            {Array.from({ length: 24 }, (_, i) => (
              <div className="hour-slot" key={i}>
                <span className="hour-ghost" style={{ height: `${45 + (i % 5) * 7}%` }} />
                {i < hourly.length && (
                  <span
                    className={i === 17 ? 'partial-bar' : ''}
                    style={{ height: `${(hourly[i] / maxHour) * 100}%` }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="axis-labels">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
          <p className="chart-footnote">{t('hourNote')}</p>
        </section>
        <section className="metric-panel">
          <header>
            <h3>{t(period === 7 ? 'days7' : 'days30')}</h3>
            <span>{period === 7 ? '10-24 → 10-30' : '10-01 → 10-30'}</span>
          </header>
          <div className="metric-pair">
            <div>
              <span>{t('visits')}</span>
              <strong>{number(site.visits)}</strong>
              <small className="positive">{t('sample')}</small>
            </div>
            <div>
              <span>{t('conversions')}</span>
              <strong>{number(site.goals)}</strong>
              <small className="positive">{t('sample')}</small>
            </div>
          </div>
          <div className="day-bars" role="img" aria-label={t('dailyChart')}>
            {daily.map((point) => (
              <div className="day-group" key={point.day}>
                <span style={{ height: `${(point.visits / maxDay) * 100}%` }} />
                <span className="goal-bar" style={{ height: `${(point.goals / maxDay) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="axis-labels">
            <span>{daily[0].day.slice(5)}</span>
            <span>{daily.at(-1)!.day.slice(5)}</span>
          </div>
          <p className="chart-footnote">
            <i className="legend-dot" />
            {t('visits')} <i className="legend-dot goals" />
            {t('conversions')} · {t('sameScale')}
          </p>
        </section>
        <aside className="site-side">
          <section className="metric-panel">
            <h3>
              {t('clicks')} · {period}
              {t('dayUnit')}
            </h3>
            <dl className="compact-metrics">
              <div>
                <dt>Google</dt>
                <dd>{number(Math.round(site.clicks * 0.72))}</dd>
              </div>
              <div>
                <dt>Bing</dt>
                <dd>{number(site.clicks - Math.round(site.clicks * 0.72))}</dd>
              </div>
            </dl>
          </section>
          <section className="metric-panel">
            <h3>{t('attentionItems')}</h3>
            <dl className="compact-metrics">
              <div>
                <dt>{t('pendingReview')}</dt>
                <dd className="warning">1</dd>
              </div>
              <div>
                <dt>{t('dataStatus')}</dt>
                <dd className="text-status">{t('sample')}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </section>
  );
}
