// Small DOM + timing helpers shared across modules.
(function () {
  Lab.shared.$ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  Lab.shared.$$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
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
  Lab.shared.sleep = function (ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  };
  // Format a millisecond duration for the dashboard.
  Lab.shared.fmtMs = function (ms) {
    if (ms < 1) return ms.toFixed(3) + ' ms';
    if (ms < 1000) return ms.toFixed(1) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  };
  Lab.shared.fmtInt = function (n) {
    return n.toLocaleString('en-US');
  };
})();
