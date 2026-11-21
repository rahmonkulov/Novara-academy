// Universities with more than one campus that students apply to separately. Each campus has its own application,
// fees and scholarships (CUHK in Hong Kong charges HK$500 to apply, CUHK-Shenzhen charges nothing), so each campus
// is its own page and this list links them so their basics can be compared side by side. Keyed by OpenAlex ID.

export type Campus = {id: string; name: string; place: string};
export type CampusGroup = {name: string; note?: string; campuses: Campus[]};

export const CAMPUS_GROUPS: CampusGroup[] = [
  {
    name: 'CUHK',
    campuses: [
      {id: 'I177725633', name: 'CUHK', place: 'Hong Kong'},
      {id: 'I4210116924', name: 'CUHK-Shenzhen', place: 'Shenzhen, China'},
    ],
  },
  {
    name: 'HKUST',
    campuses: [
      {id: 'I200769079', name: 'HKUST', place: 'Hong Kong'},
      {id: 'I4405261251', name: 'HKUST (Guangzhou)', place: 'Guangzhou, China'},
    ],
  },
  {
    name: 'CityUHK',
    campuses: [
      {id: 'I168719708', name: 'CityUHK', place: 'Hong Kong'},
      {id: 'I4405263171', name: 'CityUHK (Dongguan)', place: 'Dongguan, China'},
    ],
  },
  {
    name: 'HKBU',
    note: 'BNBU is run jointly by Beijing Normal University and HKBU.',
    campuses: [
      {id: 'I141568987', name: 'HKBU', place: 'Hong Kong'},
      {id: 'I12615008', name: 'BNBU', place: 'Zhuhai, China'},
    ],
  },
];

export const campusGroupFor = (id: string) => CAMPUS_GROUPS.find(group => group.campuses.some(campus => campus.id === id));
