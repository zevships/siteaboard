import { useState } from 'react';
import { useSiteText } from '../../../locales/site.ts';
import { useFormat } from '../../../lib/reference-format.ts';
import { KpiRows, EmptyData } from './shared.tsx';
import { useLocalized, type SectionProps } from './model.ts';

export default function IssuesSection({ site }: SectionProps) {
  const t = useSiteText();
  const localize = useLocalized();
  const { fmtInt } = useFormat();
  const [active, setActive] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [text, setText] = useState('');
  const records = site.issues;
  const rows = records.filter(
    (r) =>
      (filter === 'all' || r.status === filter) &&
      `${r.id} ${localize(r.title)}`.toLowerCase().includes(text.toLowerCase()),
  );
  const selected = site.issues.find((r) => r.id === active);
  const tone = (status: string, kind: string) =>
    status === 'resolved'
      ? 'park'
      : status === 'review'
        ? 'watch'
        : kind === 'decision'
          ? 'owner'
          : 'todo';
  const statusText = (status: string) =>
    status === 'resolved' ? t('done') : status === 'review' ? t('watch') : t('unresolved');
  return (
    <div className="sa-site-stack">
      <KpiRows
        rows={[
          {
            label: t('unresolved'),
            value: fmtInt(records.filter((r) => r.status !== 'resolved').length),
          },
          {
            label: t('owner'),
            value: fmtInt(
              records.filter((r) => r.kind === 'decision' && r.status !== 'resolved').length,
            ),
          },
          {
            label: t('review'),
            value: fmtInt(records.filter((r) => r.status === 'review').length),
          },
          {
            label: t('done'),
            value: fmtInt(records.filter((r) => r.status === 'resolved').length),
          },
        ]}
      />
      <section className="ad-board-wrap">
        <header className="ad-card-head">
          <h2>{t('issueBoard')}</h2>
          <span className="ad-card-sub">{t('issueHint')}</span>
        </header>
        <div className="sa-table-filters">
          <label>
            {t('issueStatus')}
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">{t('all')}</option>
              <option value="open">{t('unresolved')}</option>
              <option value="review">{t('watch')}</option>
              <option value="resolved">{t('done')}</option>
            </select>
          </label>
          <input
            type="search"
            aria-label={t('issueSearch')}
            placeholder={t('issueSearch')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        {rows.length ? (
          <div className={`ad-board${selected ? ' is-lit' : ''}`}>
            {(['bug', 'improvement', 'decision'] as const).map((kind) => {
              const group = rows.filter((r) => r.kind === kind);
              return group.length ? (
                <article className="ad-topic" key={kind}>
                  <header>
                    <b>
                      {kind === 'bug' ? t('issues') : kind === 'decision' ? t('owner') : t('needs')}
                    </b>
                    <span className="ad-pill">{group.length}</span>
                  </header>
                  <div className="ad-chips">
                    {group.map((r) => (
                      <button
                        className={`ad-issue is-${tone(r.status, r.kind)}${r.priority === 'high' ? ' is-high' : ''}${r.id === active ? ' is-me' : ''}${selected?.relatedIds.includes(r.id) ? ' is-rel' : ''}`}
                        key={r.id}
                        aria-controls="site-issue-detail"
                        aria-pressed={r.id === active}
                        onClick={() => setActive(r.id)}
                        onMouseEnter={() => setActive(r.id)}
                        onFocus={() => setActive(r.id)}
                      >
                        <span className="id">{r.id}</span>
                        <span className="tx">{localize(r.title)}</span>
                      </button>
                    ))}
                  </div>
                </article>
              ) : null;
            })}
          </div>
        ) : (
          <EmptyData />
        )}
        <div
          className={`ad-issue-detail${selected ? '' : ' is-idle'}`}
          id="site-issue-detail"
          aria-live="polite"
        >
          {selected ? (
            <>
              <b>
                {selected.id} {localize(selected.title)}
              </b>
              <div className="ad-meta">
                {statusText(selected.status)} · {t('impact')} {t(selected.priority)} · {t('found')}{' '}
                {selected.createdAt}
                {selected.reviewAt ? ` · ${t('review')} ${selected.reviewAt}` : ''}
              </div>
              <p>{localize(selected.description)}</p>
              <div className="sa-issue-evidence">
                <strong>{t('evidence')}</strong>
                <p>{localize(selected.evidence)}</p>
              </div>
              {selected.relatedIds.length ? (
                <div className="ad-meta">
                  {t('related')}{' '}
                  {selected.relatedIds.map((id) => (
                    <button
                      key={id}
                      className="ad-button"
                      onClick={() => {
                        setFilter('all');
                        setText('');
                        setActive(id);
                      }}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <span className="ad-muted">{t('issueIdle')}</span>
          )}
        </div>
      </section>
    </div>
  );
}
