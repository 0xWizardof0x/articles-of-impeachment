// Reproducible analysis of the shipped game. No network or leaderboard writes.
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'game.js'),'utf8');
const sourceSha256=crypto.createHash('sha256').update(source).digest('hex');
function simulate(mode,seed) {
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const callbacks = [], timers = new Map(), elements = new Map();
class Element {
  constructor() {
    this.children = []; this.dataset = {}; this.style = {}; this.attrs = {};
    this.textContent = ''; this.disabled = false; this.scrollLeft = 0;
    this.scrollWidth = 2000; this.clientWidth = 600; this.offsetWidth = 180; this.offsetLeft = 0;
    this.scrollHeight = 100; this.clientHeight = 100; this.scrollTop = 0;
    this.classes = new Set();
    this.classList = { add: k => this.classes.add(k), remove: k => this.classes.delete(k), contains: k => this.classes.has(k), toggle: (k,v) => v ? this.classes.add(k) : this.classes.delete(k) };
    this.sub = new Map();
  }
  addEventListener() {}
  setAttribute(k,v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  appendChild(el) { el.offsetLeft = this.children.length * 192; this.children.push(el); }
  insertBefore(el, reference) {
    const oldIndex = this.children.indexOf(el);
    if (oldIndex >= 0) this.children.splice(oldIndex, 1);
    const index = reference ? this.children.indexOf(reference) : this.children.length;
    this.children.splice(index, 0, el);
    this.children.forEach((child, i) => { child.offsetLeft = i * 192; });
  }
  replaceChildren(...els) { this.children = els; }
  querySelector(key) { if (!this.sub.has(key)) this.sub.set(key,new Element()); return this.sub.get(key); }
  querySelectorAll() { return []; }
  focus() { document.activeElement = this; }
  contains(el) { return this.children.includes(el); }
  insertAdjacentElement() {}
  scrollTo({left}) { this.scrollLeft=left; }
  getClientRects() { return []; }
}
const get = id => { if (!elements.has(id)) elements.set(id,new Element()); return elements.get(id); };
const docEvents = {};
const document = {
  hidden: false, documentElement: {dir:'ltr'}, activeElement: null,
  getElementById: get, createElement: () => new Element(),
  querySelector: get, querySelectorAll: () => [],
  addEventListener: (key,callback) => { (docEvents[key] ||= []).push(callback); },
  dispatchEvent: event => { for (const cb of docEvents[event.type] || []) cb(event); }
};
get('startScreen').classList.add('show');
let now = 0, reduced = false;
const context = vm.createContext({document,Intl,console,Event:class {constructor(type){this.type=type;}},
  localStorage: {getItem:()=>null,setItem(){}},
  performance:{now:()=>now}, window:{addEventListener(){},matchMedia:()=>({matches:reduced})},
  MutationObserver:class{observe(){}}, HTMLDialogElement:class{},
  requestAnimationFrame:()=>1, clearTimeout:id=>timers.delete(id),
  setTimeout:(fn,ms)=>{const id=callbacks.push({fn,ms});timers.set(id,fn);return id;},
  setInterval:()=>99,clearInterval(){}
});

for(const file of ['locales.js','leaderboard-locales.js','i18n.js','game.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
context.modeInput=mode;context.seedInput=seed;context.assert=assert;
context.advanceClock=ms=>{now+=ms;};
return vm.runInContext(`
render=()=>{};renderCalendarClock=()=>{};scheduleCarouselUpdate=()=>{};
let rng=seedInput>>>0;Math.random=()=>{rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296;};
const stats={mode:modeInput,seed:seedInput,moves:0,successes:0,failures:0,expectedSuccesses:0,decisions:0,adjourns:0,capitalBlocked:0,daysBlocked:0,mixedBlocked:0,strategicAdjourns:0,blowbacks:0,monthlyRolls:0,capitalLost:0,capitalAfterBlowback:[],zeroMoveMonths:0,maxBlowbackStreak:0,clockDays:0,moveDays:0,skippedDays:0,supportMin:100,supportMax:0,supportSamples:[],phaseDays:{investigation:0,house:0,senate:0},reached:{investigation:1},choices:{},supportDeltas:{move:0,opinion:0,events:0,decay:0}};
let movesThisMonth=0,blowbackStreak=0;
const watch=()=>{stats.supportMin=Math.min(stats.supportMin,S.support);stats.supportMax=Math.max(stats.supportMax,S.support);};
const originalCheck=checkPhase;checkPhase=function(){originalCheck();if(!stats.reached[S.phase])stats.reached[S.phase]=S.turn;};
const originalOpinion=shiftPublicOpinion;shiftPublicOpinion=function(source,previousSupport){const before=S.support;originalOpinion(source,previousSupport);stats.supportDeltas.opinion+=S.support-before;if(source==='day'){stats.clockDays++;stats.phaseDays[S.phase]++;}watch();};
const originalResolve=resolveMove;resolveMove=function(action,phase){
 stats.moves++;movesThisMonth++;stats.moveDays+=action.days;stats.phaseDays[phase]+=action.days;
 const key=phase+':'+action.id;stats.choices[key]=(stats.choices[key]||0)+1;
 stats.expectedSuccesses+=moveChance(action)/100;
 const supportBefore=S.support;const result=originalResolve(action,phase);
 stats[result.succeeded?'successes':'failures']++;stats.supportDeltas.move+=S.support-supportBefore;watch();return result;
};
const originalEvent=rollEvent;rollEvent=function(tone){const before=S.capital,support=S.support;originalEvent(tone);stats.supportDeltas.events+=S.support-support;
 if(tone==='bad'){assert.equal(S.capital,Math.floor(before/2));stats.blowbacks++;stats.capitalLost+=before-S.capital;stats.capitalAfterBlowback.push(S.capital);}watch();};
const originalEvents=resolveTurnEvents;resolveTurnEvents=function(){const before=stats.blowbacks;originalEvents();stats.monthlyRolls++;blowbackStreak=stats.blowbacks>before?blowbackStreak+1:0;stats.maxBlowbackStreak=Math.max(stats.maxBlowbackStreak,blowbackStreak);};
const originalEnd=endTurn;endTurn=function(source='manual'){
 if(S.over)return;
 if(source==='manual'){stats.skippedDays+=S.daysLeft;stats.phaseDays[S.phase]+=S.daysLeft;}
 if(S.turn<S.maxTurns)stats.supportDeltas.decay-=Math.min(S.support,decayNow());
 if(movesThisMonth===0)stats.zeroMoveMonths++;movesThisMonth=0;
 originalEnd(source);watch();
};
startGame(modeInput);watch();
const mean=range=>(range[0]+range[1])/2;
while(!S.over && stats.decisions<10000){
 stats.decisions++;advanceClock(6000);syncCalendarClock();if(S.over)break;
 watch();stats.supportSamples.push(S.support);
 const actions=availableActions(),ready=actions.filter(isMoveReady);
 const metric=PHASE_METRICS[S.phase],target={investigation:75,house:218,senate:67}[S.phase];
 const supportWeight=S.support<35?5:S.support<50?2:0.35;
 const progressWeight={investigation:1,house:0.5,senate:1.6}[S.phase];
 const candidates=ready.map(action=>{
  const p=moveChance(action)/100;
  const gain=Math.min(mean(action.gain),Math.max(0,target-S[metric]));
  const loss=Math.min(mean(action.loss),S[metric]);
  const expectedProgress=p*gain-(1-p)*loss;
  const expectedSupport=p*mean(action.support)-(1-p)*mean(action.supportLoss);
  return {action,utility:(expectedProgress*progressWeight+expectedSupport*supportWeight)/(action.cost*0.7+action.days*1.3)};
 }).sort((a,b)=>b.utility-a.utility);
 if(!candidates.length || candidates[0].utility<=0){
  stats.adjourns++;
  if(ready.length)stats.strategicAdjourns++;
  else if(!actions.some(a=>(!a.requires||a.requires())&&S.capital>=a.cost))stats.capitalBlocked++;
  else if(!actions.some(a=>(!a.requires||a.requires())&&S.daysLeft>=a.days))stats.daysBlocked++;
  else stats.mixedBlocked++;
  endTurn();
 } else doAction(candidates[0].action);
}
assert.ok(S.over,'campaign must finish');assert.equal(stats.moves,stats.successes+stats.failures);
const elapsedDays=(S.turn-1)*S.daysMax+(S.daysMax-S.daysLeft);
assert.equal(stats.clockDays+stats.moveDays+stats.skippedDays,elapsedDays,'calendar accounting');
const final={won:lastVerdict.won,reason:lastVerdict.headline,phase:S.phase,month:S.turn,elapsedDays,evidence:S.evidence,house:S.house,senate:S.senate,support:S.support,capital:S.capital,daysRemaining:Math.max(0,(S.maxTurns-S.turn)*S.daysMax+S.daysLeft)};
const avg=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
stats.supportMean=avg(stats.supportSamples);delete stats.supportSamples;
stats.meanCapitalAfterBlowback=avg(stats.capitalAfterBlowback);delete stats.capitalAfterBlowback;
({...stats,...final});
`,context);
}
(async()=>{
 const results=[];
 // Same 50 initial seeds for each mode; differing actions still consume different random streams.
 for(const mode of ['hard','harder'])for(let i=1;i<=50;i++)results.push(simulate(mode,20261029+i*101));
 const {validateResult}=await import('../server/lib/leaderboard-core.mjs');
 for(const row of results)row.score=validateResult({...row,name:'Simulation',country:'US',runId:'00000000-0000-4000-8000-000000000000'}).score;
 const output={sourceSha256,sourceCommit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),games:100,perMode:50,decisionSeconds:6,seedFormula:'20261029 + gameIndex * 101 (1..50), reused by mode',policy:'Expected phase progress and support per weighted capital/day cost; support weights 5 below 35%, 2 below 50%, 0.35 otherwise; progress weights investigation 1, House 0.5, Senate 1.6; divisor 0.7*capital + 1.3*days. Adjourn if no legal positive-utility move. No future-outcome knowledge.',results};
 const dir=path.join(__dirname,'simulation-100');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(output,null,2)+'\n');
 const columns=['mode','seed','won','reason','phase','month','elapsedDays','moves','successes','failures','adjourns','capitalBlocked','daysBlocked','mixedBlocked','strategicAdjourns','zeroMoveMonths','blowbacks','monthlyRolls','maxBlowbackStreak','capitalLost','meanCapitalAfterBlowback','supportMin','supportMax','supportMean','support','capital','evidence','house','senate','score','clockDays','moveDays','skippedDays'];
 fs.writeFileSync(path.join(dir,'games.csv'),columns.join(',')+'\n'+results.map(r=>columns.map(k=>JSON.stringify(r[k])).join(',')).join('\n')+'\n');
 console.log(JSON.stringify({games:results.length,sourceSha256,counts:results.reduce((a,r)=>{const k=r.mode+' '+r.reason;a[k]=(a[k]||0)+1;return a;},{})},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
