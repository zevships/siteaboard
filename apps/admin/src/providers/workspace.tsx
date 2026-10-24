import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  validateWorkspace,
  type WorkspaceDataset,
} from '../../../../packages/core/src/workspace.ts';
import { useI18n } from '../lib/reference-format.ts';
declare const __SITEABOARD_DATA_SOURCE__: 'demo' | 'local';
type WorkspaceContext = { data: WorkspaceDataset; mode: 'demo' | 'local' };
const Context = createContext<WorkspaceContext | null>(null);
const mode = __SITEABOARD_DATA_SOURCE__;
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [data, setData] = useState<WorkspaceDataset | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setError(false);
    const load = async () => {
      if (mode === 'demo') return (await import('../data/workspace.ts')).demoWorkspace;
      const response = await fetch('/api/workspace', {
        credentials: 'same-origin',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Unavailable');
      const value: unknown = await response.json();
      validateWorkspace(value);
      return value;
    };
    void load()
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);
  if (error)
    return (
      <section className="ad-data-error" role="alert">
        <h1>{t('无法读取本地数据', 'Local data could not be read')}</h1>
        <p>
          {t(
            '请检查本地服务和数据库格式。这里不会用演示数据替代缺失的数据。',
            'Check the local service and database format. Missing local data is never replaced with demo data.',
          )}
        </p>
        <button className="ad-button" onClick={() => setAttempt((v) => v + 1)}>
          {t('重试', 'Retry')}
        </button>
      </section>
    );
  if (!data)
    return (
      <p className="loading" role="status">
        {t('正在加载工作区…', 'Loading workspace…')}
      </p>
    );
  return <Context.Provider value={{ data, mode }}>{children}</Context.Provider>;
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('WorkspaceProvider is required');
  return value;
}
