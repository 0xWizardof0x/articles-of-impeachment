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
for (const file of ['locales.js','i18n.js','game.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const run = code => vm.runInContext(code,context);
context.assert = assert;
// Inspect all player-facing message paths, including both sides of random branches.
run(`
const verifyMessage = value => {
  if (typeof value === 'number' || value == null || value.date || value === '' || /^━+$/.test(value)) return;
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
// A reduced-motion start has no animation delay.
run(`S.mode=null;selectedMode='hard';startingSession=false;`);reduced=true;run('beginSession()');
assert.equal(callbacks.at(-1).ms,0);
console.log('PASS: 7 complete catalogs, all action/event/outcome messages, one-shot start, 12-second clock, paused/hidden time, and state-preserving language changes.');
