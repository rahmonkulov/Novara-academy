import {env} from 'cloudflare:workers';
type Config={RESEND_API_KEY?:string;EMAIL_FROM?:string;EMAIL_DB?:D1Database};
const config=()=>env as unknown as Config;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const ready=(c:Config)=>Boolean(c.RESEND_API_KEY&&c.EMAIL_FROM&&c.EMAIL_DB);
export async function GET(){return json({available:ready(config())})}
async function digest(value:string,secret:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('')}
async function limit(db:D1Database,key:string,max:number,expires:number){const row=await db.prepare('INSERT INTO email_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,expires).first<{count:number}>();return Boolean(row&&row.count<=max)}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Request origin is not allowed.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'Expected JSON.'},415);
 const c=config();if(!ready(c))return json({error:'Email verification is unavailable. You can generate your assessment without email.'},503);
 const raw=await req.text();if(raw.length>1500)return json({error:'Request too large.'},413);
 let data;try{data=JSON.parse(raw)}catch{return json({error:'Invalid request.'},400)}
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 if(email.length>250||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:'Enter a valid email address.'},400);
 const db=c.EMAIL_DB!,secret=c.RESEND_API_KEY!,now=Math.floor(Date.now()/1000);
 try{
 const emailHash=await digest('email:'+email,secret);
 if(data.action==='send'){
 const ip=req.headers.get('cf-connecting-ip')||'local';const ipHash=await digest('ip:'+ip,secret);
 const minute=Math.floor(now/60),hour=Math.floor(now/3600);
 if(!await limit(db,`minute:${emailHash}:${minute}`,1,now+120)||!await limit(db,`email:${emailHash}:${hour}`,5,now+7200)||!await limit(db,`ip:${ipHash}:${hour}`,20,now+7200))return json({error:'Too many code requests. Wait a minute; hourly limits may also apply.'},429);
 const bytes=crypto.getRandomValues(new Uint32Array(1));const code=String(bytes[0]%1000000).padStart(6,'0'),id=crypto.randomUUID();const codeHash=await digest(id+':'+code,secret);
 await db.prepare('INSERT INTO email_challenges (id,email_hash,code_hash,expires,attempts) VALUES (?,?,?,?,0) ON CONFLICT(email_hash) DO UPDATE SET id=excluded.id,code_hash=excluded.code_hash,expires=excluded.expires,attempts=0').bind(id,emailHash,codeHash,now+600).run();
 const result=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({from:c.EMAIL_FROM,to:[email],subject:'Your Novara Academy verification code',text:`Your Novara Academy code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email. Never share this code.`})});
 if(!result.ok){await db.prepare('DELETE FROM email_challenges WHERE id=?').bind(id).run();return json({error:'The email could not be sent. Please retry later or continue without email.'},502)}
 await db.batch([db.prepare('DELETE FROM email_challenges WHERE expires<?').bind(now),db.prepare('DELETE FROM email_limits WHERE expires<?').bind(now)]);
 return json({challengeId:id,message:'Code sent. Check your inbox and spam folder.'});
 }
 if(data.action==='verify'){
 if(typeof data.challengeId!=='string'||data.challengeId.length>50||typeof data.code!=='string'||!/^\d{6}$/.test(data.code))return json({error:'Enter the six-digit code from your email.'},400);
 // Atomic attempt counter and one-time deletion: concurrent guesses cannot bypass the limit.
 const row=await db.prepare('UPDATE email_challenges SET attempts=attempts+1 WHERE id=? AND email_hash=? AND expires>? AND attempts<5 RETURNING code_hash').bind(data.challengeId,emailHash,now).first<{code_hash:string}>();
 if(!row)return json({error:'This code expired or reached its attempt limit. Request a new code.'},400);
 const candidate=await digest(data.challengeId+':'+data.code,secret);
 if(candidate!==row.code_hash)return json({error:'Incorrect code. Please check your email.'},400);
 const used=await db.prepare('DELETE FROM email_challenges WHERE id=? AND code_hash=? RETURNING id').bind(data.challengeId,candidate).first();
 if(!used)return json({error:'This code has already been used. Request a new code.'},400);
 return json({verified:true,email});
 }
 return json({error:'Unknown action.'},400);
 }catch{return json({error:'Email verification is temporarily unavailable. Your assessment can continue without it.'},503)}
}
