// Module A UI controller: board rendering, manual play, image upload,
// solver selection, and step-by-step solution playback.
(function () {
  var S = Lab.shared;
  var P = Lab.moduleA.Puzzle;

  var TEST_PUZZLE = '813402765'; // [[8,1,3],[4,0,2],[7,6,5]] — optimal depth 14

  Lab.moduleA.init = function (root) {
    var board = S.$('.puzzle-board', root);
    var statusEl = S.$('#a-status', root);
    var bannerEl = S.$('#a-banner', root);
    var algoSel = S.$('#a-algo', root);
    var speedEl = S.$('#a-speed', root);

    var dashboard = Lab.shared.createDashboard(S.$('#a-dashboard', root), [
      { key: 'algo', label: 'Algorithm' },
      { key: 'time', label: 'Decision time' },
      { key: 'nodes', label: 'Nodes expanded' },
      { key: 'length', label: 'Solution length' }
    ]);

    var state = TEST_PUZZLE;
    var tileMode = 'number';   // or 'image'
    var pieces = null;
    var moveCount = 0;
    var solving = false;
    var tileEls = {};          // value(1..8) -> element

    // ---- build persistent tile elements once ----
    for (var v = 1; v <= 8; v++) {
      (function (val) {
        var t = S.el('div', { class: 'tile', 'data-val': val });
        t.textContent = val;
        t.addEventListener('click', function () { onTileClick(val); });
        tileEls[val] = t;
        board.appendChild(t);
      })(v);
    }

    function idxToTransform(index) {
      var r = Math.floor(index / 3), c = index % 3;
      return 'translate(calc(' + c + ' * var(--cell)), calc(' + r + ' * var(--cell)))';
    }

    function render(animate) {
      if (!animate) board.classList.add('no-anim');
      var blank = state.indexOf('0');
      for (var v = 1; v <= 8; v++) {
        var index = state.indexOf(String(v));
        var el = tileEls[v];
        el.style.transform = idxToTransform(index);

        // appearance
        if (tileMode === 'image' && pieces) {
          el.classList.add('image');
          el.style.backgroundImage = 'url(' + pieces[v - 1] + ')';
          el.innerHTML = '<span class="num-badge">' + v + '</span>';
        } else {
          el.classList.remove('image');
          el.style.backgroundImage = '';
          el.textContent = String(v);
        }

        // movable highlight (adjacent to blank, and not currently solving)
        var movable = !solving && manhattanAdj(index, blank);
        el.classList.toggle('movable', movable);
        el.classList.toggle('locked', solving);
      }
      if (!animate) {
        void board.offsetWidth; // reflow to commit instantly
        board.classList.remove('no-anim');
      }
    }

    function manhattanAdj(i, j) {
      var ri = Math.floor(i / 3), ci = i % 3, rj = Math.floor(j / 3), cj = j % 3;
      return Math.abs(ri - rj) + Math.abs(ci - cj) === 1;
    }

    function onTileClick(val) {
      if (solving) return;
      var index = state.indexOf(String(val));
      var blank = state.indexOf('0');
      if (!manhattanAdj(index, blank)) return;
      var arr = state.split('');
      arr[blank] = arr[index];
      arr[index] = '0';
      state = arr.join('');
      moveCount++;
      render(true);
      updateStatus();
      if (P.isGoal(state)) showSolved('Solved by hand in ' + moveCount + ' moves.');
    }

    function updateStatus(msg) {
      bannerEl.classList.remove('show');
      if (msg) { statusEl.innerHTML = msg; return; }
      statusEl.innerHTML = solving
        ? 'Playing solution&hellip;'
        : 'Manual moves: <b>' + moveCount + '</b> &middot; ' +
          (P.isGoal(state) ? 'goal state' : 'click a tile next to the gap');
    }

    function showSolved(text) {
      bannerEl.textContent = text;
      bannerEl.classList.add('show');
    }

    // ---- playback player ----
    var player = Lab.moduleA.createPlayer({
      onStep: function (st, i, total) {
        state = st;
        render(true);
        statusEl.innerHTML = 'Step <b>' + i + '</b> / ' + total;
        if (i === total && P.isGoal(state)) showSolved('Reached goal in ' + total + ' optimal moves.');
      },
      onDone: function () { setSolving(false); },
      speed: function () { return 720 - parseInt(speedEl.value, 10); }
    });

    function setSolving(on) {
      solving = on;
      S.$('#a-play', root).disabled = on;
      S.$('#a-shuffle', root).disabled = on;
      S.$('#a-test', root).disabled = on;
      render(false);
      if (!on) updateStatus();
    }

    // ---- actions ----
    function solve() {
      bannerEl.classList.remove('show');
      if (!P.isSolvable(state)) { updateStatus('This configuration is unsolvable.'); return; }
      var algo = algoSel.value;
      var fn = Lab.moduleA.solvers[algo];
      statusEl.textContent = 'Searching with ' + algo.toUpperCase() + '\u2026';

      // let the status paint before the (synchronous) search runs
      setTimeout(function () {
        var res = fn(state);
        dashboard.set('algo', algoLabel(algo));
        dashboard.set('time', S.fmtMs(res.timeMs));
        dashboard.set('nodes', S.fmtInt(res.nodesExpanded));
        dashboard.set('length', res.found ? (res.path.length - 1) + ' moves' : 'none');
        if (!res.found) { statusEl.textContent = 'No solution found.'; return; }
        setSolving(true);
        player.load(res.path);
        player.play();
      }, 30);
    }

    function algoLabel(a) {
      return a === 'bfs' ? 'BFS (blind)' : a === 'dijkstra' ? 'Dijkstra' : 'A* (Manhattan)';
    }

    function shuffle() {
      player.pause(); setSolving(false);
      state = P.randomSolvable();
      moveCount = 0;
      dashboard.reset();
      render(false); updateStatus();
    }

    function loadTest() {
      player.pause(); setSolving(false);
      state = TEST_PUZZLE; moveCount = 0; dashboard.reset();
      render(false);
      updateStatus('Loaded standard test puzzle &middot; optimal depth <b>14</b>');
    }

    // ---- wire controls ----
    S.$('#a-shuffle', root).addEventListener('click', shuffle);
    S.$('#a-test', root).addEventListener('click', loadTest);
    S.$('#a-play', root).addEventListener('click', solve);
    S.$('#a-step', root).addEventListener('click', function () { if (player.total()) { setSolvingForStep(); player.step(); } });
    S.$('#a-back', root).addEventListener('click', function () { if (player.total()) { setSolvingForStep(); player.stepBack(); } });
    S.$('#a-pause', root).addEventListener('click', function () { player.pause(); setSolving(false); });

    function setSolvingForStep() { solving = true; render(false); }

    var fileInput = S.$('#a-file', root);
    S.$('#a-upload', root).addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      statusEl.textContent = 'Slicing image\u2026';
      Lab.moduleA.sliceImage(f).then(function (p) {
        pieces = p; tileMode = 'image'; render(false);
        updateStatus('Image loaded &middot; ' + (P.isGoal(state) ? 'shuffle to scramble it' : 'ready'));
      }).catch(function (err) {
        statusEl.textContent = err.message || 'Could not process image.';
      });
      fileInput.value = '';
    });
    S.$('#a-numbers', root).addEventListener('click', function () {
      tileMode = 'number'; pieces = null; render(false); updateStatus();
    });

    // initial paint
    render(false);
    updateStatus('Loaded standard test puzzle &middot; optimal depth <b>14</b>');
  };
})();
