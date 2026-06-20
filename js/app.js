// App shell: single entry point. Switches between the two modules and sets
// the body theme class so the accent color reflects which kind of search
// you're looking at (cyan = single-agent, amber = adversarial).
(function () {
  var S = Lab.shared;

  function activate(which) {
    S.$$('.tab').forEach(function (t) {
      t.setAttribute('aria-selected', t.dataset.target === which ? 'true' : 'false');
    });
    S.$$('.panel').forEach(function (p) {
      p.classList.toggle('active', p.id === which);
    });
    document.body.classList.toggle('theme-a', which === 'module-a');
    document.body.classList.toggle('theme-b', which === 'module-b');
  }

  document.addEventListener('DOMContentLoaded', function () {
    S.$$('.tab').forEach(function (t) {
      t.addEventListener('click', function () { activate(t.dataset.target); });
    });

    Lab.moduleA.init(S.$('#module-a'));
    Lab.moduleB.init(S.$('#module-b'));

    activate('module-a');
  });
})();
