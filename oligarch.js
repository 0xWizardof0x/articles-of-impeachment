'use strict';

window.Oligarch = (() => {
  const R=window.OligarchRules, el=id=>document.getElementById(id);
  let match=null, deckKey='', shown=[], notes=[], ignoreClickUntil=0, touchX=null;
  const escaped=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=(id,value)=>{el(id).textContent=value;};
  const paused=()=>isCalendarPaused();
  function deselect() {
    el('startScreen').classList.remove('oligarch-selected');
    el('oligarchMode').setAttribute('aria-pressed','false');
    el('oligarchStartRules').hidden=true;
    text('startButtonText',t('Start the Session'));
  }
  function select() {
    if(startingSession||S.mode) return;
    selectedMode='oligarch';el('startScreen').dataset.campaign='oligarch';
    document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode==='oligarch')));
    el('startScreen').classList.add('oligarch-selected');el('oligarchStartRules').hidden=false;
    el('startButton').disabled=false;el('watchButton').disabled=true;
    text('startButtonText',t('Start as Oligarch'));renderStartHint();
    window.GameAudio?.play('select',{gesture:true});
  }
  function propose() {
    const move=R.chooseMove(match);
    match=R.dispatch(match,{actor:'prosecution',type:'propose',moveId:move?.id??null,revision:match.revision});
    if(!move) notes.push('Opponent adjourned to rebuild capital.');
  }
  function begin() {
    if(startingSession||S.mode||selectedMode!=='oligarch') return;
    startingSession=true;el('startButton').disabled=true;el('watchButton').disabled=true;
    document.querySelectorAll('#startScreen [data-mode], #startScreen select, #startScreen input').forEach(node=>node.disabled=true);
    el('startButton').classList.add('striking');renderStartHint();
    const delay=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:740;
    window.GameAudio?.play('intro',{gesture:true,delay:delay ? .42 : 0});
    setTimeout(start,delay);
  }
  function start(seed=Date.now()>>>0) {
    resetCalendarClock();window.Simulator?.stop();stopDeckMomentum();stopDeckShuffle();
    const catalog=Object.fromEntries(Object.entries(MOVE_DATA).map(([phase,moves])=>[phase,moves.filter(a=>!a.extended).map(a=>({...a,requiresEvidence:a.id==='bombshell'?85:0}))]));
    match=R.create({seed,catalog});deckKey='';notes=[];shown=[];
    S.mode='hard';S.oligarch=true;S.simulated=false;S.over=false;
    lastVerdict=null;
    el('startScreen').classList.remove('show');el('overlay').classList.remove('show');
    el('app').inert=false;el('app').classList.add('is-oligarch');
    el('campaignMain').hidden=true;el('calendarPanel').hidden=true;el('oligarchBoard').hidden=false;
    el('postScore').hidden=true;
    propose();render();el('shadowPause').focus();
  }
  function resultMessage(last) {
    if(!last||last.kind==='adjourn') return 'Opponent adjourned to rebuild capital.';
    const action=match.catalog[last.phase].find(a=>a.id===last.action);
    return msg`${action.name}: ${last.cancelled?'Cancelled':last.succeeded?'Succeeded':'Setback'}. ${METRIC_LABELS[last.metric]} ${signed(last.delta)}; support ${signed(last.supportDelta)}.`;
  }
  function respond(id,revision) {
    if(!match||paused()||match.winner||match.seat!=='oligarch'||revision!==match.revision) return;
    const counter=R.legalCounters(match).find(c=>c.id===id);if(!counter) return;
    window.GameAudio?.play('card',{gesture:true});
    match=R.dispatch(match,{actor:'oligarch',type:'counter',counterId:id,revision});
    notes.push(resultMessage(match.last));
    if(match.last.monthAdvanced) notes.push('New month: +24 influence, −6 exposure.');
    if(match.last.blowback) notes.push('Computer blowback: capital halved.');
    window.GameAudio?.play(match.last.cancelled||match.last.delta<=0?'success':'setback');
    render();
    if(!match.winner) el('shadowAdvance').focus({preventScroll:true});
  }
  function advance() {
    if(!match||paused()||match.winner||match.seat!=='prosecution') return;
    propose();window.GameAudio?.play('select',{gesture:true});render();
    if(match.seat==='oligarch') el('counterDeck').focus({preventScroll:true});
  }
  function renderResult() {
    if(!match?.winner) return;
    text('finalScore',tr`Month ${match.month} / 24 · Exchange ${match.exchange-1}`);
    text('scoreIdentity',t('Asymmetric mode · scores are not submitted.'));
    el('postScore').hidden=true;text('scoreStatus','');
  }
  function finishMatch() {
    if(S.over||!match.winner) return;
    S.over=true;
    const won=match.winner==='oligarch';
    const headline=won?'OLIGARCH VICTORY':match.reason==='exposed'?'OLIGARCH EXPOSED':'CONVICTED';
    const body={term:'You kept the administration in office until the term ended.',collapse:'Public support for the case collapsed.',
      exposed:'Your network was exposed. The defense is over.',conviction:'The Senate convicted. Your interference could not save the administration.'}[match.reason];
    lastVerdict={won,headline,body};text('verdictText',t(headline));el('verdictText').className='verdict '+(won?'win':'lose');
    text('verdictBody',t(body));renderResult();el('overlay').classList.add('show');el('app').inert=true;
    window.GameAudio?.stop();window.GameAudio?.play(won?'victory':'defeat');
    el('overlay').querySelector('button:not([hidden]):not(:disabled)').focus();
  }
  function renderDeck() {
    const key=`${match.revision}:${language}`;
    const active=match.seat==='oligarch'&&!match.winner;
    if(active) shown=R.legalCounters(match).sort((a,b)=>Number(a.cost===0)-Number(b.cost===0)).map(c=>c.id);
    else shown=match.last?.counter?[match.last.counter]:[];
    if(deckKey!==key) {
      deckKey=key;
      const cards=shown.map(id=>{
        const c=R.counters.find(c=>c.id===id),preview=active?R.preview(match,c):null;
        const button=document.createElement('button');button.type='button';button.className='counter-card';button.dataset.counterId=id;
        const picked=match.last?.counter===id&&!active;button.classList.toggle('was-played',picked);
        button.classList.toggle('is-dangerous',match.exposure+c.heat>=100);
        button.innerHTML=`<span class="card-face"><span class="counter-icon" aria-hidden="true">${c.icon}</span><strong class="counter-name">${escaped(t(c.name))}</strong><span class="counter-desc">${escaped(t(c.desc))}</span><span class="counter-preview">${preview?`${escaped(t('Success chance'))}: ${t(R.preview(match).chance)}% → ${t(preview.chance)}%<br>${escaped(t(METRIC_LABELS[R.metric(match.phase)]))} +${t(preview.gain[0])}–${t(preview.gain[1])}`:''}</span><span class="counter-cost">${escaped(tr`Cost: ${c.cost} · Exposure: ${signed(c.heat)}`)}</span><span class="counter-play">${escaped(t(picked?'Resolution':'Play counter'))} <span aria-hidden="true">↗</span></span></span>`;
        const revision=match.revision;
        button.onclick=event=>{if(event?.detail&&performance.now()<ignoreClickUntil)return;respond(id,revision);};
        return button;
      });
      el('counterDeck').replaceChildren(...cards);
      if(active) el('counterDeck').scrollTo({left:0,behavior:'auto'});
    }
    for(const button of el('counterDeck').children) button.disabled=!active||paused();
    text('counterCount',t(shown.length));
    el('counterPrev').disabled=paused()||shown.length<2;el('counterNext').disabled=paused()||shown.length<2;
  }
  function render() {
    if(!match||!S.oligarch) return;
    const active=match.seat==='oligarch'&&!match.winner,p=active?R.preview(match):null;
    el('oligarchBoard').dataset.seat=match.seat;
    text('shadowRound',tr`Month ${match.month} / 24 · Exchange ${match.exchange}`);
    for(const [id,value] of [['shadowInfluence',match.influence],['shadowExposure',match.exposure],['shadowSupport',match.case.support]]) text(id,t(value)+(id==='shadowSupport'?'%':''));
    el('influenceMeter').value=match.influence;el('exposureMeter').value=match.exposure;el('shadowSupportMeter').value=match.case.support;
    text('shadowEvidence',`📁 ${t(match.case.evidence)} / 75`);text('shadowHouse',`🏛️ ${t(match.case.house)} / 218`);text('shadowSenate',`⚖️ ${t(match.case.senate)} / 67`);
    text('shadowSeat',active?`${t('Computer move')} → ${t('Your counter')}`:t('Resolution'));
    text('shadowMove',p?t(p.action.name):t(resultMessage(match.last)));
    text('shadowMoveDesc',p?t(p.action.desc):'');
    text('shadowOdds',p?`${t('Success chance')}: ${t(p.chance)}% · +${t(p.gain[0])}–${t(p.gain[1])}`:'');
    text('shadowResources',p?`${tr`Capital: ${p.action.cost}`} · ${tr`Days: ${p.action.days}`} / ${tr`Opposition capital: ${match.case.capital} · Session days: ${match.case.days}`}${p.action.evidenceCost?' '+tr`Evidence cost on success: ${p.action.evidenceCost}.`:''}`:'');
    text('shadowResult',p?t('Read the move, then choose a counter.'):match.last?.counter?tr`You used ${R.counters.find(c=>c.id===match.last.counter).name}. Influence ${match.influence}; exposure ${match.exposure}.`:'');
    text('shadowAftermath',!p&&match.last?.monthAdvanced?`${t('New month: +24 influence, −6 exposure.')}${match.last.blowback?' '+t('Computer blowback: capital halved.'):''}`:'');
    for(const [phase,id] of Object.entries({investigation:'shadowEvidence',house:'shadowHouse',senate:'shadowSenate'})) {
      const label=`${t(METRIC_LABELS[R.metric(phase)])}: ${t(match.case[R.metric(phase)])} / ${R.target(phase)}`;
      el(id).classList.toggle('is-active',phase===match.phase);el(id).title=label;el(id).setAttribute('aria-label',label);
    }
    for(const [id,label] of [['influenceMeter','Influence'],['exposureMeter','Exposure'],['shadowSupportMeter','Public Support']]) el(id).setAttribute('aria-label',t(label));
    el('shadowThreat').dataset.state=active?'threat':match.last?.delta>0?'setback':'blocked';
    el('shadowAdvance').hidden=active||!!match.winner;el('shadowAdvance').disabled=paused();
    el('shadowPause').disabled=!!match.winner;el('shadowExit').disabled=paused();
    renderDeck();
    el('shadowHistory').replaceChildren(...notes.slice(-12).reverse().map(note=>{const li=document.createElement('li');li.textContent=t(note);return li;}));
    if(match.winner) finishMatch();
  }
  function browse(direction) {
    if(paused())return;
    el('counterDeck').scrollBy({left:direction*(document.documentElement.dir==='rtl'?-1:1)*Math.max(250,el('counterDeck').clientWidth*.8),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  el('oligarchMode').addEventListener('click',select);
  el('shadowAdvance').addEventListener('click',advance);el('shadowPause').addEventListener('click',toggleCalendarPause);
  el('shadowExit').addEventListener('click',()=>{if(!paused())window.location.reload();});
  el('counterPrev').addEventListener('click',()=>browse(-1));el('counterNext').addEventListener('click',()=>browse(1));
  el('counterDeck').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();browse((event.key==='ArrowRight'?1:-1)*(document.documentElement.dir==='rtl'?-1:1));}});
  el('counterDeck').addEventListener('touchstart',event=>{touchX=event.touches[0]?.clientX;},{passive:true});
  el('counterDeck').addEventListener('touchmove',event=>{if(touchX!=null&&Math.abs(event.touches[0].clientX-touchX)>6)ignoreClickUntil=performance.now()+700;},{passive:true});
  document.addEventListener('languagechange',()=>{if(selectedMode==='oligarch')text('startButtonText',t('Start as Oligarch'));if(S.oligarch){render();renderResult();}});
  return {select,deselect,begin,start,render,renderResult,respond,advance,get state(){return match?JSON.parse(JSON.stringify(match)):null;}};
})();
