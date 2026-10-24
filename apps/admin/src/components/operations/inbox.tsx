import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type {
  WorkspaceDataset,
  LocalizedText,
} from '../../../../../packages/core/src/workspace.ts';
import { useI18n } from '../../lib/reference-format.ts';
export function getInbox(data: WorkspaceDataset) {
  const issues = data.sites.flatMap((site) =>
    site.issues
      .filter(
        (i) =>
          i.status !== 'resolved' &&
          (i.kind === 'decision' || (i.reviewAt && i.reviewAt <= site.time.today)),
      )
      .map((issue) => ({
        id: `${site.id}-${issue.id}`,
        kind: issue.kind === 'decision' ? 'decision' : 'review',
        text: issue.title,
        site: site.id,
        name: site.name,
      })),
  );
  return [
    ...data.tasks
      .filter((task) => task.status === 'failed')
      .map((task) => ({
        id: task.id,
        kind: 'task',
        text: task.name,
        site: task.siteId,
        name: data.sites.find((s) => s.id === task.siteId)?.name ?? '',
      })),
    ...issues,
  ];
}
export function Inbox({ data }: { data: WorkspaceDataset }) {
  const { t, locale } = useI18n();
  const [kind, setKind] = useState('all');
  const items = getInbox(data);
  const kinds = ['all', ...new Set(items.map((i) => i.kind))];
  const label = (k: string) =>
    k === 'all'
      ? t('全部', 'All')
      : k === 'task'
        ? t('任务', 'Task')
        : k === 'decision'
          ? t('决定', 'Decision')
          : t('复查', 'Review');
  const text = (value: LocalizedText) => (locale === 'en' ? value.en : value.zh);
  return (
    <section className="hm-card hm-inbox">
      <header className="hm-card-head">
        <h2>
          {t('今天要看的', 'Needs your attention')}
          <span className="hm-count">{items.length}</span>
        </h2>
        <div className="hm-kinds" role="group" aria-label={t('按种类看', 'Filter attention items')}>
          {kinds.map((k) => (
            <button
              key={k}
              className={kind === k ? 'is-on' : ''}
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
            >
              {label(k)}
              <span>{k === 'all' ? items.length : items.filter((i) => i.kind === k).length}</span>
            </button>
          ))}
        </div>
      </header>
      <ul className="hm-todos">
        {items
          .filter((i) => kind === 'all' || i.kind === kind)
          .map((i) => (
            <li key={i.id} data-kind={i.kind === 'decision' ? 'decide' : i.kind}>
              <Link
                className="hm-todo"
                to={i.kind === 'task' ? '/tasks' : '/sites'}
                search={
                  i.kind === 'task' ? {} : { site: i.site, tab: 'issues', period: '7d', days: 7 }
                }
              >
                <svg className="hm-ico" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d={
                      i.kind === 'task'
                        ? 'M8 2 14 13H2zM8 6v3M8 11v.5'
                        : 'M3 3h10v11H3zM5 1v4M11 1v4M5 9l2 2 4-4'
                    }
                  />
                </svg>
                <span className="hm-todo-body">
                  <span className="hm-todo-kind">
                    {label(i.kind)} · {i.name}
                  </span>
                  <span className="hm-todo-text">{text(i.text)}</span>
                </span>
                <span className="hm-go">→</span>
              </Link>
            </li>
          ))}
      </ul>
      {items.length === 0 && (
        <p className="hm-clear">{t('今天没有待办', 'Nothing needs your attention today')}</p>
      )}
    </section>
  );
}
export function TasksMini({ data }: { data: WorkspaceDataset }) {
  const { t, locale } = useI18n();
  const failed = data.tasks.filter((task) => task.status === 'failed').length;
  return (
    <section className="hm-card hm-tasks">
      <header className="hm-card-head">
        <h2>{t('任务', 'Tasks')}</h2>
        <Link className="hm-more" to="/tasks">
          {t('打开', 'Open')} →
        </Link>
      </header>
      <p className={`hm-tasks-state${failed ? ' is-bad' : ''}`}>
        {failed
          ? t(`${failed} 个上次失败了`, `${failed} failed on last run`)
          : t('都正常', 'All healthy')}
      </p>
      <ul className="hm-task-list">
        {data.tasks.map((task) => (
          <li
            key={task.id}
            data-status={
              task.status === 'success' ? 'ok' : task.status === 'paused' ? 'off' : task.status
            }
          >
            <Link to="/tasks">
              <i className="hm-dot" />
              <span className="hm-task-name">{locale === 'en' ? task.name.en : task.name.zh}</span>
              <span className="hm-task-when">{task.lastRun.slice(11, 16)}</span>
              <span className="hm-task-next">
                {locale === 'en' ? task.schedule.en : task.schedule.zh}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
