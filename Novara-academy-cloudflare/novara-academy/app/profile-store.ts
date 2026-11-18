// One student profile per device, shared by the questionnaire, both explorers and every university page.
// The questionnaire writes the full profile (grades, scores, activities, essay, AI report). The explorers
// read it and keep SAT and IELTS in step with it, so a returning student never types the same thing twice.
// Everything stays in this browser's localStorage. Nothing here is sent to the server.
export const PROFILE_KEY = 'novara-profile-v1';
export const LISTS_KEY = 'novara-saved-v1';
export const LEGACY_SAT_KEY = 'novara-sat';
export const MAX_SAVED = 60;

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type StoredProfile = {profile: Record<string, unknown>; step?: unknown; done?: unknown; aiReport?: unknown};
export type SavedLists = {colleges: number[]; universities: string[]};
export type Scores = {sat: string; ielts: string};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parse(raw: string | null): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readStoredProfile(store: KeyValueStore): StoredProfile | null {
  const data = parse(store.getItem(PROFILE_KEY));
  return isObject(data) && isObject(data.profile) ? (data as StoredProfile) : null;
}

const NOT_GIVEN = /^\s*n\s*\/?\s*a\s*$/i;

// The questionnaire accepts "N/A" for a score the student does not have. For comparisons that means no score.
export function usableScore(value: unknown): string {
  return typeof value === 'string' && !NOT_GIVEN.test(value) ? value.trim() : '';
}

// Shapes the questionnaire expects before it will load a saved profile.
const isQuestionnaireProfile = (profile: Record<string, unknown>) => Array.isArray(profile.answers) && Array.isArray(profile.activities);

// Saves SAT and IELTS typed on any page into the profile. Returns true when something was written.
export function writeScores(store: KeyValueStore, scores: Scores): boolean {
  const stored = readStoredProfile(store);
  const current = stored && isQuestionnaireProfile(stored.profile) ? stored.profile : null;
  if (!current && !scores.sat && !scores.ielts) return false;
  const base: Record<string, unknown> = current ?? {answers: [-1, -1, -1, -1, -1, -1], activities: ['', '', '', '', '']};
  const next: Record<string, unknown> = {...base};
  for (const key of ['sat', 'ielts'] as const) {
    const previous = base[key];
    // An empty box must not erase an "N/A" the student chose in the questionnaire.
    if (!scores[key] && typeof previous === 'string' && NOT_GIVEN.test(previous)) continue;
    next[key] = scores[key];
  }
  if (current && next.sat === (current.sat ?? '') && next.ielts === (current.ielts ?? '')) return false;
  store.setItem(PROFILE_KEY, JSON.stringify({
    ...(stored ?? {}),
    profile: next,
    step: typeof stored?.step === 'number' ? stored.step : 0,
    done: Array.isArray(stored?.done) ? stored.done : [],
  }));
  return true;
}

export type ProfileSummary = {
  name: string;
  firstName: string;
  gpa: string;
  scale: string;
  sat: string;
  ielts: string;
  activities: number;
  hasReport: boolean;
};

export function summarizeProfile(stored: StoredProfile | null): ProfileSummary | null {
  const profile = stored?.profile;
  if (!profile) return null;
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  const name = text(profile.name);
  const activities = Array.isArray(profile.activities)
    ? profile.activities.filter(item => text(item) && !NOT_GIVEN.test(text(item))).length
    : 0;
  const summary: ProfileSummary = {
    name,
    firstName: name.split(/\s+/)[0] || '',
    gpa: usableScore(profile.gpa),
    scale: text(profile.scale),
    sat: usableScore(profile.sat),
    ielts: usableScore(profile.ielts),
    activities,
    hasReport: Boolean(stored?.aiReport),
  };
  const hasContent = summary.name || summary.gpa || summary.sat || summary.ielts || summary.activities || summary.hasReport;
  return hasContent ? summary : null;
}

// "GPA 3.8/4 · SAT 1450 · IELTS 7.0 · 5 activities · AI report"
export function profileParts(summary: Omit<ProfileSummary, 'name' | 'firstName'>): string[] {
  return [
    summary.gpa ? `GPA ${summary.gpa}${summary.scale ? `/${summary.scale}` : ''}` : '',
    summary.sat ? `SAT ${summary.sat}` : '',
    summary.ielts ? `IELTS ${summary.ielts}` : '',
    summary.activities ? `${summary.activities} ${summary.activities === 1 ? 'activity' : 'activities'}` : '',
    summary.hasReport ? 'AI report' : '',
  ].filter(Boolean);
}

// Saved universities, plus scores an earlier version kept in the same key (read once, then moved to the profile).
export function readLists(store: KeyValueStore): SavedLists & {legacy: Scores} {
  const data = parse(store.getItem(LISTS_KEY));
  const parsed = isObject(data) ? data : {};
  const colleges = Array.isArray(parsed.colleges) ? parsed.colleges.filter((id): id is number => Number.isInteger(id) && id > 0) : [];
  const universities = Array.isArray(parsed.universities)
    ? parsed.universities.filter((id): id is string => typeof id === 'string' && /^I\d{3,12}$/.test(id))
    : [];
  return {
    colleges: [...new Set(colleges)].slice(0, MAX_SAVED),
    universities: [...new Set(universities)].slice(0, MAX_SAVED),
    legacy: {sat: usableScore(parsed.sat), ielts: usableScore(parsed.ielts)},
  };
}

export function writeLists(store: KeyValueStore, lists: SavedLists) {
  if (!lists.colleges.length && !lists.universities.length) store.removeItem(LISTS_KEY);
  else store.setItem(LISTS_KEY, JSON.stringify({colleges: lists.colleges, universities: lists.universities}));
}

export function parseIelts(text: string): number | null {
  if (!/^\d(\.[05])?$/.test(text.trim())) return null;
  const value = Number(text);
  return value >= 1 && value <= 9 ? value : null;
}
