// Government scholarships that pay for (almost) everything, shown on every university page in that country and on
// /scholarships. Checked by hand from official or government sources; amounts change every year, so each entry
// says when it was checked and links to the official page.

export type GovernmentScholarship = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  sponsor: string;
  covers: string[];
  notCovered?: string;
  allowance?: string;
  howToApply: string;
  when: string;
  uzbekistan?: string;
  url: string;
  checked: string;
  sources: {label: string; url: string}[];
};

export const GOVERNMENT_SCHOLARSHIPS: GovernmentScholarship[] = [
  {
    id: 'gks',
    name: 'Global Korea Scholarship (GKS)',
    country: 'South Korea',
    countryCode: 'KR',
    sponsor: 'Korean government (NIIED)',
    covers: ['Full tuition', 'Monthly allowance', 'Return flights', 'Settlement allowance', '1 year of Korean language study'],
    howToApply: 'Two routes: the Embassy track (apply through the Korean embassy in your country) or the University track (apply directly to a participating Korean university). Applications go through Study in Korea.',
    when: 'For 2027 entry, the Embassy track ran Sep 15–30, 2026 and University-track deadlines run to about November 2026, set by each university. Expect the next call around September 2027.',
    uzbekistan: 'Open to citizens of GKS partner countries. Check the 2027 guideline for your country’s quota.',
    url: 'https://www.studyinkorea.go.kr/ko/plan/scholarship.do',
    checked: 'Nov 2026',
    sources: [
      {label: 'Study in Korea: GKS scholarships', url: 'https://www.studyinkorea.go.kr/ko/plan/scholarship.do'},
      {label: 'Korean embassy notice: GKS-U 2027 application period', url: 'https://www.mofa.go.kr/ca-en/brd/m_5231/view.do?seq=761813'},
      {label: 'GKS-U 2027 applications open (Korea JoongAng Daily)', url: 'https://www.koreajoongangdaily.com/korea/gksu-2027-what-international-students-need-to-know-before-applying/12878569'},
    ],
  },
  {
    id: 'csc',
    name: 'Chinese Government Scholarship (CSC)',
    country: 'China',
    countryCode: 'CN',
    sponsor: 'China Scholarship Council',
    covers: ['Full tuition', 'Free campus housing', 'Medical insurance', 'Monthly stipend'],
    notCovered: 'Flights are usually not covered.',
    howToApply: 'Apply online in the CSC system (campuschina.org) through the Chinese embassy in your country or through a Chinese university, then follow that route’s documents and deadline.',
    when: 'Each embassy and university sets its own deadline, usually between January and April for September entry.',
    url: 'https://www.campuschina.org',
    checked: 'Nov 2026',
    sources: [
      {label: 'Hunan Provincial Government: Chinese Government Scholarship', url: 'https://enghunan.gov.cn/hneng/Services/Education/GovernmentScholarship/202601/t20260121_33757917.html'},
      {label: 'Campus China application portal', url: 'https://www.campuschina.org'},
    ],
  },
  {
    id: 'mext',
    name: 'Japanese Government (MEXT) Scholarship, Undergraduate',
    country: 'Japan',
    countryCode: 'JP',
    sponsor: 'Japanese Ministry of Education (MEXT)',
    covers: ['Full tuition', 'Entrance exam and admission fees', 'Return flights', 'Monthly allowance'],
    allowance: '¥117,000 a month for undergraduates (subject to change)',
    howToApply: 'Through the Japanese embassy in your country (Embassy Recommendation): written exams and an interview. Do not send documents to MEXT in Japan.',
    when: 'Embassies announce the call around April to June for entry the following April; the 2027 calls have closed in most countries, so watch for the 2028 call next spring.',
    url: 'https://www.studyinjapan.go.jp/en/smap-stopj-applications-undergraduate.html',
    checked: 'Nov 2026',
    sources: [
      {label: 'Study in Japan: MEXT Embassy Recommendation (undergraduate)', url: 'https://www.studyinjapan.go.jp/en/smap-stopj-applications-undergraduate.html'},
      {label: 'Embassy of Japan: MEXT scholarship FAQ', url: 'https://www.lu.emb-japan.go.jp/files/100831496.pdf'},
    ],
  },
  {
    id: 'turkiye',
    name: 'Türkiye Bursları (Türkiye Scholarships)',
    country: 'Turkey',
    countryCode: 'TR',
    sponsor: 'Turkish government (YTB)',
    covers: ['Full tuition', 'Monthly stipend', 'Accommodation', 'Health insurance', '1 year of Turkish language course', 'University placement'],
    allowance: '6,500 TL a month for undergraduates',
    howToApply: 'Apply online yourself at tbbs.turkiyeburslari.gov.tr; no agents are authorised. Free to apply. Shortlisted students are interviewed.',
    when: 'One call a year, usually 10 January to 20 February, for September entry the following year.',
    url: 'https://turkiyeburslari.gov.tr/fulltimeprograms',
    checked: 'Nov 2026',
    sources: [{label: 'Türkiye Bursları: full-time scholarships', url: 'https://turkiyeburslari.gov.tr/fulltimeprograms'}],
  },
  {
    id: 'stipendium-hungaricum',
    name: 'Stipendium Hungaricum',
    country: 'Hungary',
    countryCode: 'HU',
    sponsor: 'Hungarian government (Tempus Public Foundation)',
    covers: ['Tuition-free study', 'Monthly stipend', 'Dormitory place or housing contribution', 'Medical insurance'],
    notCovered: 'Flights are not covered.',
    allowance: 'HUF 43,700 a month for bachelor students, plus a dormitory place or HUF 40,000 a month for housing',
    howToApply: 'Apply online in the Stipendium Hungaricum system and to your chosen Hungarian programmes; your home country’s partner ministry must also nominate you.',
    when: 'The application deadline was 15 January for the 2026/27 year; expect a similar mid-January deadline each year.',
    uzbekistan: 'Uzbekistan is a partner country: 110 Uzbek students won it for 2026/27, and the quota is planned to grow to 200.',
    url: 'https://stipendiumhungaricum.hu',
    checked: 'Nov 2026',
    sources: [
      {label: 'Semmelweis University: what Stipendium Hungaricum covers', url: 'https://semmelweis.hu/mobilitas/en/stipendium-hungaricum/'},
      {label: 'UzA: Uzbek recipients for 2026/27', url: 'https://uza.uz/ar/posts/meeting-conducted-with-recipients-of-the-stipendium-hungaricum-scholarship_897256'},
    ],
  },
];

export const scholarshipsFor = (countryCode: string) => GOVERNMENT_SCHOLARSHIPS.filter(item => item.countryCode === countryCode);
