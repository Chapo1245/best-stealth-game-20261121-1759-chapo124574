// Sleeper Car — synthesized sound: no audio files, every cue is an
// oscillator built at run time (footsteps, page chime, alarm, win/lose).
(function () {
  'use strict';

  var ctx = null;
  var muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, when) {
    if (muted) return;
    var ac = ensure();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume();
      var t0 = ac.currentTime + (when || 0);
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) { /* sound is decoration; never break the game */ }
  }

  window.SC.audio = {
    unlock: function () { ensure(); },
    toggleMute: function () {
      muted = !muted;
      return muted;
    },
    step: function (running) {
      tone(running ? 170 : 120, 0.06, 'triangle', running ? 0.07 : 0.035);
    },
    page: function () {
      tone(660, 0.12, 'sine', 0.14);
      tone(990, 0.18, 'sine', 0.12, 0.09);
    },
    spotted: function () {
      tone(220, 0.16, 'square', 0.10);
      tone(330, 0.16, 'square', 0.10, 0.14);
    },
    alarm: function () {
      tone(440, 0.22, 'sawtooth', 0.10);
      tone(440, 0.22, 'sawtooth', 0.10, 0.24);
      tone(440, 0.30, 'sawtooth', 0.10, 0.48);
    },
    win: function () {
      tone(523, 0.16, 'sine', 0.14);
      tone(659, 0.16, 'sine', 0.14, 0.14);
      tone(784, 0.30, 'sine', 0.14, 0.28);
    },
    lose: function () {
      tone(196, 0.30, 'sawtooth', 0.10);
      tone(147, 0.45, 'sawtooth', 0.10, 0.25);
    }
  };
})();
