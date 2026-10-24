import type { SiteSummary } from '../../../../../packages/core/src/dashboard.ts';
import { usePreferences } from '../../providers/preferences.tsx';

export function SiteAvatar({ site }: { site: SiteSummary }) {
  return (
    <span className={`site-avatar site-${site.id}`} aria-hidden="true">
      {site.id === 'tinycanvas' ? 'tc' : site.id === 'fieldnotes' ? 'f.' : 'o'}
    </span>
  );
}
function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values) - 4,
    max = Math.max(...values) + 4;
  return (
    <svg className="sparkline" viewBox="0 0 96 30" fill="none" aria-hidden="true">
      <path
        d={values
          .map(
            (v, i) =>
              `${i ? 'L' : 'M'} ${(i * 96) / (values.length - 1)} ${28 - ((v - min) / (max - min)) * 26}`,
          )
          .join(' ')}
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function SiteTable({ sites }: { sites: SiteSummary[] }) {
  const { t, number } = usePreferences();
  return (
    <div className="table-scroll">
      <table className="site-table">
        <thead>
          <tr>
            <th>{t('site')}</th>
            <th>{t('visits')}</th>
            <th>{t('trend')}</th>
            <th>{t('status')}</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site.id}>
              <td>
                <div className="site-identity">
                  <SiteAvatar site={site} />
                  <div>
                    <strong>{site.name}</strong>
                    <span>{site.domain}</span>
                  </div>
                </div>
              </td>
              <td className="numeric">{number(site.visits)}</td>
              <td>
                <Sparkline values={site.sparkline} />
              </td>
              <td>
                <span className={`badge ${site.status === 'healthy' ? 'success' : 'warning'}`}>
                  <span className="status-dot" />
                  {t(site.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
