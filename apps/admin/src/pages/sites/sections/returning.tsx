import { StackedBars } from '../../../components/reference/stacked-bars.tsx';
import { Delta } from '../../../components/reference/delta.tsx';
import { useFormat } from '../../../lib/reference-format.ts';
import { useSiteText } from '../../../locales/site.ts';
import { SectionCard, KpiRows, ratio, EmptyData, CountRows } from './shared.tsx';
import { add, inRange, type SectionProps } from './model.ts';

export default function ReturningSection({ site, query }: SectionProps) {
  const t = useSiteText();
  const { fmtInt, fmtPct, change } = useFormat();
  const rows = site.returning
    .filter((r) => inRange(r.date, query))
    .sort((a, b) => a.date.localeCompare(b.date));
  const previous = site.returning.filter(
    (r) => r.date >= query.previousFrom && r.date <= query.previousTo,
  );
  const first = add(rows.map((r) => r.newVisitors));
  const returning = add(rows.map((r) => r.returningVisitors));
  const counted = first !== null && returning !== null ? first + returning : null;
  const pFirst = add(previous.map((r) => r.newVisitors));
  const pReturning = add(previous.map((r) => r.returningVisitors));
  const pTotal = pFirst !== null && pReturning !== null ? pFirst + pReturning : null;
  const nowRate = ratio(returning, counted);
  const beforeRate = ratio(pReturning, pTotal);
  const newGoals = add(rows.map((r) => r.newGoals));
  const returnGoals = add(rows.map((r) => r.returningGoals));
  const bands = [
    ['newVisitors', 'firstVisit', 'first'],
    ['sameDayReturns', 'sameDay', 'none'],
    ['days1to7', 'returning1', 'r1'],
    ['days8to30', 'returning2', 'r2'],
    ['days31plus', 'returning3', 'r4'],
  ] as const;
  const completeRows = rows.filter((r) => bands.every(([key]) => r[key] !== null));
  return (
    <div className="sa-site-stack">
      <KpiRows
        rows={[
          {
            label: t('returningShare'),
            value: fmtPct(nowRate),
            sub: <Delta value={change(nowRate, beforeRate, 'points')} kind="points" upIsGood />,
          },
          {
            label: t('personDays'),
            value: fmtInt(returning),
            sub: `${t('visitors')} ${fmtInt(counted)}`,
          },
          {
            label: t('firstVisit'),
            value: fmtInt(first),
            sub: `${t('conversion')} ${fmtPct(ratio(newGoals, first))}`,
          },
          {
            label: t('returnConversion'),
            value: fmtPct(ratio(returnGoals, returning)),
            sub: `${t('goal')} ${fmtInt(returnGoals)}`,
          },
        ]}
      />
      <SectionCard title={t('visitsHistory')} note={t('returningNote')}>
        {completeRows.length ? (
          <StackedBars
            ticks={completeRows.map((r) => r.date.slice(5))}
            titles={completeRows.map((r) => r.date)}
            series={bands.map(([key, label, tone]) => ({
              key,
              label: t(label),
              tone,
              values: completeRows.map((r) => r[key]!),
            }))}
            unit={t('personDays')}
            caption={t('visitsHistory')}
          />
        ) : (
          <EmptyData />
        )}
        {completeRows.length !== rows.length ? (
          <p className="ad-card-foot">
            {t('missingFootnote')} · {completeRows.length}/{rows.length}
          </p>
        ) : null}
      </SectionCard>
      <div className="ad-grid">
        <SectionCard title={t('share')}>
          <CountRows
            rows={bands
              .map(([key, label]) => ({ label: t(label), n: add(rows.map((r) => r[key])) }))
              .filter((r): r is { label: string; n: number } => r.n !== null)}
          />
        </SectionCard>
        <SectionCard title={t('returnConversion')}>
          <div className="ad-table-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t('returning')}</th>
                  <th>{t('visitors')}</th>
                  <th>{t('goal')}</th>
                  <th>{t('conversion')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('firstVisit')}</td>
                  <td>{fmtInt(first)}</td>
                  <td>{fmtInt(newGoals)}</td>
                  <td>{fmtPct(ratio(newGoals, first))}</td>
                </tr>
                <tr>
                  <td>{t('returning')}</td>
                  <td>{fmtInt(returning)}</td>
                  <td>{fmtInt(returnGoals)}</td>
                  <td>{fmtPct(ratio(returnGoals, returning))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
