// Web Audio API sound effects — synthesised tones, no audio files needed.
// Lab.shared.sounds.muted can be toggled; state persists in localStorage.
(function () {
  var ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (Lab.shared.sounds.muted) return;
    try {
      var c   = getCtx();
      var osc = c.createOscillator();
      var g   = c.createGain();
      osc.connect(g);
      g.connect(c.destination);
      osc.type            = type || 'sine';
      osc.frequency.value = freq;
      var t = c.currentTime + (delay || 0);
      g.gain.setValueAtTime(vol || 0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {}
  }

  Lab.shared.sounds = {
    muted: localStorage.getItem('lab-mute') === '1',

    // Module A
    tileMove: function () { tone(440, 0.07, 'sine', 0.18); },
    solved:   function () {
      tone(523, 0.10, 'sine', 0.28, 0.00);   // C5
      tone(659, 0.10, 'sine', 0.28, 0.11);   // E5
      tone(784, 0.22, 'sine', 0.28, 0.22);   // G5
    },

    // Module B
    place: function () { tone(320, 0.06, 'sine', 0.16); },
    win:   function () {
      tone(523, 0.10, 'sine', 0.28, 0.00);
      tone(659, 0.10, 'sine', 0.28, 0.11);
      tone(784, 0.28, 'sine', 0.28, 0.22);
    },
    draw:  function () {
      tone(400, 0.12, 'sine', 0.22, 0.00);
      tone(350, 0.20, 'sine', 0.18, 0.14);
    }
  };
})();
