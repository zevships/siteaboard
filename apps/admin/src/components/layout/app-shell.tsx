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
  const sidebar = useRef<HTMLElement>(null);
  const restoreMenuFocus = useRef(false);
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
      if (restoreMenuFocus.current) menuButton.current?.focus();
      restoreMenuFocus.current = false;
      return;
    }
    restoreMenuFocus.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
      if (e.key === 'Tab') {
        const controls = Array.from(
          sidebar.current?.querySelectorAll<HTMLElement>('a, button') ?? [],
        ).filter((el) => el.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keydown);
    };
  }, [open]);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        {t('skip')}
      </a>
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => {
            setOpen(false);
          }}
        />
      )}
      <aside
        ref={sidebar}
        className={`sidebar ${open ? 'is-open' : ''}`}
        aria-label={t('workspace')}
      >
        <div className="brand-row">
          <Link to="/" className="brand" aria-label="SiteAboard">
            <BrandMark />
            <span>
              SiteAboard<span className="brand-dot">.</span>
            </span>
          </Link>
          <button
            className="icon-button mobile-only"
            aria-label={t('closeMenu')}
            onClick={() => {
              setOpen(false);
            }}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="workspace-card">
          <span className="workspace-avatar">S</span>
          <div>
            <strong>{t('demoWorkspace')}</strong>
            <span>{t('localFirst')}</span>
          </div>
          <span className="status-dot" />
        </div>
        <nav>
          {(['workspace', 'tools'] as const).map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-label">{t(group)}</p>
              {navigation
                .filter((item) => item.group === group)
                .map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${pathname === item.path ? 'active' : ''}`}
                    aria-current={pathname === item.path ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <Icon name={item.icon} />
                    <span>{t(item.label)}</span>
                    {item.path === '/activity' && <span className="nav-count">3</span>}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-sites">
          <p className="nav-label">{t('yourSites')}</p>
          {['TinyCanvas', 'Fieldnotes', 'OrbitKit'].map((site, i) => (
            <Link key={site} to="/sites" className="sidebar-site">
              <span className={`site-dot tone-${i}`} />
              {site}
              <span className="site-mini">↗</span>
            </Link>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="small-sail">
            <BrandMark />
          </div>
          <p>{t('footer')}</p>
          <a
            href="https://github.com/zevships/siteaboard"
            target="_blank"
            rel="noreferrer"
            className="github-link"
          >
            <Icon name="github" size={16} />
            {t('github')}
            <Icon name="arrow" size={14} />
          </a>
        </div>
      </aside>
      <div className="main-column" inert={open ? true : undefined}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={menuButton}
              className="icon-button mobile-only"
              aria-label={t('openMenu')}
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb-parent">{t('workspace')}</span>
            <Icon name="chevron" size={13} />
            <strong>{active ? t(active.label) : 'SiteAboard'}</strong>
          </div>
          <PreferenceControls />
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="demo-banner">
            <span className="demo-pill">
              <span className="status-dot" />
              {t('demo')}
            </span>
            <span>{t('demoNote')}</span>
          </div>
          <Outlet />
        </main>
        <footer className="footer">
          <span>
            SiteAboard <span className="footer-separator">/</span> {t('localFirst')}
          </span>
          <span>{t('version')}</span>
        </footer>
      </div>
    </div>
  );
}
