export const themes = ['ocean', 'harbor', 'sunset'] as const;
export const modes = ['light', 'dark', 'system'] as const;
export const locales = ['en', 'zh-CN'] as const;
export type Preferences = {
  theme: (typeof themes)[number];
  mode: (typeof modes)[number];
  locale: (typeof locales)[number];
};
export const preferenceKey = 'siteaboard.preferences.v1';

export function parsePreferences(raw: string | null, language = 'en'): Preferences {
  const fallback: Preferences = {
    theme: 'ocean',
    mode: 'system',
    locale: language.startsWith('zh') ? 'zh-CN' : 'en',
  };
  try {
    const value: unknown = JSON.parse(raw ?? '{}');
    if (!value || typeof value !== 'object') return fallback;
    const v = value as Record<string, unknown>;
    return {
      theme: themes.includes(v.theme as Preferences['theme'])
        ? (v.theme as Preferences['theme'])
        : fallback.theme,
      mode: modes.includes(v.mode as Preferences['mode'])
        ? (v.mode as Preferences['mode'])
        : fallback.mode,
      locale: locales.includes(v.locale as Preferences['locale'])
        ? (v.locale as Preferences['locale'])
        : fallback.locale,
    };
  } catch {
    return fallback;
  }
}

export function resolvedMode(mode: Preferences['mode'], systemDark: boolean): 'light' | 'dark' {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}
