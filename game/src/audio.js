// Coin & Candlelight: sound with no files.
// One file, one job: tiny synthesized blips. A pickup chimes, a tossed
// coin clinks on marble, a guard turning suspicious ticks, an alarm drones,
// an escape plays a little arpeggio. Everything is an oscillator: nothing
// to download, nothing to ship, and silence until the first key press
// (browsers demand a gesture).
export function makeSound() {
  let context = null;
  let enabled = true;
  function ensureContext() {
    if (context !== null) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }
  function blip(frequency, seconds, type, volume, when = 0) {
    if (!enabled) return;
    const ctx = ensureContext();
    if (ctx === null) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + seconds);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + when);
    oscillator.stop(ctx.currentTime + when + seconds);
  }
  function armOnFirstKey() {
    const arm = () => {
      ensureContext();
      window.removeEventListener('keydown', arm);
    };
    window.addEventListener('keydown', arm);
  }
  armOnFirstKey();
  return {
    pickup() {
      blip(880, 0.12, 'sine', 0.12);
      blip(1318, 0.18, 'sine', 0.1, 0.07);
    },
    clink() {
      blip(2400, 0.07, 'triangle', 0.1);
      blip(1800, 0.1, 'triangle', 0.08, 0.05);
    },
    suspicious() {
      blip(520, 0.09, 'triangle', 0.08);
    },
    alarm() {
      blip(196, 0.5, 'sawtooth', 0.1);
      blip(185, 0.5, 'sawtooth', 0.1, 0.15);
    },
    caught() {
      blip(110, 0.6, 'sawtooth', 0.14);
    },
    escape() {
      blip(523, 0.14, 'sine', 0.12);
      blip(659, 0.14, 'sine', 0.12, 0.1);
      blip(784, 0.22, 'sine', 0.12, 0.2);
    },
    toggleMute() {
      enabled = !enabled;
      return enabled;
    },
  };
}
