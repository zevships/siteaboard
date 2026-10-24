// Apply color preferences before paint. Only presentation preferences are stored.
(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('siteaboard.preferences.v1') || '{}');
    const theme = ['ocean', 'harbor', 'sunset'].includes(saved.theme) ? saved.theme : 'ocean';
    const mode = ['light', 'dark', 'system'].includes(saved.mode) ? saved.mode : 'system';
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode =
      mode === 'system'
        ? matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : mode;
    document.documentElement.lang = ['en', 'zh-CN'].includes(saved.locale)
      ? saved.locale
      : navigator.language.startsWith('zh')
        ? 'zh-CN'
        : 'en';
  } catch {
    /* Restricted storage uses the accessible document defaults. */
  }
})();
