// Algorithm 3 — A* search with the Manhattan-distance heuristic.
//
// Admissibility: Manhattan distance counts the minimum number of slides each
// tile needs to reach its goal cell. A single move relocates one tile by one
// cell, reducing the total by at most 1, so the true solution cost can never
// be less than the sum of Manhattan distances — the heuristic never
// overestimates. Manhattan distance is also consistent, so closing a state on
// expansion is safe and A* still returns an optimal path.
//
// heuristic defaults to Manhattan; pass Lab.moduleA.Puzzle.misplaced to swap it.
(function () {
  Lab.moduleA.solvers.astar = function (start, heuristic) {
    var P = Lab.moduleA.Puzzle;           // look up active puzzle at call time
    var reconstruct = Lab.moduleA.reconstruct;
    var MinHeap = Lab.shared.MinHeap;
    var h = heuristic || P.manhattan;
    var t0 = performance.now();
    var g = {}; g[start] = 0;
    var cameFrom = {}; cameFrom[start] = null;
    var closed = {};
    var pq = new MinHeap();
    pq.push(start, h(start));
    var nodesExpanded = 0, frontierMax = 1;

    while (!pq.isEmpty()) {
      if (pq.size() > frontierMax) frontierMax = pq.size();
      var s = pq.pop();
      if (closed[s]) continue; // skip stale duplicate entries
      closed[s] = true;
      nodesExpanded++;

      if (s === P.GOAL) {
        return {
          found: true, path: reconstruct(cameFrom, s),
          nodesExpanded: nodesExpanded, frontierMax: frontierMax,
          timeMs: performance.now() - t0
        };
      }

      var succ = P.neighbors(s);
      for (var i = 0; i < succ.length; i++) {
        var ns = succ[i].state;
        if (closed[ns]) continue;
        var tentative = g[s] + 1;
        if (g[ns] === undefined || tentative < g[ns]) {
          g[ns] = tentative;
          cameFrom[ns] = s;
          pq.push(ns, tentative + h(ns));
        }
      }
    }
    return { found: false, path: [], nodesExpanded: nodesExpanded, frontierMax: frontierMax, timeMs: performance.now() - t0 };
  };
})();
