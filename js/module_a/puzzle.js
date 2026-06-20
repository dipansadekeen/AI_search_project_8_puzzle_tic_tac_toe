// 8-puzzle state model.
// A state is a 9-character string, row-major, blank = '0'.
// e.g. "813402765" is  [[8,1,3],[4,0,2],[7,6,5]].
// Strings make states cheap to hash in Sets/Maps for visited tracking.
(function () {
  var GOAL = '123456780';

  // Goal index for each tile value 1..8 (value v lives at index v-1 when solved).
  function goalIndex(v) { return v - 1; }

  // Generate successor states by sliding a tile into the blank.
  // Returns [{ state, tile }] where `tile` is the value that moved.
  function neighbors(state) {
    var blank = state.indexOf('0');
    var r = Math.floor(blank / 3), c = blank % 3;
    var out = [];
    var moves = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
    ];
    for (var i = 0; i < moves.length; i++) {
      var nr = moves[i][0], nc = moves[i][1];
      if (nr < 0 || nr > 2 || nc < 0 || nc > 2) continue;
      var swap = nr * 3 + nc;
      var arr = state.split('');
      var movedTile = arr[swap];
      arr[blank] = movedTile;
      arr[swap] = '0';
      out.push({ state: arr.join(''), tile: movedTile });
    }
    return out;
  }

  // Manhattan distance: sum over tiles of grid distance to goal cell.
  function manhattan(state) {
    var total = 0;
    for (var i = 0; i < 9; i++) {
      var v = state.charCodeAt(i) - 48;
      if (v === 0) continue;
      var gi = goalIndex(v);
      var r = Math.floor(i / 3), c = i % 3;
      var gr = Math.floor(gi / 3), gc = gi % 3;
      total += Math.abs(r - gr) + Math.abs(c - gc);
    }
    return total;
  }

  // Misplaced-tiles heuristic (alternative admissible heuristic).
  function misplaced(state) {
    var count = 0;
    for (var i = 0; i < 9; i++) {
      var v = state.charCodeAt(i) - 48;
      if (v !== 0 && v !== i + 1) count++;
    }
    return count;
  }

  // A 3x3 puzzle is solvable iff the inversion count (blank excluded) is even.
  function inversions(state) {
    var tiles = state.split('').map(Number).filter(function (v) { return v !== 0; });
    var inv = 0;
    for (var i = 0; i < tiles.length; i++)
      for (var j = i + 1; j < tiles.length; j++)
        if (tiles[i] > tiles[j]) inv++;
    return inv;
  }

  function isSolvable(state) { return inversions(state) % 2 === 0; }
  function isGoal(state) { return state === GOAL; }

  // Random solvable state, optionally not already solved.
  function randomSolvable() {
    var arr = '012345678'.split('');
    var state;
    do {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      state = arr.join('');
    } while (!isSolvable(state) || state === GOAL);
    return state;
  }

  Lab.moduleA.Puzzle = {
    GOAL: GOAL,
    neighbors: neighbors,
    manhattan: manhattan,
    misplaced: misplaced,
    inversions: inversions,
    isSolvable: isSolvable,
    isGoal: isGoal,
    randomSolvable: randomSolvable
  };
})();
