'use strict';

// Original, local Web Audio cues. No downloads, looping music, or game RNG.
// Audio never blocks a turn, and only a deliberate interaction can unlock it.
window.GameAudio = (() => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const voices = new Set();
  let context, master, noiseBuffer, resuming;
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
        master.gain.value = .32;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -10; compressor.knee.value = 12; compressor.ratio.value = 6;
        compressor.attack.value = .003; compressor.release.value = .10;
        master.connect(compressor); compressor.connect(context.destination);
        noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * .25), context.sampleRate);
        const samples = noiseBuffer.getChannelData(0);
        let seed = 17391;
        for (let i = 0; i < samples.length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
          samples[i] = (seed >>> 0) / 2147483648 - 1;
        }
      }
      if (context.state !== 'running' && !resuming) {
        resuming = context.resume().catch(() => {}).finally(() => { resuming = null; });
      }
      return resuming;
    } catch { return undefined; } // Unsupported/blocked audio must never affect play.
  }

  function voice(source, at, duration, level, filter) {
    if (voices.size >= 32) {
      const oldest = voices.values().next().value;
      try { oldest.source.stop(); } catch { /* Already ended. */ }
      oldest.source.disconnect(); oldest.gain.disconnect(); oldest.filter?.disconnect(); voices.delete(oldest);
    }
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, at);
    const attack = Math.min(.002, duration / 4);
    gain.gain.linearRampToValueAtTime(level, at + attack);
    gain.gain.setValueAtTime(level, at + attack + Math.min(.018, duration * .15));
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
        const oscillator = context.createOscillator(); oscillator.type = type;
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
      const thump = (offset = 0, level = .48) => {
        tone(185, offset, .17, level, 'sine', 54);
        rustle(offset, .035, level * .6, 1900);
      };
      const chime = (notes, step = .055, duration = .24, level = .24) => notes.forEach((note, i) => {
        tone(note, i * step, duration, level, 'triangle');
        tone(note * 2, i * step, duration * .42, level * .18);
      });
      switch (name) {
        case 'select': tone(780, 0, .055, .22, 'triangle', 520); tone(190, 0, .055, .16); break;
        case 'shuffle': rustle(0, .06, .26, 2400); break;
        case 'card': rustle(0, .07, .4, 2400); tone(310, .01, .12, .36, 'triangle', 105); break;
        case 'gavel':
          thump(0, .65); tone(210, 0, .23, .48, 'triangle', 62); tone(880, 0, .035, .24, 'sine', 410);
          rustle(0, .055, .48, 1500); tone(160, .12, .10, .24, 'triangle', 65); break;
        case 'success': thump(0, .28); chime([523.25, 659.25, 783.99]); break;
        case 'setback': thump(0, .4); tone(430, 0, .22, .30, 'triangle', 120); tone(196, .075, .18, .22); break;
        case 'breakthrough': thump(0, .4); chime([783.99, 987.77, 1174.66], .07, .32, .28); break;
        case 'blowback':
          thump(0, .65); tone(140, .08, .5, .55, 'sine', 42); rustle(0, .14, .35, 950);
          [392, 247, 165].forEach((note, i) => tone(note, i * .065, .25, .24, 'triangle')); break;
        case 'phase': thump(0, .4); chime([392, 523.25, 659.25, 783.99], .085, .4, .27); break;
        case 'adjourn': rustle(0, .10, .30, 1800); rustle(.07, .07, .22, 2600); tone(260, .09, .12, .26, 'triangle', 95); break;
        case 'pause': tone(660, 0, .11, .26, 'triangle', 520); tone(330, .09, .18, .30, 'triangle', 165); rustle(0, .035, .18, 1400); break;
        case 'resume': tone(220, 0, .10, .26, 'triangle', 440); chime([523.25, 783.99], .065, .19, .27); break;
        case 'victory': thump(0, .4); chime([392, 523.25, 659.25, 783.99, 1046.5], .10, .55, .28); break;
        case 'defeat': thump(0, .35); chime([392, 311.13, 261.63, 196], .11, .42, .24); break;
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
