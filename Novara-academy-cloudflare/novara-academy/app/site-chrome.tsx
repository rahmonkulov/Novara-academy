'use client';
import {useEffect, useState} from 'react';
import {Moon, Search, Sun} from 'lucide-react';
import {BRAND} from './brand';

const THEME_KEY = 'novara-theme';
const SAT_KEY = 'novara-sat';

// The SAT a student types is kept only in this browser tab (sessionStorage), never sent to the server.
export function useSessionSat(): [string, (value: string) => void] {
  const [value, setValue] = useState('');
  useEffect(() => {
    try {
      setValue(sessionStorage.getItem(SAT_KEY) || '');
    } catch {
      // Storage can be unavailable (private mode); the field still works.
    }
  }, []);
  const update = (next: string) => {
    setValue(next);
    try {
      if (next) sessionStorage.setItem(SAT_KEY, next);
      else sessionStorage.removeItem(SAT_KEY);
    } catch {
      // Ignore storage errors.
    }
  };
  return [value, update];
}

export function SiteHeader({active}: {active?: 'colleges'}) {
  const [light, setLight] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === 'dark') setLight(false);
    } catch {
      // Default to the light theme.
    }
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', !light);
  }, [light]);
  const toggle = () => {
    const next = !light;
    setLight(next);
    try {
      localStorage.setItem(THEME_KEY, next ? 'light' : 'dark');
    } catch {
      // Ignore storage errors.
    }
  };
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label={`${BRAND.name} home`}>
        <img className="brand-logo" src={BRAND.logo} alt={BRAND.logoAlt} width={192} height={92} />
      </a>
      <div className="top-right">
        <a className={`quiet cx-nav${active === 'colleges' ? ' cx-nav-active' : ''}`} href="/colleges" aria-current={active === 'colleges' ? 'page' : undefined}>
          <Search size={16} /> Colleges
        </a>
        <button className="icon-button" onClick={toggle} aria-label={light ? 'Use dark theme' : 'Use light theme'}>
          {light ? <Moon size={19} /> : <Sun size={19} />}
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} {BRAND.name}</span>
      <div>
        <a className="cx-footer-link" href="/">Find my college fit</a>
        <span>College data: U.S. Department of Education College Scorecard.</span>
      </div>
    </footer>
  );
}
