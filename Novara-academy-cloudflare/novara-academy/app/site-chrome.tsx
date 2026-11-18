'use client';
import {useEffect, useState} from 'react';
import {Globe2, GraduationCap, Moon, Star, Sun} from 'lucide-react';
import {BRAND} from './brand';
import {
  LEGACY_SAT_KEY, MAX_SAVED, profileParts, readLists, readStoredProfile, summarizeProfile, usableScore, writeLists, writeScores,
  type ProfileSummary, type SavedLists, type Scores,
} from './profile-store';

const THEME_KEY = 'novara-theme';

// What a student enters once and reuses on every page: SAT and IELTS live in the questionnaire profile,
// saved universities in their own key. Both stay in this browser only (see profile-store.ts).
export type Saved = Scores & SavedLists;
const EMPTY_SAVED: Saved = {sat: '', ielts: '', colleges: [], universities: []};

function readSaved(): Saved {
  try {
    const lists = readLists(localStorage);
    const profile = readStoredProfile(localStorage)?.profile;
    let sessionSat = '';
    try {
      sessionSat = usableScore(sessionStorage.getItem(LEGACY_SAT_KEY));
    } catch {
      // Session storage can be blocked separately.
    }
    return {
      sat: usableScore(profile?.sat) || lists.legacy.sat || sessionSat,
      ielts: usableScore(profile?.ielts) || lists.legacy.ielts,
      colleges: lists.colleges,
      universities: lists.universities,
    };
  } catch {
    return EMPTY_SAVED;
  }
}

export function useSaved() {
  const [saved, setSaved] = useState<Saved>(EMPTY_SAVED);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setSaved(readSaved());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      writeLists(localStorage, saved);
      writeScores(localStorage, {sat: saved.sat, ielts: saved.ielts});
      sessionStorage.removeItem(LEGACY_SAT_KEY);
    } catch {
      // Storage can be unavailable (private mode); everything still works for this visit.
    }
  }, [saved, loaded]);
  const update = (patch: Partial<Scores>) => setSaved(current => ({...current, ...patch}));
  const toggleCollege = (id: number) =>
    setSaved(current => ({...current, colleges: current.colleges.includes(id) ? current.colleges.filter(x => x !== id) : [id, ...current.colleges].slice(0, MAX_SAVED)}));
  const toggleUniversity = (id: string) =>
    setSaved(current => ({...current, universities: current.universities.includes(id) ? current.universities.filter(x => x !== id) : [id, ...current.universities].slice(0, MAX_SAVED)}));
  return {saved, loaded, update, toggleCollege, toggleUniversity};
}

// The rest of the saved profile (name, grades, activities), read once per page.
export function useProfileSummary() {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  useEffect(() => {
    try {
      setSummary(summarizeProfile(readStoredProfile(localStorage)));
    } catch {
      // No storage, no profile.
    }
  }, []);
  return summary;
}

export type SelectOption = {value: string; label: string};

export function FilterSelect({label, value, onChange, options, anyLabel, compact = false}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  anyLabel?: string;
  compact?: boolean;
}) {
  return (
    <label className={`cx-select${compact ? ' cx-select-compact' : ''}`}>
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)}>
        {anyLabel && <option value="">{anyLabel}</option>}
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function SaveButton({saved, onToggle, compact = false}: {saved: boolean; onToggle: () => void; compact?: boolean}) {
  return (
    <button
      type="button"
      className={`cx-save${saved ? ' cx-saved' : ''}${compact ? ' cx-save-compact' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from My list' : 'Save to My list'}
      title={saved ? 'Remove from My list' : 'Save to My list'}
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
    >
      <Star size={16} />
      {!compact && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}

// Shows what is saved, so a returning student sees it is there and does not retype it.
export function ProfileNote({saved, summary}: {saved: Saved; summary: ProfileSummary | null}) {
  const parts = profileParts({
    gpa: summary?.gpa || '',
    scale: summary?.scale || '',
    sat: saved.sat,
    ielts: saved.ielts,
    activities: summary?.activities || 0,
    hasReport: Boolean(summary?.hasReport),
  });
  const listed = saved.colleges.length + saved.universities.length;
  if (!summary && !parts.length && !listed) return null;
  const who = summary?.firstName ? `${summary.firstName}’s profile` : 'Your profile';
  return (
    <p className="cx-saved-note">
      <strong>{who}, saved on this device:</strong> {parts.length ? parts.join(' · ') : 'no scores yet'}
      {listed ? ` · ${listed} saved` : ''}.{' '}
      <a className="inline-link" href="/?resume=1">{summary?.activities ? 'Edit profile' : 'Add grades and activities'}</a>
      {' · '}
      <a className="inline-link" href="/?delete=1">Delete</a>
    </p>
  );
}

export function SiteHeader({active}: {active?: 'colleges' | 'universities'}) {
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
        <a className={`quiet cx-nav${active === 'universities' ? ' cx-nav-active' : ''}`} href="/universities" aria-current={active === 'universities' ? 'page' : undefined}>
          <Globe2 size={16} /> Universities
        </a>
        <a className={`quiet cx-nav${active === 'colleges' ? ' cx-nav-active' : ''}`} href="/colleges" aria-current={active === 'colleges' ? 'page' : undefined}>
          <GraduationCap size={16} /> US colleges
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
        <span>Data: U.S. Department of Education College Scorecard and OpenAlex.</span>
      </div>
    </footer>
  );
}
