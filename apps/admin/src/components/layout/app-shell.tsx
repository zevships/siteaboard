import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { navigation } from '../../app/navigation.ts';
import { usePreferences } from '../../providers/preferences.tsx';
import { BrandMark, Icon } from '../ui/icon.tsx';
import { PreferenceControls } from './preference-controls.tsx';

export function AppShell() {
  const { t } = usePreferences();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const restoreFocus = useRef(false);
  const active = navigation.find((item) => item.path === pathname);
  useEffect(() => {
    document.title = `${active ? t(active.label) : 'SiteAboard'} · SiteAboard`;
  }, [active, t]);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (!open) {
      if (restoreFocus.current) menuButton.current?.focus();
      restoreFocus.current = false;
      return;
    }
    restoreFocus.current = true;
    nav.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [open]);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        {t('skip')}
      </a>
      <header className="topbar">
        <Link to="/" className="brand">
          <BrandMark />
          SiteAboard<span>{t('brandSubtitle')}</span>
        </Link>
        <button
          ref={menuButton}
          className="icon-button mobile-only"
          aria-label={t('openMenu')}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen(!open)}
        >
          <Icon name="menu" />
        </button>
        <nav
          ref={nav}
          id="primary-navigation"
          className={`top-nav ${open ? 'is-open' : ''}`}
          aria-label={t('workspace')}
        >
          <button
            className="icon-button mobile-only nav-close"
            aria-label={t('closeMenu')}
            onClick={() => setOpen(false)}
          >
            <Icon name="close" />
          </button>
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={pathname === item.path ? 'active' : ''}
              aria-current={pathname === item.path ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <PreferenceControls />
      </header>
      <div className="main-column">
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="footer">
          <span>
            {t('demoData')} · {t('demoNote')}
          </span>
          <a href="https://github.com/zevships/siteaboard" target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
