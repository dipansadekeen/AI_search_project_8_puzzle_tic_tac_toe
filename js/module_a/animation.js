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
    var states  = [];
    var idx     = 0;
    var timer   = null;
    var playing = false;

    // Fires the onStep callback with the current state and position.
    function emit() { opts.onStep(states[idx], idx, states.length - 1); }

    // Called repeatedly by setTimeout; advances one step and reschedules itself
    // until the last state is reached, then fires onDone.
    function tick() {
      if (!playing) return;
      if (idx >= states.length - 1) {
        playing = false;
        if (opts.onDone) opts.onDone();
        return;
      }
      idx++;
      emit();
      timer = setTimeout(tick, opts.speed ? opts.speed() : 400);
    }

    return {
      // Loads a new path array and immediately renders the first state.
      load: function (s) {
        this.pause();
        states = s || [];
        idx = 0;
        if (states.length) emit();
      },

      // Starts auto-playback; restarts from the beginning if already at the end.
      play: function () {
        if (!states.length) return;
        if (idx >= states.length - 1) idx = 0;
        playing = true;
        emit();
        timer = setTimeout(tick, opts.speed ? opts.speed() : 400);
      },

      // Stops auto-playback without changing position.
      pause: function () {
        playing = false;
        if (timer) { clearTimeout(timer); timer = null; }
      },

      // Advances a single step forward (stops auto-play first).
      step: function () {
        this.pause();
        if (idx < states.length - 1) { idx++; emit(); }
      },

      // Moves a single step backward (stops auto-play first).
      stepBack: function () {
        this.pause();
        if (idx > 0) { idx--; emit(); }
      },

      // Returns to the first state without clearing the path.
      reset: function () {
        this.pause();
        idx = 0;
        if (states.length) emit();
      },

      isPlaying: function () { return playing; },
      index:     function () { return idx; },

      // Returns the number of moves in the loaded path (states - 1).
      total: function () { return Math.max(0, states.length - 1); }
    };
  };
})();
