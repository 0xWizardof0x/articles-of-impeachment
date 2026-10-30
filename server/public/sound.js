'use strict';

// Local CC0 Foley + an original chiptune arrangement of the 1812 melody.
// See audio/CREDITS.md. No remote audio, looping music, or game RNG.
// Audio never blocks a turn, and only a deliberate interaction can unlock it.
window.GameAudio = (() => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const voices = new Set();
  let context, master, noiseBuffer, pulseWave, resuming;
  const samples = new Map();
  const sampleFiles = {slide: 'card-slide.wav', card: 'card-place.wav', wood: 'gavel.wav', knock: 'knock.wav'};
  let enabled = true, generation = 0, lastShuffle = -Infinity;
  try { enabled = localStorage.getItem('aoi-sound') !== 'off'; } catch { /* Optional preference. */ }

  function updateControls() {
    document.querySelectorAll('[data-sound-toggle]').forEach(button => {
      button.disabled = !AudioContext;
      button.setAttribute('aria-pressed', String(enabled && Boolean(AudioContext)));
      button.setAttribute('aria-label', t('Sound effects'));
      button.title = t(!AudioContext ? 'Sound unavailable' : enabled ? 'Sound on' : 'Sound off');
      button.querySelector('.sound-label').textContent = button.title;
    });
  }

  function stop() {
    generation++;
    for (const voice of [...voices]) {
      try { voice.source.stop(); } catch { /* Already ended. */ }
      voice.source.disconnect(); voice.gain.disconnect(); voice.filter?.disconnect();
      voices.delete(voice);
    }
  }

  function unlock() {
    if (!enabled || !AudioContext || document.hidden) return;
    try {
      if (!context) {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = .58;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -14; compressor.knee.value = 10; compressor.ratio.value = 5;
        compressor.attack.value = .004; compressor.release.value = .12;
        master.connect(compressor); compressor.connect(context.destination);
        noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * .25), context.sampleRate);
        const noiseSamples = noiseBuffer.getChannelData(0);
        let seed = 17391;
        for (let i = 0; i < noiseSamples.length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
          noiseSamples[i] = (seed >>> 0) / 2147483648 - 1;
        }
        // Rounded 25% pulse: console character without a piercing raw square.
        const real = new Float32Array(33), imaginary = new Float32Array(33);
        for (let n = 1; n < 33; n++) {
          const rolloff = Math.exp(-n / 9);
          real[n] = 2 * Math.sin(n * Math.PI / 2) / (n * Math.PI) * rolloff;
          imaginary[n] = 2 * (1 - Math.cos(n * Math.PI / 2)) / (n * Math.PI) * rolloff;
        }
        pulseWave = context.createPeriodicWave(real, imaginary);
        // Load once, without delaying input or ever replaying a late effect.
        for (const [key, file] of Object.entries(sampleFiles)) {
          void (async () => {
            try {
              const response = await fetch(`audio/${file}`);
              if (response.ok) samples.set(key, await context.decodeAudioData(await response.arrayBuffer()));
            } catch { /* Offline failures retain procedural Foley. */ }
          })();
        }
      }
      if (context.state !== 'running' && !resuming) {
        resuming = context.resume().catch(() => {}).finally(() => { resuming = null; });
      }
      return resuming;
    } catch { return undefined; } // Unsupported/blocked audio must never affect play.
  }

  function voice(source, at, duration, level, filter, recorded = false) {
    if (voices.size >= 48) {
      const oldest = voices.values().next().value;
      try { oldest.source.stop(); } catch { /* Already ended. */ }
      oldest.source.disconnect(); oldest.gain.disconnect(); oldest.filter?.disconnect(); voices.delete(oldest);
    }
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, at);
    const attack = Math.min(.002, duration / 4);
    gain.gain.linearRampToValueAtTime(level, at + attack);
    gain.gain.setValueAtTime(level, at + (recorded ? Math.max(attack, duration - .008) : attack + Math.min(.018, duration * .15)));
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(filter || gain);
    if (filter) filter.connect(gain);
    gain.connect(master);
    const item = {source, gain, filter};
    voices.add(item);
    source.onended = () => { source.disconnect(); gain.disconnect(); filter?.disconnect(); voices.delete(item); };
    source.start(at); source.stop(at + duration + .015);
  }

  async function play(name, {gesture = false, delay = 0} = {}) {
    if (!enabled || document.hidden || !AudioContext) return false;
    const ticket = generation, requested = performance.now();
    try {
      if (gesture) await unlock();
      else if (resuming) await resuming;
      if (ticket !== generation || !enabled || document.hidden || context?.state !== 'running' || performance.now() - requested > 300) return false;
      // Rapid browsing stays tactile without becoming a rattle.
      if (name === 'shuffle' && requested - lastShuffle < 85) return false;
      if (name === 'shuffle') lastShuffle = requested;
      const at = context.currentTime + .012 + Math.max(0, delay);
      const tone = (frequency, offset, duration, level = .2, type = 'sine', end = frequency) => {
        const oscillator = context.createOscillator();
        if (type === 'pulse') oscillator.setPeriodicWave(pulseWave);
        else oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, at + offset);
        oscillator.frequency.exponentialRampToValueAtTime(end, at + offset + duration);
        voice(oscillator, at + offset, duration, level);
      };
      const rustle = (offset, duration, level, frequency) => {
        const source = context.createBufferSource(); source.buffer = noiseBuffer;
        const filter = context.createBiquadFilter(); filter.type = 'bandpass';
        filter.frequency.value = frequency; filter.Q.value = .8;
        voice(source, at + offset, duration, level, filter);
      };
      const sample = (key, offset, level = .8, rate = 1) => {
        const buffer = samples.get(key);
        if (!buffer) return false;
        const source = context.createBufferSource(); source.buffer = buffer; source.playbackRate.value = rate;
        voice(source, at + offset, Math.min(1.5, buffer.duration / rate), level, undefined, true);
        return true;
      };
      const knock = (offset = 0, level = .75, rate = 1) => {
        if (!sample('wood', offset, level, rate)) {
          [185, 471, 953].forEach((hz, i) => tone(hz * rate, offset, .20 / (i + 1), level * [.42,.21,.12][i]));
          rustle(offset, .035, level * .4, 1700);
        }
      };
      const bass = (note, offset = 0, duration = .25, level = .20) => tone(440 * 2 ** ((note - 69) / 12), offset, duration, level, 'triangle');
      const chip = (note, offset, duration, level = .17) => {
        const hz = 440 * 2 ** ((note - 69) / 12);
        tone(hz, offset, duration, level, 'pulse');
        tone(hz * 2, offset, Math.min(.18, duration), level * .32, 'sine');
      };
      const phrase = (notes, beats, tempo = 172, shift = 0, level = .17, start = 0) => {
        let offset = start;
        notes.forEach((note, i) => {
          const length = beats[i] * 60 / tempo;
          chip(note + shift, offset, Math.max(.07, length * .92 + .08), level);
          offset += length;
        });
        return offset;
      };
      // James Sanderson, Hail to the Chief (1812), first two bars in D.
      // Dotted rhythms retained; no modern recording or arrangement is used.
      const chief = [69,71,73,74,73,71,69,71,69,66,64,62];
      const chiefBeats = [1,.75,.25,1,.75,.25,.75,.25,.75,.25,1,1];
      switch (name) {
        case 'select': chip(74,0,.09,.12); chip(81,.055,.13,.10); break;
        case 'shuffle': if (!sample('slide',0,.75)) rustle(0,.09,.30,2400); break;
        case 'card': if (!sample('card',0,.95)) { rustle(0,.08,.34,2200); knock(.02,.35,1.5); } break;
        case 'gavel': knock(0,.95,.88); knock(.135,.25,1.05); bass(38,0,.17,.25); break;
        case 'intro':
          knock(0,.9,.88); knock(.135,.22,1.05);
          phrase(chief.slice(0,6),chiefBeats.slice(0,6),168,0,.16,.18);
          bass(50,.18,.5,.16); bass(57,.18 + 2 * 60 / 168,.5,.14); break;
        case 'success': phrase([74,78,81,86],[.25,.25,.25,.7],190); bass(50,0,.36); break;
        case 'setback': phrase([69,65,62],[.4,.3,.7],180,0,.15); bass(38,0,.30,.18); break;
        case 'breakthrough': phrase([74,78,81,86,90],[.25,.25,.25,.5,.9],180); bass(50,0,.4); bass(57,.4,.4); break;
        case 'blowback':
          knock(0,.75,.65); tone(110,0,.5,.25,'pulse',35); rustle(0,.18,.24,700);
          phrase([62,61,57,50],[.25,.25,.4,.8],172,0,.17); break;
        case 'phase': phrase([69,74,78,81,78,81,86],[.5,.25,.25,.75,.25,.25,1],184); bass(50,0,.5); bass(57,.65,.5); break;
        case 'adjourn':
          if (!sample('knock',0,.75)) knock(0,.65,1.1);
          chip(66,.09,.15,.13); chip(69,.20,.20,.12); bass(50,.09,.25,.15); break;
        case 'pause':
          phrase(chief.slice(0,6),chiefBeats.slice(0,6),156,0,.14);
          bass(50,0,.65,.13); bass(57,2 * 60 / 156,.58,.11); break;
        case 'resume':
          phrase(chief,chiefBeats,184,12,.14);
          [50,57,57,50].forEach((n,i)=>bass(n,i * 2 * 60 / 184,.45,.13)); break;
        case 'victory':
          phrase(chief,chiefBeats,144,12,.18);
          [50,57,57,50].forEach((n,i)=>bass(n,i * 2 * 60 / 144,.65,.18));
          [74,78,81,86].forEach((n,i)=>chip(n,8 * 60 / 144 + i*.045,.85,.10));
          bass(38,8 * 60 / 144,.85,.20); break;
        case 'defeat': phrase([74,69,65,62],[.75,.75,.75,1.5],132,0,.15); bass(38,0,.65,.17); break;
        default: return false;
      }
      return true;
    } catch { return false; }
  }

  function toggle() {
    enabled = !enabled;
    try { localStorage.setItem('aoi-sound', enabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
    stop(); updateControls();
    if (enabled) void play('select', {gesture: true});
    else context?.suspend().catch(() => {});
  }
  document.querySelectorAll('[data-sound-toggle]').forEach(button => button.addEventListener('click', toggle));
  document.addEventListener('languagechange', updateControls);
  const quiet = () => { stop(); context?.suspend().catch(() => {}); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) quiet(); });
  window.addEventListener('pagehide', quiet);
  updateControls();
  return {play, stop};
})();
