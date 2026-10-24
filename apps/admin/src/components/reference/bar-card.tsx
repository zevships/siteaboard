import { useState } from 'react';

import { useFormat } from '../../lib/reference-format.ts';
import { useI18n } from '../../lib/reference-format.ts';
import type { Row } from './types.ts';
import { Zh } from './zh';

export type BarTab = {
  key: string;
  label: string;
  rows: Row[];

  name?: (label: string) => string;

  zh?: (row: Row) => string;

  note?: string;
};

export function BarCard({
  title,
  tabs,
  total,
}: {
  title: string;
  tabs: BarTab[];

  total: number | null;
}) {
  const { t, locale } = useI18n();
  const { fmtInt, fmtPct } = useFormat();
  const [active, setActive] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!tab) return null;
  const max = Math.max(1, ...tab.rows.map((r) => r.visitors ?? 0));
  return (
    <section className="ad-card">
      <header className="ad-card-head">
        <h2>{title}</h2>
        {tabs.length > 1 ? (
          <div className="ad-tabs" role="tablist" aria-label={title}>
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={t.key === tab.key}
                onClick={() => setActive(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}
      </header>
      <div className="ad-list-head">
        <span>{tab.label}</span>
        <span>{t('访客', 'Visitors')}</span>
      </div>
      {tab.rows.length ? (
        <ol className="ad-bars">
          {tab.rows.map((r) => {
            const label = tab.name ? tab.name(r.label) : r.label || t('（未知）', '(unknown)');
            const zh = locale === 'zh-CN' && r.label && tab.zh ? tab.zh(r) : '';
            return (
              <li
                key={`${r.country ?? ''}|${r.label}`}
                title={`${label}${zh ? ` - ${zh}` : ''}：${fmtInt(r.visitors)}${t(' 访客', ' visitors')}${total && r.visitors !== null ? `${t('，占全部访客的 ', ', share of all visitors: ')}${fmtPct((r.visitors / total) * 100)}` : ''}`}
              >
                <span
                  className="ad-bar"
                  style={{ width: `${r.visitors === null ? 0 : (r.visitors / max) * 100}%` }}
                  aria-hidden
                />
                <span className="ad-bar-label">
                  {label}
                  <Zh text={zh} />
                </span>
                <span className="ad-bar-value">{fmtInt(r.visitors)}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="ad-empty">{t('这段时间没有数据', 'No data in this period')}</p>
      )}
      {tab.note ? <p className="ad-card-note">{tab.note}</p> : null}
    </section>
  );
}
