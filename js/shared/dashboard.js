// Shared performance dashboard component.
// One implementation, instantiated by both modules with their own field set,
// so algorithm behavior is observable and comparable side by side.
//
//   var dash = Lab.shared.createDashboard(container, [
//     { key: 'algo',  label: 'Algorithm' },
//     { key: 'time',  label: 'Decision time' },
//     { key: 'nodes', label: 'Nodes expanded' },
//   ]);
//   dash.set('nodes', 1234);
//
(function () {
  Lab.shared.createDashboard = function (container, fields) {
    container.innerHTML = '';
    container.classList.add('dashboard');
    var cells = {};

    fields.forEach(function (f) {
      var cell = document.createElement('div');
      cell.className = 'dash-cell';

      var label = document.createElement('div');
      label.className = 'dash-label';
      label.textContent = f.label;

      var value = document.createElement('div');
      value.className = 'dash-value';
      value.textContent = '--';

      cell.appendChild(label);
      cell.appendChild(value);
      container.appendChild(cell);
      cells[f.key] = value;
    });

    function set(key, text) {
      var node = cells[key];
      if (!node) return;
      node.textContent = (text === undefined || text === null) ? '--' : text;
      // brief flash so live updates are noticeable
      node.classList.remove('flash');
      void node.offsetWidth; // reflow to restart animation
      node.classList.add('flash');
    }

    function reset() {
      Object.keys(cells).forEach(function (k) { cells[k].textContent = '--'; });
    }

    return { set: set, reset: reset };
  };
})();
