import { useState } from 'react';

import { useFormat } from '../../lib/reference-format.ts';
import { useI18n } from '../../lib/reference-format.ts';
import type { Goal } from './types.ts';
import { Zh } from './zh';

const FIRST = 12;

export function GoalsTable({
  goals,
  visitors,
  zh,
}: {
  goals: Goal[];
  visitors: number | null;

  zh?: (goal: Goal) => string;
}) {
  const { t } = useI18n();
  const { fmtInt, fmtPct } = useFormat();
  const [all, setAll] = useState(false);
  if (!goals.length)
    return <p className="ad-empty">{t('这段时间没有事件', 'No events in this period')}</p>;
  const shown = all ? goals : goals.slice(0, FIRST);
  return (
    <div className="ad-table-scroll">
      <table className="ad-table">
        <thead>
          <tr>
            <th>{t('事件', 'Event')}</th>
            <th>{t('访客', 'Visitors')}</th>
            <th>{t('次数', 'Count')}</th>
            <th>{t('转化率', 'Conversion rate')}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((g) => (
            <tr key={g.event}>
              <td>
                <span className="ad-mono">{g.event}</span>
                <Zh text={zh ? zh(g) : (g.name ?? '')} />
              </td>
              <td>{fmtInt(g.visitors)}</td>
              <td>{fmtInt(g.events)}</td>
              <td>{visitors ? fmtPct((g.visitors / visitors) * 100) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {goals.length > FIRST ? (
        <button type="button" className="ad-button ad-more" onClick={() => setAll((v) => !v)}>
          {all
            ? t('收起', 'Collapse')
            : `${t('展开其余 ', 'Show remaining ')}${goals.length - FIRST}${t(' 个事件', ' events')}`}
        </button>
      ) : null}
    </div>
  );
}
