import type { ReactNode } from 'react';
import { usePreferences } from '../../providers/preferences.tsx';

export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function PlannedNotice() {
  const { t } = usePreferences();
  return (
    <div className="planned-notice">
      <span className="badge neutral">{t('planned')}</span>
      <div>
        <strong>{t('futureModule')}</strong>
        <p>{t('futureModuleText')}</p>
      </div>
    </div>
  );
}
