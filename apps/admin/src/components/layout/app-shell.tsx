import { Link, Outlet, useLocation, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { navigation, pageRoutes } from '../../app/navigation.ts';
import { usePreferences } from '../../providers/preferences.tsx';
import { BrandMark, Icon } from '../ui/icon.tsx';
import { useWorkspace } from '../../providers/workspace.tsx';
import { useI18n } from '../../lib/reference-format.ts';
import { PreferenceControls } from './preference-controls.tsx';

function Progress() {
  const pending = useRouterState({ select: (s) => s.status === 'pending' });
  const [phase, setPhase] = useState('idle');
  useEffect(() => {
    if (pending) {
      const timer = setTimeout(() => setPhase('run'), 120);
      return () => clearTimeout(timer);
    }
    setPhase((p) => (p === 'run' ? 'done' : 'idle'));
  }, [pending]);
  useEffect(() => {
    if (phase === 'done') {
      const timer = setTimeout(() => setPhase('idle'), 450);
      return () => clearTimeout(timer);
    }
  }, [phase]);
  return <div className="ad-progress" data-phase={phase} aria-hidden="true" />;
}

export function AppShell() {
  const { t } = usePreferences();
  const { t: tr } = useI18n();
  const { mode } = useWorkspace();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const restoreFocus = useRef(false);
  const active = pageRoutes.find((item) => item.path === pathname);
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
      <Progress />
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
      <header className="ad-top">
        <Link
          to="/"
          className="ad-brand"
          aria-label={`SiteAboard · ${t('overview')}`}
          title={t('overview')}
          aria-current={pathname === '/' ? 'page' : undefined}
        >
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
          className={`ad-top-nav ${open ? 'is-open' : ''}`}
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
              className={pathname === item.path ? 'is-on' : ''}
              aria-current={pathname === item.path ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <span className="ad-top-space" />
        <PreferenceControls />
      </header>
      <div className="main-column">
        <main className="ad-main" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="footer">
          <span>
            {mode === 'demo'
              ? `${t('demoData')} · ${t('demoNote')}`
              : tr(
                  '本地数据库 · 只读视图 · 数据留在本机',
                  'Local database · Read-only view · Data stays on this machine',
                )}
          </span>
          <a href="https://github.com/zevships/siteaboard" target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
