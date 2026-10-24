import type { MessageKey } from '../locales/en.ts';
import type { IconName } from '../components/ui/icon.tsx';

// Home is the brand link; search belongs to the selected site's navigation.
export const navigation = [
  { path: '/sites', label: 'sites', icon: 'sites', group: 'workspace' },
  { path: '/content', label: 'content', icon: 'globe', group: 'workspace' },
  { path: '/activity', label: 'activity', icon: 'activity', group: 'tools' },
  { path: '/tasks', label: 'tasks', icon: 'connections', group: 'tools' },
  { path: '/guides', label: 'guides', icon: 'guides', group: 'tools' },
] as const satisfies readonly {
  path: string;
  label: MessageKey;
  icon: IconName;
  group: MessageKey;
}[];
export const pageRoutes = [
  { path: '/', label: 'overview', icon: 'overview', group: 'workspace' },
  ...navigation,
] as const;
export type PagePath = (typeof pageRoutes)[number]['path'];
