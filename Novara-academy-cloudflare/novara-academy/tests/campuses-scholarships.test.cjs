// Campuses, "How you apply" and government scholarships: every fact is checked by hand, links to an official page,
// and each campus keeps its own facts (CUHK charges HK$500 to apply, CUHK-Shenzhen charges nothing).
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function load(file){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>{throw new Error('Unexpected import '+name)}});return exports}
const {ADMISSIONS}=load('app/admissions-data.ts');
const {CAMPUS_GROUPS,campusGroupFor}=load('app/campuses.ts');
const {GOVERNMENT_SCHOLARSHIPS,scholarshipsFor}=load('app/government-scholarships.ts');
const plain=value=>JSON.parse(JSON.stringify(value));
const https=url=>typeof url==='string'&&url.startsWith('https://');

test('every hand-checked university says how to apply and links only to real pages',()=>{
  for(const [id,info] of Object.entries(ADMISSIONS)){
    assert.match(id,/^I\d+$/,id);
    assert.ok(info.applyVia&&info.applyVia.length>10,`${id} says how to apply`);
    assert.ok(info.applicationFee&&info.tuition&&info.english&&info.tests,`${id} has the basics`);
    assert.ok(info.rounds.length>0,`${id} has dates`);
    assert.ok(https(info.applyUrl),`${id} apply link`);
    assert.ok(info.sources.length>0&&info.sources.every(source=>https(source.url)&&source.label),`${id} sources`);
    for(const award of info.scholarships){
      assert.ok(['automatic','separate'].includes(award.howToApply),`${id} ${award.name}`);
      assert.ok(https(award.url),`${id} ${award.name} link`);
    }
    for(const rank of info.rankings||[])assert.ok(https(rank.url),`${id} ranking link`);
    if(info.ieltsMin!==undefined)assert.ok(info.ieltsMin>=4&&info.ieltsMin<=9,`${id} IELTS`);
  }
});

test('each campus keeps its own facts: CUHK costs HK$500 to apply, CUHK-Shenzhen is free',()=>{
  assert.match(ADMISSIONS.I177725633.applicationFee,/HK\$500/);
  assert.match(ADMISSIONS.I4210116924.applicationFee,/^Free/);
  assert.match(ADMISSIONS.I4210116924.applyVia,/separate from CUHK/);
  assert.match(ADMISSIONS.I889458895.applicationFee,/HK\$780/);
  assert.match(ADMISSIONS.I168719708.applicationFee,/HK\$450/);
  assert.match(ADMISSIONS.I157485424.scholarships[0].amount,/Full tuition/);
});

test('campus groups link each campus to the others and nothing twice',()=>{
  const ids=CAMPUS_GROUPS.flatMap(group=>group.campuses.map(campus=>campus.id));
  assert.equal(new Set(ids).size,ids.length);
  for(const group of CAMPUS_GROUPS){
    assert.ok(group.campuses.length>=2,group.name);
    for(const campus of group.campuses){
      assert.match(campus.id,/^I\d+$/);
      assert.equal(campusGroupFor(campus.id).name,group.name);
      assert.ok(campus.name&&campus.place);
    }
  }
  assert.equal(campusGroupFor('I177725633').campuses.map(campus=>campus.name).join(' + '),'CUHK + CUHK-Shenzhen');
  assert.equal(campusGroupFor('I889458895'),undefined);
});

test('government scholarships: official links, what they cover, and the right country',()=>{
  const ids=GOVERNMENT_SCHOLARSHIPS.map(item=>item.id);
  assert.equal(new Set(ids).size,ids.length);
  for(const item of GOVERNMENT_SCHOLARSHIPS){
    assert.match(item.countryCode,/^[A-Z]{2}$/);
    assert.ok(item.covers.length>=3,`${item.id} covers`);
    assert.ok(item.howToApply&&item.when&&item.checked,`${item.id} details`);
    assert.ok(https(item.url)&&item.sources.length>0&&item.sources.every(source=>https(source.url)),`${item.id} links`);
  }
  assert.deepEqual(plain(scholarshipsFor('KR').map(item=>item.id)),['gks']);
  assert.deepEqual(plain(scholarshipsFor('CN').map(item=>item.id)),['csc']);
  assert.deepEqual(plain(scholarshipsFor('HU').map(item=>item.id)),['stipendium-hungaricum']);
  assert.equal(scholarshipsFor('HK').length,0);
});

test('the AI also says how to apply, and drops it when the pages don’t say',()=>{
  const ai=load('app/admissions-ai.ts');
  const base={found:true,intake:'Fall 2027 entry',tuition:'KRW 4,000,000 a semester',applicationFee:'KRW 150,000',rounds:['Apply by Mar 3, 2027'],english:'TOPIK 3 or IELTS 5.5',tests:'High-school record',scholarships:[],applyUrl:'https://admission.yonsei.ac.kr/apply',sources:[{label:'Guide',url:'https://admission.yonsei.ac.kr/guide'}]};
  const said=ai.toAdmissionsInfo({...base,applyVia:'Yonsei’s own online application, not the Common App'},'yonsei.ac.kr',new Date('2026-11-21T00:00:00Z'));
  assert.equal(said.applyVia,'Yonsei’s own online application, not the Common App');
  const silent=ai.toAdmissionsInfo({...base,applyVia:'Not published'},'yonsei.ac.kr',new Date('2026-11-21T00:00:00Z'));
  assert.equal(silent.applyVia,undefined);
});
