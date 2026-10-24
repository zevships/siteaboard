import { PageHeading, PlannedNotice } from '../../components/ui/page-heading.tsx';
import { searchExamples } from '../../data/demo.ts';
import { usePreferences } from '../../providers/preferences.tsx';

export default function SearchPage() {
  const { t, number } = usePreferences();
  return (
    <>
      <PageHeading title={t('searchTitle')} description={t('searchDescription')} />
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t('searches')}</h2>
            <p>{t('searchSampleNote')}</p>
          </div>
          <span className="badge neutral">{t('demoData')}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t('query')}</th>
                <th>{t('site')}</th>
                <th>{t('impressions')}</th>
                <th>{t('clicks')}</th>
                <th>{t('ctr')}</th>
              </tr>
            </thead>
            <tbody>
              {searchExamples.map((row) => (
                <tr key={row.query}>
                  <td>
                    <strong>{row.query}</strong>
                  </td>
                  <td>{row.site}</td>
                  <td>{number(row.impressions)}</td>
                  <td>{number(row.clicks)}</td>
                  <td>{((row.clicks / row.impressions) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <PlannedNotice />
    </>
  );
}
