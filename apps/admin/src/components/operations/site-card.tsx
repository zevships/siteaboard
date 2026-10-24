import type { CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import {
  querySite,
  type SiteDataset,
  type DailyMetrics,
} from '../../../../../packages/core/src/workspace.ts';
import { useI18n, useFormat, change } from '../../lib/reference-format.ts';
import { Delta } from '../reference/delta.tsx';

export function HourBars({
  hours,
  previous,
}: {
  hours: (number | null)[];
  previous: (number | null)[];
}) {
  const { t } = useI18n();
  const max = Math.max(1, ...hours.map((v) => v ?? 0), ...previous.map((v) => v ?? 0));
  const at = hours.findLastIndex((v) => v !== null);
  return (
    <div className="hm-chart">
      <div
        className="hm-bars"
        role="img"
        aria-label={t(
          '今天每小时的访客，灰色是昨天同一小时',
          'Hourly first-seen visitors; gray is yesterday',
        )}
      >
        {Array.from({ length: 24 }, (_, hour) => (
          <span
            key={hour}
            className={`hm-bar${hours[hour] === null ? ' is-later' : ''}${hour === at ? ' is-now' : ''}`}
            style={
              {
                '--v': (hours[hour] ?? 0) / max,
                '--p': (previous[hour] ?? 0) / max,
                '--i': hour,
              } as CSSProperties
            }
            title={`${String(hour).padStart(2, '0')}:00 · ${t('今天', 'Today')} ${hours[hour] ?? '—'} · ${t('昨天', 'Yesterday')} ${previous[hour] ?? '—'}`}
          />
        ))}
      </div>
      <div className="hm-axis" aria-hidden="true">
        <span>{t('0 时', '00h')}</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}
export function DayBars({ days, previous }: { days: DailyMetrics[]; previous: DailyMetrics[] }) {
  const { t } = useI18n();
  const { fmtCount } = useFormat();
  const max = Math.max(1, ...[...days, ...previous].map((d) => d.visitors ?? 0));
  const bar = (day: DailyMetrics, index: number, before: boolean) => (
    <span
      key={day.date}
      className={`hm-day${before ? ' is-before' : ''}`}
      style={{ '--i': index } as CSSProperties}
      title={`${day.date} · ${t('访客人天', 'Visitor-days')} ${fmtCount(day.visitors)} · ${t('目标完成', 'Goals')} ${fmtCount(day.goals)}`}
    >
      <i style={{ '--v': (day.visitors ?? 0) / max } as CSSProperties} />
      <i className="is-step" style={{ '--v': (day.goals ?? 0) / max } as CSSProperties} />
    </span>
  );
  return (
    <div className="hm-chart">
      <div
        className="hm-bars is-days"
        role="img"
        aria-label={t(
          '每天的访客和目标完成：前 7 天在左，近 7 天在右',
          'Daily visitors and goals: previous week on the left, latest week on the right',
        )}
      >
        {previous.map((d, i) => bar(d, i, true))}
        <span className="hm-split" />
        {days.map((d, i) => bar(d, i + 7, false))}
      </div>
      <div className="hm-axis is-weeks">
        <span>{t('前 7 天', 'Previous 7 days')}</span>
        <span>{t('近 7 天', 'Last 7 days')}</span>
      </div>
    </div>
  );
}
function Num({
  label,
  value,
  previous,
}: {
  label: string;
  value: number | null;
  previous: number | null;
}) {
  const { fmtCount } = useFormat();
  const { t } = useI18n();
  return (
    <div className="hm-num">
      <span className="hm-num-label">{label}</span>
      <b className="hm-num-value">{fmtCount(value)}</b>
      <Delta
        value={change(value, previous)}
        upIsGood
        title={t('与上一同期比较', 'Compared with the previous equivalent period')}
      />
    </div>
  );
}
export function SiteCard({ site, index }: { site: SiteDataset; index: number }) {
  const { t } = useI18n();
  const { fmtCount } = useFormat();
  const today = querySite(site, 'today'),
    week = querySite(site, '7d');
  const to = (tab: string, period = '7d') => ({ site: site.id, tab, period, days: 7 });
  const open = site.issues.filter((i) => i.status !== 'resolved');
  const cutoff = new Intl.DateTimeFormat('en-GB', {
    timeZone: site.time.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(site.time.fetchedAt));
  const note = t(`和昨天到 ${cutoff} 比`, `vs. yesterday through ${cutoff}`);
  return (
    <article className="hm-site" data-site={site.id}>
      <header className="hm-site-head">
        <span
          className="hm-mark"
          style={{ '--hm-hue': 255 + index * 63 } as CSSProperties}
          aria-hidden="true"
        >
          {site.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="hm-site-title">
          <h2>
            <Link to="/sites" search={to('overview')}>
              {site.domain}
            </Link>
          </h2>
          <p className="hm-meta">
            <span>
              <i className="hm-pulse" />
              {site.provenance.quality === 'demo'
                ? t('演示快照', 'Demo snapshot')
                : site.provenance.source}
            </span>
            <span>
              {t('完整数据截至', 'Complete through')} {site.time.dataThrough} · {site.time.timezone}
            </span>
          </p>
        </div>
        <nav className="hm-site-nav" aria-label={`${site.name} ${t('页面', 'pages')}`}>
          {[
            ['overview', t('概览', 'Overview')],
            ['feedback', t('反馈', 'Feedback')],
            ['search', t('搜索', 'Search')],
            ['issues', t('问题', 'Issues')],
          ].map(([tab, label]) => (
            <Link key={tab} to="/sites" search={to(tab)}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="hm-panels">
        <Link className="hm-panel" to="/sites" search={to('overview', 'today')}>
          <h3>
            {t('今天', 'Today')}
            <span>
              {t('到', 'Through')} {cutoff}
            </span>
          </h3>
          <div className="hm-nums">
            <Num
              label={t('访客', 'Visitors')}
              value={today.totals.visitors}
              previous={today.previousTotals.visitors}
            />
            <Num
              label={t('目标完成', 'Goals')}
              value={today.totals.goals}
              previous={today.previousTotals.goals}
            />
          </div>
          <HourBars hours={site.hourly.today} previous={site.hourly.yesterday} />
          <p className="hm-foot">{note}</p>
        </Link>
        <Link className="hm-panel" to="/sites" search={to('overview')}>
          <h3>
            {t('近 7 天', 'Last 7 days')}
            <span>
              {week.from.slice(5)} → {week.to.slice(5)}
            </span>
          </h3>
          <div className="hm-nums">
            <Num
              label={t('访客人天', 'Visitor-days')}
              value={week.totals.visitors}
              previous={week.previousTotals.visitors}
            />
            <Num
              label={t('目标完成', 'Goals')}
              value={week.totals.goals}
              previous={week.previousTotals.goals}
            />
          </div>
          <DayBars days={week.current} previous={week.previous} />
          <p className="hm-foot">
            {t('和前 7 天比 ·', 'vs. previous 7 days ·')}
            <i className="hm-key" />
            {t('访客', 'Visitors')}
            <i className="hm-key is-step" />
            {t('目标完成', 'Goals')}
          </p>
        </Link>
        <div className="hm-side-tiles">
          <Link className="hm-tile" to="/sites" search={to('search')}>
            <h3>{t('搜索点击 · 7 天', 'Search clicks · 7 days')}</h3>
            <dl className="hm-engines">
              <div>
                <dt>Google</dt>
                <dd>{fmtCount(week.totals.googleClicks)}</dd>
              </div>
              <div>
                <dt>Bing</dt>
                <dd>{fmtCount(week.totals.bingClicks)}</dd>
              </div>
            </dl>
          </Link>
          <Link className="hm-tile" to="/sites" search={to('issues')}>
            <h3>{t('问题', 'Issues')}</h3>
            <dl className="hm-issues">
              <div>
                <dt>{t('未解决', 'Unresolved')}</dt>
                <dd>{open.length}</dd>
              </div>
              <div className="is-owner">
                <dt>{t('等你决定', 'Decisions')}</dt>
                <dd>{open.filter((i) => i.kind === 'decision').length}</dd>
              </div>
              <div className="is-owner">
                <dt>{t('该复查', 'Review due')}</dt>
                <dd>{open.filter((i) => i.reviewAt && i.reviewAt <= site.time.today).length}</dd>
              </div>
            </dl>
          </Link>
        </div>
      </div>
    </article>
  );
}
