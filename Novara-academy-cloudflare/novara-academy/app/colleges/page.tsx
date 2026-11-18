'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, Globe2, Info, Search, Star, X} from 'lucide-react';
import {FilterSelect, ProfileNote, SaveButton, SiteFooter, SiteHeader, useProfileSummary, useSaved, type SelectOption} from '../site-chrome';
import {loadJson} from '../load-json';
import {
  CONTROLS, DATA_VERSION, DEFAULT_SORT, EMPTY_QUERY, MAX_PAGE, OWNERSHIP_LABEL, PER_PAGE, SELECTIVITY, SIZES, SORTS, STATES,
  apiSearch, chanceFor, cleanSearch, formatCount, formatRate, formatSatRange, formatShare, parseListQuery, parseSat, queryToSearch,
  type College, type ListQuery, type Option,
} from '../colleges-lib';

type ListResponse = {total: number; page: number; perPage: number; results: College[]};

const toOptions = (record: Record<string, Option>): SelectOption[] => Object.entries(record).map(([value, option]) => ({value, label: option.label}));
const STATE_OPTIONS: SelectOption[] = STATES.map(([code, name]) => ({value: code, label: name}));

function initials(name: string): string {
  const words = name.replace(/^The\s+/i, '').split(/[\s-]+/).filter(word => /^[A-Z]/.test(word));
  return words.slice(0, 3).map(word => word[0]).join('') || name.slice(0, 2).toUpperCase();
}

function CollegeCard({college, sat, saved, onToggle}: {college: College; sat: number | null; saved: boolean; onToggle: () => void}) {
  const chance = chanceFor(sat, college);
  const place = [college.city, college.state].filter(Boolean).join(', ');
  const ownership = college.ownership != null ? OWNERSHIP_LABEL[college.ownership] : undefined;
  return (
    <a className="cx-card" href={`/colleges/${college.id}`}>
      <div className="cx-card-top">
        <span className="school-icon" aria-hidden="true">{initials(college.name)}</span>
        <span className="cx-card-actions">
          {chance && <span className={`cx-chance ${chance.tone}`} title={chance.reason}>{chance.label}</span>}
          <SaveButton saved={saved} onToggle={onToggle} compact />
        </span>
      </div>
      <h3>{college.name}</h3>
      <p className="card-location">{place}{ownership ? ` · ${ownership}` : ''}</p>
      <dl className="cx-stats">
        <div><dt>Acceptance</dt><dd>{formatRate(college.admitRate)}</dd></div>
        <div><dt>SAT middle 50%</dt><dd>{formatSatRange(college.sat)}</dd></div>
        <div><dt>Undergrads</dt><dd>{formatCount(college.size)}</dd></div>
        <div><dt>International</dt><dd>{formatShare(college.intlShare)}</dd></div>
      </dl>
      <span className="cx-card-link">View data <ArrowRight size={15} /></span>
    </a>
  );
}

