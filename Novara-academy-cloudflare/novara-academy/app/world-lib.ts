// University Explorer helpers: every university worldwide. Pure functions only, shared by the API route,
// the pages and the tests. Data source: OpenAlex (openalex.org), open data under CC0.
// Citations and papers measure research strength. They are not a teaching or admissions ranking.
import {safeUrl} from './colleges-lib';

export const OPENALEX_URL = 'https://api.openalex.org/institutions';
// Bump when filters or the response shape change, so cached answers from older versions are not reused.
export const WORLD_DATA_VERSION = 3;
export const WORLD_PER_PAGE = 24;
export const WORLD_MAX_PAGE = 199;
export const MAX_SAVED_UNIVERSITIES = 60;

export type WorldOption = {label: string; value: string};

// Regions use OpenAlex continents; the Middle East is a list of countries.
export const REGIONS: Record<string, WorldOption> = {
  asia: {label: 'Asia', value: 'continent:asia'},
  europe: {label: 'Europe', value: 'continent:europe'},
  middle_east: {label: 'Middle East', value: 'country_code:AE|SA|QA|KW|BH|OM|JO|LB|IL|IQ|IR|TR|EG'},
  north_america: {label: 'North America', value: 'continent:north_america'},
  south_america: {label: 'South America', value: 'continent:south_america'},
  africa: {label: 'Africa', value: 'continent:africa'},
  oceania: {label: 'Oceania', value: 'continent:oceania'},
};

export const WORLD_SORTS: Record<string, WorldOption> = {
  impact: {label: 'Top research first', value: 'cited_by_count:desc'},
  output: {label: 'Most research papers', value: 'works_count:desc'},
  name: {label: 'Name (A–Z)', value: 'display_name:asc'},
};
export const WORLD_DEFAULT_SORT = 'impact';

// Quick categories shown as chips. "Top" means sorted by research citations within that region. US chips open
// the US list (/colleges), which has admissions data: acceptance rates, SAT ranges and costs.
export const US_COUNTRY = 'US';
export const WORLD_CHIPS: ReadonlyArray<{key: string; label: string; region?: string; country?: string; href?: string}> = [
  {key: 'top-asia', label: 'Top Asia', region: 'asia'},
  {key: 'top-europe', label: 'Top Europe', region: 'europe'},
  {key: 'top-usa', label: 'Top USA', href: '/colleges?sel=under10'},
  {key: 'ivy', label: 'Ivy League', href: '/colleges?list=ivy'},
  {key: 'middle-east', label: 'Middle East', region: 'middle_east'},
  {key: 'HK', label: 'Hong Kong', country: 'HK'},
  {key: 'CN', label: 'China', country: 'CN'},
  {key: 'KR', label: 'South Korea', country: 'KR'},
  {key: 'JP', label: 'Japan', country: 'JP'},
  {key: 'SG', label: 'Singapore', country: 'SG'},
  {key: 'US', label: 'United States', href: '/colleges'},
  {key: 'GB', label: 'United Kingdom', country: 'GB'},
  {key: 'TR', label: 'Turkey', country: 'TR'},
  {key: 'UZ', label: 'Uzbekistan', country: 'UZ'},
];

const LIST_SELECT = 'id,display_name,display_name_acronyms,geo,homepage_url,works_count,cited_by_count';
const DETAIL_SELECT = 'id,display_name,display_name_alternatives,display_name_acronyms,geo,homepage_url,ids,works_count,cited_by_count,summary_stats,topics,associated_institutions';

export type WorldQuery = {q: string; country: string; region: string; sort: string; page: number; list: string; ids: string[]};
export const EMPTY_WORLD_QUERY: WorldQuery = {q: '', country: '', region: '', sort: WORLD_DEFAULT_SORT, page: 0, list: '', ids: []};

const known = (value: string | null, options: Record<string, WorldOption>): string =>
  value && Object.prototype.hasOwnProperty.call(options, value) ? value : '';

