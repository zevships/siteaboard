import type { Period } from '../../../../../packages/core/src/dashboard.ts';
import { usePreferences } from '../../providers/preferences.tsx';
export function PeriodControl({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  const { t } = usePreferences();
  return (
    <div className="range-selector" role="group" aria-label={t('dateRange')}>
      {([7, 30] as const).map((days) => (
        <button key={days} aria-pressed={value === days} onClick={() => onChange(days)}>
          {t(days === 7 ? 'days7' : 'days30')}
        </button>
      ))}
    </div>
  );
}