export default function CollegeExplorer() {
  const [query, setQuery] = useState<ListQuery>(EMPTY_QUERY);
  const [ready, setReady] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const {saved, loaded, update: updateSaved, toggleCollege} = useSaved();
  const profile = useProfileSummary();
  const sat = parseSat(saved.sat);
  const resultsTop = useRef<HTMLDivElement>(null);
  const savedKey = saved.colleges.join(',');

  useEffect(() => {
    const initial = parseListQuery(new URLSearchParams(window.location.search));
    setQuery({...initial, ids: []});
    setSearchText(initial.q);
    setReady(true);
  }, []);

  // Wait until typing pauses before searching.
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      const q = cleanSearch(searchText);
      setQuery(current => (current.q === q ? current : {...current, q, page: 0}));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText, ready]);

  useEffect(() => {
    if (!ready || !loaded) return;
    const search = queryToSearch(query);
    const pageUrl = window.location.pathname + (search ? `?${search}` : '');
    if (pageUrl !== window.location.pathname + window.location.search) window.history.replaceState(null, '', pageUrl);
    if (query.list === 'saved' && !saved.colleges.length) {
      setData({total: 0, page: 0, perPage: PER_PAGE, results: []});
      setLoading(false);
      setError('');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const request = apiSearch(query, saved.colleges);
    loadJson<ListResponse>(`/api/colleges?${request ? `${request}&` : ''}v=${DATA_VERSION}`, controller.signal, 'College data is temporarily unavailable.')
      .then(body => {
        setData(body);
        setLoading(false);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'College data is temporarily unavailable.');
        setLoading(false);
      });
    return () => controller.abort();
    // The saved list only matters while "My list" is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ready, loaded, attempt, query.list === 'saved' ? savedKey : '']);

  const update = (patch: Partial<ListQuery>) => setQuery(current => ({...current, ...patch, page: patch.page ?? 0}));
  const goToPage = (page: number) => {
    update({page});
    resultsTop.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };
  const clearFilters = () => {
    setSearchText('');
    setQuery(current => ({...EMPTY_QUERY, sort: current.sort}));
  };
  const chooseChip = (chip: 'all' | 'top' | 'ivy' | 'saved') => {
    setSearchText('');
    if (chip === 'all') setQuery(current => ({...EMPTY_QUERY, sort: current.sort}));
    if (chip === 'top') setQuery(current => ({...EMPTY_QUERY, sort: current.sort, sel: 'under10'}));
    if (chip === 'ivy') setQuery(current => ({...EMPTY_QUERY, sort: current.sort, list: 'ivy'}));
    if (chip === 'saved') setQuery(current => ({...EMPTY_QUERY, sort: current.sort, list: 'saved'}));
  };
  const listMode = Boolean(query.list);
  const activeChip = query.list === 'ivy' ? 'ivy' : query.list === 'saved' ? 'saved' : query.sel === 'under10' && !query.q && !query.state && !query.size && !query.control ? 'top' : !query.q && !query.state && !query.sel && !query.size && !query.control ? 'all' : '';
  const hasFilters = Boolean(query.q || query.state || query.sel || query.size || query.control || query.list);
  const totalPages = data ? Math.min(Math.max(1, Math.ceil(data.total / PER_PAGE)), MAX_PAGE + 1) : 1;
  const chips: {key: 'all' | 'top' | 'ivy' | 'saved'; label: string}[] = [
    {key: 'all', label: 'All US colleges'},
    {key: 'top', label: 'Top USA (under 10%)'},
    {key: 'ivy', label: 'Ivy League'},
    {key: 'saved', label: `My list${saved.colleges.length ? ` (${saved.colleges.length})` : ''}`},
  ];

  return (
    <div className="app-shell">
      <SiteHeader active="colleges" />
      <main className="cx-layout">
        <section className="cx-heading">
          <p className="eyebrow"><span className="tiny-star">✳</span> US COLLEGES · ADMISSIONS DATA</p>
          <h1>Real admissions data.<br /><em>Every US college.</em></h1>
          <p className="lead">Search four-year US colleges by acceptance rate, size, state and type. Add your SAT once to see which ones are a reach, a target or likely for you. <a className="inline-link" href="/universities">Looking outside the US? Explore universities worldwide.</a></p>
        </section>

        <nav className="cx-chips" aria-label="Categories">
          {chips.map(chip => (
            <button key={chip.key} type="button" className={`cx-chip${activeChip === chip.key ? ' cx-chip-active' : ''}`} aria-pressed={activeChip === chip.key} onClick={() => chooseChip(chip.key)}>
              {chip.key === 'saved' && <Star size={14} />}{chip.label}
            </button>
          ))}
          <a className="cx-chip cx-chip-link" href="/universities"><Globe2 size={14} /> Other countries</a>
        </nav>

        <section className="cx-controls" aria-label="Search and filters">
          <label className="search-field cx-search">
            <Search size={18} />
            <input type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Search by college name" aria-label="Search by college name" maxLength={60} disabled={listMode} />
            {searchText && <button type="button" className="cx-clear-input" onClick={() => setSearchText('')} aria-label="Clear search"><X size={16} /></button>}
          </label>
          <label className="cx-sat">
            <span>Your SAT</span>
            <input inputMode="numeric" value={saved.sat} onChange={event => updateSaved({sat: event.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="e.g. 1450" aria-describedby="sat-help" />
            <small id="sat-help">Optional. Used on every college page.</small>
          </label>
          {!listMode && (
            <div className="cx-filters">
              <FilterSelect label="State" value={query.state} onChange={state => update({state})} options={STATE_OPTIONS} anyLabel="All states" />
              <FilterSelect label="Acceptance rate" value={query.sel} onChange={sel => update({sel})} options={toOptions(SELECTIVITY)} anyLabel="Any rate" />
              <FilterSelect label="Size" value={query.size} onChange={size => update({size})} options={toOptions(SIZES)} anyLabel="Any size" />
              <FilterSelect label="Type" value={query.control} onChange={control => update({control})} options={toOptions(CONTROLS)} anyLabel="Any type" />
            </div>
          )}
          {saved.sat && !sat && <p className="cx-hint" role="status">Enter a total SAT score between 400 and 1600.</p>}
          <ProfileNote saved={saved} summary={profile} />
        </section>

        <div className="cx-results-bar" ref={resultsTop}>
          <p aria-live="polite">
            {loading ? 'Loading colleges…' : error || !data ? '' : `${formatCount(data.total)} ${data.total === 1 ? 'college' : 'colleges'}`}
            {hasFilters && !loading && <button type="button" className="inline-link cx-reset" onClick={clearFilters}>Clear filters</button>}
          </p>
          <FilterSelect label="Sort" value={query.sort} onChange={sort => update({sort: sort || DEFAULT_SORT})} options={toOptions(SORTS)} compact />
        </div>

        {error ? (
          <div className="form-error" role="alert">{error} <button type="button" className="inline-link" onClick={() => setAttempt(n => n + 1)}>Try again</button></div>
        ) : !data ? (
          <div className="cx-grid" aria-busy="true">{Array.from({length: 6}, (_, i) => <div className="cx-card cx-skeleton" key={i} />)}</div>
        ) : data.results.length === 0 ? (
          query.list === 'saved' ? (
            <div className="empty-state"><Star size={28} /><h3>Your list is empty.</h3><p>Tap the star on any college to save it here. It stays on this device.</p></div>
          ) : (
            <div className="empty-state"><Search size={28} /><h3>No colleges match these filters.</h3><p>Try a wider acceptance rate, another state or a shorter name.</p></div>
          )
        ) : (
          <div className={`cx-grid${loading ? ' cx-dim' : ''}`}>
            {data.results.map(college => (
              <CollegeCard key={college.id} college={college} sat={sat} saved={saved.colleges.includes(college.id)} onToggle={() => toggleCollege(college.id)} />
            ))}
          </div>
        )}

        {query.list === 'saved' && saved.universities.length > 0 && (
          <p className="cx-other-list"><Globe2 size={16} /> You also saved {saved.universities.length} {saved.universities.length === 1 ? 'university' : 'universities'} outside the US. <a className="inline-link" href="/universities?list=saved">See them</a></p>
        )}

        {data && !error && totalPages > 1 && (
          <nav className="cx-pager" aria-label="Result pages">
            <button type="button" className="secondary" disabled={query.page === 0 || loading} onClick={() => goToPage(query.page - 1)}><ArrowLeft size={16} /> Previous</button>
            <span>Page {query.page + 1} of {formatCount(totalPages)}</span>
            <button type="button" className="secondary" disabled={query.page + 1 >= totalPages || loading} onClick={() => goToPage(query.page + 1)}>Next <ArrowRight size={16} /></button>
          </nav>
        )}

        <div className="prototype-note cx-source">
          <Info size={18} />
          <p>Data: <strong>U.S. Department of Education College Scorecard</strong>, latest figures available, for four-year colleges that report an admission rate. Colleges with fewer than 300 undergraduates appear only when you search by name. Figures can lag a year or two, so confirm on each college’s website. Reach, target and likely use only your SAT and the admission rate; treat them as a rough guide, not a prediction.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
