// Algorithm — Greedy Best-First Search.
// Expands the state that looks closest to the goal according to h(n) alone;
// g(n) (cost already paid) is deliberately ignored.  This makes it fast but
// not optimal: the path found may be longer than the true optimum.
//
// Completeness: yes, because a global visited set prevents revisiting states.
// Optimality:   no  — greedy can overshoot by chasing the heuristic.
//
// Returns { found, path, nodesExpanded, frontierMax, timeMs }.
(function () {
  Lab.moduleA.solvers.greedy = function (start, heuristic) {
    var P = Lab.moduleA.Puzzle;
    var reconstruct = Lab.moduleA.reconstruct;
    var MinHeap = Lab.shared.MinHeap;
    var h = heuristic || P.manhattan;

    var t0 = performance.now();
    if (P.isGoal(start)) {
      return { found: true, path: [start], nodesExpanded: 0, frontierMax: 1, timeMs: 0 };
    }

    var pq = new MinHeap();
    pq.push(start, h(start));
    var cameFrom = {}; cameFrom[start] = null;
    var visited = {}; visited[start] = true;
    var nodesExpanded = 0, frontierMax = 1;

    while (!pq.isEmpty()) {
      if (pq.size() > frontierMax) frontierMax = pq.size();
      var s = pq.pop();
      nodesExpanded++;

      if (s === P.GOAL) {
        return {
          found: true,
          path: reconstruct(cameFrom, s),
          nodesExpanded: nodesExpanded,
          frontierMax: frontierMax,
          timeMs: performance.now() - t0
        };
      }

      var succ = P.neighbors(s);
      for (var i = 0; i < succ.length; i++) {
        var ns = succ[i].state;
        if (visited[ns]) continue;
        visited[ns] = true;
        cameFrom[ns] = s;
        pq.push(ns, h(ns));
      }
    }

    return {
      found: false, path: [],
      nodesExpanded: nodesExpanded, frontierMax: frontierMax,
      timeMs: performance.now() - t0
    };
  };
})();
