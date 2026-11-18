// Saving on this device, retries and the server cache: what a returning student and a flaky data service see.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function load(file,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,URLSearchParams,Request,Response,AbortSignal,AbortController,DOMException,setTimeout,clearTimeout,...globals});return exports}
const plain=value=>JSON.parse(JSON.stringify(value));
const memory=(initial={})=>{const data=new Map(Object.entries(initial));return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)}};
const store=load('app/profile-store.ts');

test('scores typed in an explorer go into the questionnaire profile',()=>{
  const local=memory();
  assert.equal(store.writeScores(local,{sat:'',ielts:''}),false);
  assert.equal(local.getItem(store.PROFILE_KEY),null);
  assert.equal(store.writeScores(local,{sat:'1450',ielts:''}),true);
  const saved=JSON.parse(local.getItem(store.PROFILE_KEY));
  assert.equal(saved.profile.sat,'1450');
  assert.equal(saved.profile.answers.length,6);
  assert.equal(saved.profile.activities.length,5);
  assert.equal(saved.step,0);
  assert.equal(store.writeScores(local,{sat:'1450',ielts:''}),false);
});

test('an existing profile keeps everything else, including N/A answers and the AI report',()=>{
  const profile={name:'Aziz Karimov',gpa:'3.9',scale:'4',sat:'N/A',ielts:'6.5',answers:[0,1,2,3,0,1],activities:['Robotics club','','N/A','',''],essay:'My story'};
  const local=memory({[store.PROFILE_KEY]:JSON.stringify({profile,step:9,done:['tests'],aiReport:{summary:'kept'}})});
  assert.equal(store.writeScores(local,{sat:'',ielts:'7.0'}),true);
  const saved=JSON.parse(local.getItem(store.PROFILE_KEY));
  assert.equal(saved.profile.sat,'N/A');
  assert.equal(saved.profile.ielts,'7.0');
  assert.equal(saved.profile.essay,'My story');
  assert.equal(saved.step,9);
  assert.deepEqual(saved.done,['tests']);
  assert.deepEqual(saved.aiReport,{summary:'kept'});
  const summary=store.summarizeProfile(store.readStoredProfile(local));
  assert.deepEqual(plain(summary),{name:'Aziz Karimov',firstName:'Aziz',gpa:'3.9',scale:'4',sat:'',ielts:'7.0',activities:1,hasReport:true});
  assert.deepEqual(plain(store.profileParts(summary)),['GPA 3.9/4','IELTS 7.0','1 activity','AI report']);
});

test('an empty or broken profile shows no welcome back',()=>{
  assert.equal(store.summarizeProfile(null),null);
  assert.equal(store.summarizeProfile({profile:{answers:[-1],activities:['','N/A']}}),null);
  assert.equal(store.readStoredProfile(memory({[store.PROFILE_KEY]:'{not json'})),null);
  assert.equal(store.readStoredProfile(memory({[store.PROFILE_KEY]:'[1,2]'})),null);
  assert.equal(store.usableScore(' n/a '),'');
  assert.equal(store.usableScore(1450),'');
});

test('saved lists are cleaned, and scores from the older format are picked up',()=>{
  const local=memory({[store.LISTS_KEY]:JSON.stringify({sat:'1500',ielts:'n/a',colleges:[166027,166027,-3,1.5,'x'],universities:['I200769079','I1','bad','I200769079']})});
  assert.deepEqual(plain(store.readLists(local)),{colleges:[166027],universities:['I200769079'],legacy:{sat:'1500',ielts:''}});
  store.writeLists(local,{colleges:[166027],universities:[]});
  assert.deepEqual(JSON.parse(local.getItem(store.LISTS_KEY)),{colleges:[166027],universities:[]});
  store.writeLists(local,{colleges:[],universities:[]});
  assert.equal(local.getItem(store.LISTS_KEY),null);
});

test('IELTS must be a real band',()=>{
  for(const [text,value] of [['7',7],['6.5',6.5],['9.0',9],['7.25',null],['10',null],['0.5',null],['',null],['abc',null]])assert.equal(store.parseIelts(text),value,text);
});

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});

test('pages retry once when the data service hiccups, but not for a real error',async()=>{
  const {loadJson}=load('app/load-json.ts',{setTimeout:fn=>setTimeout(fn,0)});
  let calls=0;
  const flaky=async()=>(++calls===1?json({error:'busy'},502):json({total:3}));
  assert.deepEqual(plain(await loadJson('/api/x',new AbortController().signal,'fallback',flaky)),{total:3});
  assert.equal(calls,2);
  calls=0;
  const missing=async()=>{calls++;return json({error:'We could not find that college.'},404)};
  await assert.rejects(loadJson('/api/x',new AbortController().signal,'fallback',missing),/could not find/);
  assert.equal(calls,1);
  calls=0;
  const down=async()=>{calls++;throw new TypeError('Failed to fetch')};
  await assert.rejects(loadJson('/api/x',new AbortController().signal,'College data is temporarily unavailable.',down),/temporarily unavailable/);
  assert.equal(calls,2);
});

test('the server retries the data service once, then serves an older copy instead of an error',async()=>{
  const answers=[];let calls=0;
  const fetcher=async()=>{calls++;const next=answers.shift();if(next instanceof Error)throw next;return next};
  const edge=new Map();
  const caches={default:{match:async request=>{const hit=edge.get(request.url);return hit?new Response(hit):undefined},put:async(request,response)=>{edge.set(request.url,await response.text())}}};
  const cache=load('app/server-cache.ts',{fetch:fetcher,caches,setTimeout:fn=>setTimeout(fn,0)});
  answers.push(json({},503),json({ok:1}));
  assert.deepEqual(plain(await cache.fetchJson('https://data.test/a')),{ok:1});
  assert.equal(calls,2);
  calls=0;answers.push(json({},404));
  await assert.rejects(cache.fetchJson('https://data.test/b'),error=>error.status===404);
  assert.equal(calls,1);
  // A copy kept from an earlier success is served when the service is down.
  assert.equal(await cache.cached('k1',async()=>'{"fresh":true}'),'{"fresh":true}');
  const fresh=[...edge.keys()].find(key=>!key.includes('/stale/'));
  edge.delete(fresh);
  const second=load('app/server-cache.ts',{fetch:fetcher,caches,setTimeout:fn=>setTimeout(fn,0)});
  assert.equal(await second.cached('k1',async()=>{throw new second.UpstreamError(503)}),'{"fresh":true}');
  await assert.rejects(second.cached('k2',async()=>{throw new second.UpstreamError(503)}),error=>error.status===503);
  const failure=second.upstreamFailure(new second.UpstreamError(429),'Not found');
  assert.equal(failure.status,503);
  assert.equal(second.upstreamFailure(new Error('timeout'),'Not found').status,502);
});
