'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, GraduationCap, Info, Search, Star, X} from 'lucide-react';
import {FilterSelect, ProfileNote, SaveButton, SiteFooter, SiteHeader, useProfileSummary, useSaved, type SelectOption} from '../site-chrome';
import {loadJson} from '../load-json';
import {ADMISSIONS} from '../admissions-data';
import {
  EMPTY_WORLD_QUERY, REGIONS, WORLD_CHIPS, WORLD_DATA_VERSION, WORLD_DEFAULT_SORT, WORLD_MAX_PAGE, WORLD_PER_PAGE, WORLD_SORTS,
  cleanWorldSearch, formatCompact, parseWorldQuery, worldApiSearch, worldQueryToSearch,
  type Country, type WorldOption, type WorldQuery, type WorldUniversity, US_COUNTRY} from '../world-lib';

type ListResponse = {total: number; page: number; perPage: number; results: WorldUniversity[]};

const toOptions = (record: Record<string, WorldOption>): SelectOption[] => Object.entries(record).map(([value, option]) => ({value, label: option.label}));

function badgeText(university: WorldUniversity): string {
  if (university.acronym && university.acronym.length <= 6) return university.acronym;
  const words = university.name.split(/[\s-]+/).filter(word => /^[A-Z]/.test(word));
  return words.slice(0, 3).map(word => word[0]).join('') || university.name.slice(0, 2).toUpperCase();
}

