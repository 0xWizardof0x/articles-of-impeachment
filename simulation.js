'use strict';

// A spectator controller over the real game. It never edits resources, rolls
// outcomes ahead of time, or submits scores. The calendar owns the only timer.
window.Simulator = (() => {
  let active = false, busy = false, speed = 1, remaining = 2800;
  let pending = null, planned = false, plannedTurn = 0, plannedPhase = '';
  let moves = 0, adjourns = 0, status = 'Preparing the campaign…';
  const mean = range => (range[0] + range[1]) / 2;

  function choose() {
    const metric = PHASE_METRICS[S.phase];
    const target = {investigation: MODES[S.mode].evidenceThreshold, house: 218, senate: 67}[S.phase];
    const supportWeight = S.support < 35 ? 5 : S.support < 50 ? 2 : .35;
    const progressWeight = {investigation: 1, house: .5, senate: 1.6}[S.phase];
    return orderedActions().map(action => {
      const chance = moveChance(action) / 100;
      const gain = Math.min(mean(action.gain), Math.max(0, target - S[metric]));
      const loss = Math.min(mean(action.loss), S[metric]);
      const progress = chance * gain - (1 - chance) * loss;
      const support = chance * mean(action.support) - (1 - chance) * mean(action.supportLoss);
      return {action, value: (progress * progressWeight + support * supportWeight) / (action.cost * .7 + action.days * 1.3)};
    }).sort((a,b) => b.value - a.value).find(candidate => candidate.value > 0)?.action || null;
  }

  function render() {
    document.getElementById('simulationBar').hidden = !S.simulated;
    document.getElementById('app').classList.toggle('is-simulation', Boolean(S.simulated));
    if (!S.simulated) return;
    const text = S.over ? t('Simulation complete') : t(status);
    const output = document.getElementById('simulationStatus');
    if (output.textContent !== text) output.textContent = text;
    output.title = text;
    document.getElementById('simulationSpeed').value = String(speed);
    document.getElementById('simulationSpeed').disabled = S.over || isCalendarPaused();
    for (const card of moveTrack.children) {
      const selected = Boolean(pending && planned && pending.id === card.dataset.moveId);
      card.classList.toggle('simulation-choice', selected);
      if (selected) card.querySelector('.play-label').textContent = t('Next move');
    }
  }

  function advance(elapsed) {
    if (!active || busy || !S.simulated || isCalendarPaused() || !Number.isFinite(elapsed) || elapsed <= 0) return;
    remaining -= elapsed;
    if (remaining > 0) return;
    busy = true;
    try {
      const carry = remaining;
      if (!planned) {
        pending = choose(); planned = true; plannedTurn = S.turn; plannedPhase = S.phase;
        status = pending ? msg`Next: ${pending.name}` : 'Rebuilding capital · adjourning';
        if (pending) scrollToMove(orderedActions().indexOf(pending), 'simulation');
        remaining = Math.max(0, 1600 + carry);
      } else {
        // A day can expire while the camera is moving. Re-evaluate rather than
        // spending an invalid card or skipping a second month after a rollover.
        const valid = plannedTurn === S.turn && plannedPhase === S.phase && (!pending || isMoveReady(pending));
        const choice = pending;
        pending = null; planned = false;
        if (valid) {
          status = choice ? 'Reading the outcome…' : 'New month · reassessing';
          if (choice) { moves++; doAction(choice, 'simulation'); }
          else { adjourns++; endTurn('simulation'); }
        } else status = 'Reassessing available moves…';
        remaining = Math.max(0, (valid ? 4400 : 400) + carry);
      }
      render();
    } finally { busy = false; }
  }

  function start() {
    active = true; busy = false; speed = 1; remaining = 2800;
    pending = null; planned = false; moves = 0; adjourns = 0;
    status = 'Preparing the campaign…';
  }
  function stop() { active = false; pending = null; planned = false; }
  function renderResult() {
    document.getElementById('finalScore').textContent = tr`Simulation complete · ${moves} moves · ${adjourns} adjournments`;
    document.getElementById('scoreIdentity').textContent = t('Simulation · scores are not submitted.');
    document.getElementById('postScore').hidden = true;
    document.getElementById('scoreStatus').textContent = '';
  }
  document.getElementById('simulationSpeed').addEventListener('change', event => {
    if (!active || isCalendarPaused()) return;
    const next = Number(event.target.value);
    // Clock synchronization can render and restore the old select value.
    // Capture the user's choice first, then account for time at the old speed.
    syncCalendarClock();
    if ([1,2,4].includes(next)) speed = next;
    render();
  });
  document.getElementById('stopSimulation').addEventListener('click', () => {
    if (!S.simulated || isCalendarPaused()) return;
    stop(); stopCalendarClock(); window.GameAudio?.stop(); window.location.reload();
  });
  return {start, stop, advance, render, renderResult, get speed() { return speed; }};
})();
