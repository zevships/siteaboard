import { BarCard } from '../../../components/reference/bar-card.tsx';
import { Delta } from '../../../components/reference/delta.tsx';
import { FunnelStrip } from '../../../components/reference/funnel.tsx';
import { LineChart, type ChartSeries } from '../../../components/reference/line-chart.tsx';
import { useFormat } from '../../../lib/reference-format.ts';
import { useSiteText } from '../../../locales/site.ts';
import { EmptyData, KpiRows, SectionCard, ratio } from './shared.tsx';
import {
  add,
  groupBy,
  groupBreakdowns,
  inRange,
  useLocalized,
  type SectionProps,
} from './model.ts';
import type { MetricKey } from '../../../../../../packages/core/src/workspace.ts';

export default function OverviewSection({ site, query }: SectionProps) {
  const t = useSiteText();
  const localize = useLocalized();
  const { fmtInt, fmtPct, fmtRatio, fmtDuration, change } = useFormat();
  const keys = ['visitors', 'opens', 'starts', 'completions', 'goals'] as const;
  const labels = ['arrival', 'open', 'start', 'complete', 'goal'] as const;
  const eventIds = ['visitors', 'opens', 'starts', 'completions', 'goals'];
  const steps = keys.map((key, i) => ({
    id: key,
    name: t(labels[i]),
    nameEn: t(labels[i]),
    event: eventIds[i],
    filter: '',
    definition: t(labels[i]),
    visitors: query.totals[key],
    prev: query.previousTotals[key],
    byPoint: query.current.map((p) => p[key]),
  }));
  const isHourly = query.period === 'today';
  const independent = site.provenance.funnelDefinition === 'independent-event-counts';
  const ticks = isHourly
    ? site.hourly.today.map((_, i) => `${i}:00`)
    : query.current.map((p) => p.date.slice(5));
  const titles = isHourly
    ? ticks.map((tick) => `${query.to} ${tick}`)
    : query.current.map((p) => p.date);
  const series: ChartSeries[] = isHourly
    ? [
        {
          key: 'visitors',
          label: t('visitors'),
          tone: 's1',
          values: site.hourly.today,
          area: true,
        },
        { key: 'previous', label: t('yesterday'), tone: 'prev', values: site.hourly.yesterday },
      ]
    : [0, 1, 4].map((i, k) => ({
        key: keys[i],
        label: t(labels[i]),
        tone: (['s1', 's2', 's3'] as const)[k],
        values: steps[i].byPoint,
      }));
  const breakdowns = site.breakdowns.filter((r) => inRange(r.date, query));
  const eventRows = [
    ...groupBy(
      site.events.filter((r) => inRange(r.date, query)),
      (r) => r.event,
    ),
  ].map(([event, rows]) => ({
    event,
    name: localize(rows[0].name),
    visitors: add(rows.map((r) => r.visitors)),
    events: add(rows.map((r) => r.events)),
  }));
  const sourceRows = groupBreakdowns(breakdowns.filter((r) => r.dimension === 'source'));
  const rowsFor = (dimension: (typeof site.breakdowns)[number]['dimension']) =>
    groupBreakdowns(breakdowns.filter((r) => r.dimension === dimension)).map((r) => ({
      label: r.name,
      visitors: r.visitors,
    }));
  const sourceComplete =
    sourceRows.length > 0 &&
    keys.every((key) => {
      const values = sourceRows.map((r) => r[key]);
      return (
        !values.includes(null) &&
        query.totals[key] !== null &&
        values.reduce<number>((sum, v) => sum + (v ?? 0), 0) === query.totals[key]
      );
    });
  const counts: ['visitors' | 'visits' | 'pageviews', MetricKey][] = [
    ['visitors', 'visitors'],
    ['visits', 'visits'],
    ['pageviews', 'pageviews'],
  ];
  const bounce = ratio(query.totals.bounces, query.totals.visits);
  const prevBounce = ratio(query.previousTotals.bounces, query.previousTotals.visits);
  const views =
    query.totals.pageviews !== null && query.totals.visits
      ? query.totals.pageviews / query.totals.visits
      : null;
  const prevViews =
    query.previousTotals.pageviews !== null && query.previousTotals.visits
      ? query.previousTotals.pageviews / query.previousTotals.visits
      : null;
  const duration =
    query.totals.durationSeconds !== null && query.totals.visits
      ? query.totals.durationSeconds / query.totals.visits
      : null;
  const prevDuration =
    query.previousTotals.durationSeconds !== null && query.previousTotals.visits
      ? query.previousTotals.durationSeconds / query.previousTotals.visits
      : null;
  return (
    <div className="sa-site-stack">
      {site.notes.length ? (
        <details className="ad-card ad-fold ad-readnotes" open>
          <summary>
            <h2>{t('notes')}</h2>
            <span className="ad-card-sub">
              {site.notes.length} · {t('notesHint')}
            </span>
          </summary>
          <ol>
            {site.notes.map((note, i) => (
              <li key={i}>{localize(note)}</li>
            ))}
          </ol>
        </details>
      ) : null}
      {independent ? <p className="ad-card-sub">{t('countsNote')}</p> : null}
      <FunnelStrip steps={steps} northStar="goals" compareTitle={t('previous')} />
      <SectionCard
        title={isHourly ? t('visitors') : t(independent ? 'stageCounts' : 'funnel')}
        note={isHourly ? t('hourly') : t('daily')}
        className="ad-chart-card"
      >
        <LineChart
          ticks={ticks}
          titles={titles}
          series={series}
          markers={site.releases
            .filter((r) => inRange(r.date, query))
            .map((r) => ({
              index: query.current.findIndex((p) => p.date === r.date),
              label: r.version,
            }))}
          format={fmtInt}
          caption={isHourly ? t('visitors') : t(independent ? 'stageCounts' : 'funnel')}
        />
      </SectionCard>
      <SectionCard
        title={t(independent ? 'sourceCounts' : 'sources')}
        note={sourceComplete ? t('sourceHint') : t('missingFootnote')}
      >
        {sourceRows.length ? (
          <div className="ad-table-scroll">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t('source')}</th>
                  {labels.map((l) => (
                    <th key={l}>{t(l)}</th>
                  ))}
                  <th>{t(independent ? 'goalRatio' : 'conversion')}</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    {keys.map((k) => (
                      <td key={k}>{fmtInt(r[k])}</td>
                    ))}
                    <td>{fmtPct(ratio(r.goals, r.visitors))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyData />
        )}
      </SectionCard>
      <h3 className="ad-section-title">{t('traffic')}</h3>
      <KpiRows
        columns={6}
        rows={[
          ...counts.map(([label, key]) => ({
            label: label === 'visitors' && query.current.length > 1 ? t('visitorDays') : t(label),
            value: fmtInt(query.totals[key]),
            sub: <Delta value={change(query.totals[key], query.previousTotals[key])} upIsGood />,
          })),
          {
            label: t('viewsPerVisit'),
            value: fmtRatio(views),
            sub: <Delta value={change(views, prevViews)} upIsGood />,
          },
          {
            label: t('bounce'),
            value: fmtPct(bounce),
            sub: (
              <Delta value={change(bounce, prevBounce, 'points')} kind="points" upIsGood={false} />
            ),
          },
          {
            label: t('duration'),
            value: fmtDuration(duration),
            sub: <Delta value={change(duration, prevDuration)} upIsGood />,
          },
        ]}
      />
      <div className="ad-grid">
        <BarCard
          title={t('source')}
          tabs={[{ key: 'source', label: t('source'), rows: rowsFor('source') }]}
          total={query.totals.visitors}
        />
        <BarCard
          title={t('page')}
          tabs={[{ key: 'page', label: t('page'), rows: rowsFor('page') }]}
          total={query.totals.visitors}
        />
        <BarCard
          title={t('location')}
          tabs={(['country', 'city'] as const).map((key) => ({
            key,
            label: t(key),
            rows: rowsFor(key),
          }))}
          total={query.totals.visitors}
        />
        <BarCard
          title={t('device')}
          tabs={(['device', 'browser', 'os'] as const).map((key) => ({
            key,
            label: t(key),
            rows: rowsFor(key),
          }))}
          total={query.totals.visitors}
        />
      </div>
      <details className="ad-card ad-fold" open>
        <summary>
          <h2>{t('events')}</h2>
          <span className="ad-card-sub">{t('eventHint')}</span>
        </summary>
        <div className="ad-table-scroll">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{t('events')}</th>
                <th>{t('visitors')}</th>
                <th>{t('count')}</th>
                <th>{t('conversion')}</th>
              </tr>
            </thead>
            <tbody>
              {eventRows.map((s) => (
                <tr key={s.event}>
                  <td>
                    <span className="ad-mono">{s.event}</span>
                    <span className="ad-zh"> · {s.name}</span>
                  </td>
                  <td>{fmtInt(s.visitors)}</td>
                  <td>{fmtInt(s.events)}</td>
                  <td>{fmtPct(ratio(s.visitors, query.totals.visitors))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
