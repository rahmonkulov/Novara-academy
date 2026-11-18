// College Explorer helpers. Pure functions only (no network, no browser storage),
// so the API route, both pages and the tests share exactly the same rules.
// Data source: U.S. Department of Education College Scorecard API, latest available values.

export const SCORECARD_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';
export const PER_PAGE = 24;
export const MAX_PAGE = 199;
// Very small institutions (mostly single-subject religious schools) are hidden unless the student searches by name.
export const MIN_UNDERGRADS = 300;

export const STATES: ReadonlyArray<readonly [string, string]> = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'],
  ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'],
  ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
];

export type Option = { label: string; value: string };

export const SELECTIVITY: Record<string, Option> = {
  under10: { label: 'Under 10%', value: '0..0.0999' },
  '10to25': { label: '10–25%', value: '0.1..0.2499' },
  '25to50': { label: '25–50%', value: '0.25..0.4999' },
  over50: { label: 'Over 50%', value: '0.5..1' },
};

export const SIZES: Record<string, Option> = {
  small: { label: 'Small (under 5,000)', value: `${MIN_UNDERGRADS}..4999` },
  medium: { label: 'Medium (5,000–15,000)', value: '5000..15000' },
  large: { label: 'Large (over 15,000)', value: '15001..2000000' },
};

export const CONTROLS: Record<string, Option> = {
  public: { label: 'Public', value: '1' },
  private: { label: 'Private nonprofit', value: '2' },
};

export const DEFAULT_SORT = 'selective';
export const SORTS: Record<string, Option> = {
  selective: { label: 'Most selective first', value: 'latest.admissions.admission_rate.overall:asc' },
  open: { label: 'Least selective first', value: 'latest.admissions.admission_rate.overall:desc' },
  largest: { label: 'Largest first', value: 'latest.student.size:desc' },
  name: { label: 'Name (A–Z)', value: 'school.name:asc' },
};

// Field names checked against a live API response (November 2026).
const F = {
  id: 'id',
  name: 'school.name',
  city: 'school.city',
  state: 'school.state',
  ownership: 'school.ownership',
  website: 'school.school_url',
  priceCalculator: 'school.price_calculator_url',
  admitRate: 'latest.admissions.admission_rate.overall',
  satReading25: 'latest.admissions.sat_scores.25th_percentile.critical_reading',
  satReading75: 'latest.admissions.sat_scores.75th_percentile.critical_reading',
  satMath25: 'latest.admissions.sat_scores.25th_percentile.math',
  satMath75: 'latest.admissions.sat_scores.75th_percentile.math',
  act25: 'latest.admissions.act_scores.25th_percentile.cumulative',
  act75: 'latest.admissions.act_scores.75th_percentile.cumulative',
  testPolicy: 'latest.admissions.test_requirements',
  size: 'latest.student.size',
  intlShare: 'latest.student.demographics.race_ethnicity.non_resident_alien',
  costOfAttendance: 'latest.cost.attendance.academic_year',
  tuitionInState: 'latest.cost.tuition.in_state',
  tuitionOutOfState: 'latest.cost.tuition.out_of_state',
  gradRate: 'latest.completion.completion_rate_4yr_150nt',
  earnings: 'latest.earnings.10_yrs_after_entry.median',
} as const;

const LIST_FIELDS = [F.id, F.name, F.city, F.state, F.ownership, F.admitRate, F.satReading25, F.satReading75, F.satMath25, F.satMath75, F.size, F.intlShare];
const DETAIL_FIELDS = Object.values(F);

export type ListQuery = { q: string; state: string; sel: string; size: string; control: string; sort: string; page: number };
export const EMPTY_QUERY: ListQuery = { q: '', state: '', sel: '', size: '', control: '', sort: DEFAULT_SORT, page: 0 };

const known = (value: string | null, options: Record<string, Option>): string =>
  value && Object.prototype.hasOwnProperty.call(options, value) ? value : '';

