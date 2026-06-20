// Alpha-Beta pruning — identical decisions to Minimax, fewer nodes visited.
// Same scoring convention. bestMove() returns { move, score, nodes, timeMs }.
//
// Pruning rate is computed by the UI as 1 - (abNodes / minimaxNodes) on the
// same position. The rate depends heavily on move ordering; this version uses
// natural left-to-right ordering and reports the honest number.
(function () {
  var G = Lab.moduleB.Game;

  function search(board, current, ai, depth, alpha, beta, counter) {
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
      var result = search(board, G.other(current), ai, depth + 1, alpha, beta, counter);
      board[m] = null;

      if (maximizing) {
        if (result.score > best.score) { best.score = result.score; best.move = m; }
        if (best.score > alpha) alpha = best.score;
      } else {
        if (result.score < best.score) { best.score = result.score; best.move = m; }
        if (best.score < beta) beta = best.score;
      }
      if (beta <= alpha) break; // prune remaining siblings
    }
    return best;
  }

  Lab.moduleB.alphabeta = function (board, aiPlayer) {
    var t0 = performance.now();
    var counter = { nodes: 0 };
    var result = search(board.slice(), aiPlayer, aiPlayer, 0, -Infinity, Infinity, counter);
    return { move: result.move, score: result.score, nodes: counter.nodes, timeMs: performance.now() - t0 };
  };
})();
