// 8-puzzle / 15-puzzle state model — configurable grid size.
// State: G*G single-character string, row-major, blank = '0'.
// Tiles are hex-encoded: 1-9 → '1'-'9', 10-15 → 'a'-'f'.
// 3×3 goal: '123456780'   |   4×4 goal: '123456789abcdef0'
//
// Lab.moduleA.Puzzle is the active puzzle object (default 3×3).
// Switch size via: Lab.moduleA.Puzzle = Lab.moduleA.createPuzzle(4);
(function () {
  function createPuzzle(G) {
    G = G || 3;
    var N = G * G;

    function encode(v) { return v.toString(16); }  // 10 → 'a'
    function decode(c) { return parseInt(c, 16); }  // 'a' → 10

    var GOAL = (function () {
      var s = '';
      for (var i = 1; i < N; i++) s += encode(i);
      return s + '0'; // blank at end
    })();

    function neighbors(state) {
      var blank = state.indexOf('0');
      var r = Math.floor(blank / G), c = blank % G;
      var out = [];
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (var d = 0; d < dirs.length; d++) {
        var nr = r + dirs[d][0], nc = c + dirs[d][1];
        if (nr < 0 || nr >= G || nc < 0 || nc >= G) continue;
        var swap = nr * G + nc;
        var arr = state.split('');
        var moved = arr[swap];
        arr[blank] = moved; arr[swap] = '0';
        out.push({ state: arr.join(''), tile: moved });
      }
      return out;
    }

    function manhattan(state) {
      var total = 0;
      for (var i = 0; i < N; i++) {
        var v = decode(state[i]);
        if (v === 0) continue;
        var gi = v - 1; // goal index of tile v
        total += Math.abs(Math.floor(i / G) - Math.floor(gi / G)) +
                 Math.abs((i % G) - (gi % G));
      }
      return total;
    }

    function misplaced(state) {
      var n = 0;
      for (var i = 0; i < N; i++) {
        var v = decode(state[i]);
        if (v !== 0 && v !== i + 1) n++;
      }
      return n;
    }

    function inversions(state) {
      var tiles = [];
      for (var i = 0; i < N; i++) {
        var v = decode(state[i]);
        if (v !== 0) tiles.push(v);
      }
      var inv = 0;
      for (var i = 0; i < tiles.length; i++)
        for (var j = i + 1; j < tiles.length; j++)
          if (tiles[i] > tiles[j]) inv++;
      return inv;
    }

    function isSolvable(state) {
      var inv = inversions(state);
      if (G % 2 === 1) return inv % 2 === 0; // odd-width: inversions must be even
      // Even-width: (inversions + blank row from bottom, 1-indexed) must be odd
      var blank = state.indexOf('0');
      var rowFromBottom = G - Math.floor(blank / G);
      return (inv + rowFromBottom) % 2 === 1;
    }

    function isGoal(state) { return state === GOAL; }

    function randomSolvable() {
      var arr = [];
      for (var i = 0; i < N; i++) arr.push(encode(i));
      var s;
      do {
        for (var i = arr.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        s = arr.join('');
      } while (!isSolvable(s) || s === GOAL);
      return s;
    }

    return {
      GOAL: GOAL, gridSize: G, size: N,
      encode: encode, decode: decode,
      neighbors: neighbors, manhattan: manhattan, misplaced: misplaced,
      inversions: inversions, isSolvable: isSolvable, isGoal: isGoal,
      randomSolvable: randomSolvable
    };
  }

  Lab.moduleA.createPuzzle = createPuzzle;
  Lab.moduleA.Puzzle = createPuzzle(3); // default 3×3 — backward compatible
})();
