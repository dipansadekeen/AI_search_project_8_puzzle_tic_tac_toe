// Binary min-heap priority queue. Shared by Dijkstra and A*.
// push(item, priority) / pop() -> item with lowest priority.
(function () {
  function MinHeap() {
    this._heap = []; // each entry: { item, priority }
  }
  MinHeap.prototype.size = function () { return this._heap.length; };
  MinHeap.prototype.isEmpty = function () { return this._heap.length === 0; };

  MinHeap.prototype.push = function (item, priority) {
    var h = this._heap;
    h.push({ item: item, priority: priority });
    var i = h.length - 1;
    while (i > 0) {
      var parent = (i - 1) >> 1;
      if (h[parent].priority <= h[i].priority) break;
      var tmp = h[parent]; h[parent] = h[i]; h[i] = tmp;
      i = parent;
    }
  };

  MinHeap.prototype.pop = function () {
    var h = this._heap;
    if (h.length === 0) return undefined;
    var top = h[0];
    var last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      var i = 0, n = h.length;
      while (true) {
        var l = 2 * i + 1, r = 2 * i + 2, smallest = i;
        if (l < n && h[l].priority < h[smallest].priority) smallest = l;
        if (r < n && h[r].priority < h[smallest].priority) smallest = r;
        if (smallest === i) break;
        var tmp = h[smallest]; h[smallest] = h[i]; h[i] = tmp;
        i = smallest;
      }
    }
    return top.item;
  };

  Lab.shared.MinHeap = MinHeap;
})();
