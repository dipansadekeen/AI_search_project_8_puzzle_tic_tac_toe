// Small DOM + timing helpers shared across modules.
(function () {
  // Returns the first element matching `sel` within `root` (or document).
  Lab.shared.$ = function (sel, root) {
    return (root || document).querySelector(sel);
  };

  // Returns all elements matching `sel` as a plain Array.
  Lab.shared.$$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  // Creates a DOM element with optional attribute map and child nodes.
  // Handles 'class' and 'text' as special keys for className and textContent.
  Lab.shared.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  };

  // Returns a Promise that resolves after `ms` milliseconds.
  Lab.shared.sleep = function (ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  };

  // Formats a millisecond value for the dashboard: sub-ms → 3 decimals,
  // sub-second → 1 decimal, otherwise converts to seconds.
  Lab.shared.fmtMs = function (ms) {
    if (ms < 1) return ms.toFixed(3) + ' ms';
    if (ms < 1000) return ms.toFixed(1) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  };

  // Formats a large integer with locale-aware thousands separators (e.g. 1,234).
  Lab.shared.fmtInt = function (n) {
    return n.toLocaleString('en-US');
  };
})();
