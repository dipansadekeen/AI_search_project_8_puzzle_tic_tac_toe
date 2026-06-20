// Path reconstruction shared by all three solvers.
// cameFrom maps state -> predecessor state. Returns [start, ..., goal].
(function () {
  Lab.moduleA.reconstruct = function (cameFrom, goal) {
    var path = [goal];
    var cur = goal;
    while (cameFrom[cur] !== null && cameFrom[cur] !== undefined) {
      cur = cameFrom[cur];
      path.push(cur);
    }
    path.reverse();
    return path;
  };
})();
