import { usePreferences } from '../../providers/preferences.tsx';
import { themes, modes, type Preferences } from '../../lib/preferences.ts';

export function PreferenceControls() {
  const { preferences, update, t } = usePreferences();
  return (
    <div className="preferences" aria-label={t('openPreferences')}>
      <label>
        <span className="control-label">{t('theme')}</span>
        <select
          aria-label={t('theme')}
          value={preferences.theme}
          onChange={(e) => update({ theme: e.target.value as Preferences['theme'] })}
        >
          {themes.map((theme) => (
            <option key={theme} value={theme}>
              {t(theme)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="control-label">{t('mode')}</span>
        <select
          aria-label={t('mode')}
          value={preferences.mode}
          onChange={(e) => update({ mode: e.target.value as Preferences['mode'] })}
        >
          {modes.map((mode) => (
            <option key={mode} value={mode}>
              {t(mode)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="control-label">{t('language')}</span>
        <select
          aria-label={t('language')}
          value={preferences.locale}
          onChange={(e) => update({ locale: e.target.value as Preferences['locale'] })}
        >
          <option value="en">EN</option>
          <option value="zh-CN">中文</option>
        </select>
      </label>
    </div>
  );
}
