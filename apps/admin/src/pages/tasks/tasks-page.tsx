import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type {
  TaskRecord,
  TaskRun,
  LocalizedText,
} from '../../../../../packages/core/src/workspace.ts';
import { useWorkspace } from '../../providers/workspace.tsx';
import { useI18n } from '../../lib/reference-format.ts';

function TaskCard({
  task,
  demo,
  onSelect,
}: {
  task: TaskRecord;
  demo: boolean;
  onSelect: (task: TaskRecord, run: TaskRun) => void;
}) {
  const { t, locale } = useI18n();
  const text = (value: LocalizedText) => (locale === 'en' ? value.en : value.zh);
  const [enabled, setEnabled] = useState(task.status !== 'paused');
  const [running, setRunning] = useState(task.status === 'running');
  const [result, setResult] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const run = () => {
    setRunning(true);
    setResult(false);
    timer.current = setTimeout(() => {
      setRunning(false);
      setResult(true);
    }, 1800);
  };
  const status = !enabled ? 'off' : running ? 'running' : result ? 'success' : task.status;
  return (
    <article className={`tk-task${running ? ' is-running' : ''}`} data-status={status}>
      <header className="tk-task-head">
        <i className="tk-dot" />
        <h3>{text(task.name)}</h3>
        <button
          className={`tk-switch${enabled ? ' is-on' : ''}`}
          role="switch"
          aria-label={`${t('演示开关', 'Demo toggle')}: ${text(task.name)}`}
          aria-checked={enabled}
          disabled={!demo || running}
          onClick={() => setEnabled(!enabled)}
        >
          <span />
        </button>
      </header>
      <p className="tk-what">{text(task.schedule)}</p>
      <div className="tk-hist" aria-label={t('最近运行记录', 'Recent run history')}>
        {task.runs.slice(-24).map((run, i) => (
          <button
            key={run.at}
            className="tk-hist-bar"
            data-status={run.status}
            style={
              {
                '--h': Math.max(
                  0.15,
                  run.durationSeconds / Math.max(1, ...task.runs.map((r) => r.durationSeconds)),
                ),
                '--i': i,
              } as CSSProperties
            }
            aria-label={`${run.at} · ${text(run.message)}`}
            title={`${run.at} · ${run.durationSeconds}s`}
            onClick={() => onSelect(task, run)}
          />
        ))}
      </div>
      <dl className="tk-facts">
        <div>
          <dt>{t('上次运行', 'Last run')}</dt>
          <dd>{task.lastRun.slice(5, 16).replace('T', ' ')}</dd>
        </div>
        <div>
          <dt>{t('下次运行', 'Next run')}</dt>
          <dd>{task.nextRun?.slice(5, 16).replace('T', ' ') ?? '—'}</dd>
        </div>
      </dl>
      <p className="tk-what" role="status">
        {running
          ? t('演示运行中…', 'Demo running…')
          : result
            ? t(
                '演示动画完成，未连接外部服务',
                'Demo animation complete. No external service was called.',
              )
            : task.runs.at(-1)
              ? text(task.runs.at(-1)!.message)
              : t('尚无记录', 'No runs yet')}
      </p>
      <div className="sb-task-actions">
        <span className="hm-source-tag">
          {demo ? t('演示任务', 'DEMO TASK') : t('只读', 'READ ONLY')}
        </span>
        <button className="ad-button" disabled={!demo || !enabled || running} onClick={run}>
          {t('模拟运行', 'Simulate run')}
        </button>
      </div>
    </article>
  );
}
export default function TasksPage() {
  const { data, mode } = useWorkspace();
  const { t, locale } = useI18n();
  const text = (v: LocalizedText) => (locale === 'en' ? v.en : v.zh);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<{ task: TaskRecord; run: TaskRun } | null>(null);
  const log = useRef<HTMLElement>(null);
  const runs = data.tasks
    .flatMap((task) => task.runs.map((run) => ({ task, run })))
    .sort((a, b) => b.run.at.localeCompare(a.run.at));
  const shown = runs.filter(({ run }) => filter === 'all' || run.status === filter);
  const select = (task: TaskRecord, run: TaskRun) => {
    setSelected({ task, run });
    requestAnimationFrame(() =>
      log.current?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'center',
      }),
    );
  };
  return (
    <div className="tk">
      <header className="tk-hero">
        <div className="tk-hero-text">
          <p className="hm-date">
            {t('采集、同步与检查，统一看运行情况', 'Collection, sync and checks — in one place')}
          </p>
          <h1>{t('任务', 'Tasks')}</h1>
          <p className="tk-state">
            <i className="tk-dot" />
            {mode === 'demo'
              ? t(
                  '合成任务记录 · 可体验运行状态',
                  'Synthetic task history · Preview running states',
                )
              : t(
                  '本地记录 · 此版本不启动采集任务',
                  'Local records · This version does not start collectors',
                )}
          </p>
        </div>
        <dl className="tk-stats">
          <div>
            <dt>{t('任务', 'Tasks')}</dt>
            <dd>{data.tasks.length}</dd>
          </div>
          <div>
            <dt>{t('上次失败', 'Last run failed')}</dt>
            <dd>{data.tasks.filter((t) => t.status === 'failed').length}</dd>
          </div>
        </dl>
      </header>
      <div className="tk-groups">
        {data.sites.map((site) => (
          <section
            className="tk-group"
            key={site.id}
            style={
              {
                '--n': Math.max(1, data.tasks.filter((t) => t.siteId === site.id).length),
              } as CSSProperties
            }
          >
            <h2>
              {site.name}
              <span>{site.domain}</span>
            </h2>
            <div className="tk-grid">
              {data.tasks
                .filter((task) => task.siteId === site.id)
                .map((task) => (
                  <TaskCard key={task.id} task={task} demo={mode === 'demo'} onSelect={select} />
                ))}
            </div>
          </section>
        ))}
      </div>
      <section className="tk-card">
        <header className="tk-card-head">
          <h2>{t('本地数据覆盖', 'Local data coverage')}</h2>
          <span className="ad-sub">{t('按数据快照记录', 'As recorded in the snapshot')}</span>
        </header>
        <div className="sb-coverage">
          {data.tasks.map((task) => (
            <div key={task.id}>
              <div className="sb-coverage-label">
                <span>{text(task.name)}</span>
                <b>
                  {task.coverage.completed}/{task.coverage.expected}
                </b>
              </div>
              <div className="sb-meter">
                <span
                  style={{
                    width: `${task.coverage.expected ? Math.min(100, (100 * task.coverage.completed) / task.coverage.expected) : 0}%`,
                  }}
                />
              </div>
              <small>
                {task.coverage.from} → {task.coverage.to}
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="tk-card" ref={log}>
        <header className="tk-card-head">
          <h2>{t('运行历史', 'Run history')}</h2>
          <div className="ad-seg" role="group" aria-label={t('运行结果筛选', 'Filter runs')}>
            {[
              ['all', t('全部', 'All')],
              ['success', t('成功', 'Success')],
              ['failed', t('失败', 'Failed')],
            ].map(([key, label]) => (
              <button
                key={key}
                className={filter === key ? 'is-on' : ''}
                aria-pressed={filter === key}
                onClick={() => {
                  setFilter(key);
                  setSelected(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </header>
        {selected && (
          <div className="tk-log-body" role="status">
            <strong>
              {text(selected.task.name)} · {selected.run.at}
            </strong>
            <p>{text(selected.run.message)}</p>
            <code>
              {selected.run.durationSeconds}s · {selected.run.status}
            </code>
            <button className="ad-button" onClick={() => setSelected(null)}>
              {t('收起', 'Close')}
            </button>
          </div>
        )}
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{t('时间', 'Time')}</th>
                <th>{t('任务', 'Task')}</th>
                <th>{t('结果', 'Result')}</th>
                <th>{t('耗时', 'Duration')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 24).map(({ task, run }) => (
                <tr key={`${task.id}-${run.at}`}>
                  <td>
                    <button className="sb-row-button" onClick={() => select(task, run)}>
                      {run.at.slice(5, 16).replace('T', ' ')} ↗
                    </button>
                  </td>
                  <td>{text(task.name)}</td>
                  <td>
                    <span className={run.status === 'failed' ? 'ad-bad' : 'ad-good'}>
                      {run.status === 'failed' ? t('失败', 'Failed') : t('成功', 'Success')}
                    </span>
                  </td>
                  <td>{run.durationSeconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ad-sub">
          {t(
            `显示最近 ${Math.min(24, shown.length)} / ${shown.length} 条`,
            `Showing latest ${Math.min(24, shown.length)} of ${shown.length} runs`,
          )}
        </p>
      </section>
      <section className="ad-card">
        <h2>{t('接入你的数据', 'Bring your own data')}</h2>
        <p>
          {t(
            '本地版本可以从 SQLite 快照加载同一套页面；外部平台连接器仍在规划中。',
            'The local version reads these same pages from a SQLite snapshot. External platform connectors are still planned.',
          )}
        </p>
        <a
          href="https://github.com/zevships/siteaboard/blob/main/docs/local-data.md"
          target="_blank"
          rel="noreferrer"
        >
          {t('查看本地数据接入说明', 'Read the local data guide')} ↗
        </a>
      </section>
    </div>
  );
}
