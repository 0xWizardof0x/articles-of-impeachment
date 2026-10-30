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
        master.gain.value = .22;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -12; compressor.knee.value = 18; compressor.ratio.value = 4;
        compressor.attack.value = .006; compressor.release.value = .08;
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
    gain.gain.linearRampToValueAtTime(level, at + Math.min(.008, duration / 4));
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
      const chime = (notes, step = .065, duration = .25, level = .18) => notes.forEach((note, i) => {
        tone(note, i * step, duration, level);
        tone(note * 2, i * step, duration * .55, level * .13);
      });
      switch (name) {
        case 'select': tone(620, 0, .07, .13); break;
        case 'shuffle': rustle(0, .055, .13, 2600); break;
        case 'card': rustle(0, .09, .24, 2200); tone(240, .025, .09, .2, 'triangle', 130); break;
        case 'gavel':
          tone(180, 0, .2, .5, 'triangle', 65); tone(420, 0, .075, .2, 'sine', 230);
          rustle(0, .055, .38, 1600); tone(150, .115, .12, .16, 'triangle', 70); break;
        case 'success': chime([523.25, 659.25, 783.99]); break;
        case 'setback': tone(330, 0, .28, .23, 'triangle', 165); tone(196, .09, .25, .18); break;
        case 'breakthrough': chime([783.99, 987.77, 1174.66], .08, .38); break;
        case 'blowback':
          tone(125, 0, .55, .42, 'sine', 45); rustle(0, .16, .2, 800);
          [330, 247, 165].forEach((note, i) => tone(note, i * .075, .28, .15, 'triangle')); break;
        case 'phase': chime([392, 523.25, 659.25, 783.99], .10, .45); break;
        case 'adjourn': rustle(0, .12, .18, 1800); rustle(.09, .09, .12, 2600); tone(220, .10, .12, .15, 'triangle', 110); break;
        case 'victory': chime([392, 523.25, 659.25, 783.99, 1046.5], .12, .6, .2); break;
        case 'defeat': chime([392, 311.13, 261.63, 196], .13, .5, .16); break;
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
