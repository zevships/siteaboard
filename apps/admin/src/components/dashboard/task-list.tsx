import { Link } from '@tanstack/react-router';
import { usePreferences } from '../../providers/preferences.tsx';
export function TaskList() {
  const { t } = usePreferences();
  return (
    <aside className="panel tasks-panel">
      <div className="panel-heading">
        <h2>{t('tasks')}</h2>
        <Link className="text-link" to="/connections">
          {t('open')} →
        </Link>
      </div>
      <p className="section-note">{t('taskPreview')}</p>
      <ul className="task-list">
        {(['fixtureSource', 'analyticsSource', 'googleSource'] as const).map((key, i) => (
          <li key={key}>
            <span className={`status-dot ${i > 0 ? 'is-pending' : ''}`} />
            <div>
              <strong>{t(key)}</strong>
              <p>{t(i === 0 ? 'fixtureUpdated' : 'notConnected')}</p>
            </div>
            <span className="task-state">{t(i === 0 ? 'sample' : 'planned')}</span>
          </li>
        ))}
      </ul>
      <div className="task-bottom">
        <span>{t('agentWorkflow')}</span>
        <Link to="/guides">{t('guides')} ↗</Link>
      </div>
    </aside>
  );
}
