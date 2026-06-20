// Minimax for Tic-Tac-Toe.
// Score is from the perspective of the AI player passed to bestMove():
//   +(10 - depth) for an AI win, -(10 - depth) for an AI loss, 0 for a draw.
// Subtracting depth makes the AI prefer faster wins and slower losses.
//
// bestMove() returns { move, score, nodes } where nodes counts every game-tree
// node visited (the metric compared against Alpha-Beta).
(function () {
  var G = Lab.moduleB.Game;

  function search(board, current, ai, depth, counter) {
    counter.nodes++;
    var w = G.winner(board);
    if (w === ai) return { score: 10 - depth };
    if (w === G.other(ai)) return { score: depth - 10 };
    if (G.isFull(board)) return { score: 0 };

    var moves = G.legalMoves(board);
    var maximizing = (current === ai);
    var best = { score: maximizing ? -Infinity : Infinity, move: moves[0] };

    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      board[m] = current;
      var result = search(board, G.other(current), ai, depth + 1, counter);
      board[m] = null;
      if (maximizing) {
        if (result.score > best.score) { best.score = result.score; best.move = m; }
      } else {
        if (result.score < best.score) { best.score = result.score; best.move = m; }
      }
    }
    return best;
  }

  Lab.moduleB.minimax = function (board, aiPlayer) {
    var t0 = performance.now();
    var counter = { nodes: 0 };
    var result = search(board.slice(), aiPlayer, aiPlayer, 0, counter);
    return { move: result.move, score: result.score, nodes: counter.nodes, timeMs: performance.now() - t0 };
  };
})();
