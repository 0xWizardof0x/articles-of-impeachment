'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../oligarch-engine.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8').match(/const MOVE_DATA = ([\s\S]*?);\nconst PHASE_METRICS/)[1]);
const catalog=Object.fromEntries(Object.entries(data).map(([phase,moves])=>[phase,moves.filter(a=>!a.extended).map(a=>({...a,requiresEvidence:a.id==='bombshell'?85:0}))]));
const fresh=seed=>R.create({seed,catalog});
const propose=s=>R.dispatch(s,{actor:'prosecution',type:'propose',moveId:R.chooseMove(s)?.id??null,revision:s.revision});
const counter=(s,id)=>R.dispatch(s,{actor:'oligarch',type:'counter',counterId:id,revision:s.revision});
let s=fresh(1),before=JSON.stringify(s);
assert.throws(()=>R.dispatch(s,{actor:'oligarch',type:'counter',counterId:'reserve',revision:0}),/Wrong seat/);
s=propose(s);assert.equal(s.seat,'oligarch');assert.equal(s.case.capital,80,'revealing a committed move does not roll its outcome');
assert.equal(JSON.stringify(fresh(1)),before,'dispatch never mutates its input');
assert.throws(()=>R.dispatch(s,{actor:'oligarch',type:'counter',counterId:'reserve',revision:0}),/Stale/);
assert.throws(()=>counter(s,'unknown'),/Illegal/);
const action=R.preview(s).action,cost=action.cost,days=action.days;
assert.equal(R.preview(s,R.counters.find(c=>c.id==='deal')).chance,0);
s=counter(s,'deal');assert.equal(s.case.capital,80-cost);assert.equal(s.case.days,10-days);assert.ok(s.last.cancelled);assert.equal(s.last.delta,0);
assert.throws(()=>counter(s,'deal'),/Wrong seat/);
s=propose(s);assert.ok(!R.legalCounters(s).some(c=>c.id==='deal'),'cooldowns span exchanges');
const poor=JSON.parse(JSON.stringify(s));poor.influence=0;
assert.deepEqual(R.legalCounters(poor).map(c=>c.id),['reserve','low'],'a free legal response always exists');
assert.throws(()=>counter(poor,'objection'),/Illegal/);
// Exact monthly recovery and exposure changes, with no wall-clock dependency.
s=fresh(1);s.influence=20;s.exposure=30;s.inMonth=2;s=propose(s);s=counter(s,'low');
assert.equal(s.month,2);assert.equal(s.influence,48);assert.equal(s.exposure,12);assert.equal(s.case.days,10);
// Explicit terminal priorities and phase transitions.
s=fresh(1);s.exposure=90;s=propose(s);s=counter(s,'deal');assert.equal(s.reason,'exposed');
s=fresh(1);s.phase='senate';s.case.senate=66;s.catalog.senate=s.catalog.senate.map(a=>({...a,chance:100,gain:[5,5]}));
s=propose(s);s=counter(s,'reserve');assert.equal(s.reason,'conviction');assert.equal(s.winner,'prosecution');
assert.throws(()=>propose(s),/Wrong seat/);
s=fresh(1);s.phase='house';s.case.house=217;s.catalog.house=s.catalog.house.map(a=>({...a,chance:100,gain:[5,5]}));
s=counter(propose(s),'reserve');assert.equal(s.phase,'senate');assert.ok(s.case.senate>0);
s=fresh(1);s.month=24;s.inMonth=2;s=counter(propose(s),'reserve');assert.equal(s.reason,'term');
s=fresh(1);s.case.support=12;s=propose(s);s.catalog[s.phase].find(a=>a.id===s.pending).support=[0,0];
s=counter(s,'media');assert.equal(s.reason,'collapse');
const outcomes={reserve:{},defend:{}};
for(const policy of Object.keys(outcomes))for(let seed=1;seed<=100;seed++){
  s=fresh(seed);let ticks=0;
  while(!s.winner&&ticks++<400){
    if(s.seat==='prosecution')s=propose(s);
    else{
      const legal=R.legalCounters(s);
      const c=policy==='defend'?(s.exposure>55?legal.find(c=>c.id==='low'):(legal.find(c=>c.id==='objection')||legal.find(c=>c.id==='reserve'))):legal.find(c=>c.id==='reserve');
      s=counter(s,c.id);
    }
    for(const value of [s.influence,s.exposure,s.case.support,s.case.evidence,s.case.senate])assert.ok(value>=0&&value<=100);
    assert.ok(s.case.capital>=0&&s.case.capital<=120);assert.ok(s.case.days>=0&&s.case.days<=10);
    assert.equal(s.history.length,s.revision);
  }
  assert.ok(s.winner,'all games terminate');outcomes[policy][s.reason]=(outcomes[policy][s.reason]||0)+1;
  if(seed<=5){let replay=fresh(seed);for(const command of s.history)replay=R.dispatch(replay,command);assert.deepEqual(replay,s,'JSON command replay exactly reproduces the match');}
}
assert.equal(outcomes.reserve.conviction,100,'ignoring the opponent loses the baseline campaigns');
assert.ok(outcomes.defend.term>=20&&outcomes.defend.term<=80,'a simple defensive policy has both wins and losses');
console.log('PASS: two-seat/revision validation; immutable deterministic replay; legal counters, costs and cooldowns; monthly economy; terminal conditions; 200 complete games.',JSON.stringify(outcomes));
