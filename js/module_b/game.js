// Tic-Tac-Toe game model — configurable board size and k-in-a-row.
// Board: flat array of size*size cells, each 'X', 'O', or null.
// Lab.moduleB.Game is the active instance (default 3×3, k=3).
// Switch via: Lab.moduleB.Game = Lab.moduleB.createGame(4, 4);
(function () {

  // Pre-computes every possible winning line of exactly k consecutive cells.
  // Covers rows, columns, left-diagonals, and right-diagonals (anti-diagonals).
  // Called once at game creation; the result is reused by all board checks.
  function generateLines(size, k) {
    var lines = [];
    var r, c, i, line;

    // Rows: k consecutive cells along a single row
    for (r = 0; r < size; r++) {
      for (c = 0; c <= size - k; c++) {
        line = [];
        for (i = 0; i < k; i++) line.push(r * size + c + i);
        lines.push(line);
      }
    }

    // Columns: k consecutive cells along a single column
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
    var N     = size * size;
    var LINES = generateLines(size, k); // cached winning lines

    // Creates a new board with every cell set to null (empty).
    function emptyBoard() {
      var b = [];
      for (var i = 0; i < N; i++) b.push(null);
      return b;
    }

    // Returns an array of cell indices that are currently empty (legal moves).
    function legalMoves(board) {
      var moves = [];
      for (var i = 0; i < N; i++) if (board[i] === null) moves.push(i);
      return moves;
    }

    // Scans every winning line; returns { winner, line } for the first complete
    // line found, or null if no player has won yet.
    function winnerInfo(board) {
      for (var i = 0; i < LINES.length; i++) {
        var line  = LINES[i];
        var first = board[line[0]];
        if (!first) continue; // skip lines with an empty first cell
        var win = true;
        for (var j = 1; j < line.length; j++) {
          if (board[line[j]] !== first) { win = false; break; }
        }
        if (win) return { winner: first, line: line };
      }
      return null;
    }

    // Convenience wrapper returning just the winning player string, or null.
    function winner(board) {
      var info = winnerInfo(board);
      return info ? info.winner : null;
    }

    // Returns true when every cell is occupied (no legal moves remain).
    function isFull(board) {
      for (var i = 0; i < N; i++) if (board[i] === null) return false;
      return true;
    }

    // Returns true when the position is terminal: someone has won or the board is full.
    function isTerminal(board) { return winner(board) !== null || isFull(board); }

    // Returns the opponent of the given player ('X' ↔ 'O').
    function other(player) { return player === 'X' ? 'O' : 'X'; }

    // Heuristic evaluation function for depth-limited search (used for 4×4 boards).
    // Scores open lines exponentially by the number of own pieces in them:
    //   1 piece → +1, 2 pieces → +10, 3 pieces → +100, etc.
    // Opponent-only lines subtract symmetrically.
    // Lines containing both players are inert (blocked, no threat value).
    function evaluate(board, ai) {
      var opp   = other(ai);
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
