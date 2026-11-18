// "Find admissions & scholarships": the AI may only use the university's own website, results are saved once
// for everyone, and daily limits keep the cost under control.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const {DatabaseSync}=require('node:sqlite');
function load(file,deps={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,URLSearchParams,Request,Response,AbortSignal,TextEncoder,setTimeout,console,crypto:require('node:crypto').webcrypto,...globals,require:name=>{const hit=Object.keys(deps).find(key=>name.endsWith(key));if(!hit)throw new Error('Unexpected import '+name);return deps[hit]}});return exports}
const plain=value=>JSON.parse(JSON.stringify(value));
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const colleges=load('app/colleges-lib.ts');
const world=load('app/world-lib.ts',{'/colleges-lib':colleges});
const data=load('app/admissions-data.ts');
const ai=load('app/admissions-ai.ts');

test('only the university’s own website counts',()=>{
  assert.equal(ai.officialDomain('https://www.hkust.edu.hk/'),'hkust.edu.hk');
  assert.equal(ai.officialDomain('hku.hk'),'hku.hk');
  assert.equal(ai.officialDomain('javascript:alert(1)'),null);
  assert.equal(ai.officialDomain(null),null);
  assert.equal(ai.onDomain('https://join.hkust.edu.hk/fees','hkust.edu.hk'),true);
  assert.equal(ai.onDomain('https://hkust.edu.hk.evil.example/','hkust.edu.hk'),false);
  assert.equal(ai.onDomain('https://evilhkust.edu.hk/','hkust.edu.hk'),false);
  assert.equal(ai.onDomain('ftp://hkust.edu.hk/','hkust.edu.hk'),false);
});

const good={found:true,intake:'Fall 2027 entry',tuition:'HK$182,000 per year (2027/28)',livingCost:null,applicationFee:'HK$450',rounds:['Early round: Nov 15, 2026'],english:'IELTS 6.5',ieltsMin:6.5,satMin:1355,satNote:'Reference only',tests:'SAT, A-level, IB',
  scholarships:[{name:'Entrance Scholarship',amount:'Up to full tuition',howToApply:'automatic',details:'Considered with the application.',deadline:null,url:'https://admissions.hku.hk/scholarships'},{name:'Copied award',amount:'?',howToApply:'separate',details:'Off-site page',deadline:null,url:'https://scholarship-list.example/hku'}],
  chances:null,applyUrl:'https://apply.example/hku',sources:[{label:'Fees',url:'https://admissions.hku.hk/fees'},{label:'Blog',url:'https://blog.example/'}]};

test('results are checked: off-site links, made-up numbers and empty answers are dropped',()=>{
  const info=plain(ai.toAdmissionsInfo(good,'hku.hk',new Date('2026-11-18T00:00:00Z')));
  assert.equal(info.checked,'Nov 2026');
  assert.deepEqual(info.scholarships.map(item=>item.name),['Entrance Scholarship']);
  assert.equal(info.scholarships[0].deadline,undefined);
  assert.deepEqual(info.sources,[{label:'Fees',url:'https://admissions.hku.hk/fees'}]);
  assert.equal(info.applyUrl,'https://hku.hk');
  assert.equal(info.ieltsMin,6.5);
  assert.equal(info.satMin,undefined);
  assert.equal(ai.toAdmissionsInfo({...good,found:false},'hku.hk',new Date()),null);
  assert.equal(ai.toAdmissionsInfo({...good,tuition:'Not published',scholarships:[],rounds:[]},'hku.hk',new Date()),null);
  assert.equal(ai.toAdmissionsInfo('nonsense','hku.hk',new Date()),null);
  assert.equal(ai.outputText({output:[{type:'web_search_call'},{type:'message',content:[{type:'output_text',text:'{"a":'},{type:'output_text',text:'1}'}]}]}),'{"a":1}');
  const request=plain(ai.buildResearchRequest({model:'m',name:'HKU',country:'Hong Kong',domain:'hku.hk',today:'2026-11-18'}));
  assert.deepEqual(request.tools[0].filters.allowed_domains,['hku.hk']);
  assert.equal(request.text.format.type,'json_schema');
  assert.equal(request.text.format.strict,true);
  assert.match(request.instructions,/Never guess/);
});

