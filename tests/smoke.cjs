// Dependency-free checks for translation coverage, start gating and clock safety.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
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
for (const file of ['locales.js','leaderboard-locales.js','i18n.js','game.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const run = code => vm.runInContext(code,context);
context.assert = assert;
// Inspect all player-facing message paths, including both sides of random branches.
run(`
const verifyMessage = value => {
  if (typeof value === 'number' || value == null || value.date || value === '' || /^[+-]?[0-9]+$/.test(value) || /^━+$/.test(value)) return;
  const key = typeof value === 'string' ? value : value.key;
  for (const locale of Object.keys(TRANSLATIONS)) {
    assert.ok(Object.hasOwn(TRANSLATIONS[locale], key), locale + ' missing: ' + key);
    assert.deepEqual([...TRANSLATIONS[locale][key].matchAll(/\\{\\d+\\}/g)].map(m=>m[0]).sort(), [...key.matchAll(/\\{\\d+\\}/g)].map(m=>m[0]).sort());
  }
  if (value.values) value.values.forEach(verifyMessage);
};
for (const locale of Object.keys(TRANSLATIONS)) assert.deepEqual(Object.keys(TRANSLATIONS[locale]).sort(), Object.keys(TRANSLATIONS.es).sort());
[...SCANDALS,...OPENERS].forEach(verifyMessage);
for (const actions of Object.values(ACTIONS)) for (const action of actions) {
  verifyMessage(action.name); verifyMessage(action.desc); if(action.lockedMsg) verifyMessage(action.lockedMsg);
  for (const sample of [0,0.99]) {
    Math.random=()=>sample; S.evidence=90; S.support=50; S.capital=80;
    verifyMessage(action.run().text);
  }
}
for (const phase of ['investigation','house','senate']) { S.phase=phase; for (const event of EVENTS) verifyMessage(event.run().text); }
`);
for (const match of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) {
  context.key = match[1].replace(/&amp;/g,'&'); run('verifyMessage(key)');
}
run(`S.mode=null;S.over=false;S.turn=1;S.daysLeft=10;
selectMode('hard'); consumeActiveCalendarTime(60000);
assert.equal(S.mode,null); assert.equal(S.daysLeft,10); assert.equal(CALENDAR_CLOCK.interval,null);
selectMode('harder'); assert.equal(selectedMode,'harder');
beginSession(); beginSession(); assert.equal(S.mode,null);
`);
assert.equal(callbacks.filter(x=>x.ms===740).length,1,'one gavel animation / one start');
callbacks.find(x=>x.ms===740).fn();
run(`assert.equal(S.mode,'harder');assert.equal(S.daysLeft,10);assert.equal(CALENDAR_CLOCK.interval,99);
assert.equal(document.getElementById('startScreen').classList.contains('show'),false);
S.log.forEach(e=>verifyMessage(e.text));
consumeActiveCalendarTime(11999);assert.equal(S.daysLeft,10);
consumeActiveCalendarTime(1);assert.equal(S.daysLeft,9);
CALENDAR_CLOCK.manuallyPaused=true;consumeActiveCalendarTime(120000);assert.equal(S.daysLeft,9);
CALENDAR_CLOCK.elapsedMs=3456;
for(const code of Object.keys(LANGUAGES)) {
 const before=JSON.stringify(S);applyLanguage(code);assert.equal(JSON.stringify(S),before);assert.equal(CALENDAR_CLOCK.elapsedMs,3456);
 assert.equal(document.documentElement.dir,LANGUAGES[code].dir);
 S.log.forEach(e=>verifyMessage(e.text));
}
CALENDAR_CLOCK.manuallyPaused=false;document.hidden=true;consumeActiveCalendarTime(120000);assert.equal(S.daysLeft,9);document.hidden=false;
for (const phase of ['investigation','house','senate']) { S.phase=phase;S.turn=S.maxTurns;S.over=false;endTurn('clock');verifyMessage(lastVerdict.headline);verifyMessage(lastVerdict.body); }
S.phase='senate';S.senate=67;S.over=false;checkPhase();verifyMessage(lastVerdict.headline);verifyMessage(lastVerdict.body);
S.phase='investigation';S.senate=0;S.turn=1;S.over=false;S.support=0;Math.random=()=>0.99;endTurn('clock');verifyMessage(lastVerdict.body);
`);
// Expanded pools stay exactly double in Harder in every phase.
run(`
assert.equal(Object.values(ACTIONS).flat().length,168);
const allIds=Object.values(ACTIONS).flat().map(a=>a.id);assert.equal(new Set(allIds).size,168);
for (const phase of Object.keys(ACTIONS)) {
 S.phase=phase;S.mode='hard';assert.equal(availableActions().length,28);
 S.mode='harder';assert.equal(availableActions().length,56);
 for (const action of ACTIONS[phase]) {
  assert.ok(action.cost>0 && action.days>0 && action.days<=10);
  S.support=50;S.mode='hard';const hardOdds=moveChance(action);S.mode='harder';assert.equal(moveChance(action),hardOdds-8);
  for (const roll of [0,0.999999]) {
   S.evidence=50;S.house=100;S.senate=30;S.support=50;Math.random=()=>roll;
   assert.equal(action.run().succeeded,roll===0);
   assert.ok(S.support>=0 && S.support<=100);
  }
 }
}
// All adverse event types halve the pre-event balance exactly once, including odd/zero balances.
const badEvents=EVENTS.filter(e=>e.tone==='bad');
for (let i=0;i<badEvents.length;i++) for(const capital of [0,1,49,84,85,120]) {
 S.capital=capital;Math.random=()=>(i+0.1)/badEvents.length;rollEvent('bad');assert.equal(S.capital,Math.floor(capital/2));
 S.log.slice(-2).forEach(e=>verifyMessage(e.text));
}
// A failed move still spends its listed time and political capital.
S.mode='hard';S.phase='investigation';S.over=false;S.turn=1;S.maxTurns=24;S.daysLeft=10;S.capital=50;S.evidence=30;S.support=50;
document.getElementById('overlay').classList.remove('show');CALENDAR_CLOCK.manuallyPaused=false;CALENDAR_CLOCK.lastNow=null;
Math.random=()=>0.999999;const failedMove=ACTIONS.investigation[0];doAction(failedMove);
assert.equal(S.capital,50-failedMove.cost);assert.equal(S.daysLeft,10-failedMove.days);assert.ok(S.evidence<30);
// Active polling can move support in either direction, never outside 0–100.
S.support=50;Math.random=()=>0;shiftPublicOpinion('day');assert.equal(S.support,49);
Math.random=()=>0.99;shiftPublicOpinion('day');assert.equal(S.support,50);
S.support=0;Math.random=()=>0;shiftPublicOpinion('day');assert.equal(S.support,0);
S.support=100;Math.random=()=>0.99;shiftPublicOpinion('day');assert.equal(S.support,100);
// A full no-spend month recovers capital, then any blowback halves the recovered amount.
S.support=50;S.evidence=20;S.capital=4;S.turn=1;S.over=false;S.daysLeft=1;
const rolls=[0,0.99,0,0.2,0];Math.random=()=>rolls.shift() ?? 0.99;endTurn('clock');assert.equal(S.capital,12);assert.equal(S.turn,2);
`);
// Availability changes remove unplayable cards and update navigation.
run(`
// Ready moves always lead, while both groups retain the source order.
S.over=false;S.mode='harder';S.phase='investigation';S.evidence=0;S.capital=25;S.daysLeft=3;
CALENDAR_CLOCK.manuallyPaused=false;applyLanguage('en');
const assertMoveOrder = () => {
 const source=availableActions();
 const expected=source.filter(isMoveReady);
 assert.deepEqual(orderedActions().map(a=>a.id),expected.map(a=>a.id));
 assert.deepEqual(Array.from(moveTrack.children,c=>c.dataset.moveId),expected.map(a=>a.id));
 assert.deepEqual(Array.from(moveDots.children,d=>d.dataset.moveId),expected.map(a=>a.id));
 const firstBlocked=expected.findIndex(a=>!isMoveReady(a));
 if(firstBlocked>=0) assert.ok(expected.slice(firstBlocked).every(a=>!isMoveReady(a)));
};
renderMoves();assertMoveOrder();
const originalCards=new Map(deckCards);
const focusedMove=orderedActions().find(isMoveReady);originalCards.get(focusedMove.id).focus();
S.capital=120;S.daysLeft=10;renderMoves();assertMoveOrder();
assert.ok(document.activeElement===originalCards.get(focusedMove.id) || document.activeElement===moveTrack);
assert.ok(Array.from(moveTrack.children).every(c=>originalCards.get(c.dataset.moveId)===c),'reuse card nodes');
S.capital=focusedMove.cost;S.daysLeft=focusedMove.days;renderMoves();assert.ok(isMoveReady(focusedMove));assertMoveOrder();
S.capital=0;renderMoves();assertMoveOrder();assert.equal(document.activeElement,moveTrack);
assert.equal(moveTrack.children.length,0);assert.equal(moveDots.children.length,0);assert.equal(document.getElementById('deckEmpty').hidden,false);
S.capital=25;S.daysLeft=3;renderMoves();assertMoveOrder();
const beforePause=orderedActions().map(a=>a.id);CALENDAR_CLOCK.manuallyPaused=true;renderMoves();
assert.deepEqual(orderedActions().map(a=>a.id),beforePause);assert.ok(Array.from(moveTrack.children).every(c=>c.disabled));
CALENDAR_CLOCK.manuallyPaused=false;renderMoves();
// Each dot keeps its current card and number after repeated partitions.
for(let i=0;i<moveDots.children.length;i++) {
 const dot=moveDots.children[i];dot.onclick();assert.equal(Number(moveTrack.dataset.selectedIndex),i);
 assert.equal(dot.getAttribute('aria-label'),t(msg\`Show move \${i+1}: \${orderedActions()[i].name}\`));
}
// The evidence-gated move also returns to its original group when unlocked.
S.phase='senate';S.capital=120;S.daysLeft=10;S.evidence=0;renderMoves();assertMoveOrder();
const gated=availableActions().find(a=>a.requires);assert.ok(gated);assert.equal(isMoveReady(gated),false);
S.evidence=85;renderMoves();assert.equal(isMoveReady(gated),true);assertMoveOrder();
applyLanguage('fa');renderMoves();assertMoveOrder();moveDots.children[5].onclick();assert.ok(moveTrack.scrollLeft<=0);
S.mode='hard';renderMoves();assert.equal(moveTrack.children.length,28);assertMoveOrder();
S.mode='easy';S.phase='investigation';S.capital=120;S.daysLeft=10;S.evidence=12;S.support=55;
renderMoves();assert.equal(moveTrack.children.length,28);assertMoveOrder();
assert.equal(MODES.easy.blowbackChance,0.35);assert.equal(MODES.easy.startCapital,70);
const oddsEasy=moveChance(ACTIONS.investigation[0]);S.mode='hard';assert.equal(oddsEasy,Math.min(94,moveChance(ACTIONS.investigation[0])+10));S.mode='easy';
scrollToMove(4);assert.equal(moveTrack.dataset.selectedIndex,'4');
doAction(orderedActions()[4]);assert.equal(moveTrack.dataset.selectedIndex,'0');assert.equal(moveTrack.scrollLeft,0);
assert.ok(Array.from(moveTrack.children).every(card=>isMoveReady(availableActions().find(a=>a.id===card.dataset.moveId))));
verifyMessage(msg\`Deck: \${1} / \${28} cards available\`);

`);
// Centered navigation must reach the first and last card in both directions.
run(`
applyLanguage('en');S.capital=120;S.daysLeft=10;renderMoves();
moveTrack.clientWidth=600;
Array.from(moveTrack.children).forEach((card,index)=>{card.offsetWidth=300;card.offsetLeft=150+index*238;});
moveTrack.scrollWidth=600+(moveTrack.children.length-1)*238;
assert.equal(moveDestination(moveTrack.children[0]),0);
assert.equal(moveDestination(moveTrack.children.at(-1)),moveTrack.scrollWidth-600);
moveTrack.scrollLeft=4*238;settleCarousel();updateCarouselControls();
assert.equal(nearestMoveIndex(),4);assert.equal(moveTrack.dataset.selectedIndex,'4');
assert.equal(moveDots.children.filter(dot=>!dot.hidden).length,7);
assert.equal(moveTrack.children.filter(card=>card.tabIndex===0).length,1);
const beforeBrowse=JSON.stringify(S);moveTrack.children[5].onclick();
assert.equal(JSON.stringify(S),beforeBrowse,'side-card click only centers the card');
assert.equal(carouselTarget.index,5);
document.documentElement.dir='rtl';
Array.from(moveTrack.children).forEach((card,index)=>{card.offsetLeft=150-index*238;});
moveTrack.scrollLeft=-4*238;settleCarousel();updateCarouselControls();
assert.equal(nearestMoveIndex(),4);scrollMoves(1);assert.equal(moveTrack.scrollLeft,-5*238);
assert.ok(moveTrack.children[0].querySelector('.card-face').style.transform.includes('rotateY'));
document.documentElement.dir='ltr';movePhaseKey='';renderMoves();
`);
// Exercise exit animation cleanup and reduced-motion behavior without wall-clock waits.
const animations=[];context.animations=animations;
Element.prototype.getBoundingClientRect=function(){return {left:this.offsetLeft,right:this.offsetLeft+this.offsetWidth,top:0,width:this.offsetWidth,height:214};};
Element.prototype.getAnimations=function(){return [];};
Element.prototype.cloneNode=function(){const clone=new Element();clone.innerHTML=this.innerHTML;return clone;};
Element.prototype.remove=function(){get('deckExits').children=get('deckExits').children.filter(el=>el!==this);};
Element.prototype.animate=function(frames,options){const animation={frames,options,onfinish:null,oncancel:null,cancel(){this.oncancel?.();}};animations.push(animation);return animation;};
run(`
S.mode='easy';S.phase='investigation';S.over=false;S.capital=120;S.daysLeft=10;CALENDAR_CLOCK.manuallyPaused=false;
renderMoves();animations.length=0;S.capital=0;renderMoves();
assert.equal(moveTrack.children.length,0);assert.ok(document.getElementById('deckExits').children.length>0);
assert.ok(animations.some(a=>a.options.duration===220));
animations.forEach(a=>a.onfinish?.());assert.equal(document.getElementById('deckExits').children.length,0);
S.capital=120;renderMoves();assert.ok(animations.some(a=>a.options.duration===320));
`);
run(`
applyLanguage('en');animations.length=0;
S.log=[{text:'Move failed',kind:'bad'},{text:msg\`PUBLIC OPINION — Support \${40}% → \${42}%.\`,kind:'good'}];
renderFeed();
assert.equal(document.getElementById('previousDispatch').textContent,'Move failed');
assert.equal(document.getElementById('dispatchPeek').dataset.tone,'bad','polling gains do not hide the failed move');
assert.equal(document.getElementById('dispatchSignal').textContent,'!');
assert.equal(animations.length,2,'new result animates the panel and text');
renderFeed();assert.equal(animations.length,2,'ordinary renders do not replay the result');
applyLanguage('fr');assert.equal(animations.length,2,'translation does not replay the result');
`);
reduced=true;run(`animations.length=0;S.capital=0;renderMoves();assert.equal(animations.length,0);assert.equal(document.getElementById('deckExits').children.length,0);`);
run(`log('A new result','good');renderFeed();assert.equal(animations.length,0,'reduced motion skips dispatch effects');`);
run(`S.mode=null;selectedMode='hard';startingSession=false;`);reduced=true;run('beginSession()');
assert.equal(callbacks.at(-1).ms,0);
console.log('PASS: Easy mode; available-only Deck, reset on play, exit cleanup, reduced motion, focus, dots, RTL; 28/56 moves per phase, stochastic outcomes, exact blowback halving, live support polling; 7 complete catalogs, all action/event/outcome messages, one-shot start, 12-second clock, paused/hidden time, and state-preserving language changes.');
