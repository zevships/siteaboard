import type { CSSProperties } from 'react';

import { useFormat } from '../../lib/reference-format.ts';
import { useI18n } from '../../lib/reference-format.ts';
import type { FunnelStep, SourceFunnel } from './types.ts';
import { Delta } from './delta';

export function FunnelStrip({
  steps,
  northStar,
  compareTitle,
}: {
  steps: FunnelStep[];
  northStar: string | null;
  compareTitle: string;
}) {
  const { t, locale } = useI18n();
  const { change, fmtCount, fmtPct } = useFormat();
  if (!steps.length)
    return (
      <p className="ad-empty">
        {t('这个站点尚未配置漏斗步骤。', 'This site has no configured funnel steps.')}
      </p>
    );
  const first = steps[0]!.visitors;
  return (
    <div className="ad-funnel" style={{ '--steps': steps.length } as CSSProperties}>
      {steps.map((s, i) => {
        const before = i > 0 ? steps[i - 1]!.visitors : null;
        const ofBefore = before && s.visitors !== null ? (s.visitors / before) * 100 : null;
        const ofFirst = first && s.visitors !== null ? (s.visitors / first) * 100 : null;
        return (
          <div
            key={s.id}
            className={`ad-step${s.id === northStar ? ' is-hero' : ''}`}
            title={t(s.definition, s.definitionEn ?? `${s.nameEn ?? s.id} (${s.event})`)}
          >
            <span className="ad-step-name">
              <span>
                {t(s.name, s.nameEn ?? s.id)}
                {s.id === northStar ? t(' · 北极星', ' · North star') : ''}
              </span>
              <span className="ad-step-event">
                {s.event}
                {s.filter ? (
                  <span className="ad-step-filter">
                    {locale === 'en' ? s.filter.replace(/^无 /, 'without ') : s.filter}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="ad-step-value">{fmtCount(s.visitors)}</span>
            <span className="ad-step-conv">
              {i === 0
                ? t('起点', 'Starting point')
                : `${t('上一步的 ', 'Share of previous step: ')}${fmtPct(ofBefore)}`}
            </span>
            {i > 1 ? (
              <span className="ad-step-conv">
                {t(steps[0]!.name, steps[0]!.nameEn ?? steps[0]!.id)}
                {t('的', ' share: ')}
                {fmtPct(ofFirst)}
              </span>
            ) : null}
            <Delta value={change(s.visitors, s.prev)} upIsGood title={compareTitle} />
            <div className="ad-step-meter" aria-hidden>
              <span style={{ width: `${Math.min(100, ofFirst ?? 0)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SourceFunnelTable({ rows, steps }: { rows: SourceFunnel[]; steps: FunnelStep[] }) {
  const { t } = useI18n();
  const { fmtInt, fmtPct } = useFormat();
  if (!rows.length || steps.length < 2)
    return <p className="ad-empty">{t('这段时间没有数据', 'No data in this period')}</p>;
  const a = steps[0]!,
    b = steps[1]!,
    z = steps[steps.length - 1]!;
  const ratio = (num: number, den: number) => (den ? fmtPct((num / den) * 100) : '—');
  return (
    <div className="ad-table-scroll">
      <table className="ad-table">
        <thead>
          <tr>
            <th>{t('来源', 'Source')}</th>
            {steps.map((s) => (
              <th key={s.id}>{t(s.name, s.nameEn ?? s.id)}</th>
            ))}
            <th>
              {t(a.name, a.nameEn ?? a.id)}→{t(b.name, b.nameEn ?? b.id)}
            </th>
            <th>
              {t(a.name, a.nameEn ?? a.id)}→{t(z.name, z.nameEn ?? z.id)}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.flatMap((r) => {
            const line = (key: string, label: string, values: number[]) => (
              <tr key={key} className={key === r.bucket ? undefined : 'ad-marked'}>
                <td>{label}</td>
                {values.map((v, i) => (
                  <td key={i}>{fmtInt(v)}</td>
                ))}
                <td>{ratio(values[1] ?? 0, values[0] ?? 0)}</td>
                <td>{ratio(values[values.length - 1] ?? 0, values[0] ?? 0)}</td>
              </tr>
            );
            return r.marked
              ? [
                  line(r.bucket, t(r.label, r.labelEn ?? r.bucket), r.steps),
                  line(
                    `${r.bucket}:marked`,
                    `${t('其中', 'Including ')}${t(r.marked.label, r.marked.labelEn ?? 'marked')}`,
                    r.marked.steps,
                  ),
                ]
              : [line(r.bucket, t(r.label, r.labelEn ?? r.bucket), r.steps)];
          })}
        </tbody>
      </table>
    </div>
  );
}
