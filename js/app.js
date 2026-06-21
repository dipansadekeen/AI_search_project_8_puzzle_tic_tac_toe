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

    // ---- theme toggle ----
    var themeBtn = S.$('#theme-btn');
    function syncThemeBtn() {
      var isLight = document.documentElement.classList.contains('light');
      themeBtn.textContent = isLight ? '☾' : '☀'; // ☾ dark / ☀ light
      themeBtn.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    }
    syncThemeBtn(); // sync with class applied by the inline <head> script
    themeBtn.addEventListener('click', function () {
      document.documentElement.classList.toggle('light');
      localStorage.setItem('lab-theme',
        document.documentElement.classList.contains('light') ? 'light' : 'dark');
      syncThemeBtn();
    });

    // ---- mute toggle ----
    var muteBtn = S.$('#mute-btn');
    function syncMuteBtn() {
      muteBtn.textContent = Lab.shared.sounds.muted ? '🔇' : '🔊';
      muteBtn.title = Lab.shared.sounds.muted ? 'Unmute sounds' : 'Mute sounds';
    }
    syncMuteBtn();
    muteBtn.addEventListener('click', function () {
      Lab.shared.sounds.muted = !Lab.shared.sounds.muted;
      localStorage.setItem('lab-mute', Lab.shared.sounds.muted ? '1' : '0');
      syncMuteBtn();
    });
  });
})();
