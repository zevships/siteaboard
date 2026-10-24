import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type MessageKey } from '../locales/en.ts';
import { zhCN } from '../locales/zh-CN.ts';
import {
  parsePreferences,
  preferenceKey,
  resolvedMode,
  type Preferences,
} from '../lib/preferences.ts';

type ContextValue = {
  preferences: Preferences;
  update: (next: Partial<Preferences>) => void;
  t: (key: MessageKey) => string;
  number: (value: number) => string;
};
const Context = createContext<ContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(() => {
    try {
      return parsePreferences(localStorage.getItem(preferenceKey), navigator.language);
    } catch {
      return parsePreferences(null, navigator.language);
    }
  });
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = preferences.theme;
      document.documentElement.dataset.mode = resolvedMode(preferences.mode, media.matches);
      document.documentElement.lang = preferences.locale;
    };
    apply();
    media.addEventListener('change', apply);
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(preferences));
    } catch {
      /* In-memory mode. */
    }
    return () => media.removeEventListener('change', apply);
  }, [preferences]);
  const value = useMemo<ContextValue>(
    () => ({
      preferences,
      update: (next) => setPreferences((current) => ({ ...current, ...next })),
      t: (key) => (preferences.locale === 'zh-CN' ? zhCN : en)[key],
      number: (value) => new Intl.NumberFormat(preferences.locale).format(value),
    }),
    [preferences],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error('PreferencesProvider is required');
  return value;
}
