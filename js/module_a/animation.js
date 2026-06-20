// Solution playback engine: walks a list of states one move at a time with
// pause / resume / step / speed control. Decoupled from the board renderer
// via callbacks so it stays testable and reusable.
//
//   var player = Lab.moduleA.createPlayer({
//     onStep: function (state, index, total) { ... },
//     onDone: function () { ... },
//     speed: function () { return 400; }   // ms between steps
//   });
(function () {
  Lab.moduleA.createPlayer = function (opts) {
    var states = [];
    var idx = 0;
    var timer = null;
    var playing = false;

    function emit() { opts.onStep(states[idx], idx, states.length - 1); }

    function tick() {
      if (!playing) return;
      if (idx >= states.length - 1) { playing = false; if (opts.onDone) opts.onDone(); return; }
      idx++;
      emit();
      timer = setTimeout(tick, opts.speed ? opts.speed() : 400);
    }

    return {
      load: function (s) { this.pause(); states = s || []; idx = 0; if (states.length) emit(); },
      play: function () {
        if (!states.length) return;
        if (idx >= states.length - 1) idx = 0; // replay from start
        playing = true;
        emit();
        timer = setTimeout(tick, opts.speed ? opts.speed() : 400);
      },
      pause: function () { playing = false; if (timer) { clearTimeout(timer); timer = null; } },
      step: function () { this.pause(); if (idx < states.length - 1) { idx++; emit(); } },
      stepBack: function () { this.pause(); if (idx > 0) { idx--; emit(); } },
      reset: function () { this.pause(); idx = 0; if (states.length) emit(); },
      isPlaying: function () { return playing; },
      index: function () { return idx; },
      total: function () { return Math.max(0, states.length - 1); }
    };
  };
})();
