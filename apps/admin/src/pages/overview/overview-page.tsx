import { Link } from '@tanstack/react-router';
import { useWorkspace } from '../../providers/workspace.tsx';
import { useI18n } from '../../lib/reference-format.ts';
import { SiteCard } from '../../components/operations/site-card.tsx';
import { Inbox, TasksMini, getInbox } from '../../components/operations/inbox.tsx';
export default function OverviewPage() {
  const { data, mode } = useWorkspace();
  const { t, locale } = useI18n();
  const first = data.sites[0];
  const date = new Date(data.generatedAt);
  const failed = data.tasks.filter((task) => task.status === 'failed').length;
  return (
    <div className="hm">
      <header className="hm-hero">
        <div>
          <p className="hm-date">
            {new Intl.DateTimeFormat(locale, {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
              timeZone: 'UTC',
            }).format(date)}
            <span>
              {mode === 'demo' ? t('演示时间', 'Demo time') : t('数据快照', 'Snapshot')} ·{' '}
              {date.toISOString().slice(11, 16)} UTC
            </span>
          </p>
          <h1>{t('下午好', 'Good afternoon')}</h1>
        </div>
        <div className="hm-glance">
          <Link className="hm-g is-owner" to="/activity">
            <b>{getInbox(data).length}</b>
            {t('件要看', 'to review')}
          </Link>
          <Link className={`hm-g${failed ? ' is-bad' : ''}`} to="/tasks">
            <b>{failed}</b>
            {t('个任务失败了', 'failed tasks')}
          </Link>
          <Link
            className="hm-g"
            to="/sites"
            search={{ site: first?.id, tab: 'overview', period: '7d', days: 7 }}
          >
            <b>{data.sites.length}</b>
            {t('个站点', 'websites')}
          </Link>
        </div>
      </header>
      <div className="hm-scope-note">
        <span>
          <i />
          {mode === 'demo'
            ? t('演示工作区 · 所有数据均为虚构', 'Demo workspace · All data is fictional')
            : t(
                '本地工作区 · 数据仅来自你的数据库',
                'Local workspace · Data from your database only',
              )}
        </span>
        <span>{t('先看数据，再做决定', 'Know your numbers. Choose your next move.')}</span>
      </div>
      {data.sites.length === 0 ? (
        <section className="ad-card">
          {t('数据库里还没有站点', 'No sites in this database yet')}
        </section>
      ) : (
        <div className="hm-sites">
          {data.sites.map((site, index) => (
            <SiteCard key={site.id} site={site} index={index} />
          ))}
        </div>
      )}
      <div className="hm-cols">
        <Inbox data={data} />
        <TasksMini data={data} />
      </div>
    </div>
  );
}
