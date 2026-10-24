import type { MessageKey } from '../locales/en.ts';
import type { IconName } from '../components/ui/icon.tsx';

export const navigation = [
  { path: '/', label: 'overview', icon: 'overview', group: 'workspace' },
  { path: '/sites', label: 'sites', icon: 'sites', group: 'workspace' },
  { path: '/search', label: 'search', icon: 'search', group: 'workspace' },
  { path: '/activity', label: 'activity', icon: 'activity', group: 'tools' },
  { path: '/connections', label: 'connections', icon: 'connections', group: 'tools' },
  { path: '/guides', label: 'guides', icon: 'guides', group: 'tools' },
] as const satisfies readonly {
  path: string;
  label: MessageKey;
  icon: IconName;
  group: MessageKey;
}[];
export type PagePath = (typeof navigation)[number]['path'];
