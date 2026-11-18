'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, Info, Search, X} from 'lucide-react';
import {SiteFooter, SiteHeader, useSessionSat} from '../site-chrome';
import {
  CONTROLS, DEFAULT_SORT, EMPTY_QUERY, MAX_PAGE, OWNERSHIP_LABEL, PER_PAGE, SELECTIVITY, SIZES, SORTS, STATES,
  chanceFor, cleanSearch, formatCount, formatRate, formatSatRange, formatShare, parseListQuery, parseSat, queryToSearch,
  type College, type ListQuery, type Option,
} from '../colleges-lib';

type ListResponse = {total: number; page: number; perPage: number; results: College[]};
type SelectOption = {value: string; label: string};

const toOptions = (record: Record<string, Option>): SelectOption[] => Object.entries(record).map(([value, option]) => ({value, label: option.label}));
const STATE_OPTIONS: SelectOption[] = STATES.map(([code, name]) => ({value: code, label: name}));

function initials(name: string): string {
  const words = name.replace(/^The\s+/i, '').split(/[\s-]+/).filter(word => /^[A-Z]/.test(word));
  return words.slice(0, 3).map(word => word[0]).join('') || name.slice(0, 2).toUpperCase();
}

function FilterSelect({label, value, onChange, options, anyLabel, compact = false}: {
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

function CollegeCard({college, sat}: {college: College; sat: number | null}) {
  const chance = chanceFor(sat, college);
  const place = [college.city, college.state].filter(Boolean).join(', ');
  const ownership = college.ownership != null ? OWNERSHIP_LABEL[college.ownership] : undefined;
  return (
    <a className="cx-card" href={`/colleges/${college.id}`}>
      <div className="cx-card-top">
        <span className="school-icon" aria-hidden="true">{initials(college.name)}</span>
        {chance && <span className={`cx-chance ${chance.tone}`} title={chance.reason}>{chance.label}</span>}
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
  const [satText, setSatText] = useSessionSat();
  const sat = parseSat(satText);
  const resultsTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = parseListQuery(new URLSearchParams(window.location.search));
    setQuery(initial);
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
    if (!ready) return;
    const search = queryToSearch(query);
    const pageUrl = window.location.pathname + (search ? `?${search}` : '');
    if (pageUrl !== window.location.pathname + window.location.search) window.history.replaceState(null, '', pageUrl);
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`/api/colleges${search ? `?${search}` : ''}`, {signal: controller.signal})
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'College data is temporarily unavailable.');
        return body as ListResponse;
      })
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
  }, [query, ready]);

  const update = (patch: Partial<ListQuery>) => setQuery(current => ({...current, ...patch, page: patch.page ?? 0}));
  const goToPage = (page: number) => {
    update({page});
    resultsTop.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };
  const clearFilters = () => {
    setSearchText('');
    setQuery(current => ({...EMPTY_QUERY, sort: current.sort}));
  };
  const hasFilters = Boolean(query.q || query.state || query.sel || query.size || query.control);
  const totalPages = data ? Math.min(Math.max(1, Math.ceil(data.total / PER_PAGE)), MAX_PAGE + 1) : 1;

  return (
    <div className="app-shell">
      <SiteHeader active="colleges" />
      <main className="cx-layout">
        <section className="cx-heading">
          <p className="eyebrow"><span className="tiny-star">✳</span> COLLEGE EXPLORER</p>
          <h1>Real admissions data.<br /><em>Every US college.</em></h1>
          <p className="lead">Search four-year colleges by acceptance rate, size, state and type. Add your SAT to see which ones are a reach, a target or likely for you.</p>
        </section>

        <section className="cx-controls" aria-label="Search and filters">
          <label className="search-field cx-search">
            <Search size={18} />
            <input type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Search by college name" aria-label="Search by college name" maxLength={60} />
            {searchText && <button type="button" className="cx-clear-input" onClick={() => setSearchText('')} aria-label="Clear search"><X size={16} /></button>}
          </label>
          <label className="cx-sat">
            <span>Your SAT</span>
            <input inputMode="numeric" value={satText} onChange={event => setSatText(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="e.g. 1450" aria-describedby="sat-help" />
            <small id="sat-help">Optional. Stays in this browser tab.</small>
          </label>
          <div className="cx-filters">
            <FilterSelect label="State" value={query.state} onChange={state => update({state})} options={STATE_OPTIONS} anyLabel="All states" />
            <FilterSelect label="Acceptance rate" value={query.sel} onChange={sel => update({sel})} options={toOptions(SELECTIVITY)} anyLabel="Any rate" />
            <FilterSelect label="Size" value={query.size} onChange={size => update({size})} options={toOptions(SIZES)} anyLabel="Any size" />
            <FilterSelect label="Type" value={query.control} onChange={control => update({control})} options={toOptions(CONTROLS)} anyLabel="Any type" />
          </div>
          {satText && !sat && <p className="cx-hint" role="status">Enter a total SAT score between 400 and 1600.</p>}
        </section>

        <div className="cx-results-bar" ref={resultsTop}>
          <p aria-live="polite">
            {loading ? 'Loading colleges…' : error || !data ? '' : `${formatCount(data.total)} ${data.total === 1 ? 'college' : 'colleges'}`}
            {hasFilters && !loading && <button type="button" className="inline-link cx-reset" onClick={clearFilters}>Clear filters</button>}
          </p>
          <FilterSelect label="Sort" value={query.sort} onChange={sort => update({sort: sort || DEFAULT_SORT})} options={toOptions(SORTS)} compact />
        </div>

        {error ? (
          <div className="form-error" role="alert">{error}</div>
        ) : !data ? (
          <div className="cx-grid" aria-busy="true">{Array.from({length: 6}, (_, i) => <div className="cx-card cx-skeleton" key={i} />)}</div>
        ) : data.results.length === 0 ? (
          <div className="empty-state"><Search size={28} /><h3>No colleges match these filters.</h3><p>Try a wider acceptance rate, another state or a shorter name.</p></div>
        ) : (
          <div className={`cx-grid${loading ? ' cx-dim' : ''}`}>{data.results.map(college => <CollegeCard key={college.id} college={college} sat={sat} />)}</div>
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
          <p>Data: <strong>U.S. Department of Education College Scorecard</strong>, latest figures available, for four-year colleges that report an admission rate. Figures can lag a year or two, so confirm on each college’s website. Reach, target and likely use only your SAT and the admission rate; treat them as a rough guide, not a prediction.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
