import { Link } from '@tanstack/react-router';
import { useWorkspace } from '../../providers/workspace.tsx';
import { useI18n } from '../../lib/reference-format.ts';
import { Inbox } from '../../components/operations/inbox.tsx';
export default function ActivityPage() {
  const { data } = useWorkspace();
  const { t } = useI18n();
  return (
    <div className="hm">
      <header className="page-heading">
        <div>
          <h1>{t('问题与改进', 'Issues and improvements')}</h1>
          <p>
            {t('把问题、改动和复查连起来。', 'Connect issues, changes, and follow-up reviews.')}
          </p>
        </div>
      </header>
      <Inbox data={data} />
      <section className="ad-card">
        <h2>{t('各站点的问题', 'Issues by site')}</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{t('站点', 'Site')}</th>
                <th>{t('未解决', 'Unresolved')}</th>
                <th>{t('已解决', 'Resolved')}</th>
                <th>{t('发版', 'Releases')}</th>
              </tr>
            </thead>
            <tbody>
              {data.sites.map((site) => (
                <tr key={site.id}>
                  <td>
                    <Link
                      to="/sites"
                      search={{ site: site.id, tab: 'issues', period: '7d', days: 7 }}
                    >
                      {site.domain} →
                    </Link>
                  </td>
                  <td>{site.issues.filter((i) => i.status !== 'resolved').length}</td>
                  <td>{site.issues.filter((i) => i.status === 'resolved').length}</td>
                  <td>{site.releases.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
