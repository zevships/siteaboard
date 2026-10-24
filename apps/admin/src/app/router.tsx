import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { lazy, Suspense, type ComponentType } from 'react';
import { AppShell } from '../components/layout/app-shell.tsx';
import { usePreferences } from '../providers/preferences.tsx';
import { navigation, type PagePath } from './navigation.ts';

const pages: Record<PagePath, ComponentType> = {
  '/': lazy(() => import('../pages/overview/overview-page.tsx')),
  '/sites': lazy(() => import('../pages/sites/sites-page.tsx')),
  '/search': lazy(() => import('../pages/search/search-page.tsx')),
  '/activity': lazy(() => import('../pages/activity/activity-page.tsx')),
  '/connections': lazy(() => import('../pages/connections/connections-page.tsx')),
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
const routes = navigation.map((item) => {
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
export const router = createRouter({
  routeTree: root.addChildren(routes),
  history: createHashHistory(),
  defaultPreload: 'intent',
});
