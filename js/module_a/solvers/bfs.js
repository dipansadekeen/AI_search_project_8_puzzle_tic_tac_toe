// Algorithm 1 — Blind search (Breadth-First Search).
// BFS is chosen over DFS because on unit-cost moves it is complete AND
// optimal, and on the standard depth-14 test puzzle it expands on the order
// of a few thousand nodes (the expected ballpark). Plain DFS would wander
// into very long non-optimal paths over the ~181k reachable states.
//
// Returns { found, path, nodesExpanded, frontierMax, timeMs }.
//   nodesExpanded = states dequeued and expanded (neighbors generated).
(function () {
  var P = Lab.moduleA.Puzzle;
  var reconstruct = Lab.moduleA.reconstruct;

  Lab.moduleA.solvers.bfs = function (start) {
    var t0 = performance.now();
    if (P.isGoal(start)) {
      return { found: true, path: [start], nodesExpanded: 0, frontierMax: 1, timeMs: 0 };
    }
    var queue = [start];
    var head = 0;
    var cameFrom = {}; cameFrom[start] = null;
    var visited = {}; visited[start] = true;
    var nodesExpanded = 0, frontierMax = 1;

    while (head < queue.length) {
      var s = queue[head++];
      nodesExpanded++;
      var succ = P.neighbors(s);
      for (var i = 0; i < succ.length; i++) {
        var ns = succ[i].state;
        if (visited[ns]) continue;
        visited[ns] = true;
        cameFrom[ns] = s;
        if (ns === P.GOAL) {
          return {
            found: true,
            path: reconstruct(cameFrom, ns),
            nodesExpanded: nodesExpanded,
            frontierMax: frontierMax,
            timeMs: performance.now() - t0
          };
        }
        queue.push(ns);
      }
      var frontier = queue.length - head;
      if (frontier > frontierMax) frontierMax = frontier;
    }
    return { found: false, path: [], nodesExpanded: nodesExpanded, frontierMax: frontierMax, timeMs: performance.now() - t0 };
  };
})();
