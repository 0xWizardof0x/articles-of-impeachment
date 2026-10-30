'use strict';

// Transport-independent rules: JSON state + revisioned commands, no DOM/timers.
// A future authoritative server can own this state and replace the AI seat.
(function(root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  else root.OligarchRules = rules;
})(typeof window === 'object' ? window : globalThis, () => {
  const cap = (n,lo=0,hi=100) => Math.max(lo,Math.min(hi,n));
  const metric = phase => ({investigation:'evidence',house:'house',senate:'senate'})[phase];
  const target = phase => ({investigation:75,house:218,senate:67})[phase];
  const mean = range => (range[0]+range[1])/2;
  const counters = [
    {id:'reserve',icon:'🕶️',name:'Stand Aside',desc:'Let the move resolve. Recover 16 influence and lose 2 exposure.',cost:0,heat:-2,recover:16},
    {id:'low',icon:'🌑',name:'Lay Low',desc:'Let the move resolve. Lose 12 exposure and recover 4 influence.',cost:0,heat:-12,recover:4},
    {id:'media',icon:'📺',name:'Media Blitz',desc:'Cut success odds by 15 points and public support by 2.',cost:10,heat:8,odds:-15,support:-2},
    {id:'objection',icon:'⚖️',name:'Legal Objection',desc:'Halve progress from this move and burn one extra session day.',cost:14,heat:3,mult:.5,days:1},
    {id:'witness',icon:'🎙️',name:'Challenge the Witness',desc:'Cut success odds by 18 points during the investigation.',cost:10,heat:5,odds:-18,phases:['investigation']},
    {id:'whip',icon:'🤝',name:'Loyalty Whip',desc:'Remove 7 House votes or 3 Senate votes; cut new progress by 20%.',cost:16,heat:10,mult:.8,drain:{house:7,senate:3},phases:['house','senate']},
    {id:'delay',icon:'⌛',name:'Procedural Delay',desc:'Burn three extra session days. The committed move still resolves.',cost:16,heat:7,days:3},
    {id:'deal',icon:'💼',name:'Backchannel Deal',desc:'Cancel the move after its costs are paid. Available once every four exchanges.',cost:24,heat:22,cancel:true,cooldown:4},
    {id:'scandal',icon:'💣',name:'Scandal Bomb',desc:'Halve the computer’s remaining capital after it pays for this move.',cost:14,heat:12,halve:true},
    {id:'leak',icon:'📰',name:'Counter-Leak',desc:'Cut progress by 65% and support by 4, but raise success odds by 8 points.',cost:14,heat:10,mult:.35,odds:8,support:-4},
    {id:'ally',icon:'♟️',name:'Sacrifice an Ally',desc:'Remove 10 evidence, 8 House votes or 3 Senate votes. Lose 14 exposure, but grant 4 support.',cost:20,heat:-14,drain:{investigation:10,house:8,senate:3},support:4},
    {id:'lawyers',icon:'🏛️',name:'Lawyer Wall',desc:'Cut progress by 15% and lose 6 exposure.',cost:18,heat:-6,mult:.85}
  ];
  function random(s) { s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0; return s.rng/4294967296; }
  const roll = (s,range) => range[0]+Math.floor(random(s)*(range[1]-range[0]+1));
  function chance(s,action,counter) {
    if (counter?.cancel) return 0;
    return cap(action.chance+Math.round((s.case.support-40)/10)+Math.floor(s.exposure/25)*3+(counter?.odds||0),15,95);
  }
  function legalMoves(s) {
    return s.catalog[s.phase].filter(a => a.cost<=s.case.capital && a.days<=s.case.days && s.case.evidence>=(a.requiresEvidence||0));
  }
  function legalCounters(s) {
    if(s.winner || s.seat!=='oligarch') return [];
    return counters.filter(c => c.cost<=s.influence && (!c.phases||c.phases.includes(s.phase)) &&
      (!c.cooldown || s.exchange-(s.used[c.id]??-999)>=c.cooldown));
  }
  function chooseMove(s) {
    const m=metric(s.phase),needed=target(s.phase)-s.case[m],supportWeight=s.case.support<35?2:.25;
    return legalMoves(s).map(a => {
      const p=chance(s,a)/100;
      const progress=p*Math.min(needed,mean(a.gain)*1.15)-(1-p)*mean(a.loss);
      const support=p*mean(a.support)-(1-p)*mean(a.supportLoss);
      return {action:a,value:(progress+support*supportWeight)/(a.cost*.3+a.days*.9+1)};
    }).sort((a,b)=>b.value-a.value || a.action.id.localeCompare(b.action.id))[0]?.action || null;
  }
  function verdict(s) {
    // Conviction and exposure take priority over a last-month survival win.
    if(s.case.senate>=67) {s.winner='prosecution';s.reason='conviction';}
    else if(s.exposure>=100) {s.winner='prosecution';s.reason='exposed';}
    else if(s.case.support<12) {s.winner='oligarch';s.reason='collapse';}
    if(s.winner) s.seat='finished';
  }
  function nextMonth(s) {
    verdict(s); if(s.winner) return;
    if(s.month>=24) {s.winner='oligarch';s.reason='term';s.seat='finished';return;}
    s.month++;s.inMonth=0;s.case.days=10;
    s.case.capital=cap(s.case.capital+roll(s,[38,46]),0,120);
    s.influence=cap(s.influence+24);s.exposure=cap(s.exposure-6);
    s.case.support=cap(s.case.support+2);
    if(random(s)<.35) {s.case.capital=Math.floor(s.case.capital/2);s.last.blowback=true;}
    s.last.monthAdvanced=true;
  }
  function advancePhase(s) {
    if(s.phase==='investigation'&&s.case.evidence>=75) {s.phase='house';s.case.house=Math.floor(s.case.support/4);}
    if(s.phase==='house'&&s.case.house>=218) {s.phase='senate';s.case.senate=Math.floor(s.case.support/8);}
    verdict(s);
  }
  function create({seed=1,catalog}) {
    for(const phase of ['investigation','house','senate']) if(!catalog?.[phase]?.length) throw Error('Missing move catalog');
    return {version:1,revision:0,rng:seed>>>0,seat:'prosecution',phase:'investigation',month:1,inMonth:0,exchange:1,
      case:{evidence:12,house:0,senate:0,support:50,capital:80,days:10},influence:60,exposure:0,used:{},
      catalog:JSON.parse(JSON.stringify(catalog)),pending:null,last:null,winner:null,reason:null,history:[]};
  }
  function dispatch(state,command) {
    if(state.version!==1 || !Number.isInteger(command.revision)||command.revision!==state.revision) throw Error('Stale turn');
    if(state.winner || command.actor!==state.seat) throw Error('Wrong seat');
    const s=JSON.parse(JSON.stringify(state));
    if(command.type==='propose' && s.seat==='prosecution') {
      if(command.moveId===null) {
        s.last={kind:'adjourn',monthAdvanced:false};nextMonth(s);
      } else {
        const action=legalMoves(s).find(a=>a.id===command.moveId);
        if(!action) throw Error('Illegal move');
        s.pending=action.id;s.seat='oligarch';
      }
    } else if(command.type==='counter' && s.seat==='oligarch') {
      const counter=legalCounters(s).find(c=>c.id===command.counterId);
      const action=s.catalog[s.phase].find(a=>a.id===s.pending);
      if(!counter||!action) throw Error('Illegal counter');
      const phase=s.phase,m=metric(phase),before=s.case[m],supportBefore=s.case.support;
      s.influence=cap(s.influence-counter.cost+(counter.recover||0));
      s.exposure=cap(s.exposure+counter.heat);s.used[counter.id]=s.exchange;
      // The revealed move is committed: cancellation still consumes its cost.
      s.case.capital-=action.cost;s.case.days=Math.max(0,s.case.days-action.days-(counter.days||0));
      if(counter.halve) s.case.capital=Math.floor(s.case.capital/2);
      const succeeded=!counter.cancel && random(s)<chance(state,action,counter)/100;
      let delta=0;
      if(!counter.cancel) {
        delta=succeeded ? Math.round(roll(s,action.gain)*1.15*(counter.mult??1)) : -roll(s,action.loss);
        s.case.support=cap(s.case.support+(succeeded?roll(s,action.support):-roll(s,action.supportLoss)));
        if(succeeded&&action.evidenceCost) s.case.evidence=cap(s.case.evidence-action.evidenceCost);
      }
      s.case[m]=cap(s.case[m]+delta-(counter.drain?.[phase]||0),0,m==='house'?435:100);
      s.case.support=cap(s.case.support+(counter.support||0)+roll(s,[-2,2]));
      s.last={kind:'exchange',action:action.id,counter:counter.id,phase,metric:m,succeeded,cancelled:!!counter.cancel,
        delta:s.case[m]-before,supportDelta:s.case.support-supportBefore,monthAdvanced:false,halved:!!counter.halve};
      s.pending=null;s.seat='prosecution';s.inMonth++;s.exchange++;
      advancePhase(s);
      if(!s.winner&&(s.inMonth>=3||s.case.days===0)) nextMonth(s);
    } else throw Error('Unknown command');
    s.revision++;s.history.push({...command});
    return s;
  }
  function preview(s,counter) {
    const action=s.catalog[s.phase].find(a=>a.id===s.pending);
    if(!action) return null;
    return {action,chance:chance(s,action,counter),gain:action.gain.map(n=>counter?.cancel?0:Math.round(n*1.15*(counter?.mult??1)))};
  }
  return {create,dispatch,legalMoves,legalCounters,chooseMove,preview,counters,metric,target};
});
