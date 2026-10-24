import { PageHeading, PlannedNotice } from '../../components/ui/page-heading.tsx';
import { ReviewList } from '../../components/dashboard/review-list.tsx';
import { usePreferences } from '../../providers/preferences.tsx';

export default function ActivityPage() {
  const { t } = usePreferences();
  return (
    <>
      <PageHeading title={t('activityTitle')} description={t('activityDescription')} />
      <section className="panel activity-panel">
        <div className="panel-heading">
          <h2>{t('demoActions')}</h2>
          <span className="badge neutral">{t('sample')}</span>
        </div>
        <ReviewList />
      </section>
      <PlannedNotice />
    </>
  );
}