// University names come in every script, so only characters that could break a request are removed.
export function cleanWorldSearch(value: string | null): string {
  return (value || '').replace(/[\u0000-\u001f<>{}[\]|\\^`"%#;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function parseWorldId(value: string | null | undefined): string | null {
  return value && /^I\d{3,12}$/.test(value) ? value : null;
}

export function parseWorldIds(value: string | null): string[] {
  const ids = (value || '').split(',').filter(part => parseWorldId(part) !== null);
  return [...new Set(ids)].slice(0, MAX_SAVED_UNIVERSITIES);
}

export function parseWorldQuery(params: URLSearchParams): WorldQuery {
  const country = (params.get('country') || '').toUpperCase();
  const page = Number.parseInt(params.get('page') || '0', 10);
  return {
    q: cleanWorldSearch(params.get('q')),
    country: /^[A-Z]{2}$/.test(country) ? country : '',
    region: known(params.get('region'), REGIONS),
    sort: known(params.get('sort'), WORLD_SORTS) || WORLD_DEFAULT_SORT,
    page: Number.isFinite(page) ? Math.min(Math.max(page, 0), WORLD_MAX_PAGE) : 0,
    list: params.get('list') === 'saved' ? 'saved' : '',
    ids: parseWorldIds(params.get('ids')),
  };
}

export function worldQueryToSearch(query: WorldQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.country) params.set('country', query.country);
  if (query.region) params.set('region', query.region);
  if (query.sort && query.sort !== WORLD_DEFAULT_SORT) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  if (query.list) params.set('list', query.list);
  return params.toString();
}

export function worldApiSearch(query: WorldQuery, savedIds: string[]): string {
  const params = new URLSearchParams(worldQueryToSearch(query));
  params.delete('list');
  if (query.list === 'saved') params.set('ids', savedIds.slice(0, MAX_SAVED_UNIVERSITIES).join(','));
  return params.toString();
}

export function buildWorldListUrl(query: WorldQuery): string {
  const filters = ['type:education'];
  if (query.ids.length) {
    filters.push(`ids.openalex:${query.ids.join('|')}`);
  } else {
    if (query.country) filters.push(`country_code:${query.country}`);
    if (query.region) filters.push(REGIONS[query.region].value);
  }
  const params = new URLSearchParams({
    filter: filters.join(','),
    sort: (WORLD_SORTS[query.sort] || WORLD_SORTS[WORLD_DEFAULT_SORT]).value,
    per_page: String(WORLD_PER_PAGE),
    page: String(query.page + 1),
    select: LIST_SELECT,
  });
  if (query.q && !query.ids.length) params.set('search', query.q);
  return `${OPENALEX_URL}?${params}`;
}

export function buildWorldDetailUrl(id: string): string {
  return `${OPENALEX_URL}/${id}?${new URLSearchParams({select: DETAIL_SELECT})}`;
}

// How many universities (in a country, or worldwide) have more citations: their count + 1 is the rank.
export function buildRankUrl(citations: number, countryCode?: string): string {
  const filters = ['type:education'];
  if (countryCode && /^[A-Z]{2}$/.test(countryCode)) filters.push(`country_code:${countryCode}`);
  filters.push(`cited_by_count:>${Math.max(0, Math.floor(citations))}`);
  return `${OPENALEX_URL}?${new URLSearchParams({filter: filters.join(','), per_page: '1', select: 'id'})}`;
}

export function buildCountriesUrl(): string {
  return `${OPENALEX_URL}?${new URLSearchParams({filter: 'type:education', group_by: 'country_code'})}`;
}

type Row = Record<string, unknown>;
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const obj = (value: unknown): Row => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {});
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const lastSegment = (value: unknown): string => text(value).split('/').pop() || '';

export type WorldUniversity = {
  id: string;
  name: string;
  acronym: string;
  city: string;
  country: string;
  countryCode: string;
  website: string | null;
  works: number | null;
  citations: number | null;
};

export type WorldDetail = WorldUniversity & {
  otherNames: string[];
  wikipedia: string | null;
  hIndex: number | null;
  topics: string[];
  related: {id: string; name: string; relationship: string}[];
};

export type WorldRanks = {country: number | null; world: number | null};
export type Country = {code: string; name: string; count: number};

export function toWorldUniversity(row: Row): WorldUniversity {
  const geo = obj(row.geo);
  const acronym = list(row.display_name_acronyms).map(text).find(Boolean) || '';
  return {
    id: lastSegment(row.id),
    name: text(row.display_name) || 'Unnamed university',
    acronym,
    city: text(geo.city),
    country: text(geo.country),
    countryCode: text(geo.country_code),
    website: safeUrl(row.homepage_url),
    works: num(row.works_count),
    citations: num(row.cited_by_count),
  };
}

export function toWorldDetail(row: Row): WorldDetail {
  const base = toWorldUniversity(row);
  const ids = obj(row.ids);
  const wiki = safeUrl(ids.wikipedia);
  return {
    ...base,
    otherNames: list(row.display_name_alternatives).map(text).filter(name => name && name !== base.name).slice(0, 4),
    wikipedia: wiki ? wiki.replace(/^http:/, 'https:') : null,
    hIndex: num(obj(row.summary_stats).h_index),
    topics: list(row.topics).map(topic => text(obj(topic).display_name)).filter(Boolean).slice(0, 6),
    related: list(row.associated_institutions)
      .map(item => {
        const entry = obj(item);
        return {id: lastSegment(entry.id), name: text(entry.display_name), relationship: text(entry.relationship), type: text(entry.type)};
      })
      // Campuses and partner universities only: OpenAlex also links hospitals and research institutes.
      .filter(item => parseWorldId(item.id) && item.name && (!item.type || item.type === 'education'))
      .map(({type: _type, ...item}) => item)
      .slice(0, 8),
  };
}

export function toCountries(groups: unknown): Country[] {
  return list(groups)
    .map(item => {
      const group = obj(item);
      return {code: lastSegment(group.key).toUpperCase(), name: text(group.key_display_name), count: num(group.count) ?? 0};
    })
    .filter(country => /^[A-Z]{2}$/.test(country.code) && country.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function formatCompact(value: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1}).format(value);
}

export function formatRank(rank: number | null): string {
  return rank == null ? '—' : `#${rank.toLocaleString('en-US')}`;
}
