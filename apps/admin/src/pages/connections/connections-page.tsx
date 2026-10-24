import { PageHeading } from '../../components/ui/page-heading.tsx';
import { Icon } from '../../components/ui/icon.tsx';
import { usePreferences } from '../../providers/preferences.tsx';

const sources = [
  { name: 'fixtureSource', description: 'fixtureDescription', icon: 'sites', active: true },
  { name: 'analyticsSource', description: 'analyticsDescription', icon: 'globe', active: false },
  { name: 'googleSource', description: 'googleDescription', icon: 'search', active: false },
] as const;
export default function ConnectionsPage() {
  const { t } = usePreferences();
  return (
    <>
      <PageHeading title={t('connectionsTitle')} description={t('connectionsDescription')} />
      <div className="connection-list">
        {sources.map((source) => (
          <article className="panel connection-card" key={source.name}>
            <span className="connection-icon">
              <Icon name={source.icon} size={23} />
            </span>
            <div>
              <h2>{t(source.name)}</h2>
              <p>{t(source.description)}</p>
            </div>
            <span className={`badge ${source.active ? 'success' : 'neutral'}`}>
              {t(source.active ? 'activeDemo' : 'planned')}
            </span>
          </article>
        ))}
      </div>
      <p className="privacy-note">
        <Icon name="connections" size={17} />
        {t('localNotice')}
      </p>
    </>
  );
}
