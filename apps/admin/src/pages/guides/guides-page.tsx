import { PageHeading } from '../../components/ui/page-heading.tsx';
import { Icon } from '../../components/ui/icon.tsx';
import { usePreferences } from '../../providers/preferences.tsx';

const guides = [
  { step: 'stepOne', title: 'guideConnect', body: 'guideConnectBody', icon: 'connections' },
  { step: 'stepTwo', title: 'guideTracking', body: 'guideTrackingBody', icon: 'target' },
  { step: 'stepThree', title: 'guideReview', body: 'guideReviewBody', icon: 'sparkle' },
] as const;
export default function GuidesPage() {
  const { t } = usePreferences();
  return (
    <>
      <PageHeading title={t('guidesTitle')} description={t('guidesDescription')} />
      <div className="guide-grid">
        {guides.map((guide) => (
          <article className="panel guide-card" key={guide.title}>
            <span className="guide-step">{t(guide.step)}</span>
            <span className="guide-icon">
              <Icon name={guide.icon} size={28} />
            </span>
            <h2>{t(guide.title)}</h2>
            <p>{t(guide.body)}</p>
            <span className="badge neutral">{t('planned')}</span>
          </article>
        ))}
      </div>
      <p className="privacy-note">
        <Icon name="guides" size={17} />
        {t('guideNotice')}
      </p>
    </>
  );
}
