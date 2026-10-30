import assert from 'node:assert/strict';
import {validateResult,COUNTRIES} from '../server/lib/leaderboard-core.mjs';
const base={name:'Test '+crypto.randomUUID().slice(0,8),country:'PR',mode:'hard',won:false,evidence:30,house:0,senate:0,support:50,capital:20,daysRemaining:100,runId:crypto.randomUUID()};
assert.equal(COUNTRIES.size,249);
assert.equal(validateResult({...base,score:9999999}).score,820);
for(const change of [{name:'<script>'},{name:'x'},{country:'XX'},{support:101},{capital:-1},{evidence:1.5},{won:true},{senate:67},{mode:'unknown'},{runId:'bad'}]) assert.throws(()=>validateResult({...base,...change}));
for(const name of ['José','日本語','한국어','ישראל','پارسا']) assert.equal(validateResult({...base,name}).name,name);
assert.ok(validateResult({...base,won:true,house:218,senate:67}).score>10000);
assert.equal(validateResult({...base,mode:'easy',daysRemaining:240}).score,820);
assert.throws(()=>validateResult({...base,mode:'easy',daysRemaining:241}));
const origin=process.env.TEST_ORIGIN;
if(origin){
 const get=async(query='')=>(await fetch(origin+'/api/leaderboard?mode=hard'+query)).json();
 const post=async(body,cookie='',originHeader=origin)=>{
  const response=await fetch(origin+'/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json',Origin:originHeader,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={error:text};}
  return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie};
 };
 const one=await post(base);assert.equal(one.status,201);assert.equal(one.data.score,820);assert.ok(one.cookie);
 const duplicate=await post(base,one.cookie);assert.equal(duplicate.status,200);assert.equal(duplicate.data.score,820);
 const better=await post({...base,runId:crypto.randomUUID(),support:60},one.cookie);assert.equal(better.status,201);
 const two=await post({...base,runId:crypto.randomUUID(),name:'Other Player',country:'JP',support:55});assert.equal(two.status,201);
 const easy=await post({...base,runId:crypto.randomUUID(),mode:'easy'},one.cookie);assert.equal(easy.status,201);
 const easyBoard=await (await fetch(origin+'/api/leaderboard?mode=easy')).json();assert.ok(easyBoard.entries.some(e=>e.name===base.name));
 const harder=await post({...base,runId:crypto.randomUUID(),mode:'harder'},one.cookie);assert.equal(harder.status,201);
 assert.equal((await post({...base,runId:crypto.randomUUID(),name:'<img>'},one.cookie)).status,400);
 assert.equal((await post({...base,runId:crypto.randomUUID()},one.cookie,'https://wrong.example')).status,403);
 const country=await get('&country=PR');assert.ok(country.entries.every(e=>e.country==='PR'));assert.ok(country.entries.some(e=>e.score===920));
 const all=await get();assert.ok(all.entries.every((e,i)=>!i||all.entries[i-1].score>=e.score));
 assert.ok(all.entries.every(e=>!('player_id' in e)&&!('run_id' in e)));
 assert.equal(all.entries.filter(e=>e.name===base.name&&e.country==='PR').length,1,'one best result per browser');
 const jp=await get('&country=JP');assert.ok(jp.entries.every(e=>e.country==='JP'));
 const invalid=await fetch(origin+'/api/leaderboard?country=XX');assert.equal(invalid.status,400);
 console.log('PASS: shared D1 submissions, duplicate retry, best score, country/mode filters, ordering, private ID exclusion, origin and input validation.');
}
console.log('PASS: 249 countries, multilingual names, score calculation and validation.');
