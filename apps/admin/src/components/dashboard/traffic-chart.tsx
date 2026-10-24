import { useId, useState } from 'react';
import type { DailyPoint } from '../../../../../packages/core/src/dashboard.ts';
import { usePreferences } from '../../providers/preferences.tsx';

export function TrafficChart({ points }: { points: DailyPoint[] }) {
  const { t, number, preferences } = usePreferences();
  const [showData, setShowData] = useState(false);
  const gradient = useId().replace(/:/g, '');
  const top = Math.ceil(Math.max(...points.map((p) => Math.max(p.visits, p.previous))) / 400) * 400;
  const width = 800,
    height = 200;
  const line = (field: 'visits' | 'previous') =>
    points
      .map(
        (point, i) =>
          `${i ? 'L' : 'M'} ${(i / (points.length - 1)) * width} ${height - (point[field] / top) * height}`,
      )
      .join(' ');
  const indexes = [
    0,
    Math.round((points.length - 1) / 3),
    Math.round(((points.length - 1) * 2) / 3),
    points.length - 1,
  ];
  const dateLabel = (day: string) =>
    new Intl.DateTimeFormat(preferences.locale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${day}T12:00:00Z`));
  return (
    <div className="chart-section">
      <div className="chart-body">
        <div className="chart-y">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <span key={ratio}>{number(top * ratio)}</span>
          ))}
        </div>
        <div className="chart-plot">
          <svg
            role="img"
            aria-label={t('chartLabel')}
            viewBox={`0 -8 ${width} ${height + 16}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity=".18" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                x2={width}
                y1={height * ratio}
                y2={height * ratio}
                stroke="var(--border)"
                strokeDasharray="3 5"
              />
            ))}
            <path
              d={`${line('visits')} L ${width} ${height} L 0 ${height} Z`}
              fill={`url(#${gradient})`}
            />
            <path
              d={line('previous')}
              fill="none"
              stroke="var(--chart-muted)"
              strokeWidth="2"
              strokeDasharray="5 6"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line('visits')}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.7"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="chart-x">
            {indexes.map((i) => (
              <span key={i}>{dateLabel(points[i].day)}</span>
            ))}
          </div>
        </div>
      </div>
      <button
        className="text-button chart-table-toggle"
        aria-expanded={showData}
        onClick={() => setShowData(!showData)}
      >
        {t(showData ? 'hideData' : 'showData')}
      </button>
      {showData && (
        <div className="table-scroll chart-table">
          <table>
            <caption className="sr-only">{t('trafficTitle')}</caption>
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('current')}</th>
                <th>{t('previous')}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.day}>
                  <td>{p.day}</td>
                  <td>{number(p.visits)}</td>
                  <td>{number(p.previous)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
