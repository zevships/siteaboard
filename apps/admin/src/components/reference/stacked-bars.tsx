import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { useFormat } from '../../lib/reference-format.ts';
import { useI18n } from '../../lib/reference-format.ts';
import { niceStep } from './line-chart';

export type StackSeries = {
  key: string;
  label: string;

  tone: string;
  values: number[];
};

export type StackSeam = { index: number; label: string };

type Props = {
  ticks: string[];

  titles: string[];

  series: StackSeries[];

  seams?: StackSeam[];

  unit: string;

  caption: string;
  firstColumn?: string;
  height?: number;
};

const M = { top: 24, right: 12, bottom: 26, left: 44 };
const GAP = 2;
const RADIUS = 4;
const MAX_BAR = 24;

function segment(x: number, y: number, w: number, h: number, round: boolean) {
  const r = round ? Math.min(RADIUS, w / 2, h) : 0;
  if (!r) return `M${x},${y + h}V${y}H${x + w}V${y + h}Z`;
  return `M${x},${y + h}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h}Z`;
}

export function StackedBars({
  ticks,
  titles,
  series,
  seams = [],
  unit,
  caption,
  firstColumn,
  height = 260,
}: Props) {
  const { t } = useI18n();
  const { fmtInt, fmtPct } = useFormat();
  const wrap = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? 880;
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = (w: number) => setMeasured(Math.max(280, Math.round(w)));
    measure(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) measure(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = ticks.length;
  const totals = ticks.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0));
  const max = Math.max(0, ...totals);
  const step = niceStep(max > 0 ? max / 4 : 1);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const yTicks: number[] = [];
  for (let k = 0; k * step <= top + step / 1000; k++) yTicks.push(Number((k * step).toFixed(10)));
  const iw = Math.max(1, width - M.left - M.right);
  const ih = height - M.top - M.bottom;
  const slot = iw / Math.max(1, n);
  const bar = Math.max(2, Math.min(MAX_BAR, slot - Math.max(GAP, slot * 0.3)));
  const cx = (i: number) => M.left + slot * (i + 0.5);
  const y = (v: number) => M.top + ih - (v / top) * ih;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 56))));
  const topDown = [...series].reverse();
  const shown = seams.length > 1 ? seams : [];

  const pick = (clientX: number, target: Element) => {
    const rect = target.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * iw;
    setHover(Math.min(n - 1, Math.max(0, Math.floor(px / slot))));
  };
  const onKey = (e: KeyboardEvent<SVGRectElement>) => {
    const at = hover ?? n - 1;
    const next =
      e.key === 'ArrowLeft'
        ? Math.max(0, at - 1)
        : e.key === 'ArrowRight'
          ? Math.min(n - 1, at + 1)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : null;
    if (next !== null) {
      e.preventDefault();
      setHover(next);
    }
  };

  const tipLeft = hover === null ? 0 : cx(hover);
  const flip = hover !== null && tipLeft > width * 0.6;

  return (
    <div>
      <ul className="ad-legend" aria-label={t('图例', 'Legend')}>
        {topDown.map((s) => (
          <li key={s.key}>
            <span className={`ad-key ad-key-sq ad-tone-${s.tone}`} aria-hidden />
            {s.label}
          </li>
        ))}
      </ul>
      <div
        className="ad-chart ad-stacks"
        ref={wrap}
        style={measured === null ? { height } : undefined}
      >
        {measured === null || !n ? null : (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={caption}
            className={hover !== null ? 'is-hovering' : undefined}
          >
            <defs>
              <pattern
                id="ad-hatch"
                patternUnits="userSpaceOnUse"
                width="5"
                height="5"
                patternTransform="rotate(45)"
              >
                <line className="hatch" x1="0" y1="0" x2="0" y2="5" />
              </pattern>
            </defs>
            {yTicks.map((v) => (
              <g key={v}>
                <line
                  className={v === 0 ? 'base' : 'grid'}
                  x1={M.left}
                  x2={M.left + iw}
                  y1={y(v)}
                  y2={y(v)}
                />
                <text className="tick" x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end">
                  {fmtInt(v)}
                </text>
              </g>
            ))}
            {ticks.map((t, i) =>
              i % every === 0 ? (
                <text key={i} className="tick" x={cx(i)} y={M.top + ih + 18} textAnchor="middle">
                  {t}
                </text>
              ) : null,
            )}
            {shown.map((s) => (
              <g key={`s${s.index}`}>
                {s.index > 0 ? (
                  <line
                    className="seam"
                    x1={M.left + slot * s.index}
                    x2={M.left + slot * s.index}
                    y1={M.top - 14}
                    y2={M.top + ih}
                  />
                ) : null}
                <text className="seam-label" x={M.left + slot * s.index + 4} y={M.top - 6}>
                  {s.label}
                </text>
              </g>
            ))}
            {ticks.map((_, i) => {
              const parts = series.filter((s) => (s.values[i] ?? 0) > 0);
              let base = y(0);
              return (
                <g key={`b${i}`} className={hover === i ? 'bar is-hover' : 'bar'}>
                  {parts.map((s, j) => {
                    const h = ((s.values[i] ?? 0) / top) * ih;
                    const foot = j ? GAP : 0;
                    const drawn = h - foot;
                    const yTop = base - h;
                    base = yTop;
                    return drawn >= 0.5 ? (
                      <path
                        key={s.key}
                        className={`seg ad-tone-${s.tone}`}
                        d={segment(cx(i) - bar / 2, yTop, bar, drawn, j === parts.length - 1)}
                      />
                    ) : null;
                  })}
                </g>
              );
            })}
            <rect
              className="hit"
              x={M.left}
              y={M.top}
              width={iw}
              height={ih}
              tabIndex={0}
              aria-label={`${caption}${t('：用左右方向键逐天查看', ': use the left and right arrow keys to inspect days')}`}
              onPointerMove={(e: PointerEvent<SVGRectElement>) => pick(e.clientX, e.currentTarget)}
              onPointerDown={(e: PointerEvent<SVGRectElement>) => pick(e.clientX, e.currentTarget)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover((h) => h ?? n - 1)}
              onBlur={() => setHover(null)}
              onKeyDown={onKey}
            />
          </svg>
        )}
        {hover !== null ? (
          <div
            className="ad-tip"
            style={{
              left: flip ? tipLeft - 16 : tipLeft + 16,
              transform: flip ? 'translateX(-100%)' : undefined,
            }}
            role="status"
          >
            <div className="ad-tip-title">{titles[hover]}</div>
            {topDown.map((s) => (
              <div className="ad-tip-row" key={s.key}>
                <span className={`ad-key ad-key-sq ad-tone-${s.tone}`} aria-hidden />
                <b>{fmtInt(s.values[hover] ?? 0)}</b>
                <span>
                  {s.label}
                  {totals[hover]
                    ? ` · ${fmtPct(((s.values[hover] ?? 0) / totals[hover]!) * 100, 0)}`
                    : ''}
                </span>
              </div>
            ))}
            <div className="ad-tip-release">
              {t('合计', 'Total')}
              {fmtInt(totals[hover])} {unit}
            </div>
          </div>
        ) : null}
      </div>
      <details className="ad-table-view">
        <summary>{t('表格', 'Table')}</summary>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{firstColumn ?? t('日期', 'Date')}</th>
                {topDown.map((s) => (
                  <th key={s.key}>{s.label}</th>
                ))}
                <th>{t('合计', 'Total')}</th>
              </tr>
            </thead>
            <tbody>
              {titles.map((t, i) => (
                <tr key={i}>
                  <td>{t}</td>
                  {topDown.map((s) => (
                    <td key={s.key}>{fmtInt(s.values[i] ?? 0)}</td>
                  ))}
                  <td>{fmtInt(totals[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