function UniversityCard({university, rank, saved, onToggle}: {university: WorldUniversity; rank: number | null; saved: boolean; onToggle: () => void}) {
  const place = [...new Set([university.city, university.country].filter(Boolean))].join(', ');
  return (
    <a className="cx-card" href={`/universities/${university.id}`}>
      <div className="cx-card-top">
        <span className="school-icon" aria-hidden="true">{badgeText(university)}</span>
        <span className="cx-card-actions">
          {rank != null && <span className="wx-rank" title="Position in this list by research citations">#{rank.toLocaleString('en-US')}</span>}
          <SaveButton saved={saved} onToggle={onToggle} compact />
        </span>
      </div>
      <h3>{university.name}</h3>
      <p className="card-location">{place || 'Location not listed'}</p>
      <dl className="cx-stats">
        <div><dt>Citations</dt><dd>{formatCompact(university.citations)}</dd></div>
        <div><dt>Research papers</dt><dd>{formatCompact(university.works)}</dd></div>
      </dl>
      {ADMISSIONS[university.id] && <span className="wx-badge">Admissions and scholarships</span>}
      <span className="cx-card-link">View university <ArrowRight size={15} /></span>
    </a>
  );
}

export default function UniversityExplorer() {
  const [query, setQuery] = useState<WorldQuery>(EMPTY_WORLD_QUERY);
  const [ready, setReady] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<ListResponse | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const {saved, loaded, update: updateSaved, toggleUniversity} = useSaved();
  const profile = useProfileSummary();
  const resultsTop = useRef<HTMLDivElement>(null);
  const savedKey = saved.universities.join(',');

  useEffect(() => {
    const initial = parseWorldQuery(new URLSearchParams(window.location.search));
    // US universities live in the US list, which has admissions data.
    if (initial.country === US_COUNTRY) {
      window.location.replace('/colleges');
      return;
    }
    setQuery({...initial, ids: []});
    setSearchText(initial.q);
    setReady(true);
    fetch(`/api/universities?countries=1&v=${WORLD_DATA_VERSION}`)
      .then(response => (response.ok ? response.json() : {countries: []}))
      .then(body => setCountries(Array.isArray(body.countries) ? body.countries : []))
      .catch(() => setCountries([]));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      const q = cleanWorldSearch(searchText);
      setQuery(current => (current.q === q ? current : {...current, q, page: 0}));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText, ready]);

  useEffect(() => {
    if (!ready || !loaded) return;
    const search = worldQueryToSearch(query);
    const pageUrl = window.location.pathname + (search ? `?${search}` : '');
    if (pageUrl !== window.location.pathname + window.location.search) window.history.replaceState(null, '', pageUrl);
    if (query.list === 'saved' && !saved.universities.length) {
      setData({total: 0, page: 0, perPage: WORLD_PER_PAGE, results: []});
      setLoading(false);
      setError('');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const request = worldApiSearch(query, saved.universities);
    loadJson<ListResponse>(`/api/universities?${request ? `${request}&` : ''}v=${WORLD_DATA_VERSION}`, controller.signal, 'University data is temporarily unavailable.')
      .then(body => {
        setData(body);
        setLoading(false);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'University data is temporarily unavailable.');
        setLoading(false);
      });
    return () => controller.abort();
    // The saved list only matters while "My list" is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ready, loaded, attempt, query.list === 'saved' ? savedKey : '']);

  const update = (patch: Partial<WorldQuery>) => setQuery(current => ({...current, ...patch, list: '', page: patch.page ?? 0}));
  const goToPage = (page: number) => {
    setQuery(current => ({...current, page}));
    resultsTop.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };
  const choose = (patch: Partial<WorldQuery>) => {
    setSearchText('');
    setQuery(current => ({...EMPTY_WORLD_QUERY, sort: current.sort, ...patch}));
  };
  const clearFilters = () => choose({});
  const listMode = query.list === 'saved';
  const plain = !query.q && !query.country && !query.region && !listMode;
  const showRanks = query.sort === WORLD_DEFAULT_SORT && !query.q && !listMode;
  const totalPages = data ? Math.min(Math.max(1, Math.ceil(data.total / WORLD_PER_PAGE)), WORLD_MAX_PAGE + 1) : 1;
  const countryOptions: SelectOption[] = countries.map(country => ({value: country.code, label: `${country.name} (${country.count.toLocaleString('en-US')})`}));
  if (query.country && !countries.some(country => country.code === query.country)) countryOptions.unshift({value: query.country, label: query.country});
  const scopeLabel = query.country ? countries.find(country => country.code === query.country)?.name || query.country : query.region ? REGIONS[query.region].label : 'the world';

  return (
    <div className="app-shell">
      <SiteHeader active="universities" />
      <main className="cx-layout">
        <section className="cx-heading">
          <p className="eyebrow"><span className="tiny-star">✳</span> UNIVERSITY EXPLORER</p>
          <h1>Every university.<br /><em>Every country.</em></h1>
          <p className="lead">Search more than 30,000 universities in 200 countries. Pick a region or country, see who leads in research, and save the ones you like to your list.</p>
        </section>

        <nav className="cx-chips" aria-label="Categories">
          <button type="button" className={`cx-chip${plain ? ' cx-chip-active' : ''}`} aria-pressed={plain} onClick={() => choose({})}>All</button>
          {WORLD_CHIPS.map(chip => {
            if (chip.href) return <a key={chip.key} className="cx-chip" href={chip.href}>{chip.label}</a>;
            const active = !listMode && !query.q && (chip.region ? query.region === chip.region && !query.country : query.country === chip.country && !query.region);
            return (
              <button key={chip.key} type="button" className={`cx-chip${active ? ' cx-chip-active' : ''}`} aria-pressed={active} onClick={() => choose(chip.region ? {region: chip.region} : {country: chip.country})}>
                {chip.label}
              </button>
            );
          })}
          <button type="button" className={`cx-chip${listMode ? ' cx-chip-active' : ''}`} aria-pressed={listMode} onClick={() => choose({list: 'saved'})}>
            <Star size={14} />My list{saved.universities.length ? ` (${saved.universities.length})` : ''}
          </button>
        </nav>

        <section className="cx-controls" aria-label="Search and filters">
          <label className="search-field cx-search">
            <Search size={18} />
            <input type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Search any university, in any language" aria-label="Search universities" maxLength={80} disabled={listMode} />
            {searchText && <button type="button" className="cx-clear-input" onClick={() => setSearchText('')} aria-label="Clear search"><X size={16} /></button>}
          </label>
          <label className="cx-sat">
            <span>Your IELTS</span>
            <input inputMode="decimal" value={saved.ielts} onChange={event => updateSaved({ielts: event.target.value.replace(/[^\d.]/g, '').slice(0, 3)})} placeholder="e.g. 7.0" aria-describedby="ielts-help" />
            <small id="ielts-help">Optional. Compared with each university’s minimum.</small>
          </label>
          {!listMode && (
            <div className="cx-filters wx-filters">
              <FilterSelect label="Country" value={query.country} onChange={country => (country === US_COUNTRY ? window.location.assign('/colleges') : update({country}))} options={countryOptions} anyLabel="All countries" />
              <FilterSelect label="Region" value={query.region} onChange={region => update({region})} options={toOptions(REGIONS)} anyLabel="All regions" />
            </div>
          )}
          <ProfileNote saved={saved} summary={profile} />
        </section>


        <div className="cx-results-bar" ref={resultsTop}>
          <p aria-live="polite">
            {loading ? 'Loading universities…' : error || !data ? '' : `${formatCompact(data.total)} ${data.total === 1 ? 'university' : 'universities'}${showRanks ? ` · ranked by research citations in ${scopeLabel}` : ''}`}
            {!plain && !loading && <button type="button" className="inline-link cx-reset" onClick={clearFilters}>Clear filters</button>}
          </p>
          <FilterSelect label="Sort" value={query.sort} onChange={sort => setQuery(current => ({...current, sort: sort || WORLD_DEFAULT_SORT, page: 0}))} options={toOptions(WORLD_SORTS)} compact />
        </div>

        {error ? (
          <div className="form-error" role="alert">{error} <button type="button" className="inline-link" onClick={() => setAttempt(n => n + 1)}>Try again</button></div>
        ) : !data ? (
          <div className="cx-grid" aria-busy="true">{Array.from({length: 6}, (_, i) => <div className="cx-card cx-skeleton" key={i} />)}</div>
        ) : data.results.length === 0 ? (
          listMode ? (
            <div className="empty-state"><Star size={28} /><h3>Your list is empty.</h3><p>Tap the star on any university to save it here. It stays on this device.</p></div>
          ) : (
            <div className="empty-state"><Search size={28} /><h3>No universities match.</h3><p>Try another spelling, or choose a different country.</p></div>
          )
        ) : (
          <div className={`cx-grid${loading ? ' cx-dim' : ''}`}>
            {data.results.map((university, index) => (
              <UniversityCard
                key={university.id}
                university={university}
                rank={showRanks ? query.page * WORLD_PER_PAGE + index + 1 : null}
                saved={saved.universities.includes(university.id)}
                onToggle={() => toggleUniversity(university.id)}
              />
            ))}
          </div>
        )}

        {listMode && saved.colleges.length > 0 && (
          <p className="cx-other-list"><GraduationCap size={16} /> You also saved {saved.colleges.length} US {saved.colleges.length === 1 ? 'college' : 'colleges'}. <a className="inline-link" href="/colleges?list=saved">See them with your SAT chances</a></p>
        )}

        {data && !error && totalPages > 1 && (
          <nav className="cx-pager" aria-label="Result pages">
            <button type="button" className="secondary" disabled={query.page === 0 || loading} onClick={() => goToPage(query.page - 1)}><ArrowLeft size={16} /> Previous</button>
            <span>Page {query.page + 1} of {totalPages.toLocaleString('en-US')}</span>
            <button type="button" className="secondary" disabled={query.page + 1 >= totalPages || loading} onClick={() => goToPage(query.page + 1)}>Next <ArrowRight size={16} /></button>
          </nav>
        )}

        <div className="prototype-note cx-source">
          <Info size={18} />
          <p>Data: <strong>OpenAlex</strong>, an open database of research institutions (CC0). “Top” and the numbers on each card rank universities by how often their research is cited. That measures research strength, not teaching quality or how hard it is to get in. Admissions, tuition and scholarship details are added university by university from official sources.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