export function cleanSearch(value: string | null): string {
  return (value || '').replace(/[^A-Za-z0-9À-ɏ &'.,-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export function parseListQuery(params: URLSearchParams): ListQuery {
  const state = (params.get('state') || '').toUpperCase();
  const page = Number.parseInt(params.get('page') || '0', 10);
  return {
    q: cleanSearch(params.get('q')),
    state: STATES.some(([code]) => code === state) ? state : '',
    sel: known(params.get('sel'), SELECTIVITY),
    size: known(params.get('size'), SIZES),
    control: known(params.get('control'), CONTROLS),
    sort: known(params.get('sort'), SORTS) || DEFAULT_SORT,
    page: Number.isFinite(page) ? Math.min(Math.max(page, 0), MAX_PAGE) : 0,
  };
}

export function queryToSearch(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.state) params.set('state', query.state);
  if (query.sel) params.set('sel', query.sel);
  if (query.size) params.set('size', query.size);
  if (query.control) params.set('control', query.control);
  if (query.sort && query.sort !== DEFAULT_SORT) params.set('sort', query.sort);
  if (query.page) params.set('page', String(query.page));
  return params.toString();
}

// Only four-year (bachelor's) colleges that are open, report an admission rate and, unless the student
// searches by name, have at least MIN_UNDERGRADS undergraduates.
export function buildListUrl(query: ListQuery, apiKey: string): string {
  const params = new URLSearchParams({
    api_key: apiKey,
    'school.degrees_awarded.predominant': '3',
    'school.operating': '1',
    'school.ownership': query.control ? CONTROLS[query.control].value : '1,2',
    [`${F.admitRate}__range`]: query.sel ? SELECTIVITY[query.sel].value : '0..1',
    sort: (SORTS[query.sort] || SORTS[DEFAULT_SORT]).value,
    per_page: String(PER_PAGE),
    page: String(query.page),
    fields: LIST_FIELDS.join(','),
  });
  if (query.size) params.set(`${F.size}__range`, SIZES[query.size].value);
  else if (!query.q) params.set(`${F.size}__range`, `${MIN_UNDERGRADS}..2000000`);
  if (query.state) params.set('school.state', query.state);
  if (query.q) params.set('school.name', query.q);
  return `${SCORECARD_URL}?${params}`;
}

export function parseId(value: string | null | undefined): number | null {
  return value && /^\d{5,8}$/.test(value) ? Number(value) : null;
}

export function buildDetailUrl(id: number, apiKey: string): string {
  const params = new URLSearchParams({ api_key: apiKey, id: String(id), fields: DETAIL_FIELDS.join(',') });
  return `${SCORECARD_URL}?${params}`;
}

type Row = Record<string, unknown>;
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

// College websites arrive without a scheme ("www.example.edu/"). Only http(s) links are kept.
export function safeUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export type SatParts = { reading25: number | null; reading75: number | null; math25: number | null; math75: number | null };

export type College = {
  id: number;
  name: string;
  city: string;
  state: string;
  ownership: number | null;
  admitRate: number | null;
  sat: SatParts;
  size: number | null;
  intlShare: number | null;
};

export type CollegeDetail = College & {
  website: string | null;
  priceCalculator: string | null;
  act25: number | null;
  act75: number | null;
  testPolicy: number | null;
  costOfAttendance: number | null;
  tuitionInState: number | null;
  tuitionOutOfState: number | null;
  gradRate: number | null;
  earnings: number | null;
};

export function toCollege(row: Row): College {
  return {
    id: num(row[F.id]) ?? 0,
    name: text(row[F.name]) || 'Unnamed college',
    city: text(row[F.city]),
    state: text(row[F.state]),
    ownership: num(row[F.ownership]),
    admitRate: num(row[F.admitRate]),
    sat: {
      reading25: num(row[F.satReading25]),
      reading75: num(row[F.satReading75]),
      math25: num(row[F.satMath25]),
      math75: num(row[F.satMath75]),
    },
    size: num(row[F.size]),
    intlShare: num(row[F.intlShare]),
  };
}

export function toDetail(row: Row): CollegeDetail {
  return {
    ...toCollege(row),
    website: safeUrl(row[F.website]),
    priceCalculator: safeUrl(row[F.priceCalculator]),
    act25: num(row[F.act25]),
    act75: num(row[F.act75]),
    testPolicy: num(row[F.testPolicy]),
    costOfAttendance: num(row[F.costOfAttendance]),
    tuitionInState: num(row[F.tuitionInState]),
    tuitionOutOfState: num(row[F.tuitionOutOfState]),
    gradRate: num(row[F.gradRate]),
    earnings: num(row[F.earnings]),
  };
}

export const OWNERSHIP_LABEL: Record<number, string> = { 1: 'Public', 2: 'Private nonprofit', 3: 'Private for-profit' };
export const TEST_POLICY_LABEL: Record<number, string> = {
  1: 'Required',
  2: 'Recommended',
  3: 'Not required',
  4: 'Not reported',
  5: 'Optional (considered if sent)',
};

export function formatPercent(value: number | null, digits = 0): string {
  return value == null ? '—' : `${(value * 100).toFixed(digits)}%`;
}

export function formatRate(value: number | null): string {
  return value == null ? '—' : formatPercent(value, value < 0.1 ? 1 : 0);
}

export function formatShare(value: number | null): string {
  if (value == null) return '—';
  return value > 0 && value < 0.005 ? 'Under 1%' : formatPercent(value);
}

export function formatMoney(value: number | null): string {
  return value == null ? '—' : `$${Math.round(value).toLocaleString('en-US')}`;
}

export function formatCount(value: number | null): string {
  return value == null ? '—' : Math.round(value).toLocaleString('en-US');
}

// Adds the section ranges (reading + math), the usual way to show a combined middle 50%.
export function satTotalRange(sat: SatParts): { low: number; high: number } | null {
  const { reading25, reading75, math25, math75 } = sat;
  return reading25 != null && reading75 != null && math25 != null && math75 != null
    ? { low: reading25 + math25, high: reading75 + math75 }
    : null;
}

export function formatSatRange(sat: SatParts): string {
  const range = satTotalRange(sat);
  return range ? `${range.low}–${range.high}` : 'Not reported';
}

export function parseSat(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{3,4}$/.test(trimmed)) return null;
  const score = Number(trimmed);
  return score >= 400 && score <= 1600 ? score : null;
}

