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

    // Converts a tile value to its single hex character (10 → 'a', 15 → 'f').
    // Keeps state strings compact and uniform regardless of grid size.
    function encode(v) { return v.toString(16); }

    // Inverse of encode — converts a hex character back to an integer tile value.
    function decode(c) { return parseInt(c, 16); }

    // Pre-compute the goal string once: '1', '2', … up to N-1, then '0' for blank.
    var GOAL = (function () {
      var s = '';
      for (var i = 1; i < N; i++) s += encode(i);
      return s + '0'; // blank at end
    })();

    // Returns all states reachable in one legal slide from `state`.
    // Each neighbour is produced by swapping the blank with an adjacent tile.
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

    // Admissible heuristic: sum of per-tile Manhattan distances to goal cells.
    // One move can reduce the sum by at most 1, so this never overestimates.
    function manhattan(state) {
      var total = 0;
      for (var i = 0; i < N; i++) {
        var v = decode(state[i]);
        if (v === 0) continue;          // blank does not count
        var gi = v - 1;                 // goal index of tile v
        total += Math.abs(Math.floor(i / G) - Math.floor(gi / G)) +
                 Math.abs((i % G) - (gi % G));
      }
      return total;
    }

    // Weaker heuristic: simply counts tiles that are not in their goal position.
    // Admissible (each misplaced tile needs at least one move) but less informed.
    function misplaced(state) {
      var n = 0;
      for (var i = 0; i < N; i++) {
        var v = decode(state[i]);
        if (v !== 0 && v !== i + 1) n++;
      }
      return n;
    }

    // Counts the number of inversions in the tile sequence (blank excluded).
    // An inversion is a pair (a, b) where a appears before b but a > b.
    // Used by isSolvable() to determine reachability of the goal.
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

    // Determines whether `state` can reach the goal.
    // Odd-width grid: solvable iff inversions is even.
    // Even-width grid: solvable iff (inversions + blank's row from bottom) is odd.
    function isSolvable(state) {
      var inv = inversions(state);
      if (G % 2 === 1) return inv % 2 === 0;
      var blank = state.indexOf('0');
      var rowFromBottom = G - Math.floor(blank / G);
      return (inv + rowFromBottom) % 2 === 1;
    }

    // Returns true when `state` matches the pre-computed goal string exactly.
    function isGoal(state) { return state === GOAL; }

    // Produces a random state that passes isSolvable() and is not already the goal.
    // Uses Fisher-Yates shuffle; repeats until a valid starting position is found.
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
