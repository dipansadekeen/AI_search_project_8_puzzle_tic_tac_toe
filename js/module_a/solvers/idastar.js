// Algorithm — IDA* (Iterative Deepening A*).
//
// Combines the memory efficiency of DFS with the optimality of A*.
// Each iteration is a depth-first search that prunes any branch whose
// f(n) = g(n) + h(n) exceeds the current threshold.  When a threshold is
// exceeded, the minimum f-value seen beyond it becomes the next threshold.
//
// Completeness: yes (finite state space, cycle detection on the current path).
// Optimality:   yes (admissible heuristic → threshold never skips the optimum).
// Memory:       O(d) — only the current path is kept, not a full open list.
//
// nodesExpanded counts every node visited across ALL iterations so the
// dashboard can compare total work against A*.
//
// Returns { found, path, nodesExpanded, frontierMax, timeMs }.
(function () {
  Lab.moduleA.solvers.idastar = function (start, heuristic) {
    var P = Lab.moduleA.Puzzle;
    var h = heuristic || P.manhattan;
    var t0 = performance.now();

    var nodesExpanded = 0;
    var maxDepthReached = 0;
    var threshold = h(start);
    var path = [start];
    var inPath = {}; inPath[start] = true; // cycle guard for current path only

    // Recursive DFS bounded by the current threshold.
    // Returns -1 when the goal is found; otherwise the minimum f that exceeded
    // the threshold (used to set the next threshold).
    function search(g) {
      var s = path[path.length - 1];
      var f = g + h(s);
      if (f > threshold) return f;

      nodesExpanded++;
      if (path.length > maxDepthReached) maxDepthReached = path.length;

      if (s === P.GOAL) return -1; // found

      var nextMin = Infinity;
      var succ = P.neighbors(s);
      for (var i = 0; i < succ.length; i++) {
        var ns = succ[i].state;
        if (inPath[ns]) continue; // skip states already on the current path
        inPath[ns] = true;
        path.push(ns);
        var t = search(g + 1);
        if (t === -1) return -1; // propagate the "found" signal up
        if (t < nextMin) nextMin = t;
        path.pop();
        delete inPath[ns];
      }
      return nextMin;
    }

    while (true) {
      var result = search(0);

      if (result === -1) {
        return {
          found: true,
          path: path.slice(),
          nodesExpanded: nodesExpanded,
          frontierMax: maxDepthReached,
          timeMs: performance.now() - t0
        };
      }
      if (result === Infinity) {
        return {
          found: false, path: [],
          nodesExpanded: nodesExpanded,
          frontierMax: maxDepthReached,
          timeMs: performance.now() - t0
        };
      }

      // Raise the threshold and restart.
      threshold = result;
      path = [start];
      inPath = {}; inPath[start] = true;
    }
  };
})();
