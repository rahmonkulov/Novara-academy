// University Explorer helpers (OpenAlex): query parsing, request URLs and data shaping.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function load(file,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,URLSearchParams,require:name=>{const hit=Object.keys(deps).find(key=>name.endsWith(key));if(!hit)throw new Error('Unexpected import '+name);return deps[hit]}});return exports}
const lib=load('app/world-lib.ts',{'/colleges-lib':load('app/colleges-lib.ts')});
const plain=value=>JSON.parse(JSON.stringify(value));

test('world queries keep only known values, in any script',()=>{
  const query=lib.parseWorldQuery(new URLSearchParams('q=香港科技大学<script>&country=hk&region=mars&sort=evil&page=-3&list=saved&ids=I200769079,I200769079,bad,I1'));
  assert.deepEqual(plain(query),{q:'香港科技大学 script',country:'HK',region:'',sort:'impact',page:0,list:'saved',ids:['I200769079']});
  assert.equal(lib.parseWorldQuery(new URLSearchParams('page=99999')).page,lib.WORLD_MAX_PAGE);
  assert.equal(lib.parseWorldQuery(new URLSearchParams('country=USA')).country,'');
  assert.equal(lib.parseWorldQuery(new URLSearchParams('list=ivy')).list,'');
  assert.equal(lib.cleanWorldSearch('Sorbonne Université'),'Sorbonne Université');
  assert.equal(lib.cleanWorldSearch('a'.repeat(200)).length,80);
  assert.equal(lib.worldQueryToSearch(lib.parseWorldQuery(new URLSearchParams('region=asia&sort=name&page=2&list=saved'))),'region=asia&sort=name&page=2&list=saved');
  assert.equal(lib.worldQueryToSearch(lib.EMPTY_WORLD_QUERY),'');
  const api=new URLSearchParams(lib.worldApiSearch(lib.parseWorldQuery(new URLSearchParams('list=saved')),['I200769079','I889458895']));
  assert.equal(api.get('list'),null);
  assert.equal(api.get('ids'),'I200769079,I889458895');
});

test('OpenAlex list URLs filter to universities and the chosen place',()=>{
  const url=new URL(lib.buildWorldListUrl(lib.parseWorldQuery(new URLSearchParams('q=science&country=HK&sort=output&page=2'))));
  const p=url.searchParams;
  assert.equal(url.origin+url.pathname,'https://api.openalex.org/institutions');
  assert.equal(p.get('filter'),'type:education,country_code:HK');
  assert.equal(p.get('search'),'science');
  assert.equal(p.get('sort'),'works_count:desc');
  assert.equal(p.get('page'),'3');
  assert.equal(p.get('per_page'),String(lib.WORLD_PER_PAGE));
  assert.match(p.get('select'),/^id,display_name,/);
  const middleEast=new URL(lib.buildWorldListUrl(lib.parseWorldQuery(new URLSearchParams('region=middle_east')))).searchParams;
  assert.equal(middleEast.get('filter'),'type:education,country_code:AE|SA|QA|KW|BH|OM|JO|LB|IL|IQ|IR|TR|EG');
  assert.equal(middleEast.get('sort'),'cited_by_count:desc');
  const saved=new URL(lib.buildWorldListUrl({...lib.EMPTY_WORLD_QUERY,q:'ignored',country:'HK',ids:['I200769079','I889458895']})).searchParams;
  assert.equal(saved.get('filter'),'type:education,ids.openalex:I200769079|I889458895');
  assert.equal(saved.get('search'),null);
});

test('rank, detail and country URLs',()=>{
  const rank=new URL(lib.buildRankUrl(1234.7,'HK')).searchParams;
  assert.equal(rank.get('filter'),'type:education,country_code:HK,cited_by_count:>1234');
  assert.equal(rank.get('per_page'),'1');
  assert.equal(new URL(lib.buildRankUrl(5,'hk')).searchParams.get('filter'),'type:education,cited_by_count:>5');
  const detail=new URL(lib.buildWorldDetailUrl('I200769079'));
  assert.equal(detail.pathname,'/institutions/I200769079');
  assert.match(detail.searchParams.get('select'),/associated_institutions/);
  assert.equal(new URL(lib.buildCountriesUrl()).searchParams.get('group_by'),'country_code');
});

test('rows are shaped for the pages and unsafe links are dropped',()=>{
  const row={id:'https://openalex.org/I200769079',display_name:'Hong Kong University of Science and Technology',display_name_acronyms:['','HKUST'],
    display_name_alternatives:['Hong Kong University of Science and Technology','香港科技大學','HKUST'],
    geo:{city:'Hong Kong',country:'Hong Kong',country_code:'HK'},homepage_url:'javascript:alert(1)',works_count:61234,cited_by_count:'many',
    ids:{wikipedia:'http://en.wikipedia.org/wiki/HKUST'},summary_stats:{h_index:312},
    topics:Array.from({length:9},(_,i)=>({display_name:'Topic '+i})),
    associated_institutions:[{id:'https://openalex.org/I4210127875',display_name:'HKUST (Guangzhou)',relationship:'child'},{id:'https://openalex.org/bad',display_name:'Broken'}]};
  const university=plain(lib.toWorldUniversity(row));
  assert.deepEqual(university,{id:'I200769079',name:'Hong Kong University of Science and Technology',acronym:'HKUST',city:'Hong Kong',country:'Hong Kong',countryCode:'HK',website:null,works:61234,citations:null});
  const detail=plain(lib.toWorldDetail(row));
  assert.deepEqual(detail.otherNames,['香港科技大學','HKUST']);
  assert.equal(detail.wikipedia,'https://en.wikipedia.org/wiki/HKUST');
  assert.equal(detail.hIndex,312);
  assert.equal(detail.topics.length,6);
  assert.deepEqual(detail.related,[{id:'I4210127875',name:'HKUST (Guangzhou)',relationship:'child'}]);
  assert.equal(lib.toWorldUniversity({}).name,'Unnamed university');
});

test('countries come back sorted by name, and labels format compactly',()=>{
  const countries=plain(lib.toCountries([
    {key:'https://openalex.org/countries/US',key_display_name:'United States',count:3000},
    {key:'https://openalex.org/countries/hk',key_display_name:'Hong Kong',count:20},
    {key:'unknown',key_display_name:'',count:1},
  ]));
  assert.deepEqual(countries,[{code:'HK',name:'Hong Kong',count:20},{code:'US',name:'United States',count:3000}]);
  assert.deepEqual(plain(lib.toCountries(null)),[]);
  assert.equal(lib.formatCompact(1234567),'1.2M');
  assert.equal(lib.formatCompact(null),'—');
  assert.equal(lib.formatRank(1234),'#1,234');
  assert.equal(lib.formatRank(null),'—');
});