function harness({env={},openai=()=>json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(good)}]}]})}={}){
  const sql=new DatabaseSync(':memory:');
  const statement=(query,args=[])=>({bind:(...values)=>statement(query,values),first:async()=>sql.prepare(query).get(...args)??null,run:async()=>sql.prepare(query).run(...args)});
  const db={prepare:query=>statement(query),batch:async statements=>Promise.all(statements.map(item=>item.run()))};
  const calls={openai:[],openalex:0};
  const fetcher=async(url,init)=>{
    if(String(url).startsWith('https://api.openai.com/')){calls.openai.push(JSON.parse(init.body));return openai()}
    calls.openalex++;
    const id=new URL(url).pathname.split('/').pop();
    return json({id:'https://openalex.org/'+id,display_name:id==='I889458895'?'University of Hong Kong':'University '+id,homepage_url:id==='I111'?null:'https://www.hku.hk/',geo:{country:'Hong Kong',country_code:'HK'}});
  };
  const cache=load('app/server-cache.ts',{},{fetch:fetcher,setTimeout:fn=>setTimeout(fn,0)});
  const route=load('app/api/admissions/route.ts',{'cloudflare:workers':{env:{OPENAI_API_KEY:'test-key',DATA_DB:db,...env}},'/admissions-data':data,'/admissions-ai':ai,'/server-cache':cache,'/world-lib':world},{fetch:fetcher});
  const get=async id=>(await route.GET(new Request('https://novara.test/api/admissions?id='+id))).json();
  const post=async(id,{ip='1.2.3.4',origin='https://novara.test'}={})=>{const res=await route.POST(new Request('https://novara.test/api/admissions',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':ip,origin},body:JSON.stringify({id})}));return {status:res.status,body:await res.json()}};
  return {get,post,calls,sql};
}

test('hand-checked universities never call the AI',async()=>{
  const h=harness();
  const state=await h.get('I200769079');
  assert.equal(state.status,'ready');
  assert.equal(state.source,'checked');
  assert.equal((await h.post('I200769079')).body.source,'checked');
  assert.equal(h.calls.openai.length,0);
});

test('a university is researched once, then everyone gets the saved answer',async()=>{
  const h=harness();
  assert.deepEqual(await h.get('I889458895'),{status:'none',canResearch:true});
  const first=await h.post('I889458895');
  assert.equal(first.body.status,'ready');
  assert.equal(first.body.source,'ai');
  assert.equal(first.body.domain,'hku.hk');
  assert.equal(first.body.info.tuition,'HK$182,000 per year (2027/28)');
  assert.deepEqual(h.calls.openai[0].tools[0].filters.allowed_domains,['hku.hk']);
  assert.equal(h.calls.openai[0].model,'gpt-5.5');
  const again=await h.post('I889458895',{ip:'5.6.7.8'});
  assert.equal(again.body.status,'ready');
  assert.equal(h.calls.openai.length,1);
  assert.equal((await h.get('I889458895')).status,'ready');
});

test('daily limits per visitor and in total, and other sites cannot start research',async()=>{
  const h=harness({env:{ADMISSIONS_DAILY_LIMIT:'4'}});
  for(const id of ['I1001','I1002','I1003'])assert.equal((await h.post(id)).body.status,'ready');
  const fourth=await h.post('I1004');
  assert.equal(fourth.status,429);
  assert.match(fourth.body.error,/3 new universities today/);
  assert.equal((await h.post('I1005',{ip:'9.9.9.9'})).body.status,'ready');
  const overall=await h.post('I1006',{ip:'8.8.8.8'});
  assert.equal(overall.status,429);
  assert.match(overall.body.error,/used up/);
  assert.equal((await h.post('I1007',{origin:'https://evil.example'})).status,403);
});

test('a failed search is remembered, so the same university is not retried for hours',async()=>{
  const h=harness({openai:()=>json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...good,found:false})}]}]})});
  const first=await h.post('I2001');
  assert.equal(first.body.status,'failed');
  assert.match(first.body.error,/hku\.hk/);
  assert.equal((await h.get('I2001')).status,'failed');
  await h.post('I2001',{ip:'4.4.4.4'});
  assert.equal(h.calls.openai.length,1);
  const noSite=await h.post('I111');
  assert.match(noSite.body.error,/no official website/);
  assert.equal(h.calls.openai.length,1);
});

test('without an AI key the button is hidden and research is refused',async()=>{
  const h=harness({env:{OPENAI_API_KEY:''}});
  assert.deepEqual(await h.get('I889458895'),{status:'none',canResearch:false});
  assert.equal((await h.post('I889458895')).status,503);
  const off=harness({env:{ADMISSIONS_AI:'off'}});
  assert.deepEqual(await off.get('I889458895'),{status:'none',canResearch:false});
});

test('a wrong AI key shows only "OpenAI 401" publicly and can be retried soon',async()=>{
  const h=harness({openai:()=>json({error:{message:'Incorrect API key provided: sk-proj-****abcd.'}},401)});
  const first=await h.post('I3001');
  assert.equal(first.body.status,'failed');
  assert.equal(first.body.detail,'OpenAI 401');
  assert.doesNotMatch(JSON.stringify(first.body),/Incorrect|sk-proj/);
  const later=await h.get('I3001');
  assert.equal(later.detail,'OpenAI 401');
  const row=h.sql.prepare('SELECT detail, retry_after, failed FROM admissions_ai WHERE id = ?').get('I3001');
  assert.match(row.detail,/Incorrect API key/);
  assert.doesNotMatch(row.detail,/sk-proj-\*/);
  assert.equal(row.retry_after-row.failed,600);
});