export type ChanceTone = 'reach' | 'target' | 'likely' | 'unknown';
export type Chance = { label: string; tone: ChanceTone; reason: string };

// A deliberately simple, conservative guide: SAT position against the middle 50% plus the admission rate.
// Under 15% admitted is always a reach, whatever the score.
export function chanceFor(sat: number | null, college: Pick<College, 'admitRate' | 'sat'>): Chance | null {
  if (sat == null) return null;
  const rate = college.admitRate;
  if (rate == null) return { label: 'Not enough data', tone: 'unknown', reason: 'This college does not report an admission rate.' };
  if (rate < 0.15) {
    return { label: 'Reach', tone: 'reach', reason: `It admits ${formatRate(rate)} of applicants, so it is a reach for everyone, even with top scores.` };
  }
  const range = satTotalRange(college.sat);
  if (!range) {
    return { label: 'Not enough data', tone: 'unknown', reason: 'This college does not report SAT ranges, so your score cannot be compared.' };
  }
  const position = sat >= range.high ? 'above' : sat >= range.low ? 'within' : 'below';
  const tone: ChanceTone =
    rate < 0.3
      ? position === 'above' ? 'target' : 'reach'
      : rate < 0.6
        ? position === 'above' ? 'likely' : position === 'within' ? 'target' : 'reach'
        : position === 'below' ? 'target' : 'likely';
  const where = position === 'above' ? 'at or above' : position === 'within' ? 'inside' : 'below';
  return {
    label: tone === 'reach' ? 'Reach' : tone === 'target' ? 'Target' : 'Likely',
    tone,
    reason: `Your ${sat} is ${where} its middle 50% (${range.low}–${range.high}), and ${formatRate(rate)} of applicants are admitted.`,
  };
}
