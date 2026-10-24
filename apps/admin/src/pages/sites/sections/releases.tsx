import { useState } from 'react';
import { shiftDate, sumCounts } from '../../../../../../packages/core/src/workspace.ts';
import { Delta } from '../../../components/reference/delta.tsx';
import { useSiteText } from '../../../locales/site.ts';
import { useFormat } from '../../../lib/reference-format.ts';
import { SectionCard, EmptyData, ratio } from './shared.tsx';
import { inRange, useLocalized, type SectionProps } from './model.ts';

const keys = ['visitors', 'opens', 'starts', 'completions', 'goals'] as const;
const labels = ['arrival', 'open', 'start', 'complete', 'goal'] as const;
export default function ReleasesSection({ site, query }: SectionProps) {
  const t = useSiteText();
  const localize = useLocalized();
  const { fmtInt, fmtPct } = useFormat();
  const [open, setOpen] = useState<string | null>(null);
  const rows = site.releases
    .filter((r) => inRange(r.date, query))
    .sort((a, b) => b.date.localeCompare(a.date));
  const side = (date: string, offset: number) => {
    const dates = Array.from({ length: 3 }, (_, i) => shiftDate(date, offset + i));
    const readings = dates.map((day) => site.daily.find((r) => r.date === day));
    return {
      from: dates[0],
      to: dates[2],
      days: readings.filter(Boolean).length,
      steps: keys.map((key) => sumCounts(readings.map((r) => r?.[key] ?? null))),
    };
  };
  const sideCells = (value: ReturnType<typeof side>) => (
    <>
      <td>{fmtInt(value.steps[0])}</td>
      <td>{fmtInt(value.steps.at(-1))}</td>
      <td>
        {fmtPct(ratio(value.steps.at(-1), value.steps[0]))}
        {value.days < 3 ? (
          <span className="ad-sub">
            {value.days}/3 · {t('pending')}
          </span>
        ) : null}
      </td>
    </>
  );
  return (
    <div className="sa-site-stack">
      <p className="ad-footnote">{t('releaseNote')}</p>
      <SectionCard title={t('releaseTitle')} note={t('releaseHint')}>
        {rows.length ? (
          <div className="ad-table-scroll">
            <table className="ad-table ad-releases">
              <thead>
                <tr>
                  <th rowSpan={2}>{t('release')}</th>
                  <th colSpan={3}>{t('before')}</th>
                  <th colSpan={3}>{t('after')}</th>
                  <th rowSpan={2}>{t('conversionChange')}</th>
                  <th rowSpan={2}>{t('description')}</th>
                </tr>
                <tr>
                  <th>{t('arrival')}</th>
                  <th>{t('goal')}</th>
                  <th>{t('conversion')}</th>
                  <th>{t('arrival')}</th>
                  <th>{t('goal')}</th>
                  <th>{t('conversion')}</th>
                </tr>
              </thead>
              {rows.map((r) => {
                const before = side(r.date, -3),
                  after = side(r.date, 1);
                const beforeRate = ratio(before.steps.at(-1), before.steps[0]),
                  afterRate = ratio(after.steps.at(-1), after.steps[0]);
                const isOpen = open === r.id;
                const nearby = site.releases.filter(
                  (other) =>
                    other.id !== r.id &&
                    Math.abs(Date.parse(other.date) - Date.parse(r.date)) <= 3 * 86400000,
                );
                return (
                  <tbody key={r.id}>
                    <tr>
                      <td>
                        <button
                          className="ad-row-toggle"
                          onClick={() => setOpen(isOpen ? null : r.id)}
                          aria-expanded={isOpen}
                        >
                          <span aria-hidden>{isOpen ? '▾' : '▸'}</span>
                          <span className="ad-mono">{r.version}</span>
                        </button>
                        <span className="ad-sub">{r.date}</span>
                      </td>
                      {sideCells(before)}
                      {sideCells(after)}
                      <td>
                        <Delta
                          value={
                            beforeRate === null || afterRate === null
                              ? null
                              : afterRate - beforeRate
                          }
                          kind="points"
                          upIsGood
                        />
                      </td>
                      <td className="ad-wrap">
                        {localize(r.title)}
                        {nearby.length ? (
                          <span
                            className="ad-warn ad-sub"
                            title={nearby.map((r) => r.version).join(', ')}
                          >
                            {t('overlap')}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr>
                        <td colSpan={9} className="sa-release-detail">
                          <p>{localize(r.description)}</p>
                          <ul>
                            {r.changes.map((change, i) => (
                              <li key={i}>{localize(change)}</li>
                            ))}
                          </ul>
                          {r.issueIds.length ? (
                            <p className="ad-muted">
                              {t('issues')}: {r.issueIds.join(' · ')}
                            </p>
                          ) : null}
                          <table className="ad-table ad-table-inner">
                            <thead>
                              <tr>
                                <th>{t('step')}</th>
                                <th>
                                  {t('before')}
                                  <span className="ad-sub">
                                    {before.from} → {before.to}
                                  </span>
                                </th>
                                <th>{t('sharePrevious')}</th>
                                <th>
                                  {t('after')}
                                  <span className="ad-sub">
                                    {after.from} → {after.to}
                                  </span>
                                </th>
                                <th>{t('sharePrevious')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {keys.map((key, i) => (
                                <tr key={key}>
                                  <td>{t(labels[i])}</td>
                                  <td>{fmtInt(before.steps[i])}</td>
                                  <td>
                                    {i ? fmtPct(ratio(before.steps[i], before.steps[i - 1])) : '—'}
                                  </td>
                                  <td>{fmtInt(after.steps[i])}</td>
                                  <td>
                                    {i ? fmtPct(ratio(after.steps[i], after.steps[i - 1])) : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                );
              })}
            </table>
          </div>
        ) : (
          <EmptyData />
        )}
      </SectionCard>
    </div>
  );
}
