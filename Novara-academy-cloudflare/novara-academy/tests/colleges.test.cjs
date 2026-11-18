// College Explorer helpers: filter validation, College Scorecard URLs, data shaping and the SAT guide.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const lib={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/colleges-lib.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:lib,URL,URLSearchParams});
const plain=value=>JSON.parse(JSON.stringify(value));

test('list queries keep only known filters',()=>{
  const query=lib.parseListQuery(new URLSearchParams('q=MIT<script>&state=ma&sel=under10&size=huge&control=private&sort=evil&page=-4'));
  assert.deepEqual(plain(query),{q:'MIT script',state:'MA',sel:'under10',size:'',control:'private',sort:'selective',page:0});
  assert.equal(lib.parseListQuery(new URLSearchParams('page=99999')).page,lib.MAX_PAGE);
  assert.equal(lib.parseListQuery(new URLSearchParams('state=ZZ')).state,'');
  assert.equal(lib.queryToSearch(lib.parseListQuery(new URLSearchParams('state=NY&sort=name&page=3'))),'state=NY&sort=name&page=3');
  assert.equal(lib.queryToSearch(lib.EMPTY_QUERY),'');
});

test('College Scorecard list URL applies filters and safe defaults',()=>{
  const url=new URL(lib.buildListUrl(lib.parseListQuery(new URLSearchParams('q=boston&state=MA&sel=10to25&size=medium&control=private&sort=name&page=2')),'KEY'));
  const p=url.searchParams;
  assert.equal(url.origin+url.pathname,'https://api.data.gov/ed/collegescorecard/v1/schools');
  assert.equal(p.get('api_key'),'KEY');
  assert.equal(p.get('school.name'),'boston');
  assert.equal(p.get('school.state'),'MA');
  assert.equal(p.get('school.ownership'),'2');
  assert.equal(p.get('latest.admissions.admission_rate.overall__range'),'0.1..0.2499');
  assert.equal(p.get('latest.student.size__range'),'5000..15000');
  assert.equal(p.get('sort'),'school.name:asc');
  assert.equal(p.get('page'),'2');
  assert.equal(p.get('per_page'),String(lib.PER_PAGE));
  const defaults=new URL(lib.buildListUrl(lib.EMPTY_QUERY,'KEY')).searchParams;
  assert.equal(defaults.get('school.ownership'),'1,2');
  assert.equal(defaults.get('school.degrees_awarded.predominant'),'3');
  assert.equal(defaults.get('latest.admissions.admission_rate.overall__range'),'0..1');
  assert.equal(defaults.get('sort'),'latest.admissions.admission_rate.overall:asc');
  assert.equal(defaults.get('school.name'),null);
  assert.equal(lib.parseId('166027'),166027);
  assert.equal(lib.parseId('16602x'),null);
  assert.equal(new URL(lib.buildDetailUrl(166027,'KEY')).searchParams.get('id'),'166027');
});

test('rows are shaped for the pages and unsafe links are dropped',()=>{
  const row={id:166027,'school.name':'Harvard University','school.city':'Cambridge','school.state':'MA','school.ownership':2,'school.school_url':'www.harvard.edu/','school.price_calculator_url':'javascript:alert(1)','latest.admissions.admission_rate.overall':0.0365,'latest.admissions.sat_scores.25th_percentile.critical_reading':740,'latest.admissions.sat_scores.75th_percentile.critical_reading':780,'latest.admissions.sat_scores.25th_percentile.math':770,'latest.admissions.sat_scores.75th_percentile.math':800,'latest.admissions.act_scores.25th_percentile.cumulative':34,'latest.admissions.act_scores.75th_percentile.cumulative':36,'latest.admissions.test_requirements':1,'latest.student.size':7601,'latest.student.demographics.race_ethnicity.non_resident_alien':0.1459,'latest.cost.attendance.academic_year':89279,'latest.cost.tuition.in_state':64796,'latest.cost.tuition.out_of_state':64796,'latest.completion.completion_rate_4yr_150nt':0.9708,'latest.earnings.10_yrs_after_entry.median':121957};
  const college=lib.toDetail(row);
  assert.equal(college.website,'https://www.harvard.edu/');
  assert.equal(college.priceCalculator,null);
  assert.equal(lib.formatSatRange(college.sat),'1510–1580');
  assert.equal(lib.formatRate(college.admitRate),'3.6%');
  assert.equal(lib.formatShare(college.intlShare),'15%');
  assert.equal(lib.formatMoney(college.costOfAttendance),'$89,279');
  assert.equal(lib.formatCount(college.size),'7,601');
  assert.equal(lib.TEST_POLICY_LABEL[college.testPolicy],'Required');
  const sparse=lib.toCollege({id:1,'school.name':7});
  assert.equal(sparse.name,'Unnamed college');
  assert.equal(lib.formatSatRange(sparse.sat),'Not reported');
  assert.equal(lib.formatRate(sparse.admitRate),'—');
});

test('the SAT guide stays conservative',()=>{
  const harvard={admitRate:0.0365,sat:{reading25:740,reading75:780,math25:770,math75:800}};
  assert.equal(lib.chanceFor(1600,harvard).tone,'reach');
  const middle={admitRate:0.45,sat:{reading25:600,reading75:690,math25:600,math75:700}};
  assert.equal(lib.chanceFor(1450,middle).tone,'likely');
  assert.equal(lib.chanceFor(1300,middle).tone,'target');
  assert.equal(lib.chanceFor(1100,middle).tone,'reach');
  const selective={admitRate:0.2,sat:{reading25:650,reading75:740,math25:660,math75:770}};
  assert.equal(lib.chanceFor(1520,selective).tone,'target');
  assert.equal(lib.chanceFor(1400,selective).tone,'reach');
  const open={admitRate:0.8,sat:{reading25:500,reading75:600,math25:490,math75:600}};
  assert.equal(lib.chanceFor(1100,open).tone,'likely');
  assert.equal(lib.chanceFor(950,open).tone,'target');
  assert.equal(lib.chanceFor(null,middle),null);
  assert.equal(lib.chanceFor(1300,{admitRate:0.5,sat:{reading25:null,reading75:null,math25:null,math75:null}}).tone,'unknown');
  assert.equal(lib.parseSat('1450'),1450);
  assert.equal(lib.parseSat('1700'),null);
  assert.equal(lib.parseSat('14.5'),null);
  assert.equal(lib.parseSat(''),null);
});
