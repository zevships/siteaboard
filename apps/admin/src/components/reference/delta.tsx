import { useFormat } from '../../lib/reference-format.ts';
import { useI18n } from '../../lib/reference-format.ts';

export function Delta({
  value,
  kind = 'relative',
  upIsGood,
  title,
}: {
  value: number | null;
  kind?: 'relative' | 'points';

  upIsGood: boolean | null;
  title?: string;
}) {
  const { t } = useI18n();
  const { fmtChange } = useFormat();
  if (value === null || !Number.isFinite(value))
    return (
      <span
        className="ad-delta"
        title={title ?? t('没有可比的上一周期', 'No comparable previous period')}
      >
        {t('无可比', 'No comparison')}
      </span>
    );
  const dir = value > 0.05 ? 1 : value < -0.05 ? -1 : 0;
  const tone = dir === 0 || upIsGood === null ? '' : dir > 0 === upIsGood ? ' is-good' : ' is-bad';
  return (
    <span className={`ad-delta${tone}`} title={title}>
      <span aria-hidden>{dir > 0 ? '▲' : dir < 0 ? '▼' : '■'}</span>
      {fmtChange(value, kind)}
    </span>
  );
}
