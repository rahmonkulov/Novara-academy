// Admissions and money details for international undergraduates, checked by hand on each university's
// official pages. Keyed by OpenAlex institution ID. Every entry lists its sources and the month it was checked.
// Keep entries factual: copy numbers exactly, say when something is "up to", and never guess.

export type Scholarship = {
  name: string;
  amount: string;
  // 'automatic': everyone admitted is considered. 'separate': needs its own application.
  howToApply: 'automatic' | 'separate';
  details: string;
  deadline?: string;
  url: string;
};

export type AdmissionsInfo = {
  checked: string;
  intake: string;
  tuition: string;
  livingCost?: string;
  applicationFee: string;
  rounds: string[];
  english: string;
  ieltsMin?: number;
  // A published SAT minimum or reference score, with what the university says about it.
  satMin?: number;
  satNote?: string;
  tests: string;
  scholarships: Scholarship[];
  chances?: string;
  applyUrl: string;
  sources: {label: string; url: string}[];
};

export const ADMISSIONS: Record<string, AdmissionsInfo> = {};
