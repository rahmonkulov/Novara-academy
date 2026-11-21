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
  // Where students apply: the university's own website, the Common App, UCAS, a government portal...
  applyVia?: string;
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
    applicationFee: 'HK$600 (about US$77), non-refundable',
    applyVia: 'HKUST’s own online application at join.hkust.edu.hk (not the Common App)',
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
  // The Chinese University of Hong Kong. Checked Nov 21, 2026 on admission.cuhk.edu.hk.
  I177725633: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'HK$214,000 a year in 2026-27 (about US$27,400). CUHK’s 2027-entry FAQ lists HK$230,000 a year for students who pay the unsubsidised rate.',
    applicationFee: 'HK$500 (about US$64), non-refundable',
    applyVia: 'CUHK’s own online application system (International Students Admissions Scheme), not the Common App. Only one application per year.',
    rounds: [
      'Advance Offer round: Nov 12, 2026, with offers from December 2026',
      'Regular round: Jan 7, 2027',
      'After that, only if places are still available',
    ],
    english: 'IELTS Academic 6.0 overall, TOEFL iBT 80, or SAT Evidence-Based Reading and Writing 590',
    ieltsMin: 6,
    tests: 'SAT/AP, A-levels, IB or a national school-leaving qualification. CUHK publishes reference scores for the main qualifications.',
    scholarships: [
      {
        name: 'Admission Scholarships',
        amount: 'From HK$5,000 up to full tuition; many renew every year',
        howToApply: 'automatic',
        details: 'Everyone admitted to a full-time undergraduate programme is considered, with no separate application. Need-based financial aid is not available to international students.',
        url: 'https://admission.cuhk.edu.hk/fees-financing-your-studies/scholarships/admission-scholarships-for-undergraduates-only/',
      },
    ],
    applyUrl: 'https://admission.cuhk.edu.hk/application/overseas-other-qualifications-non-local-international-team/application-guides/',
    sources: [
      {label: 'Application guide: deadlines and HK$500 fee (2027 entry)', url: 'https://admission.cuhk.edu.hk/application/overseas-other-qualifications-non-local-international-team/application-guides/'},
      {label: 'International FAQ: tuition, scholarships, financial aid', url: 'https://admission.cuhk.edu.hk/application/overseas-other-qualifications-non-local-international-team/faq'},
      {label: 'English language requirements', url: 'https://admission.cuhk.edu.hk/application/non-jupas/language-requirements/'},
      {label: '2027-entry FAQ: unsubsidised tuition rate', url: 'https://admission.cuhk.edu.hk/non-jupas-yr-1/faq.html'},
    ],
  },
  // The Chinese University of Hong Kong, Shenzhen: a separate campus with its own free application. Checked Nov 21, 2026.
  I4210116924: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'CNY 162,000 a year (about US$23,000) for students entering in 2027. A CNY 19,000 deposit when you accept counts toward it and is mostly not refundable.',
    livingCost: 'About US$320 a year for campus housing and about US$350 a month for living costs, as CUHK-Shenzhen estimates',
    applicationFee: 'Free: no application fee',
    applyVia: 'CUHK-Shenzhen’s own International Undergraduate Application System at intlugapply.cuhk.edu.cn. It is separate from CUHK in Hong Kong, and it is not the Common App.',
    rounds: [
      'Early Bird round: Nov 1, 2026',
      'Regular round: Mar 7, 2027',
      'Late round: Apr 18, 2027 (very few scholarships, no conditional offers)',
      'English test result due by May 28, 2027 (all times China time)',
    ],
    english: 'An accepted English test such as IELTS or TOEFL; see CUHK-Shenzhen’s English requirements page. The result is due by May 28, 2027.',
    tests: 'High-school results with SAT, ACT, AP, IB, A-levels or a national qualification. An interview can be part of the review.',
    scholarships: [
      {
        name: 'Entry Scholarship',
        amount: 'Several levels, up to full tuition; amounts are on CUHK-Shenzhen’s scholarships page',
        howToApply: 'automatic',
        details: 'No separate application: you are considered when you apply for admission in the Early Bird or Regular round. The Late round has very few scholarships.',
        url: 'https://intladmissions.cuhk.edu.cn/en/taxonomy/term/151',
      },
    ],
    chances: 'Apply by the Regular round (Mar 7, 2027) if you need a scholarship: the Late round has very few.',
    applyUrl: 'https://intlugapply.cuhk.edu.cn/',
    sources: [
      {label: 'Application system: no fee, 2027 rounds', url: 'https://intlugapply.cuhk.edu.cn/'},
      {label: 'Application rounds and important dates', url: 'https://intladmissions.cuhk.edu.cn/en/page/190'},
      {label: 'Fee standards: CNY 162,000 for 2027 entry', url: 'https://www.cuhk.edu.cn/en/node/8803'},
      {label: 'FAQs: scholarships, deposit, living costs', url: 'https://intladmissions.cuhk.edu.cn/en/taxonomy/term/151'},
    ],
  },
  // The University of Hong Kong. Checked Nov 21, 2026 on admissions.hku.hk.
  I889458895: {
    checked: 'Nov 2026',
    intake: 'September 2027 entry',
    tuition: 'HK$250,000 a year for non-STEM programmes or HK$280,000 for STEM (about US$32,000–36,000); HK$590,000 for Medicine and Dentistry',
    applicationFee: 'HK$780 (about US$100), non-refundable',
    applyVia: 'HKU’s own online application (International / Non-JUPAS Admissions Scheme) at admissions.hku.hk, not the Common App. Only one application per year.',
    rounds: [
      'Apply by Nov 25, 2026 (noon, Hong Kong time) to be reviewed first; offers from December 2026',
      'After that, applications are reviewed as they arrive until Aug 25, 2027',
    ],
    english: 'IELTS Academic 6.5 overall in one sitting, or another accepted proof such as TOEFL',
    ieltsMin: 6.5,
    tests: 'SAT/AP, A-levels, IB or a national qualification. HKU lists the lowest results it accepts by country and qualification.',
    scholarships: [
      {
        name: 'Entrance Scholarships',
        amount: 'Up to full tuition, plus a housing scholarship and a yearly living allowance for top students',
        howToApply: 'automatic',
        details: 'Every applicant is considered, on academic and non-academic achievements. Results come with the offer.',
        url: 'https://admissions.hku.hk/sites/default/files/2026-09/HKU_General_Information_NJ_2027.pdf',
      },
    ],
    chances: 'Apply by Nov 25, 2026: those applications are reviewed first. A HK$20,000 deposit is due when you accept an offer.',
    applyUrl: 'https://admissions.hku.hk/apply/international-qualifications',
    sources: [
      {label: 'General information for September 2027 entry', url: 'https://admissions.hku.hk/sites/default/files/2026-09/HKU_General_Information_NJ_2027.pdf'},
      {label: 'English language requirement', url: 'https://admissions.hku.hk/apply/international-qualifications/english-language-requirement'},
    ],
  },
  // City University of Hong Kong. Checked Nov 21, 2026 on cityu.edu.hk.
  I168719708: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'HK$190,000 a year (about US$24,400)',
    applicationFee: 'HK$450 (about US$58) for up to 3 programme choices',
    applyVia: 'CityUHK’s own online application for non-local applicants, with up to 3 programme choices. Not the Common App; CityUHK asks applicants not to apply through agents.',
    rounds: [
      'Early deadline: Nov 15, 2026',
      'Regular deadline: Jan 15, 2027',
      'Some programmes still accept applications after that',
    ],
    english: 'IELTS 6.5 overall or TOEFL iBT 79, as CityUHK lists for non-JUPAS entry',
    ieltsMin: 6.5,
    tests: 'A-levels (3 subjects at grade E or above), IB, SAT/AP or a national qualification. CityUHK lists its requirements by country.',
    scholarships: [
      {
        name: 'Entrance Scholarship Scheme',
        amount: 'Top Scholarship of HK$200,000 a year (tuition, campus housing and part of living costs), or full tuition',
        howToApply: 'automatic',
        details: 'For international students with excellent results who are admitted to government-funded bachelor’s programmes.',
        url: 'https://cityu.edu.hk/international/fees-scholarships/scholarships',
      },
    ],
    rankings: [
      {name: 'QS World University Rankings 2027', rank: '#52', url: 'https://cityu.edu.hk/admo/news/2027_Flyer_INTL_Admission.pdf'},
      {name: 'U.S. News Best Global Universities 2026-2027', rank: '#47', url: 'https://www.cityu.edu.hk/international/students/visa'},
    ],
    chances: 'Accepting an offer costs a HK$20,000 acceptance fee for 2027/28, which is not refundable.',
    applyUrl: 'https://www.cityu.edu.hk/admo/apply-now/non-local-applicants',
    sources: [
      {label: 'Fees and scholarships', url: 'https://www.cityu.edu.hk/admo/fees-and-scholarships?kind=local'},
      {label: 'International admissions 2027 flyer: dates and requirements', url: 'https://cityu.edu.hk/admo/news/2027_Flyer_INTL_Admission.pdf'},
      {label: 'Acceptance fee for 2027/28', url: 'https://www.cityu.edu.hk/admo/node/196'},
      {label: 'English requirement (non-JUPAS)', url: 'https://www.cityu.edu.hk/admo/admissions/non-jupas-year-1-admission'},
    ],
  },
  // KAIST: every admitted international undergraduate gets the KAIST Scholarship. Checked Nov 21, 2026.
  I157485424: {
    checked: 'Nov 2026',
    intake: 'Spring or Fall 2027 entry',
    tuition: 'KRW 3,433,000 a semester; the KAIST Scholarship pays it for admitted international students',
    applicationFee: 'US$80, as KAIST’s 2027 guide states',
    applyVia: 'KAIST’s own online application for international students (univapply.kaist.ac.kr), not the Common App',
    rounds: [
      'Early track (Spring or Fall 2027): closed Oct 22, 2026',
      'Regular track (Fall 2027): apply by Jan 14, 2027 (Korea time)',
    ],
    english: 'Proof of English such as TOEFL or IELTS; KAIST’s 2027 guide gives the minimums',
    tests: 'A document review of your high-school record and a recommendation letter; KAIST contacts you if an interview is needed.',
    scholarships: [
      {
        name: 'KAIST Scholarship',
        amount: 'Full tuition, a monthly allowance and national health insurance',
        howToApply: 'automatic',
        details: 'There is no separate scholarship application: tick “KAIST scholarship” under Statement of Financial Resources in the admission application.',
        url: 'https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist',
      },
    ],
    applyUrl: 'https://univapply.kaist.ac.kr/interapply',
    sources: [
      {label: 'KAIST Scholarship for international undergraduates', url: 'https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist'},
      {label: 'KAIST online application', url: 'https://univapply.kaist.ac.kr/interapply'},
      {label: 'KAIST Undergraduate Admissions Guide 2027 (copy of KAIST’s guide)', url: 'https://kaistscholarship.com/wp-content/uploads/2026/08/KAIST-Undergraduate-Admissions-Guide-for-2027.pdf'},
    ],
  },
};
