import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { useI18n } from '../../lib/reference-format.ts';

export type Tone = 's1' | 's2' | 's3' | 'prev';

export type ChartSeries = {
  key: string;
  label: string;
  tone: Tone;
  values: (number | null)[];

  notes?: string[];
  area?: boolean;
};

export type ChartMarker = { index: number; label: string; kind?: 'note' };

type Props = {
  ticks: string[];

  titles: string[];
  series: ChartSeries[];
  markers?: ChartMarker[];
  format: (v: number | null) => string;
  tickFormat?: (v: number) => string;

  caption: string;
  firstColumn?: string;
  height?: number;
};

const M = { top: 14, right: 16, bottom: 26, left: 56 };

export function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

type Run = [number, number][];
function runs(values: (number | null)[]): Run[] {
  const out: Run[] = [];
  let current: Run | null = null;
  values.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) {
      current = null;
      return;
    }
    if (!current) {
      current = [];
      out.push(current);
    }
    current.push([i, v]);
  });
  return out;
}

export function LineChart({
  ticks,
  titles,
  series,
  markers = [],
  format,
  tickFormat,
  caption,
  firstColumn,
  height = 260,
}: Props) {
  const { t } = useI18n();
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
  const finite = series
    .flatMap((s) => s.values)
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const max = finite.length ? Math.max(...finite) : 0;
  const step = niceStep(max > 0 ? max / 4 : 1);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const yTicks: number[] = [];
  for (let k = 0; k * step <= top + step / 1000; k++) yTicks.push(Number((k * step).toFixed(10)));
  const iw = Math.max(1, width - M.left - M.right);
  const ih = height - M.top - M.bottom;
  const x = (i: number) => M.left + (n <= 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v: number) => M.top + ih - (v / top) * ih;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  const yLabel = tickFormat ?? ((v: number) => format(v));

  const byIndex = new Map<number, string[]>();
  const noteIndex = new Map<number, string[]>();
  for (const m of markers)
    if (m.index >= 0 && m.index < n) {
      const into = m.kind === 'note' ? noteIndex : byIndex;
      into.set(m.index, [...(into.get(m.index) ?? []), m.label]);
    }

  const pick = (clientX: number, target: Element) => {
    const rect = target.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * iw;
    setHover(n <= 1 ? 0 : Math.min(n - 1, Math.max(0, Math.round((px / iw) * (n - 1)))));
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

  const tipLeft = hover === null ? 0 : x(hover);
  const flip = hover !== null && tipLeft > width * 0.6;
  const legend = series.length > 1 || byIndex.size > 0 || noteIndex.size > 0;

  return (
    <div>
      {legend ? (
        <ul className="ad-legend" aria-label={t('图例', 'Legend')}>
          {series.map((s) => (
            <li key={s.key}>
              <span className={`ad-key ad-key-${s.tone}`} aria-hidden />
              {s.label}
            </li>
          ))}
          {byIndex.size ? (
            <li>
              <span className="ad-key ad-key-release" aria-hidden />
              {t('发版', 'Release')}
            </li>
          ) : null}
          {noteIndex.size ? (
            <li>
              <span className="ad-key ad-key-note" aria-hidden />
              {t('读数注意', 'Reading notes')}
            </li>
          ) : null}
        </ul>
      ) : null}
      <div className="ad-chart" ref={wrap} style={measured === null ? { height } : undefined}>
        {measured === null ? null : (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={caption}
          >
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
                  {yLabel(v)}
                </text>
              </g>
            ))}
            {ticks.map((t, i) =>
              i % every === 0 ? (
                <text
                  key={i}
                  className="tick"
                  x={x(i)}
                  y={M.top + ih + 18}
                  textAnchor={n > 1 && i === 0 ? 'start' : 'middle'}
                >
                  {t}
                </text>
              ) : null,
            )}
            {[...byIndex.keys()].map((i) => (
              <g key={`m${i}`}>
                <line className="release" x1={x(i)} x2={x(i)} y1={M.top} y2={M.top + ih} />
                <circle className="release-dot" cx={x(i)} cy={M.top} r={4} />
              </g>
            ))}
            {[...noteIndex.keys()].map((i) => (
              <g key={`n${i}`}>
                <line className="note" x1={x(i)} x2={x(i)} y1={M.top} y2={M.top + ih} />
                <rect className="note-dot" x={x(i) - 4} y={M.top + ih - 4} width={8} height={8} />
              </g>
            ))}
            {series.map((s) =>
              s.area
                ? runs(s.values).map((run, k) => (
                    <path
                      key={`a${s.key}${k}`}
                      className={`area ${s.tone}`}
                      d={`M${x(run[0]![0])},${y(0)}${run.map(([i, v]) => `L${x(i)},${y(v)}`).join('')}L${x(run[run.length - 1]![0])},${y(0)}Z`}
                    />
                  ))
                : null,
            )}
            {series.map((s) =>
              runs(s.values).map((run, k) =>
                run.length > 1 ? (
                  <path
                    key={`l${s.key}${k}`}
                    className={`line ${s.tone}`}
                    d={run.map(([i, v], j) => `${j ? 'L' : 'M'}${x(i)},${y(v)}`).join('')}
                  />
                ) : (
                  <circle
                    key={`p${s.key}${k}`}
                    className={`dot ${s.tone}`}
                    cx={x(run[0]![0])}
                    cy={y(run[0]![1])}
                    r={4}
                  />
                ),
              ),
            )}
            {series
              .filter((s) => s.tone !== 'prev')
              .map((s) => {
                const all = runs(s.values);
                const last = all[all.length - 1];
                const end = last?.[last.length - 1];
                return end && last!.length > 1 ? (
                  <circle
                    key={`e${s.key}`}
                    className={`dot ${s.tone}`}
                    cx={x(end[0])}
                    cy={y(end[1])}
                    r={4}
                  />
                ) : null;
              })}
            {hover !== null ? (
              <g>
                <line className="cross" x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + ih} />
                {series.map((s) => {
                  const v = s.values[hover];
                  return v !== null && v !== undefined && Number.isFinite(v) ? (
                    <circle
                      key={`h${s.key}`}
                      className={`dot ${s.tone}`}
                      cx={x(hover)}
                      cy={y(v)}
                      r={4.5}
                    />
                  ) : null;
                })}
              </g>
            ) : null}
            <rect
              className="hit"
              x={M.left}
              y={M.top}
              width={iw}
              height={ih}
              tabIndex={0}
              aria-label={`${caption}${t('：用左右方向键逐点查看', ': use the left and right arrow keys to inspect points')}`}
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
              left: flip ? tipLeft - 12 : tipLeft + 12,
              transform: flip ? 'translateX(-100%)' : undefined,
            }}
            role="status"
          >
            <div className="ad-tip-title">{titles[hover]}</div>
            {series.map((s) => (
              <div className="ad-tip-row" key={s.key}>
                <span className={`ad-key ad-key-${s.tone}`} aria-hidden />
                <b>{format(s.values[hover] ?? null)}</b>
                <span>
                  {s.label}
                  {s.notes?.[hover] ? ` · ${s.notes[hover]}` : ''}
                </span>
              </div>
            ))}
            {byIndex.get(hover) ? (
              <div className="ad-tip-release">
                {t('发版：', 'Release: ')}
                {byIndex.get(hover)!.join('、')}
              </div>
            ) : null}
            {noteIndex.get(hover) ? (
              <div className="ad-tip-release">
                {t('读数注意：', 'Reading note: ')}
                {noteIndex.get(hover)!.join('、')}
                {t('起', ' onward')}
              </div>
            ) : null}
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
                {series.map((s) => (
                  <th key={s.key}>{s.label}</th>
                ))}
                {byIndex.size ? <th>{t('发版', 'Release')}</th> : null}
                {noteIndex.size ? <th>{t('读数注意', 'Reading notes')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {titles.map((t, i) => (
                <tr key={i}>
                  <td>{t}</td>
                  {series.map((s) => (
                    <td key={s.key}>
                      {format(s.values[i] ?? null)}
                      {s.notes?.[i] ? <span className="ad-sub">{s.notes[i]}</span> : null}
                    </td>
                  ))}
                  {byIndex.size ? <td>{byIndex.get(i)?.join('、') ?? ''}</td> : null}
                  {noteIndex.size ? <td>{noteIndex.get(i)?.join('、') ?? ''}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
