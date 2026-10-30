const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../sound.js'), 'utf8');
const noteOf = n => 69+12*Math.log2(n.frequency.changes[0].value/440);
const chiefClasses = new Set([1,2,4,6,9,11]); // C#, D, E, F#, A, B.
function assertChiefNotes(nodes) {
  for (const voice of nodes.filter(n=>n.wave?.pulse||n.type==='triangle')) {
    const note=noteOf(voice);
    assert.ok(Math.abs(note-Math.round(note))<1e-8,'musical voices use exact equal-tempered notes');
    assert.ok(chiefClasses.has((Math.round(note)%12+12)%12),'every musical voice stays in the Hail to the Chief palette');
  }
}

function setup({saved = null, supported = true, blocked = false, pending = false, samplesAvailable = false} = {}) {
  const contexts = [], nodes = [], storage = new Map(saved ? [['aoi-sound', saved]] : []), events = {};
  let now = 0, resume;
  const param = () => ({value: 0, changes: [], setValueAtTime(value,at) {this.changes.push({value,at});}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}});
  const node = () => ({connect() {}, disconnect() { this.disconnected = true; }, gain: param()});
  class AudioContext {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 8000; this.destination = node(); contexts.push(this); }
    createGain() { return node(); }
    createDynamicsCompressor() { return Object.assign(node(), Object.fromEntries(['threshold','knee','ratio','attack','release'].map(k => [k,param()]))); }
    createBuffer(_, length) { return {getChannelData: () => new Float32Array(length)}; }
    createPeriodicWave() { return {pulse:true}; }
    decodeAudioData() { return Promise.resolve({duration:.4,recorded:true}); }
    createBiquadFilter() { return Object.assign(node(), {frequency: param(), Q: param()}); }
    createOscillator() { return this.makeSource(); }
    createBufferSource() { return this.makeSource(); }
    makeSource() { const n = Object.assign(node(), {frequency: param(), playbackRate:param(), setPeriodicWave(wave) {this.wave=wave;}, start(at) { this.startAt = at; }, stop(at) { this.stopAt = at; this.stopped = true; }}); nodes.push(n); return n; }
    resume() { if (blocked) return Promise.reject(new Error('Blocked')); if (pending) return new Promise(resolve => { resume = () => { this.state = 'running'; resolve(); }; }); this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
  }
  const buttons = Array.from({length: 3}, () => ({attrs: {}, label: {}, setAttribute(k,v) { this.attrs[k] = v; }, querySelector() { return this.label; }, addEventListener(k,fn) { this[k] = fn; }}));
  const document = {hidden: false, querySelectorAll: () => buttons, addEventListener(k,fn) { events[k] = fn; }};
  const window = {AudioContext: supported ? AudioContext : undefined, addEventListener(k,fn) { events[k] = fn; }};
  const context = vm.createContext({window,document,t: x => x,fetch:async()=>{if(!samplesAvailable)throw Error('Offline');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};},performance: {now:()=>now},localStorage: {getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},Math:Object.assign(Object.create(Math),{random(){throw Error('Sound must never use game RNG');}})});
  vm.runInContext(source, context);
  return {audio:window.GameAudio,buttons,document,events,contexts,nodes,storage,advance:ms=>{now+=ms;},resume:()=>resume()};
}

