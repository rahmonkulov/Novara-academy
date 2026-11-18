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
  // Rankings exactly as the university states them on its own pages, each with that page.
  rankings?: {name: string; rank: string; url: string}[];
  // Graduate employment as the university publishes it: a short headline, what it counts, and the source.
  employment?: {headline: string; detail?: string; url: string};
  applyUrl: string;
  sources: {label: string; url: string}[];
};

export const ADMISSIONS: Record<string, AdmissionsInfo> = {
  // Hong Kong University of Science and Technology. Checked Nov 18, 2026 on join.hkust.edu.hk.
  I200769079: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'HK$260,000 a year (about US$33,300), 2027/28',
    livingCost: 'Campus housing about HK$21,000–51,000 a year (guaranteed in year one) plus about HK$65,000 personal expenses',
    applicationFee: 'HK$600',
    rounds: [
      'Priority round: apply by Nov 25, 2026',
      'Rolling admissions from Nov 26, 2026, with offers from late December 2026',
      'Applications close June 30, 2027',
    ],
    english: 'IELTS Academic 6.0 overall, or another accepted test such as TOEFL, Duolingo or PTE',
    ieltsMin: 6,
    tests: 'SAT/ACT/AP, A-levels, IB or a national high-school qualification. Uzbekistan’s is on HKUST’s list. Minimums depend on the qualification.',
    scholarships: [
      {
        name: 'University Admissions Scholarship',
        amount: 'Up to full tuition plus HK$65,000 a year, renewable',
        howToApply: 'automatic',
        details: 'For top students with international qualifications, judged on the whole profile. Awards can also be partial or one-off. The decision comes with the admission offer.',
        url: 'https://join.hkust.edu.hk/university-admissions-scholarship-for-other-qualifications-holders',
      },
      {
        name: 'Global Learners Scholarship',
        amount: 'Full tuition waiver, renewable',
        howToApply: 'automatic',
        details: 'For applicants from nationalities that are underrepresented at HKUST. HKUST does not publish which nationalities count.',
        url: 'https://join.hkust.edu.hk/global-learners-scholarship',
      },
      {
        name: 'Future Leaders Award',
        amount: 'Up to full tuition plus a living allowance, based on financial need',
        howToApply: 'separate',
        details: 'For non-local students with exceptional financial need and strong results. Apply for admission in the priority round, then send the award form with a statement of circumstances, a family finance declaration and a reference letter. Results come late December to early January.',
        deadline: 'Dec 2, 2026',
        url: 'https://join.hkust.edu.hk/future-leaders-award',
      },
      {
        name: 'Beyond Academic Admissions Scholarship (BAAS)',
        amount: 'HK$50,000 one-off, plus favourable admission consideration',
        howToApply: 'separate',
        details: 'For students with talents and contributions beyond academics.',
        deadline: 'Nov 25, 2026 (priority round). Late applications are considered case by case until late March 2027.',
        url: 'https://join.hkust.edu.hk/beyond-academic-admissions-scholarship',
      },
      {
        name: 'Olympiad Medalists Scholarship',
        amount: 'Up to full tuition plus a living allowance',
        howToApply: 'automatic',
        details: 'For International and Asian Olympiad medalists.',
        url: 'https://join.hkust.edu.hk/scholarship-scheme-for-international/asian-olympiad-medalists',
      },
    ],
    rankings: [
      {name: 'QS World University Rankings 2027', rank: '#33', url: 'https://ais.hkust.edu.hk/node/3122'},
    ],
    employment: {
      headline: '94.7% working, studying further or returned home',
      detail: 'Class of 2025 bachelor’s graduates, surveyed by December 2025. 62.7% were in full-time jobs or self-employed; 2.3% were still looking for work.',
      url: 'https://career.hkust.edu.hk/web/public/documents/ExecutiveSummary_UG_2025.pdf',
    },
    chances: 'Meeting the minimums makes you eligible, not admitted. Scholarships go to the strongest profiles. Apply in the priority round (by Nov 25, 2026): the Future Leaders Award requires it, and offers start in late December.',
    applyUrl: 'https://join.hkust.edu.hk/apply',
    sources: [
      {label: 'International qualifications: dates and English requirement', url: 'https://join.hkust.edu.hk/admissions/international-qualifications'},
      {label: 'Application details for international qualification holders', url: 'https://join.hkust.edu.hk/node/7'},
      {label: 'Fees and scholarships 2027/28', url: 'https://join.hkust.edu.hk/fees-and-scholarship'},
    ],
  },
};
