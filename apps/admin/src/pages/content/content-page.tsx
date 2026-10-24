import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type {
  ContentCreator,
  ContentDataset,
  ContentEntity,
  ContentPost,
  ContentText,
} from '../../../../../packages/core/src/content.ts';
import { useWorkspace } from '../../providers/workspace.tsx';
import { useI18n } from '../../lib/reference-format.ts';
import { ContentArt } from './content-art.tsx';
import '../../styles/content.css';

type Tab = 'creators' | 'saved' | 'entities';
type View = 'wall' | 'feed' | 'people';
const artSeed = (id: string) =>
  Array.from(id).reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 0);
const artRatio = {
  terminal: 1.45,
  landscape: 1.9,
  shapes: 1.7,
  editor: 1.6,
  dashboard: 1.85,
  type: 1.4,
};
function Avatar({ creator, size = 56 }: { creator: ContentCreator; size?: number }) {
  return (
    <span
      className="cx-av is-letter"
      style={{ width: size, height: size, '--cx-hue': creator.hue } as CSSProperties}
    >
      {creator.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}
function Modal({
  children,
  title,
  onClose,
  onKey,
  sheet = false,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  onKey?: (key: string) => void;
  sheet?: boolean;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    const prior = document.activeElement as HTMLElement | null;
    el?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el?.close();
      document.body.style.overflow = old;
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={sheet ? 'content-filter-sheet' : 'cx-viewer'}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (
          onKey &&
          (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement) &&
          !(e.target instanceof HTMLSelectElement)
        ) {
          e.preventDefault();
          onKey?.(e.key);
        }
      }}
    >
      <button className="cx-vclose" aria-label={t('关闭', 'Close')} onClick={onClose}>
        ×
      </button>
      {children}
    </dialog>
  );
}
function Accounts({ data }: { data: ContentDataset }) {
  const { t, locale } = useI18n();
  const txt = (v: ContentText) => (locale === 'zh-CN' ? v.zh : v.en);
  return (
    <details className="own-social">
      <summary>
        <strong>{t('我的账号', 'My accounts')}</strong>
        <span>
          {data.accounts.length} {t('个账号', 'accounts')} ·{' '}
          {new Set(data.accounts.map((a) => a.platform)).size} {t('个平台', 'platforms')}
        </span>
        <span>
          {t('已登记', 'Recorded')} <b>{data.accounts.reduce((s, a) => s + a.posts, 0)}</b>{' '}
          {t('帖', 'posts')}
        </span>
        <span className="own-social-open">{t('账号与运营', 'Accounts & operations')} ↗</span>
      </summary>
      <div className="own-social-body">
        <p className="own-social-note">
          {t(
            '仅展示快照中已登记的发布与读数；未接入的数据不计作 0。',
            'Only recorded publishing and readings are shown; unavailable data is not zero.',
          )}
        </p>
        <div className="own-social-accounts">
          {data.accounts.map((a) => (
            <article className="own-social-account" key={a.id}>
              <strong>{a.platform}</strong>
              <span>{a.name}</span>
              <small>@{a.handle}</small>
            </article>
          ))}
        </div>
        <div className="own-social-columns">
          <section>
            <h3>{t('发布与表现', 'Publishing & performance')}</h3>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t('账号', 'Account')}</th>
                  <th>{t('已登记帖子', 'Recorded posts')}</th>
                  <th>{t('已记录浏览', 'Recorded views')}</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.posts}</td>
                    <td>{a.views === null ? '—' : a.views.toLocaleString(locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <h3>{t('接下来', 'Up next')}</h3>
            {data.accounts.map((a) => (
              <p key={a.id}>
                <strong>{a.platform}</strong> · {txt(a.nextAction)}
              </p>
            ))}
            <p className="own-social-note">
              {t(
                '当前仅阅读与整理，不会连接账号或发布内容。',
                'Reading and organization only. No account is connected and no content is published.',
              )}
            </p>
          </section>
        </div>
      </div>
    </details>
  );
}
function Facet({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { id: string; label: string; n: number; color?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <section className="cx-facet">
      <h2 className="cx-facet-title">{title}</h2>
      <div className="cx-opts">
        {options.map((o) => (
          <button
            key={o.id}
            className={`cx-opt${value === o.id ? ' is-on' : ''}${o.n ? '' : ' is-zero'}`}
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
          >
            {o.color ? <span className="content-color" style={{ background: o.color }} /> : null}
            <span className="cx-opt-label">{o.label}</span>
            <span className="cx-opt-n">{o.n}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
function ContentWorkspace({ content, readonly }: { content: ContentDataset; readonly: boolean }) {
  const { t, locale } = useI18n();
  const txt = (v: ContentText) => (locale === 'zh-CN' ? v.zh : v.en);
  const [tab, setTab] = useState<Tab>('creators');
  const [view, setView] = useState<View>('wall');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('all');
  const [topic, setTopic] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [creatorId, setCreatorId] = useState('all');
  const [filters, setFilters] = useState(false);
  const [saved, setSaved] = useState(
    () => new Set(content.posts.filter((p) => p.saved).map((p) => p.id)),
  );
  const [posts, setPosts] = useState(content.posts);
  const [creators, setCreators] = useState(content.creators);
  const [opened, setOpened] = useState<string | null>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState(false);
  const [intake, setIntake] = useState('');
  const [intakeKind, setIntakeKind] = useState('post');
  const [notice, setNotice] = useState('');
  const [savedList, setSavedList] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const [entityQuery, setEntityQuery] = useState('');
  const byCreator = useMemo(() => new Map(creators.map((c) => [c.id, c])), [creators]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault();
        search.current?.focus();
      }
      if (e.key === 'Escape') setFilters(false);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  const matches = (p: ContentPost, ignore?: 'category' | 'topic' | 'platform') => {
    const c = byCreator.get(p.creatorId)!;
    return (
      (tab !== 'saved' || saved.has(p.id)) &&
      (ignore === 'category' || category === 'all' || p.categoryId === category) &&
      (ignore === 'topic' || topic === 'all' || c.topic === topic) &&
      (ignore === 'platform' || platform === 'all' || c.platform === platform) &&
      (creatorId === 'all' || p.creatorId === creatorId) &&
      (!query ||
        [p.title.zh, p.title.en, p.body.zh, p.body.en, c.name, c.handle].some((s) =>
          s.toLowerCase().includes(query.toLowerCase()),
        ))
    );
  };
  const filtered = posts
    .filter((p) => matches(p))
    .sort((a, b) =>
      sort === 'oldest'
        ? a.date.localeCompare(b.date)
        : sort === 'popular'
          ? (b.likes ?? -1) - (a.likes ?? -1)
          : b.date.localeCompare(a.date),
    );
  const people = creators.filter(
    (c) =>
      (creatorId === 'all' || c.id === creatorId) &&
      (category === 'all' || category === c.categoryId) &&
      (topic === 'all' || topic === c.topic) &&
      (platform === 'all' || platform === c.platform) &&
      (!query ||
        [c.name, c.handle, c.bio.en, c.bio.zh].some((s) =>
          s.toLowerCase().includes(query.toLowerCase()),
        )),
  );
  const newestPost = (id: string) =>
    posts
      .filter((p) => p.creatorId === id)
      .map((p) => p.date)
      .sort()
      .at(-1) ?? '';
  people.sort((a, b) =>
    sort === 'popular'
      ? posts.filter((p) => p.creatorId === b.id).reduce((n, p) => n + (p.likes ?? 0), 0) -
        posts.filter((p) => p.creatorId === a.id).reduce((n, p) => n + (p.likes ?? 0), 0)
      : sort === 'oldest'
        ? newestPost(a.id).localeCompare(newestPost(b.id))
        : newestPost(b.id).localeCompare(newestPost(a.id)),
  );
  const clear = () => {
    setQuery('');
    setCategory('all');
    setTopic('all');
    setPlatform('all');
    setCreatorId('all');
  };
  const toggleSaved = (id: string) => {
    if (readonly) return;
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const saveLabel = (id: string) => (saved.has(id) ? t('已收藏', 'Saved') : t('收藏', 'Save'));
  const money = (n: number | null) =>
    n === null
      ? '—'
      : new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(n);
  const openedPost = posts.find((p) => p.id === opened);
  const openedPerson = creators.find((c) => c.id === person);
  const openedEntity = content.entities.find((e) => e.id === entityId);
  const openEntity = (e: ContentEntity) => {
    setOpened(null);
    setPerson(null);
    setEntityId(e.id);
  };
  const createDraft = () => {
    if (readonly || !intake.trim()) return;
    const n = Date.now().toString(36);
    if (intakeKind === 'creator') {
      setCreators((v) => [
        ...v,
        {
          id: `draft-creator-${n}`,
          name: intake.trim().slice(0, 100),
          handle: 'demo_draft',
          platform: 'Draft',
          categoryId: content.categories[0]?.id ?? 'design',
          topic: 'makers',
          bio: {
            zh: '仅当前页面的演示草稿，未采集。',
            en: 'An in-memory demo draft. No collection occurred.',
          },
          hue: 180,
          followers: null,
        },
      ]);
      setView('people');
      setTab('creators');
    } else if (creators[0] && content.categories[0]) {
      const id = `draft-post-${n}`;
      setPosts((v) => [
        {
          id,
          creatorId: creators[0]!.id,
          date: content.collectedAt,
          title: { zh: intake.trim().slice(0, 100), en: intake.trim().slice(0, 100) },
          body: {
            zh: '仅当前页面的演示草稿，不会抓取链接或发送数据。',
            en: 'In-memory demo draft. No link was fetched and no data was sent.',
          },
          categoryId: content.categories[0]!.id,
          art: 'type',
          durationSeconds: null,
          likes: null,
          saved: true,
          entityIds: [],
        },
        ...v,
      ]);
      setSaved((s) => new Set([...s, id]));
      setTab('saved');
    }
    clear();
    setIntake('');
    setNotice(
      t(
        '已添加到本页演示草稿；刷新即清除，没有写入数据库或调用外部服务。',
        'Added to this page’s demo drafts; reload clears it. No database write or external call occurred.',
      ),
    );
  };
  const drawPost = (p: ContentPost) => {
    const c = byCreator.get(p.creatorId)!;
    return (
      <button
        key={p.id}
        className="cx-wt"
        onClick={() => setOpened(p.id)}
        aria-label={`${t('打开帖子', 'Open post')}: ${txt(p.title)}`}
        style={{ flexGrow: artRatio[p.art], flexBasis: 200 * artRatio[p.art] }}
      >
        <ContentArt kind={p.art} seed={artSeed(p.id)} />
        {p.durationSeconds !== null ? (
          <span className="cx-play">
            {t('示意', 'Preview')} · {Math.floor(p.durationSeconds / 60)}:
            {String(p.durationSeconds % 60).padStart(2, '0')}
          </span>
        ) : null}
        {saved.has(p.id) ? (
          <span className="content-saved-mark" aria-label={t('已收藏', 'Saved')}>
            ★
          </span>
        ) : null}
        <span className="cx-wt-cap">
          <span className="cx-wt-name">
            {c.name} · {txt(p.title)}
          </span>
          <time>{p.date.slice(5, 10)}</time>
        </span>
      </button>
    );
  };
  const facetContent = (
    <>
      <Facet
        title={t('主题', 'Topic')}
        value={topic}
        onChange={setTopic}
        options={[
          {
            id: 'all',
            label: t('全部', 'All'),
            n: posts.filter((p) => matches(p, 'topic')).length,
          },
          ...(['makers', 'learning'] as const).map((id) => ({
            id,
            label:
              id === 'makers'
                ? t('博主名单', 'Creator roster')
                : t('教程与学习', 'Tutorials & learning'),
            n: posts.filter((p) => matches(p, 'topic') && byCreator.get(p.creatorId)!.topic === id)
              .length,
          })),
        ]}
      />
      <Facet
        title={t('分类', 'Category')}
        value={category}
        onChange={setCategory}
        options={[
          {
            id: 'all',
            label: t('全部', 'All'),
            n: posts.filter((p) => matches(p, 'category')).length,
          },
          ...content.categories.map((c) => ({
            id: c.id,
            label: txt(c.label),
            color: c.color,
            n: posts.filter((p) => matches(p, 'category') && p.categoryId === c.id).length,
          })),
        ]}
      />
      <Facet
        title={t('平台', 'Platform')}
        value={platform}
        onChange={setPlatform}
        options={[
          {
            id: 'all',
            label: t('全部', 'All'),
            n: posts.filter((p) => matches(p, 'platform')).length,
          },
          ...Array.from(new Set(creators.map((c) => c.platform))).map((id) => ({
            id,
            label: id,
            n: posts.filter(
              (p) => matches(p, 'platform') && byCreator.get(p.creatorId)!.platform === id,
            ).length,
          })),
        ]}
      />
      <p className="cx-facet-note">
        {t(
          '计数表示当前条件下可看的帖子；缺失读数不会当作 0。',
          'Counts reflect posts matching the other filters; missing readings are not zero.',
        )}
      </p>
      <button className="ad-button cx-clear" onClick={clear}>
        {t('清除筛选', 'Clear filters')}
      </button>
      <button className="ad-button cx-done" onClick={() => setFilters(false)}>
        {t('完成筛选', 'Done')}
      </button>
    </>
  );
  return (
    <div className="content-workspace">
      <section className="rs-header" aria-label={t('内容运营', 'Content workspace')}>
        <div className="rs-title">
          <h1>{t('内容运营', 'Content workspace')}</h1>
          <button className="cx-linkish" onClick={() => setWorkflow(true)}>
            {t('工作流', 'Workflow')} ↗
          </button>
        </div>
        <div className="research-costs">
          <div className="research-costs-strip">
            <span>{t('采集费用', 'Collection costs')}</span>
            <span>
              {t('今日', 'Today')} {money(content.costs.todayUsd)}
            </span>
            <span>
              {t('本月', 'This month')} {money(content.costs.monthUsd)}
            </span>
            <span className="research-costs-trend">
              {t('近 7 天', 'Last 7 days')}
              <svg
                width="64"
                height="26"
                viewBox="0 0 64 26"
                aria-label={t('已记录的每日采集费用', 'Recorded daily collection costs')}
                role="img"
              >
                {content.costs.dailyUsd.slice(-7).map((n, i) => (
                  <rect
                    key={i}
                    x={i * 9}
                    y={
                      25 -
                      ((n ?? 0) / Math.max(0.01, ...content.costs.dailyUsd.map((v) => v ?? 0))) * 22
                    }
                    width="7"
                    height={Math.max(
                      1,
                      ((n ?? 0) / Math.max(0.01, ...content.costs.dailyUsd.map((v) => v ?? 0))) *
                        22,
                    )}
                    rx="1"
                    fill="currentColor"
                    opacity={n === null ? 0.25 : 0.8}
                  />
                ))}
              </svg>
            </span>
            <span className="research-costs-estimate">USD</span>
            <details className="research-costs-info">
              <summary>{t('口径', 'Definition')}</summary>
              <p>
                {t(
                  '费用来自快照中的已记录读数，缺失为 —。当前页面不会触发采集。',
                  'Costs are recorded snapshot readings; missing means —. This page never triggers collection.',
                )}
              </p>
            </details>
          </div>
        </div>
        <Accounts data={content} />
        <nav className="rs-tabs" aria-label={t('内容视图', 'Content views')}>
          {(
            [
              ['creators', '博主与帖子', 'Creators & posts'],
              ['saved', '我的收藏', 'My saved'],
              ['entities', '知识实体', 'Knowledge entities'],
            ] as const
          ).map(([id, zh, en]) => (
            <button
              key={id}
              className={tab === id ? 'is-on' : ''}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => {
                setTab(id);
                clear();
              }}
            >
              {t(zh, en)}
            </button>
          ))}
        </nav>
        <details className="content-intake">
          <summary>＋ {t('收藏帖子 · 录入博主', 'Save a post · Add a creator')}</summary>
          <div className="cx-add">
            <p>
              {readonly
                ? t(
                    '本地快照只读，暂不支持新增或收藏。',
                    'The local snapshot is read-only; additions and saving are unavailable.',
                  )
                : t(
                    '演示草稿仅在本页内存中保留。不会抓取链接、连接账号或提交信息。',
                    'Demo drafts stay in this page’s memory. No links are fetched, accounts connected or information submitted.',
                  )}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createDraft();
              }}
            >
              <label>
                {t('类型', 'Type')}
                <select
                  value={intakeKind}
                  onChange={(e) => setIntakeKind(e.target.value)}
                  disabled={readonly}
                >
                  <option value="post">{t('收藏帖子', 'Save a post')}</option>
                  <option value="creator">{t('录入博主', 'Add a creator')}</option>
                </select>
              </label>
              <label>
                {t('标题或博主名称', 'Title or creator name')}
                <input
                  value={intake}
                  maxLength={100}
                  onChange={(e) => setIntake(e.target.value)}
                  disabled={readonly}
                  placeholder={t('输入一个虚构的演示条目', 'Enter a fictional demo item')}
                />
              </label>
              <button className="ad-button" disabled={readonly || !intake.trim()}>
                {t('添加演示草稿', 'Add demo draft')}
              </button>
            </form>
          </div>
        </details>
        {notice ? (
          <p className="content-notice" role="status">
            {notice}
          </p>
        ) : null}
      </section>
      {tab === 'entities' ? (
        <section className="content-entities">
          <div className="cx-head">
            <div>
              <h2>{t('知识实体', 'Knowledge entities')}</h2>
              <p>
                {t(
                  '把工具、方法和相关帖子连起来，下一次更容易找回。',
                  'Connect tools, methods and related posts so they are easy to find again.',
                )}
              </p>
            </div>
            <label className="content-entity-search">
              {t('查找实体', 'Find an entity')}
              <input
                value={entityQuery}
                onChange={(e) => setEntityQuery(e.target.value)}
                placeholder={t('搜索名称、类型或说明', 'Search name, kind or description')}
              />
            </label>
          </div>
          <div className="content-entity-grid">
            {content.entities
              .filter((e) =>
                [e.name, e.kind, e.summary.en, e.summary.zh].some((s) =>
                  s.toLowerCase().includes(entityQuery.toLowerCase()),
                ),
              )
              .map((e) => (
                <button className="content-entity" key={e.id} onClick={() => openEntity(e)}>
                  <span className="content-entity-kind">{e.kind}</span>
                  <h3>{e.name}</h3>
                  <p>{txt(e.summary)}</p>
                  <small>
                    {posts.filter((p) => p.entityIds.includes(e.id)).length}{' '}
                    {t('条相关帖子', 'related posts')} · {e.relatedIds.length}{' '}
                    {t('个关联实体', 'related entities')} ↗
                  </small>
                </button>
              ))}
          </div>
          {!content.entities.some((e) =>
            [e.name, e.kind, e.summary.en, e.summary.zh].some((s) =>
              s.toLowerCase().includes(entityQuery.toLowerCase()),
            ),
          ) ? (
            <p className="cx-empty">
              {t('没有匹配的知识实体。', 'No matching knowledge entities.')}
            </p>
          ) : null}
        </section>
      ) : (
        <div className="cx">
          <aside className="cx-side" aria-label={t('筛选', 'Filters')}>
            {facetContent}
          </aside>
          {filters ? (
            <Modal sheet title={t('筛选', 'Filters')} onClose={() => setFilters(false)}>
              <div className="cx content-filter-body">
                <div className="cx-side">{facetContent}</div>
              </div>
            </Modal>
          ) : null}
          <div className="cx-main">
            <header className="cx-head">
              <div>
                <h2>
                  {tab === 'saved'
                    ? t('我的收藏', 'My saved')
                    : view === 'people'
                      ? t('博主名单', 'Creator roster')
                      : view === 'feed'
                        ? t('博主动态', 'Creator feed')
                        : t('博主墙', 'Creator wall')}
                </h2>
                <p>
                  {t('关注', 'Following')} <b>{creators.length}</b> {t('个创作者', 'creators')} ·{' '}
                  {t('已收集', 'Collected')} <b>{posts.length}</b> {t('帖', 'posts')} ·{' '}
                  {t('最近采集', 'Last collection')}{' '}
                  {new Intl.DateTimeFormat(locale, {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC',
                  }).format(new Date(content.collectedAt))}{' '}
                  UTC
                </p>
              </div>
            </header>
            <div className="cx-stories" aria-label={t('按博主筛选', 'Filter by creator')}>
              <button
                className={`cx-story${creatorId === 'all' ? ' is-on' : ''}`}
                onClick={() => setCreatorId('all')}
                aria-pressed={creatorId === 'all'}
              >
                <span className="cx-story-ring">
                  <span className="cx-story-all">{t('全部', 'All')}</span>
                </span>
                <span className="cx-story-name">
                  {t('全部', 'All')} {creators.length}
                </span>
              </button>
              {creators.map((c) => (
                <button
                  key={c.id}
                  className={`cx-story is-fresh${creatorId === c.id ? ' is-on' : ''}`}
                  onClick={() => setCreatorId(c.id)}
                  aria-pressed={creatorId === c.id}
                >
                  <span className="cx-story-ring">
                    <Avatar creator={c} />
                  </span>
                  <span className="cx-story-n">
                    {posts.filter((p) => p.creatorId === c.id).length}
                  </span>
                  <span className="cx-story-name">{c.name}</span>
                </button>
              ))}
            </div>
            <div className="cx-bar">
              <nav className="cx-views" aria-label={t('看法', 'View')}>
                {(tab === 'saved'
                  ? [
                      ['wall', '卡片', 'Cards'],
                      ['feed', '列表', 'List'],
                    ]
                  : [
                      ['feed', '动态', 'Feed'],
                      ['wall', '媒体墙', 'Media wall'],
                      ['people', '名单', 'Roster'],
                    ]
                ).map(([id, zh, en]) => (
                  <button
                    key={id}
                    className={
                      (tab === 'saved' ? (savedList ? id === 'feed' : id === 'wall') : view === id)
                        ? 'is-on'
                        : ''
                    }
                    aria-pressed={
                      tab === 'saved' ? (savedList ? id === 'feed' : id === 'wall') : view === id
                    }
                    onClick={() =>
                      tab === 'saved' ? setSavedList(id === 'feed') : setView(id as View)
                    }
                  >
                    {t(zh!, en!)}{' '}
                    <span className="cx-views-n">
                      {id === 'people' ? people.length : filtered.length}
                    </span>
                  </button>
                ))}
              </nav>
              <label className="cx-search">
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="10" cy="10" r="6" />
                  <path d="m15 15 6 6" />
                </svg>
                <span className="ad-sr">{t('搜索帖子和博主', 'Search posts and creators')}</span>
                <input
                  ref={search}
                  type="search"
                  aria-label={t('搜索帖子和博主', 'Search posts and creators')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t(
                    '搜帖子（原文和中文）、名字、@……',
                    'Search posts, names, @handles…',
                  )}
                />
                <kbd>/</kbd>
              </label>
              <label>
                <span className="ad-sr">{t('排序', 'Sort')}</span>
                <select
                  className="cx-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">{t('最新的在前', 'Newest first')}</option>
                  <option value="oldest">{t('最早的在前', 'Oldest first')}</option>
                  <option value="popular">{t('互动多的在前', 'Most liked')}</option>
                </select>
              </label>
              <button className="ad-button cx-filterbtn" onClick={() => setFilters(true)}>
                {t('筛选', 'Filters')}
              </button>
            </div>
            {category !== 'all' ||
            topic !== 'all' ||
            platform !== 'all' ||
            creatorId !== 'all' ||
            query ? (
              <div className="cx-active">
                <span>
                  {view === 'people' && tab === 'creators' ? people.length : filtered.length}{' '}
                  {t('个结果', 'results')}
                </span>
                <button className="cx-achip" onClick={clear}>
                  {t('清除全部筛选', 'Clear all filters')} <span>×</span>
                </button>
              </div>
            ) : null}
            <div className="cx-view" key={`${tab}-${view}-${savedList}`}>
              {view === 'people' && tab === 'creators' ? (
                <div className="cx-tiles">
                  {people.map((c) => (
                    <article
                      className="cx-tile"
                      key={c.id}
                      style={{ '--cx-hue': c.hue } as CSSProperties}
                    >
                      <div className="cx-banner">
                        <ContentArt kind="landscape" seed={c.hue} />
                      </div>
                      <div className="cx-tile-body">
                        <div className="cx-tile-top">
                          <Avatar creator={c} size={60} />
                          <span className="cx-pill">{c.platform}</span>
                        </div>
                        <h3 className="cx-tile-name">
                          <button className="cx-stretch" onClick={() => setPerson(c.id)}>
                            {c.name}
                          </button>
                        </h3>
                        <p className="cx-tile-handle">@{c.handle}</p>
                        <p className="cx-tile-focus">{txt(c.bio)}</p>
                        <small>
                          {c.followers === null ? '—' : c.followers.toLocaleString(locale)}{' '}
                          {t('关注者', 'followers')} ·{' '}
                          {posts.filter((p) => p.creatorId === c.id).length} {t('帖', 'posts')}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : tab === 'saved' && savedList ? (
                <div className="content-saved-list">
                  {filtered.map((p) => (
                    <article key={p.id}>
                      <button onClick={() => setOpened(p.id)}>
                        <strong>{txt(p.title)}</strong>
                        <span>
                          {byCreator.get(p.creatorId)!.name} · {p.date.slice(0, 10)}
                        </span>
                      </button>
                      <button
                        className="ad-button"
                        disabled={readonly}
                        onClick={() => toggleSaved(p.id)}
                      >
                        {saveLabel(p.id)}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (view === 'feed' && tab === 'creators') || (tab === 'saved' && !savedList) ? (
                <div className="content-feed">
                  {filtered.map((p) => {
                    const c = byCreator.get(p.creatorId)!;
                    return (
                      <article key={p.id} className="cx-post">
                        <header className="content-post-head">
                          <button onClick={() => setPerson(c.id)}>
                            <Avatar creator={c} size={36} />
                            <span>
                              <b>{c.name}</b>
                              <small>
                                {c.platform} · {p.date.slice(5, 10)}
                              </small>
                            </span>
                          </button>
                          <button
                            className="content-save"
                            aria-label={saveLabel(p.id)}
                            disabled={readonly}
                            onClick={() => toggleSaved(p.id)}
                          >
                            {saved.has(p.id) ? '★' : '☆'}
                          </button>
                        </header>
                        <h3>{txt(p.title)}</h3>
                        <p>{txt(p.body)}</p>
                        <button
                          className="content-feed-art"
                          aria-label={`${t('打开帖子', 'Open post')}: ${txt(p.title)}`}
                          onClick={() => setOpened(p.id)}
                        >
                          <ContentArt kind={p.art} seed={artSeed(p.id)} />
                        </button>
                        <footer>
                          ♡ {p.likes === null ? '—' : p.likes.toLocaleString(locale)}{' '}
                          <button className="cx-linkish" onClick={() => setOpened(p.id)}>
                            {t('查看详情', 'Read more')} ↗
                          </button>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              ) : (
                Array.from(new Set(filtered.map((p) => p.date.slice(0, 10)))).map((day) => (
                  <section className="cx-day" key={day}>
                    <h3 className="cx-dayhead">
                      <span>
                        {day === content.collectedAt.slice(0, 10) ? `${t('今天', 'Today')} · ` : ''}
                        {day.slice(5)}
                      </span>
                      <span className="cx-dayn">
                        {filtered.filter((p) => p.date.startsWith(day)).length} {t('个', 'items')}
                      </span>
                    </h3>
                    <div className="cx-justify">
                      {filtered.filter((p) => p.date.startsWith(day)).map(drawPost)}
                    </div>
                  </section>
                ))
              )}
              {(view === 'people' && tab === 'creators' ? people.length : filtered.length) === 0 ? (
                <div className="cx-empty">
                  <p>{t('当前条件下没有内容。', 'No content matches these filters.')}</p>
                  <button className="ad-button" onClick={clear}>
                    {t('清除筛选', 'Clear filters')}
                  </button>
                </div>
              ) : null}
            </div>
            <p className="ad-footnote cx-foot">
              {readonly
                ? t(
                    '只读本地快照 · 收藏与录入功能暂不可用。',
                    'Read-only local snapshot · Saving and intake are unavailable.',
                  )
                : t(
                    '虚构演示 · 所有图像均由代码绘制，演示收藏与草稿刷新后清除。',
                    'Fictional demo · All artwork is drawn in code. Demo saves and drafts reset on reload.',
                  )}
            </p>
          </div>
        </div>
      )}
      {openedPost ? (
        <Modal
          title={txt(openedPost.title)}
          onClose={() => setOpened(null)}
          onKey={(key) => {
            const ids = filtered.map((p) => p.id);
            const at = ids.indexOf(openedPost.id);
            if (ids.length)
              setOpened(ids[(at + (key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length]!);
          }}
        >
          <div className="cx-vbox">
            <div className="cx-vstage">
              <ContentArt kind={openedPost.art} seed={artSeed(openedPost.id)} />
              <div className="content-viewer-nav">
                <button
                  className="ad-button"
                  onClick={() => {
                    const at = filtered.findIndex((p) => p.id === openedPost.id);
                    setOpened(
                      filtered[(at - 1 + filtered.length) % filtered.length]?.id ?? openedPost.id,
                    );
                  }}
                  aria-label={t('上一条', 'Previous post')}
                >
                  ←
                </button>
                <span>{t('← → 切换 · Esc 关闭', '← → navigate · Esc close')}</span>
                <button
                  className="ad-button"
                  onClick={() => {
                    const at = filtered.findIndex((p) => p.id === openedPost.id);
                    setOpened(filtered[(at + 1) % filtered.length]?.id ?? openedPost.id);
                  }}
                  aria-label={t('下一条', 'Next post')}
                >
                  →
                </button>
              </div>
            </div>
            <div className="cx-vinfo">
              <button
                className="cx-vwho"
                onClick={() => {
                  setOpened(null);
                  setPerson(openedPost.creatorId);
                }}
              >
                <Avatar creator={byCreator.get(openedPost.creatorId)!} size={40} />
                <span>
                  <b>{byCreator.get(openedPost.creatorId)!.name}</b>
                  <small>{byCreator.get(openedPost.creatorId)!.platform}</small>
                </span>
              </button>
              <p className="cx-vwhen">{openedPost.date.replace('T', ' ').replace('Z', ' UTC')}</p>
              <h2>{txt(openedPost.title)}</h2>
              <p className="cx-vtext">{txt(openedPost.body)}</p>
              {openedPost.durationSeconds !== null ? (
                <p className="cx-vmeta">
                  {t(
                    '此演示以静态示意图代替视频，不会播放或下载媒体。',
                    'This demo uses a static illustration in place of video; no media is played or downloaded.',
                  )}
                </p>
              ) : null}
              <button
                className="ad-button"
                disabled={readonly}
                onClick={() => toggleSaved(openedPost.id)}
              >
                {saveLabel(openedPost.id)}
              </button>
              {openedPost.entityIds.length ? (
                <div>
                  <h3>{t('相关知识实体', 'Related knowledge')}</h3>
                  {openedPost.entityIds.map((id) => {
                    const e = content.entities.find((e) => e.id === id)!;
                    return (
                      <button key={id} className="ad-button" onClick={() => openEntity(e)}>
                        {e.name} ↗
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <p className="cx-vcount">
                ♡ {openedPost.likes === null ? '—' : openedPost.likes.toLocaleString(locale)} ·{' '}
                {t('快照读数', 'Snapshot reading')}
              </p>
            </div>
          </div>
        </Modal>
      ) : null}
      {openedPerson ? (
        <Modal title={openedPerson.name} onClose={() => setPerson(null)}>
          <div className="content-detail">
            <div className="content-person-heading">
              <Avatar creator={openedPerson} size={72} />
              <div>
                <h2>{openedPerson.name}</h2>
                <p>
                  @{openedPerson.handle} · {openedPerson.platform}
                </p>
              </div>
            </div>
            <p>{txt(openedPerson.bio)}</p>
            <p>
              {openedPerson.followers === null
                ? '—'
                : openedPerson.followers.toLocaleString(locale)}{' '}
              {t('关注者', 'followers')}
            </p>
            <h3>{t('收集的帖子', 'Collected posts')}</h3>
            {posts
              .filter((p) => p.creatorId === openedPerson.id)
              .map((p) => (
                <button
                  className="content-related"
                  key={p.id}
                  onClick={() => {
                    setPerson(null);
                    setOpened(p.id);
                  }}
                >
                  {txt(p.title)} <span>{p.date.slice(0, 10)} ↗</span>
                </button>
              ))}
          </div>
        </Modal>
      ) : null}
      {openedEntity ? (
        <Modal title={openedEntity.name} onClose={() => setEntityId(null)}>
          <div className="content-detail">
            <small>{openedEntity.kind}</small>
            <h2>{openedEntity.name}</h2>
            <p>{txt(openedEntity.summary)}</p>
            <h3>{t('关联实体', 'Related entities')}</h3>
            {openedEntity.relatedIds.map((id) => {
              const e = content.entities.find((e) => e.id === id)!;
              return (
                <button key={id} className="ad-button" onClick={() => setEntityId(id)}>
                  {e.name} ↗
                </button>
              );
            })}
            <h3>{t('相关帖子', 'Related posts')}</h3>
            {posts
              .filter((p) => p.entityIds.includes(openedEntity.id))
              .map((p) => (
                <button
                  className="content-related"
                  key={p.id}
                  onClick={() => {
                    setEntityId(null);
                    setOpened(p.id);
                  }}
                >
                  {txt(p.title)} <span>{byCreator.get(p.creatorId)!.name} ↗</span>
                </button>
              ))}
          </div>
        </Modal>
      ) : null}
      {workflow ? (
        <Modal title={t('内容工作流', 'Content workflow')} onClose={() => setWorkflow(false)}>
          <div className="content-detail">
            <h2>{t('从发现到复用', 'From discovery to reuse')}</h2>
            <ol className="content-workflow">
              <li>
                <h3>{t('关注与采集', 'Follow & collect')}</h3>
                <p>
                  {t(
                    '按博主、分类和平台组织来源。本演示只读取合成快照，真实采集仍待实现。',
                    'Organize sources by creator, category and platform. This demo reads a synthetic snapshot; live collection is not implemented.',
                  )}
                </p>
              </li>
              <li>
                <h3>{t('阅读与收藏', 'Read & save')}</h3>
                <p>
                  {t(
                    '用媒体墙快速浏览，打开详情阅读，再收藏值得留存的帖子。',
                    'Browse the media wall, read post details, then save what is worth keeping.',
                  )}
                </p>
              </li>
              <li>
                <h3>{t('整理成知识', 'Connect knowledge')}</h3>
                <p>
                  {t(
                    '通过知识实体找到相关的方法、工具和帖子。当前关系来自快照。',
                    'Discover related methods, tools and posts through knowledge entities. Current relationships come from the snapshot.',
                  )}
                </p>
              </li>
              <li>
                <h3>{t('回到自己的运营', 'Return to your operations')}</h3>
                <p>
                  {t(
                    '在账号面板查看已登记的发布、读数与下一步。自动发布和写入尚未实现。',
                    'Review recorded posts, readings and next actions in the account panel. Automated publishing and writes are not implemented.',
                  )}
                </p>
              </li>
            </ol>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
export default function ContentPage() {
  const { data, mode } = useWorkspace();
  const { t } = useI18n();
  if (!data.content)
    return (
      <section className="ad-card content-unavailable">
        <h1>{t('内容运营', 'Content workspace')}</h1>
        <p>
          {t(
            '此本地快照没有内容运营数据。请按内容数据契约加入 content；不会用演示数据补齐。',
            'This local snapshot has no content workspace data. Add content using the content contract; demo data will not fill this gap.',
          )}
        </p>
      </section>
    );
  return <ContentWorkspace content={data.content} readonly={mode === 'local'} />;
}