(async () => {
  const s = setup();
  assert.equal(s.contexts.length,0,'page load is silent and creates no AudioContext');
  assert.equal(await s.audio.play('success'),false,'automatic events cannot unlock audio');
  assert.equal(await s.audio.play('gavel',{gesture:true,delay:.42}),true);
  assert.equal(s.contexts.length,1);
  assert.ok(s.nodes[0].startAt >= .42,'gavel follows the visual strike');
  for (const cue of ['intro','select','shuffle','card','success','setback','breakthrough','blowback','phase','adjourn','pause','resume','victory','defeat']) {
    const before=s.nodes.length; assert.equal(await s.audio.play(cue),true,cue); assert.ok(s.nodes.length>before,cue+' schedules audio');
    assertChiefNotes(s.nodes.slice(before));
    s.nodes.slice(before).forEach(n=>{assert.ok(n.stopAt > n.startAt && n.stopAt-n.startAt<1,'every voice has a bounded lifetime'); n.onended();});
  }
  assert.equal(await s.audio.play('shuffle'),false,'rapid deck movement is rate limited');
  s.buttons[0].click();
  assert.equal(s.storage.get('aoi-sound'),'off');
  assert.ok(s.buttons.every(b=>b.attrs['aria-pressed']==='false'),'all mute controls stay synchronized');
  assert.ok(s.nodes.every(n=>n.disconnected),'mute stops and disconnects active and future voices');
  assert.equal(await s.audio.play('success',{gesture:true}),false);
  const muted = setup({saved:'off'}); assert.equal(await muted.audio.play('card',{gesture:true}),false); assert.equal(muted.contexts.length,0,'muted preference survives reload');
  const hidden = setup(); await hidden.audio.play('intro',{gesture:true}); hidden.document.hidden=true; hidden.events.visibilitychange();
  assert.equal(hidden.contexts[0].state,'suspended'); assert.ok(hidden.nodes.every(n=>n.disconnected)); assert.equal(await hidden.audio.play('blowback',{gesture:true}),false);
  const blocked = setup({blocked:true}); assert.equal(await blocked.audio.play('gavel',{gesture:true}),false,'autoplay rejection is harmless');
  const unsupported = setup({supported:false}); assert.ok(unsupported.buttons.every(b=>b.disabled)); assert.equal(await unsupported.audio.play('gavel',{gesture:true}),false);
  const delayed = setup({pending:true}); const oldCue=delayed.audio.play('gavel',{gesture:true}); delayed.buttons[0].click(); delayed.resume(); assert.equal(await oldCue,false,'muting invalidates pending resume cues'); assert.equal(delayed.nodes.length,0);
  const stale = setup({pending:true}); const staleCue=stale.audio.play('gavel',{gesture:true}); stale.advance(500); stale.resume(); assert.equal(await staleCue,false,'late browser unlock never replays a stale cue');
  const recorded=setup({samplesAvailable:true});await recorded.audio.play('select',{gesture:true});
  for(let i=0;i<8;i++)await Promise.resolve();
  for(const cue of ['shuffle','card','gavel','adjourn']) {
    const start=recorded.nodes.length;await recorded.audio.play(cue);
    assert.ok(recorded.nodes.slice(start).some(n=>n.buffer?.recorded),cue+' uses bundled Foley');
  }
  const chief=[69,71,73,74,73,71,69,71,69,66,64,62];
  for(const [cue,notes,tempo,shift] of [['intro',chief,156,0],['pause',chief.slice(0,6),156,0],['resume',chief,184,12],['victory',chief,144,12]]) {
    recorded.audio.stop();const start=recorded.nodes.length;await recorded.audio.play(cue);
    const lead=recorded.nodes.slice(start).filter(n=>n.wave?.pulse).slice(0,notes.length);
    const actual=lead.map(n=>Math.round(69+12*Math.log2(n.frequency.changes[0].value/440)));
    const transpose=actual[0]-notes[0]-shift;
    assert.equal(transpose,0,'all full themes retain their original key');
    assert.deepEqual(actual,notes.map(n=>n+shift+transpose),'recognizable Hail to the Chief melody');
    assert.ok(Math.abs(lead[2].startAt-lead[1].startAt-.75*60/tempo)<1e-8,'dotted rhythm retained');
    assert.ok(lead.at(-1).stopAt>1.5,'pause/resume are melodic phrases, not clicks');
  }
  recorded.audio.stop();let start=recorded.nodes.length;await recorded.audio.play('intro');
  const opening=recorded.nodes.slice(start),openingLead=opening.filter(n=>n.wave?.pulse);
  assert.deepEqual(openingLead.slice(12,24).map(n=>Math.round(69+12*Math.log2(n.frequency.changes[0].value/440))),chief.map(n=>n+12),'opening has a full octave-up reprise');
  assert.ok(Math.max(...opening.map(n=>n.stopAt))-Math.min(...opening.map(n=>n.startAt))>7.5,'opening is a complete fanfare, longer than pause');
  assert.ok(opening.every(n=>!n.disconnected),'the opening fits the voice budget without stealing its own notes');
  for(const cue of ['select','shuffle','card','gavel','success','setback','breakthrough','blowback','phase','adjourn','defeat']) {
    const count=6;
    const pitches=[];
    for(let i=0;i<count*3;i++) {
      recorded.audio.stop();recorded.advance(100);start=recorded.nodes.length;await recorded.audio.play(cue);
      const nodes=recorded.nodes.slice(start),lead=nodes.filter(n=>n.wave?.pulse);
      assertChiefNotes(nodes);
      pitches.push(Math.round(noteOf(lead[0])));
      if(i>0)assert.notEqual(pitches[i],pitches[i-1],cue+' never repeats its previous pitch, including bag boundaries');
      if(['select','shuffle','card','gavel','adjourn'].includes(cue))assert.equal(lead.length,1,'short actions play one melody note');
      if(cue==='success')assert.ok(lead.every((n,index)=>index===0||noteOf(n)>noteOf(lead[index-1])),'success retains its rising contour');
    }
    assert.equal(new Set(pitches).size,count,cue+' uses its full pitch range');
    assert.ok(Math.max(...pitches)-Math.min(...pitches)<12,cue+' variations stay within one octave');
  }
  recorded.audio.stop();assert.ok(recorded.nodes.every(n=>n.disconnected),'all sample and melody voices clean up');
  console.log('PASS: 11 cues with six nonrepeating Hail to the Chief notes; single-note actions; all pitched leads/bass in the melody palette, recorded and offline; four intact themes; 7.7-second opening; voice budget; gesture/mute/hidden/stale cleanup; no game RNG.');
})().catch(error => {console.error(error);process.exitCode=1;});
