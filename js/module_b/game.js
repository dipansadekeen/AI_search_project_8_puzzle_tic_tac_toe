// Tic-Tac-Toe game model — configurable board size and k-in-a-row.
// Board: flat array of size*size cells, each 'X', 'O', or null.
// Lab.moduleB.Game is the active instance (default 3×3, k=3).
// Switch via: Lab.moduleB.Game = Lab.moduleB.createGame(4, 4);
(function () {
  // Generate all winning lines of exactly k consecutive cells.
  function generateLines(size, k) {
    var lines = [];
    var r, c, i, line;
    // Rows
    for (r = 0; r < size; r++) {
      for (c = 0; c <= size - k; c++) {
        line = [];
        for (i = 0; i < k; i++) line.push(r * size + c + i);
        lines.push(line);
      }
    }
    // Columns
    for (c = 0; c < size; c++) {
      for (r = 0; r <= size - k; r++) {
        line = [];
        for (i = 0; i < k; i++) line.push((r + i) * size + c);
        lines.push(line);
      }
    }
    // Diagonals (top-left → bottom-right)
    for (r = 0; r <= size - k; r++) {
      for (c = 0; c <= size - k; c++) {
        line = [];
        for (i = 0; i < k; i++) line.push((r + i) * size + (c + i));
        lines.push(line);
      }
    }
    // Anti-diagonals (top-right → bottom-left)
    for (r = 0; r <= size - k; r++) {
      for (c = k - 1; c < size; c++) {
        line = [];
        for (i = 0; i < k; i++) line.push((r + i) * size + (c - i));
        lines.push(line);
      }
    }
    return lines;
  }

  function createGame(size, k) {
    size = size || 3;
    k    = k    || 3;
    var N = size * size;
    var LINES = generateLines(size, k);

    function emptyBoard() {
      var b = [];
      for (var i = 0; i < N; i++) b.push(null);
      return b;
    }

    function legalMoves(board) {
      var moves = [];
      for (var i = 0; i < N; i++) if (board[i] === null) moves.push(i);
      return moves;
    }

    function winnerInfo(board) {
      for (var i = 0; i < LINES.length; i++) {
        var line = LINES[i];
        var first = board[line[0]];
        if (!first) continue;
        var win = true;
        for (var j = 1; j < line.length; j++) {
          if (board[line[j]] !== first) { win = false; break; }
        }
        if (win) return { winner: first, line: line };
      }
      return null;
    }

    function winner(board) {
      var info = winnerInfo(board);
      return info ? info.winner : null;
    }

    function isFull(board) {
      for (var i = 0; i < N; i++) if (board[i] === null) return false;
      return true;
    }

    function isTerminal(board) { return winner(board) !== null || isFull(board); }
    function other(player) { return player === 'X' ? 'O' : 'X'; }

    // Heuristic evaluation for depth-limited search.
    // Open lines score exponentially by the number of own pieces in them.
    function evaluate(board, ai) {
      var opp = other(ai);
      var score = 0;
      for (var i = 0; i < LINES.length; i++) {
        var line = LINES[i];
        var aiCount = 0, oppCount = 0;
        for (var j = 0; j < line.length; j++) {
          if      (board[line[j]] === ai)  aiCount++;
          else if (board[line[j]] === opp) oppCount++;
        }
        if (oppCount === 0 && aiCount > 0) score += Math.pow(10, aiCount - 1);
        if (aiCount === 0 && oppCount > 0) score -= Math.pow(10, oppCount - 1);
      }
      return score;
    }

    return {
      LINES: LINES, size: size, k: k, boardSize: N,
      emptyBoard: emptyBoard, legalMoves: legalMoves,
      winner: winner, winnerInfo: winnerInfo,
      isFull: isFull, isTerminal: isTerminal,
      other: other, evaluate: evaluate
    };
  }

  Lab.moduleB.createGame = createGame;
  Lab.moduleB.Game = createGame(3, 3); // default 3×3 — backward compatible
})();
