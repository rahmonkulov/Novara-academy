// The questionnaire's AI assessment now runs on the free AIs: answers are reshaped and checked before a student sees them.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function load(file,deps={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,URLSearchParams,Request,Response,AbortSignal,TextEncoder,setTimeout,console,crypto:require('node:crypto').webcrypto,...globals,require:name=>{const hit=Object.keys(deps).find(key=>name===key||name.endsWith(key));if(!hit)throw new Error('Unexpected import '+name);return deps[hit]}});return exports}
const plain=value=>JSON.parse(JSON.stringify(value));
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const zod=require('zod');
const options=load('app/profile-options.ts');
const data=load('app/data.ts',{'/profile-options':options});
const schema=load('app/ai-schema.ts',{'zod':zod});
const ai=load('app/admissions-ai.ts');
const assessment=load('app/assessment.ts',{'/data':data,'/ai-schema':schema,'/admissions-ai':ai});
const mit=data.schools.find(s=>s.id==='mit').url;
const report={summary:'Strong maths profile.',strengths:['Built an app used by 40 classmates'],gaps:['No SAT subject evidence'],
  recommendations:[
    {id:'mit',category:'high reach',explanation:'Fits engineering interest.',academicAssessment:'Strong.',financialAssessment:'Need-blind for all applicants? Check.',requirements:[{claim:'English test needed',source:mit},{claim:'Copied claim',source:'https://ranking-blog.example/mit'}],uncertainties:['Essay quality']},
    {id:'mit',category:'Reach',explanation:'Duplicate',academicAssessment:'',financialAssessment:'',requirements:[],uncertainties:[]},
    {id:'stanford',category:'Reach',explanation:'Fits.',academicAssessment:'Good.',financialAssessment:'Check aid.',requirements:[{claim:'Off-site only',source:'https://blog.example/stanford'}],uncertainties:[]},
    {id:'kaist',category:'Potential match',explanation:'Fits.',academicAssessment:'Good.',financialAssessment:'Scholarships exist; check.',requirements:[],uncertainties:[]},
    {id:'made-up-university',category:'Reach',explanation:'x',academicAssessment:'x',financialAssessment:'x',requirements:[],uncertainties:[]},
  ],
  roadmap:[{title:'Take the SAT',action:'Book a test date.',timing:'Next 2 months'},{title:'Draft essay',action:'Write a first draft.',timing:'This month'},{title:'Shortlist',action:'Save 8 universities.'}]};

test('answers keep only known universities, valid categories and official sources',()=>{
  const out=plain(assessment.normalizeReport(report));
  assert.deepEqual(out.recommendations.map(r=>[r.id,r.category]),[['mit','High reach'],['stanford','Reach'],['kaist','Potential match']]);
  assert.deepEqual(out.recommendations[0].requirements,[{claim:'English test needed',source:mit}]);
  assert.equal(out.recommendations[1].requirements[0].source,data.schools.find(s=>s.id==='stanford').url);
  assert.match(out.recommendations[2].requirements[0].claim,/official admissions page/);
  assert.equal(out.roadmap[2].timing,'Soon');
  assert.equal(assessment.normalizeReport({...report,recommendations:report.recommendations.slice(0,2)}),null);
  assert.equal(assessment.normalizeReport({...report,roadmap:report.roadmap.slice(0,2)}),null);
  assert.equal(assessment.normalizeReport('not json'),null);
});

function route({gemini,workers}){
  const calls=[];
  const fetcher=async(url,init)=>{calls.push(JSON.parse(init.body));return gemini()};
  const providers=load('app/ai-providers.ts',{},{fetch:fetcher});
  const limits=load('app/ai-limits.ts');
  const brand={BRAND:{name:'Test Academy',short:'Test',tagline:'',logo:'',logoAlt:''}};
  const env={GEMINI_API_KEY:'g',AI:workers?{run:async()=>workers()}:undefined};
  const handler=load('app/api/match/route.ts',{'cloudflare:workers':{env},'zod':zod,'/data':data,'/brand':brand,'/assessment':assessment,'/ai-providers':providers,'/ai-limits':limits});
  const post=body=>handler.POST(new Request('https://novara.test/api/match',{method:'POST',headers:{origin:'https://novara.test','content-type':'application/json'},body:JSON.stringify(body)}));
  return {handler,post,calls};
}
const profile={...data.sample,consent:true};

test('the assessment runs on Gemini, without the student’s name, school or email',async()=>{
  const r=route({gemini:()=>json({candidates:[{content:{parts:[{text:JSON.stringify(report)}]}}]})});
  assert.equal((await (await r.handler.GET()).json()).available,true);
  const res=await r.post({profile,aiConsent:true});
  const body=await res.json();
  assert.equal(res.status,200);
  assert.equal(body.model,'Gemini (Google) · gemini-flash-latest');
  assert.deepEqual(body.recommendations.map(x=>x.id),['mit','stanford','kaist']);
  assert.equal(body.sources.length,3);
  const sent=r.calls[0].contents[0].parts[0].text;
  assert.doesNotMatch(sent,/Alex Morgan|International School/);
  assert.match(r.calls[0].systemInstruction.parts[0].text,/cannot browse the web/);
  assert.equal((await r.post({profile,aiConsent:false})).status,400);
});

test('if Gemini answers badly, Cloudflare’s Llama is used; if all fail, the student is told to retry',async()=>{
  const r=route({gemini:()=>json({candidates:[{content:{parts:[{text:'sorry'}]}}]}),workers:()=>({response:JSON.stringify(report)})});
  const body=await (await r.post({profile,aiConsent:true})).json();
  assert.match(body.model,/^Llama \(Cloudflare\)/);
  const none=route({gemini:()=>json({error:{message:'busy'}},503)});
  const res=await none.post({profile,aiConsent:true});
  assert.equal(res.status,502);
  assert.match((await res.json()).error,/try again/);
});
