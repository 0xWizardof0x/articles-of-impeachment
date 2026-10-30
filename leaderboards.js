'use strict';
(() => {
  const byId = id => document.getElementById(id);
  const dialog = byId('leaderboardDialog');
  let profile = {}, completed = null, posted = false, posting = false, boardScope = 'overall', entries = [], boardStatus = '', scoreStatus = '', requestVersion = 0;
  try { profile = JSON.parse(localStorage.getItem('aoi-player') || '{}') || {}; } catch {}
  byId('playerName').value = typeof profile.name === 'string' ? profile.name : '';
  function countryName(code) {
    try { return new Intl.DisplayNames([LANGUAGES[language].locale], {type:'region'}).of(code); } catch { return code; }
  }
  function populateCountries(select, selected, placeholder) {
    const options = COUNTRY_CODES.map(code => ({code,name:countryName(code)})).sort((a,b)=>a.name.localeCompare(b.name,LANGUAGES[language].locale));
    select.replaceChildren();
    if (placeholder) { const opt=document.createElement('option');opt.value='';opt.textContent=t('Choose a country');select.appendChild(opt); }
    for (const {code,name} of options) {const opt=document.createElement('option');opt.value=code;opt.textContent=name;select.appendChild(opt);}
    select.value=COUNTRY_CODES.includes(selected) ? selected : placeholder ? '' : 'US';
  }
  populateCountries(byId('playerCountry'),profile.country,true);
  populateCountries(byId('boardCountry'),profile.country,false);
  function prepareProfile() {
    const input=byId('playerName');
    const name=input.value.normalize('NFKC').trim().replace(/\s+/gu,' ');
    const country=byId('playerCountry').value;
    if ([...name].length<2 || [...name].length>24 || !/^[\p{L}\p{M}\p{N} ._'’\-]+$/u.test(name)) {
      byId('profileError').textContent=t('Enter a name of 2–24 letters or numbers.');input.focus();return false;
    }
    if(!COUNTRY_CODES.includes(country)) {byId('profileError').textContent=t('Choose a country');byId('playerCountry').focus();return false;}
    profile={name,country};input.value=name;byId('profileError').textContent='';
    try {localStorage.setItem('aoi-player',JSON.stringify(profile));} catch {}
    return true;
  }
  function onFinish(state, won) {
    if(state.simulated||state.oligarch) return;
    if(completed) return;
    const daysRemaining=Math.max(0,(state.maxTurns-state.turn)*state.daysMax+state.daysLeft);
    completed={...profile,runId:crypto.randomUUID(),mode:state.mode,won,evidence:state.evidence,house:state.house,senate:state.senate,support:state.support,capital:state.capital,daysRemaining};
    completed.score=(won?10000:0)+Math.min(state.evidence,75)*10+Math.min(state.house,218)*10+Math.min(state.senate,67)*30+state.support*10+state.capital+(won?daysRemaining*5:0);
    renderResult();
  }
  function renderResult() {
    if(S.oligarch) return;
    if(!completed) return;
    byId('finalScore').textContent=t('Score')+': '+t(completed.score);
    byId('scoreIdentity').textContent=profile.name+' · '+countryName(profile.country)+' · '+t(completed.mode.toUpperCase());
    byId('postScore').disabled=posting||posted;
    byId('postScore').textContent=t(posting?'Posting…':posted?'Posted':'Post score');
    byId('scoreStatus').textContent=t(scoreStatus);
  }
  async function api(path, options={}) {
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(path,{...options,signal:controller.signal,credentials:'same-origin'});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error || 'unavailable');
      return data;
    } finally {clearTimeout(timeout);}
  }
  async function postScore() {
    if(S.simulated||S.oligarch||!completed||posting||posted) return;
    posting=true;scoreStatus='';renderResult();
    try {
      const data=await api('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(completed)});
      posted=true;completed.score=data.score;scoreStatus='Score saved. Your best result appears on the leaderboards.';
    } catch(error) {scoreStatus=error.message==='rate'?'Too many submissions. Try again in an hour.':'Could not save your score. Try again.';}
    finally {posting=false;renderResult();}
  }
  function renderRows() {
    byId('boardRows').replaceChildren();
    entries.forEach((entry,index)=>{
      const row=document.createElement('tr');
      for(const value of [t(index+1),entry.name,countryName(entry.country),t(entry.score),t(entry.won?'Victory':'Unfinished')]) {
        const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);
      }
      byId('boardRows').appendChild(row);
    });
    byId('boardStatus').textContent=t(boardStatus);
  }
  async function loadBoard() {
    const version=++requestVersion;
    entries=[];boardStatus='Loading rankings…';renderRows();
    const params=new URLSearchParams({mode:byId('boardMode').value});
    if(boardScope==='country') params.set('country',byId('boardCountry').value);
    try {
      const data=await api('/api/leaderboard?'+params);
      if(version!==requestVersion) return;
      entries=data.entries;boardStatus=entries.length?'':'No scores yet. Post a completed game to set the first mark.';
    } catch {if(version!==requestVersion) return;boardStatus='Rankings are unavailable. Refresh to try again.';}
    renderRows();
  }
  function setScope(scope) {
    boardScope=scope;byId('boardOverall').setAttribute('aria-pressed',String(scope==='overall'));
    byId('boardByCountry').setAttribute('aria-pressed',String(scope==='country'));
    byId('boardCountryLabel').hidden=scope!=='country';loadBoard();
  }
  function openBoard() {
    const mode=S.mode || selectedMode;
    byId('boardMode').value=['easy','hard','harder'].includes(mode)?mode:'hard';
    if(profile.country) byId('boardCountry').value=profile.country;
    dialog.showModal();refreshCalendarPauseState();loadBoard();
  }
  document.querySelectorAll('[data-open-leaderboard]').forEach(button=>button.addEventListener('click',openBoard));
  byId('closeLeaderboard').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{requestVersion++;refreshCalendarPauseState();});
  byId('postScore').addEventListener('click',postScore);
  byId('boardOverall').addEventListener('click',()=>setScope('overall'));
  byId('boardByCountry').addEventListener('click',()=>setScope('country'));
  byId('refreshLeaderboard').addEventListener('click',loadBoard);
  byId('boardMode').addEventListener('change',loadBoard);
  byId('boardCountry').addEventListener('change',loadBoard);
  document.addEventListener('languagechange',()=>{
    populateCountries(byId('playerCountry'),byId('playerCountry').value,true);
    populateCountries(byId('boardCountry'),byId('boardCountry').value,false);
    byId('profileError').textContent='';renderRows();renderResult();
  });
  window.Leaderboards={prepareProfile,onFinish};
})();
