// App shell: single entry point. Switches between the two modules and sets
// the body theme class so the accent color reflects which kind of search
// you're looking at (cyan = single-agent, amber = adversarial).
(function () {
  var S = Lab.shared;

  // Activates a module panel and its corresponding tab, updating aria attributes
  // and body theme class so CSS accent variables switch automatically.
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
    // Wire each tab button to the activate helper.
    S.$$('.tab').forEach(function (t) {
      t.addEventListener('click', function () { activate(t.dataset.target); });
    });

    Lab.moduleA.init(S.$('#module-a'));
    Lab.moduleB.init(S.$('#module-b'));

    activate('module-a');

    // ---- theme toggle ----

    // Syncs the button glyph and tooltip to the current html.light class state.
    var themeBtn = S.$('#theme-btn');
    function syncThemeBtn() {
      var isLight = document.documentElement.classList.contains('light');
      themeBtn.textContent = isLight ? '☾' : '☀'; // ☾ = switch to dark / ☀ = switch to light
      themeBtn.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    }
    syncThemeBtn(); // align with the class applied by the inline <head> anti-flash script
    themeBtn.addEventListener('click', function () {
      document.documentElement.classList.toggle('light');
      localStorage.setItem('lab-theme',
        document.documentElement.classList.contains('light') ? 'light' : 'dark');
      syncThemeBtn();
    });

    // ---- mute toggle ----

    // Syncs the mute button glyph and tooltip to Lab.shared.sounds.muted.
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
