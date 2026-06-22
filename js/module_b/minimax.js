// Minimax for Tic-Tac-Toe.
//
// Default (opts omitted): full game-tree search.
//   Evaluation: +10 (AI wins), -10 (opponent wins), 0 (draw) — per spec.
//
// Depth-limited (opts.maxDepth set): WIN_SCORE = 100000 so terminal states
//   always dominate heuristic leaf scores. opts.evalFn(board, ai) is called
//   at non-terminal leaves that hit the depth ceiling.
//
// bestMove() returns { move, score, nodes, timeMs }.
// nodes counts every game-tree node visited — compared against Alpha-Beta.
(function () {
  function search(board, current, ai, depth, maxDepth, WIN_SCORE, G, counter, evalFn) {
    counter.nodes++;
    var w = G.winner(board);
    if (w === ai)          return { score:  WIN_SCORE };  // +10 (AI wins)
    if (w === G.other(ai)) return { score: -WIN_SCORE };  // -10 (opponent wins)
    if (G.isFull(board))   return { score: 0 };           //   0 (draw)
    if (depth >= maxDepth) return { score: evalFn ? evalFn(board, ai) : 0 };

    var moves = G.legalMoves(board);
    var maximizing = (current === ai);
    var best = { score: maximizing ? -Infinity : Infinity, move: moves[0] };

    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      board[m] = current;
      var result = search(board, G.other(current), ai, depth + 1, maxDepth, WIN_SCORE, G, counter, evalFn);
      board[m] = null;
      if (maximizing) {
        if (result.score > best.score) { best.score = result.score; best.move = m; }
      } else {
        if (result.score < best.score) { best.score = result.score; best.move = m; }
      }
    }
    return best;
  }

  Lab.moduleB.minimax = function (board, aiPlayer, opts) {
    var G = Lab.moduleB.Game; // look up active game at call time
    var t0 = performance.now();
    var counter = { nodes: 0 };
    var maxDepth = (opts && opts.maxDepth != null) ? opts.maxDepth : Infinity;
    var WIN_SCORE = (maxDepth < Infinity) ? 100000 : 10; // backward-compatible default
    var evalFn    = (opts && opts.evalFn)  || null;
    var result = search(board.slice(), aiPlayer, aiPlayer, 0, maxDepth, WIN_SCORE, G, counter, evalFn);
    return { move: result.move, score: result.score, nodes: counter.nodes, timeMs: performance.now() - t0 };
  };
})();
