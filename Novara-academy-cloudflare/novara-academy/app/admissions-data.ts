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
  // City University of Hong Kong. Checked Nov 21, 2026 on its 2027 international admissions page and flyer.
  I168719708: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'HK$240,000 a year (about US$30,800), as CityUHK’s 2027 international flyer states; HK$400,000 for Veterinary Medicine',
    applicationFee: 'HK$600 (about US$77) for up to 2 programme choices, non-refundable',
    applyVia: 'CityUHK’s own Online Application System, with up to 2 programme choices. Not the Common App; CityUHK asks applicants not to apply through agents.',
    rounds: [
      'Early round: Nov 15, 2026, with results in December 2026',
      'Main round: Jan 15, 2027, with results from February to May 2027',
      'Some programmes still accept applications after that',
    ],
    english: 'IELTS Academic 6.5 overall, or TOEFL iBT 79 (4.5 out of 6 for tests taken from Jan 21, 2026)',
    ieltsMin: 6.5,
    satMin: 1190,
    satNote: 'CityUHK’s minimum for US-system applicants; two AP subjects at grade 3 or above also qualify',
    tests: 'A-levels (3 subjects at grade E or above), IB Diploma 30+, or a US high-school diploma with SAT 1190+ or two APs at grade 3+. Other national qualifications are listed by country.',
    scholarships: [
      {
        name: 'Entrance scholarships: Top, Full Tuition and Half Tuition',
        amount: 'Top: full tuition plus a living allowance; Full Tuition: 100% of tuition; Half Tuition: 50%. Renewed each year with a CGPA of 2.5 or above',
        howToApply: 'automatic',
        details: 'Every non-local applicant is considered automatically. The offer letter gives the details.',
        url: 'https://www.cityu.edu.hk/admo/news/2027_Flyer_INTL_Admission.pdf',
      },
      {
        name: 'Diversity Grant',
        amount: 'HK$30,000 a year (about US$3,850)',
        howToApply: 'automatic',
        details: 'For international students from nationalities that are underrepresented at CityUHK. Details come with the offer letter; Top Scholarship holders cannot also get it.',
        url: 'https://www.cityu.edu.hk/admo/news/2027_Flyer_INTL_Admission.pdf',
      },
    ],
    rankings: [
      {name: 'QS World University Rankings 2027', rank: '#52', url: 'https://cityu.edu.hk/admo/news/2027_Flyer_INTL_Admission.pdf'},
      {name: 'U.S. News Best Global Universities 2026-2027', rank: '#47', url: 'https://www.cityu.edu.hk/international/students/visa'},
    ],
    chances: 'Accepting an offer costs a HK$20,000 acceptance fee for 2027/28. It is not refundable, but it counts toward your tuition.',
    applyUrl: 'https://www.cityu.edu.hk/admo/admissions/international-admissions',
    sources: [
      {label: 'International admission: fee, dates, English, acceptance fee', url: 'https://www.cityu.edu.hk/admo/admissions/international-admissions'},
      {label: 'International admissions 2027 flyer: tuition, requirements, scholarships', url: 'https://www.cityu.edu.hk/admo/news/2027_Flyer_INTL_Admission.pdf'},
    ],
  },
  // City University of Hong Kong (Dongguan): a separate campus with its own application. Checked Nov 21, 2026.
  I4405263171: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'RMB 115,000 a year, as its admission guide lists (fees can change), plus RMB 500 a year in other fees and RMB 1,000 a year for medical insurance',
    applicationFee: 'Not stated in its 2027 admission guide',
    applyVia: 'CityUHK (Dongguan)’s own online application system at intladmissions.cityu-dg.edu.cn. It is separate from CityUHK in Hong Kong, and it is not the Common App.',
    rounds: [
      'First round: Dec 31, 2026',
      'Second round: Mar 31, 2027',
      'Third round: May 31, 2027 (all Beijing time)',
    ],
    english: 'IELTS Academic 6.5 overall, TOEFL iBT 79 (4.5 out of 6 from Jan 21, 2026), SAT Evidence-Based Reading and Writing 590, ACT 24 in English and Reading, or PTE Academic 62',
    ieltsMin: 6.5,
    tests: 'High-school results, then an online interview if your documents pass. Five programmes: Computer Science, Data Science, Materials Science and Engineering, Intelligent Manufacturing Engineering, and Energy Science and Engineering.',
    scholarships: [
      {
        name: 'Full Scholarship (International Undergraduate Entrance Scholarship)',
        amount: 'Full tuition for 4 years, campus housing, RMB 2,500 a month living allowance (12 months a year) and medical insurance',
        howToApply: 'automatic',
        details: 'The guide says outstanding applicants are awarded it and mentions no separate form.',
        url: 'https://intluga.cityu-dg.edu.cn/en/info/1002/5763.htm',
      },
      {
        name: 'International Talent Scholarship',
        amount: 'RMB 50,000 a year for 4 years, plus medical insurance',
        howToApply: 'automatic',
        details: 'The second level of the entrance scholarship; the guide mentions no separate form.',
        url: 'https://intluga.cityu-dg.edu.cn/en/info/1002/5763.htm',
      },
    ],
    applyUrl: 'https://intladmissions.cityu-dg.edu.cn',
    sources: [{label: '2027 Admission Guide for International Undergraduate Students', url: 'https://intluga.cityu-dg.edu.cn/en/info/1002/5763.htm'}],
  },
  // Beijing Normal-Hong Kong Baptist University (BNBU), Zhuhai. Checked Nov 21, 2026 on admission.bnbu.edu.cn.
  I12615008: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'RMB 110,000 a year (RMB 132,000 for Music Performance)',
    livingCost: 'Campus housing RMB 3,500–6,400 a year depending on the room, plus about RMB 2,000–3,000 a month for living costs, as BNBU estimates',
    applicationFee: 'None: BNBU’s international office says undergraduate applicants have paid no application fee since 2021',
    applyVia: 'BNBU’s own international application portal at applyintl.bnbu.edu.cn, not the Common App',
    rounds: ['Apply by May 15, 2027. Scholarships go first come, first served, so applying early matters.'],
    english: 'All programmes are taught in English; BNBU lists the accepted English proof on its admission requirements page',
    tests: 'High-school results (international curricula such as IB are accepted), then an interview with the academic division.',
    scholarships: [
      {
        name: 'Entrance scholarships for international students: Full, 50% and 30% tuition',
        amount: 'Full: RMB 110,000 a year (all tuition; housing at your own cost). Also 50% or 30% of tuition. Normally for 4 years if you keep the grades',
        howToApply: 'automatic',
        details: 'No application needed: eligible applicants are considered automatically. The Full Scholarship asks for high-school grades of A or A+ (average above 90) or IB 36+. Awards go first come, first served.',
        url: 'https://admission.bnbu.edu.cn/info/1811/2933.htm',
      },
    ],
    chances: 'Scholarships are given first come, first served, so apply well before May 15, 2027.',
    applyUrl: 'https://applyintl.bnbu.edu.cn/',
    sources: [
      {label: 'How to apply: portal and May 15, 2027 deadline', url: 'https://admission.bnbu.edu.cn/ido/how_to_apply.htm'},
      {label: 'Tuition and expenses', url: 'https://admission.bnbu.edu.cn/ido/tuition_and_expenses.htm'},
      {label: '2026 international freshman scholarship policy', url: 'https://admission.bnbu.edu.cn/info/1811/2933.htm'},
      {label: 'Scholarships at a glance: considered automatically', url: 'https://sao.bnbu.edu.cn/en/info/1123/14372.htm'},
      {label: 'International office: no application fee since 2021', url: 'https://ido.bnbu.edu.cn/info/1075/1129.htm'},
    ],
  },
  // HKUST (Guangzhou). Its English pages do not publish the 2027 fee, tuition or dates yet. Checked Nov 21, 2026.
  I4405261251: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'Not published on the HKUST(GZ) pages we could open for 2027 entry',
    applicationFee: 'Not published on the HKUST(GZ) pages we could open for 2027 entry',
    applyVia: 'HKUST(GZ)’s own Undergraduate Online Application System for international students (ugapply.hkust-gz.edu.cn/international). It is separate from HKUST in Hong Kong, and it is not the Common App.',
    rounds: [
      '2027 dates are not published yet on the pages we could open',
      'For 2024 entry, applications ran Oct 7, 2023 to May 1, 2024, with offers on a rolling basis',
    ],
    english: 'IELTS Academic 6.0 overall, TOEFL iBT 80, or SAT Evidence-Based Reading and Writing 590',
    ieltsMin: 6,
    tests: 'SAT/AP, A-levels, IB or a national qualification; HKUST(GZ) lists accepted qualifications by country.',
    scholarships: [
      {
        name: 'Admission Scholarship',
        amount: 'Amount not published',
        howToApply: 'automatic',
        details: 'For top international applicants, judged on academic and non-academic achievements.',
        url: 'https://studyathkustgz.hkust-gz.edu.cn/StudentSupport',
      },
      {
        name: 'Guangdong Government Outstanding International Student Scholarship',
        amount: 'RMB 10,000 for bachelor’s students',
        howToApply: 'separate',
        details: 'A provincial government award for international degree students with excellent results; HKUST(GZ) posts the application each year.',
        url: 'https://studyathkustgz.hkust-gz.edu.cn/StudentSupport',
      },
    ],
    applyUrl: 'https://ugapply.hkust-gz.edu.cn/international',
    sources: [
      {label: 'Information for international applicants', url: 'https://sysh.hkust-gz.edu.cn/?p=1206'},
      {label: 'Application requirements: English', url: 'https://sysh.hkust-gz.edu.cn/academics/undergraduate-study/admission-and-application/information-for-international-applicants/application-requirements/'},
      {label: 'Scholarships for international students', url: 'https://studyathkustgz.hkust-gz.edu.cn/StudentSupport'},
      {label: 'International admissions brochure (2024 entry)', url: 'https://dsa.hkust-gz.edu.cn/wp-content/uploads/2024/06/2024-undergraduate-admissions-for-international-students.pdf'},
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
  // Seoul National University. Checked Nov 21, 2026.
  I139264467: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 or Spring 2028 entry',
    tuition: 'Depends on the college: about KRW 2.4 million a semester in humanities up to about KRW 5 million in medicine (2027 guide)',
    applicationFee: 'KRW 70,000 (about US$50)',
    applyVia: 'SNU’s own online application on the Office of Admissions website (en.snu.ac.kr/admission), one programme per round. Not the Common App.',
    rounds: [
      'Spring 2027: closed (applications were Jul 6–9, 2026)',
      'Fall 2027: not announced yet. Past fall rounds opened for about a week in early March, so watch SNU’s announcements from February.',
    ],
    english: 'Korean TOPIK level 3+, or English: TOEFL iBT 80, IELTS 6.0 or TEPS 551',
    ieltsMin: 6,
    tests: 'A document review of your school record, personal statement and recommendation; you may apply to only one programme per round.',
    scholarships: [
      {
        name: 'Global Talent Scholarship',
        amount: 'Part of tuition and living costs',
        howToApply: 'automatic',
        details: 'Given to a selected number of admitted students and announced with the final admission decisions.',
        url: 'https://en.snu.ac.kr/admission/overview/faq/admission',
      },
    ],
    applyUrl: 'https://en.snu.ac.kr/admission/undergraduate/application',
    sources: [
      {label: 'Admissions FAQ: fee, language, scholarship, one programme', url: 'https://en.snu.ac.kr/admission/overview/faq/admission'},
      {label: 'Fall 2022 guide: past fall round dates', url: 'https://en.snu.ac.kr/webdata/uploads/eng/file/2022/01/Reference_Guide_for_Undergraudate_Admissions_Fall_2022.pdf'},
      {label: 'Tuition by college (summary of SNU’s 2027 guide)', url: 'https://koreaadmit.com/universities/seoul-national-university'},
    ],
  },
  // Yonsei University: Underwood International College (in English) and Korean-taught majors. Checked Nov 21, 2026.
  I193775966: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'Underwood International College: KRW 8,416,000 for the first semester, then KRW 8,202,000 a semester. Korean-taught majors: about KRW 4.6–6.2 million a semester (2026 rates).',
    applicationFee: 'Underwood International College: KRW 150,000 directly, or US$150 through the Common App (no fee waivers). Korean-taught majors: KRW 200,000.',
    applyVia: 'Two routes. Underwood International College (all courses in English): its own online application or the Common App, then mail the documents. Korean-taught majors: Yonsei’s international admission online application (iadmission.yonsei.ac.kr).',
    rounds: [
      'Underwood International College, Spring 2027: closed Sep 22, 2026 (interviews Dec 11–12, results Dec 18)',
      'Underwood International College, Fall 2027: applications in March 2027 (exact dates not announced), interviews and results in June 2027',
      'Korean-taught majors: the March 2027 round closed Sep 17, 2026; fall 2027 dates not announced',
    ],
    english: 'Underwood International College requires proof of English from the 2027 intake: TOEFL, IELTS, IB English A, AP English or similar (no minimum score listed)',
    tests: 'Underwood International College reviews documents first, then interviews shortlisted applicants online.',
    scholarships: [
      {
        name: 'Underwood International College admissions scholarships',
        amount: 'Amount not published; results are emailed with the admission decision',
        howToApply: 'automatic',
        details: 'UIC offers admissions, merit-based and need-based scholarships. Admissions scholarship results go to the email on your application.',
        url: 'https://yonsei.ac.kr/en_sc/2245/subview.do',
      },
    ],
    applyUrl: 'https://uic.yonsei.ac.kr/admission.php?mid=m04_02_02',
    sources: [
      {label: 'UIC freshman admission: dates, fee, Common App, English', url: 'https://uic.yonsei.ac.kr/admission.php?mid=m04_02_02'},
      {label: '2026 undergraduate tuition for international students', url: 'https://www.yonsei.ac.kr/sites/en_sc/down/2026_fee1.pdf'},
      {label: 'Scholarship overview', url: 'https://yonsei.ac.kr/en_sc/2245/subview.do'},
      {label: 'Korean-taught majors: March 2027 dates and fee (K Study Times)', url: 'https://kstudytimes.kr/news/universities/2026/03/yonsei-university-international-student-admissions-guide?lang=en'},
    ],
  },
  // Korea University (Seoul). Checked Nov 21, 2026 on oia.korea.ac.kr.
  I197347611: {
    checked: 'Nov 2026',
    intake: 'Fall 2027 entry',
    tuition: 'About KRW 5.8 million a semester in humanities and social sciences and about KRW 7.7 million in engineering (2026)',
    applicationFee: 'KRW 150,000 (Art & Design KRW 200,000). Applying to both Admission I and II means paying twice.',
    applyVia: 'Korea University’s own online application for international students (Office of International Affairs, oia.korea.ac.kr), then post the original documents. Not the Common App.',
    rounds: [
      'Spring 2027: closed Aug 31, 2026 (results Nov 27, 2026)',
      'Fall 2027: applications expected in March 2027 (the fall 2026 round ran Mar 2–27, 2026)',
    ],
    english: 'Korean-taught majors need Korean: with TOPIK 5+ there is no required Korean course; TOPIK 4 means one semester of it, TOPIK 3 or below two semesters. The English-taught International Studies track requires TOEFL iBT or IELTS Academic.',
    tests: 'A document review. Admission I: choose a major. Admission II (international students only): the Global Open Major or Global Entertainment.',
    scholarships: [
      {
        name: 'Global Leader Scholarship A and B',
        amount: 'A: full tuition for 2 semesters; B: 50% of tuition for 2 semesters',
        howToApply: 'automatic',
        details: 'Awarded from your application documents, with no separate application. Keeping it needs a GPA of 3.5 (A) or 3.0 (B) in the first semester.',
        url: 'https://oia.korea.ac.kr/_res/oia/etc/Application_Guide_for_Spring_2026_Freshman(ENG).pdf',
      },
      {
        name: 'Future Bright Scholarship',
        amount: 'KRW 1,000,000 a semester, up to 2 semesters',
        howToApply: 'automatic',
        details: 'For students who hold a national scholarship from their home country.',
        url: 'https://oia.korea.ac.kr/_res/oia/etc/Application_Guide_for_Spring_2026_Freshman(ENG).pdf',
      },
    ],
    applyUrl: 'https://oia.korea.ac.kr',
    sources: [
      {label: 'International freshman application guide (Spring 2026): fees, language, scholarships', url: 'https://oia.korea.ac.kr/_res/oia/etc/Application_Guide_for_Spring_2026_Freshman(ENG).pdf'},
      {label: 'Spring 2027 dates (Korea JoongAng Daily)', url: 'https://www.koreajoongangdaily.com/korea/spring-2027-admissions-for-international-students-open-at-korean-universities/12788168'},
      {label: 'Tuition and fall 2027 round (StudyU summary)', url: 'https://www.studyu.org/en/university-korea-university'},
    ],
  },
};
