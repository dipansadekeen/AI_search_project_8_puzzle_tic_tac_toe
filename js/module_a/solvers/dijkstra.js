// Algorithm 2 — Dijkstra (uniform-cost search).
// With unit-cost moves this behaves like BFS, which is exactly the point:
// the nodes-expanded counter lets you SEE that a heuristic (A*) is what
// actually cuts the work, not the queue discipline.
//
// We relax with strict "<" and read dist[s] at pop time (not the stored
// priority), so under unit costs each state is pushed and expanded exactly
// once and no stale-entry skip is required. If you ever generalize to
// weighted moves, add `if (popped_priority > dist[s]) continue;` after pop.
(function () {
  Lab.moduleA.solvers.dijkstra = function (start) {
    var P = Lab.moduleA.Puzzle;           // look up active puzzle at call time
    var reconstruct = Lab.moduleA.reconstruct;
    var MinHeap = Lab.shared.MinHeap;
    var t0 = performance.now();
    var dist = {}; dist[start] = 0;
    var cameFrom = {}; cameFrom[start] = null;
    var pq = new MinHeap();
    pq.push(start, 0);
    var nodesExpanded = 0, frontierMax = 1;

    while (!pq.isEmpty()) {
      if (pq.size() > frontierMax) frontierMax = pq.size();
      var s = pq.pop();
      var d = dist[s];

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
        var nd = d + 1;
        if (dist[ns] === undefined || nd < dist[ns]) {
          dist[ns] = nd;
          cameFrom[ns] = s;
          pq.push(ns, nd);
        }
      }
    }
    return { found: false, path: [], nodesExpanded: nodesExpanded, frontierMax: frontierMax, timeMs: performance.now() - t0 };
  };
})();
