import { useState } from 'react';
import { useFormat } from '../../../lib/reference-format.ts';
import { useSiteText } from '../../../locales/site.ts';
import { SectionCard, KpiRows, EmptyData, CountRows, ratio } from './shared.tsx';
import { groupBy, inRange, useLocalized, type SectionProps } from './model.ts';

const levels = ['much', 'some', 'same', 'worse'] as const;
export default function FeedbackSection({ site, query }: SectionProps) {
  const t = useSiteText();
  const localize = useLocalized();
  const { fmtInt, fmtPct } = useFormat();
  const [rating, setRating] = useState('all');
  const [text, setText] = useState('');
  const rows = site.feedback.filter((r) => inRange(r.date, query));
  const rated = rows.filter((r) => r.rating !== null);
  const counts = Object.fromEntries(
    levels.map((level) => [level, rated.filter((r) => r.rating === level).length]),
  );
  const shown = rows
    .filter(
      (r) =>
        (rating === 'all' || r.rating === rating) &&
        `${localize(r.text)} ${r.page}`.toLowerCase().includes(text.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const devices = [...groupBy(rated, (r) => r.device)];
  const followups = [
    ...groupBy(
      rows.filter((r) => r.followup),
      (r) => localize(r.followup!),
    ),
  ]
    .map(([label, group]) => ({ label, n: group.length }))
    .sort((a, b) => b.n - a.n);
  return (
    <div className="sa-site-stack">
      <KpiRows
        rows={[
          {
            label: t('ratings'),
            value: fmtInt(rated.length),
            sub: `${t('feedback')} ${fmtInt(rows.length)}`,
          },
          {
            label: t('positive'),
            value: fmtInt(counts.much + counts.some),
            sub: fmtPct(ratio(counts.much + counts.some, rated.length)),
          },
          {
            label: t('negative'),
            value: fmtInt(counts.worse),
            sub: `${t('same')} ${fmtInt(counts.same)}`,
          },
          {
            label: t('unresolved'),
            value: fmtInt(rows.filter((r) => r.status !== 'resolved').length),
            sub: `${t('followup')} ${fmtInt(rows.filter((r) => r.followup).length)}`,
          },
        ]}
      />
      <div className="ad-grid">
        <SectionCard title={t('ratingSplit')}>
          <div className="ad-legend">
            {levels.map((level) => (
              <span key={level}>
                <i className={`ad-lv is-${level}`} aria-hidden /> {t(level)}
              </span>
            ))}
          </div>
          {devices.length ? (
            devices.map(([device, group]) => (
              <div className="ad-facet" key={device}>
                <div className="ad-facet-title">{device}</div>
                <div
                  className={`ad-stack-row${group.length < 10 ? ' is-faded' : ''}`}
                  title={levels
                    .map((l) => `${t(l)} ${group.filter((r) => r.rating === l).length}`)
                    .join(' · ')}
                >
                  <span className="ad-stack-label">{t('ratings')}</span>
                  <span className="ad-stack">
                    {levels.map((level) => {
                      const count = group.filter((r) => r.rating === level).length;
                      return count ? (
                        <span key={level} className={`ad-lv is-${level}`} style={{ flex: count }} />
                      ) : null;
                    })}
                  </span>
                  <span className="ad-stack-n">{fmtInt(group.length)}</span>
                </div>
              </div>
            ))
          ) : (
            <EmptyData />
          )}
        </SectionCard>
        <SectionCard title={t('followup')}>
          <CountRows rows={followups} />
        </SectionCard>
      </div>
      <SectionCard title={t('recentRatings')}>
        <div className="sa-table-filters">
          <label>
            {t('ratingFilter')}
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="all">{t('all')}</option>
              {levels.map((level) => (
                <option value={level} key={level}>
                  {t(level)}
                </option>
              ))}
            </select>
          </label>
          <input
            type="search"
            aria-label={t('feedback')}
            placeholder={t('feedback')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        {shown.length ? (
          <div className="ad-table-scroll">
            <table className="ad-table ad-table-left">
              <thead>
                <tr>
                  <th>{t('time')}</th>
                  <th>{t('ratings')}</th>
                  <th>{t('followup')}</th>
                  <th>{t('page')}</th>
                  <th>{t('device')}</th>
                  <th>{t('issues')}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className="ad-mono">{r.date}</td>
                    <td>
                      {r.rating ? (
                        <>
                          <i className={`ad-lv is-${r.rating}`} aria-hidden /> {t(r.rating)}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="ad-wrap">{r.followup ? localize(r.followup) : '—'}</td>
                    <td>{r.page}</td>
                    <td>{r.device}</td>
                    <td>{r.issueId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyData />
        )}
      </SectionCard>
      <SectionCard
        title={t('comments')}
        note={site.provenance.quality === 'demo' ? t('mockQuotes') : undefined}
      >
        {shown.length ? (
          <ul className="ad-quotes">
            {shown.map((r) => (
              <li key={r.id}>
                <span className="ad-muted ad-mono">{r.date}</span> <span>{localize(r.text)}</span>
                {r.issueId ? <span className="ad-muted"> → {r.issueId}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyData />
        )}
      </SectionCard>
    </div>
  );
}
