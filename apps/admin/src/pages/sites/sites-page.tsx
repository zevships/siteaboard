import { PageHeading, PlannedNotice } from '../../components/ui/page-heading.tsx';
import { SiteAvatar } from '../../components/dashboard/site-table.tsx';
import { getDemoDashboard } from '../../data/demo.ts';
import { usePreferences } from '../../providers/preferences.tsx';

export default function SitesPage() {
  const { t, number } = usePreferences();
  const descriptions = ['projectCanvas', 'projectFieldnotes', 'projectOrbit'] as const;
  return (
    <>
      <PageHeading title={t('sitesTitle')} description={t('sitesDescription')} />
      <div className="site-card-grid">
        {getDemoDashboard(30).sites.map((site, i) => (
          <article className="panel site-card" key={site.id}>
            <div className="site-card-top">
              <SiteAvatar site={site} />
              <span className="badge neutral">{t('sample')}</span>
            </div>
            <h2>{site.name}</h2>
            <p className="site-domain">{site.domain}</p>
            <p className="site-description">{t(descriptions[i])}</p>
            <dl className="site-card-stats">
              <div>
                <dt>{t('visits')}</dt>
                <dd>{number(site.visits)}</dd>
              </div>
              <div>
                <dt>{t('conversions')}</dt>
                <dd>{number(site.goals)}</dd>
              </div>
            </dl>
            <span className={`badge ${site.status === 'healthy' ? 'success' : 'warning'}`}>
              {t(site.status)}
            </span>
          </article>
        ))}
      </div>
      <PlannedNotice />
    </>
  );
}
