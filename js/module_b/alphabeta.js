// Alpha-Beta pruning — identical decisions to Minimax, fewer nodes visited.
// Same scoring convention and opts parameter as minimax.js.
// Pruning rate is computed by the UI as 1 - (abNodes / minimaxNodes).
// bestMove() returns { move, score, nodes, timeMs }.
(function () {
  function search(board, current, ai, depth, alpha, beta, maxDepth, WIN_SCORE, G, counter, evalFn) {
    counter.nodes++;
    var w = G.winner(board);
    if (w === ai)          return { score: WIN_SCORE - depth };
    if (w === G.other(ai)) return { score: depth - WIN_SCORE };
    if (G.isFull(board))   return { score: 0 };
    if (depth >= maxDepth) return { score: evalFn ? evalFn(board, ai) : 0 };

    var moves = G.legalMoves(board);
    var maximizing = (current === ai);
    var best = { score: maximizing ? -Infinity : Infinity, move: moves[0] };

    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      board[m] = current;
      var result = search(board, G.other(current), ai, depth + 1, alpha, beta, maxDepth, WIN_SCORE, G, counter, evalFn);
      board[m] = null;

      if (maximizing) {
        if (result.score > best.score) { best.score = result.score; best.move = m; }
        if (best.score > alpha) alpha = best.score;
      } else {
        if (result.score < best.score) { best.score = result.score; best.move = m; }
        if (best.score < beta)  beta  = best.score;
      }
      if (beta <= alpha) break; // prune remaining siblings
    }
    return best;
  }

  Lab.moduleB.alphabeta = function (board, aiPlayer, opts) {
    var G = Lab.moduleB.Game; // look up active game at call time
    var t0 = performance.now();
    var counter = { nodes: 0 };
    var maxDepth = (opts && opts.maxDepth != null) ? opts.maxDepth : Infinity;
    var WIN_SCORE = (maxDepth < Infinity) ? 100000 : 10;
    var evalFn    = (opts && opts.evalFn)  || null;
    var result = search(board.slice(), aiPlayer, aiPlayer, 0, -Infinity, Infinity, maxDepth, WIN_SCORE, G, counter, evalFn);
    return { move: result.move, score: result.score, nodes: counter.nodes, timeMs: performance.now() - t0 };
  };
})();
