import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
} from '@tanstack/react-router';
import { lazy, Suspense, type ComponentType } from 'react';
import { AppShell } from '../components/layout/app-shell.tsx';
import { usePreferences } from '../providers/preferences.tsx';
import { pageRoutes, type PagePath } from './navigation.ts';

import { useWorkspace } from '../providers/workspace.tsx';

const pages: Record<PagePath, ComponentType> = {
  '/': lazy(() => import('../pages/overview/overview-page.tsx')),
  '/sites': lazy(() => import('../pages/sites/sites-page.tsx')),
  '/content': lazy(() => import('../pages/content/content-page.tsx')),
  '/activity': lazy(() => import('../pages/activity/activity-page.tsx')),
  '/tasks': lazy(() => import('../pages/tasks/tasks-page.tsx')),
  '/guides': lazy(() => import('../pages/guides/guides-page.tsx')),
};
function Loading() {
  const { t } = usePreferences();
  return (
    <p role="status" className="loading">
      {t('loading')}
    </p>
  );
}
function ErrorPage() {
  const { t } = usePreferences();
  return (
    <div className="empty-state">
      <h1>{t('failed')}</h1>
      <button className="button" onClick={() => window.location.reload()}>
        {t('retry')}
      </button>
    </div>
  );
}
function NotFound() {
  const { t } = usePreferences();
  return (
    <div className="empty-state">
      <h1>{t('notFound')}</h1>
      <p>{t('notFoundText')}</p>
      <a className="button" href="#/">
        {t('back')}
      </a>
    </div>
  );
}
const root = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});
const routes = pageRoutes.map((item) => {
  const Page = pages[item.path];
  return createRoute({
    getParentRoute: () => root,
    path: item.path,
    validateSearch: (search: Record<string, unknown>) =>
      item.path === '/sites'
        ? {
            site: typeof search.site === 'string' ? search.site : 'tinycanvas',
            days: search.days === 30 || search.days === '30' ? 30 : 7,
            tab: [
              'overview',
              'performance',
              'feedback',
              'returning',
              'search',
              'issues',
              'releases',
            ].includes(String(search.tab))
              ? String(search.tab)
              : 'overview',
            period: ['today', 'yesterday', '7d', '30d', 'month', 'all'].includes(
              String(search.period),
            )
              ? String(search.period)
              : search.days === 30 || search.days === '30'
                ? '30d'
                : '7d',
          }
        : {},
    component: () => (
      <Suspense fallback={<Loading />}>
        <Page />
      </Suspense>
    ),
  });
});
function LegacySearch() {
  const { data } = useWorkspace();
  return (
    <Navigate
      to="/sites"
      search={{ site: data.sites[0]?.id, tab: 'search', period: '7d', days: 7 }}
      replace
    />
  );
}
const aliases = [
  createRoute({
    getParentRoute: () => root,
    path: '/connections',
    component: () => <Navigate to="/tasks" replace />,
  }),
  createRoute({ getParentRoute: () => root, path: '/search', component: LegacySearch }),
];
export const router = createRouter({
  routeTree: root.addChildren([...routes, ...aliases]),
  history: createHashHistory(),
  defaultPreload: 'intent',
});
