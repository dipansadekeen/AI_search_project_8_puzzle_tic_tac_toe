// Module A UI controller: 8-puzzle / 15-puzzle solver.
// Supports 3×3 (default) and 4×4 grid sizes selectable at runtime.
// BFS and Dijkstra are disabled for 4×4 (impractical state space).
(function () {
  var S = Lab.shared;

  var TEST_PUZZLE_3 = '813402765'; // 3×3 standard — optimal depth 14

  Lab.moduleA.init = function (root) {
    var boardEl  = S.$('.puzzle-board', root);
    var statusEl = S.$('#a-status', root);
    var bannerEl = S.$('#a-banner', root);
    var algoSel  = S.$('#a-algo', root);
    var speedEl  = S.$('#a-speed', root);
    var sizeSel  = S.$('#a-size', root);

    var dashboard = Lab.shared.createDashboard(S.$('#a-dashboard', root), [
      { key: 'algo',   label: 'Algorithm' },
      { key: 'time',   label: 'Decision time' },
      { key: 'nodes',  label: 'Nodes expanded' },
      { key: 'length', label: 'Solution length' }
    ]);

    function P() { return Lab.moduleA.Puzzle; } // always the active puzzle

    var state = TEST_PUZZLE_3;
    var tileMode = 'number';
    var pieces   = null;
    var moveCount = 0;
    var solving   = false;
    var tileEls   = {};        // numeric value → DOM element
    var manualHistory = [];

    // ---- tile DOM ----
    function buildTiles() {
      boardEl.innerHTML = '';
      tileEls = {};
      var puzzle = P();
      boardEl.classList.toggle('size-4', puzzle.gridSize === 4);
      for (var v = 1; v < puzzle.size; v++) {
        (function (val) {
          var t = S.el('div', { class: 'tile', 'data-val': val });
          t.textContent = String(val);
          t.addEventListener('click', function () { onTileClick(val); });
          tileEls[val] = t;
          boardEl.appendChild(t);
        })(v);
      }
      updateGoalPreview();
    }

    function updateGoalPreview() {
      var miniGrid = S.$('.mini-grid', root);
      if (!miniGrid) return;
      var puzzle = P();
      miniGrid.innerHTML = '';
      miniGrid.style.gridTemplateColumns = 'repeat(' + puzzle.gridSize + ', 14px)';
      miniGrid.style.gridTemplateRows    = 'repeat(' + puzzle.gridSize + ', 14px)';
      for (var i = 0; i < puzzle.size; i++) {
        var d = document.createElement('div');
        if (i === puzzle.size - 1) { d.className = 'blank'; }
        else { d.textContent = String(i + 1); }
        miniGrid.appendChild(d);
      }
    }

    function idxToTransform(index) {
      var G = P().gridSize;
      var r = Math.floor(index / G), c = index % G;
      return 'translate(calc(' + c + ' * var(--cell)), calc(' + r + ' * var(--cell)))';
    }

    function isAdjToBlank(i, blank) {
      var G = P().gridSize;
      return Math.abs(Math.floor(i / G) - Math.floor(blank / G)) +
             Math.abs((i % G) - (blank % G)) === 1;
    }

    function render(animate) {
      var puzzle = P();
      if (!animate) boardEl.classList.add('no-anim');
      var blank = state.indexOf('0');
      for (var v = 1; v < puzzle.size; v++) {
        var el = tileEls[v];
        if (!el) continue;
        var index = state.indexOf(puzzle.encode(v));
        el.style.transform = idxToTransform(index);

        if (tileMode === 'image' && pieces && pieces[v - 1]) {
          el.classList.add('image');
          el.style.backgroundImage = 'url(' + pieces[v - 1] + ')';
          el.innerHTML = '<span class="num-badge">' + v + '</span>';
        } else {
          el.classList.remove('image');
          el.style.backgroundImage = '';
          el.textContent = String(v);
        }

        var movable = !solving && isAdjToBlank(index, blank);
        el.classList.toggle('movable', movable);
        el.classList.toggle('locked', solving);
      }
      if (!animate) {
        void boardEl.offsetWidth;
        boardEl.classList.remove('no-anim');
      }
    }

    // ---- manual play ----
    function onTileClick(val) {
      if (solving) return;
      var puzzle = P();
      var index  = state.indexOf(puzzle.encode(val));
      var blank  = state.indexOf('0');
      if (!isAdjToBlank(index, blank)) return;
      manualHistory.push(state);
      var arr = state.split('');
      arr[blank] = arr[index]; arr[index] = '0';
      state = arr.join('');
      moveCount++;
      render(true);
      Lab.shared.sounds.tileMove();
      updateStatus();
      if (puzzle.isGoal(state)) {
        Lab.shared.sounds.solved();
        showSolved('Solved by hand in ' + moveCount + ' moves.');
      }
    }

    function undoManual() {
      if (solving || manualHistory.length === 0) return;
      state = manualHistory.pop();
      moveCount = Math.max(0, moveCount - 1);
      bannerEl.classList.remove('show');
      render(false);
      updateStatus();
    }

    // ---- status ----
    function updateStatus(msg) {
      bannerEl.classList.remove('show');
      if (msg) { statusEl.innerHTML = msg; return; }
      statusEl.innerHTML = solving
        ? 'Playing solution&hellip;'
        : 'Manual moves: <b>' + moveCount + '</b> &middot; ' +
          (P().isGoal(state) ? 'goal state' : 'click a tile next to the gap');
    }

    function showSolved(text) {
      bannerEl.textContent = text;
      bannerEl.classList.add('show');
    }

    // ---- algorithm selector ----
    function updateAlgoOptions() {
      var is4 = P().gridSize === 4;
      var opts = algoSel.options;
      for (var i = 0; i < opts.length; i++) {
        var slow = opts[i].value === 'bfs' || opts[i].value === 'dijkstra';
        opts[i].disabled = is4 && slow;
        opts[i].title    = (is4 && slow) ? 'Too slow for 4×4 — use A*, Greedy, or IDA*' : '';
      }
      if (algoSel.options[algoSel.selectedIndex] &&
          algoSel.options[algoSel.selectedIndex].disabled) {
        algoSel.value = 'astar';
      }
    }

    function algoLabel(a) {
      if (a === 'bfs')      return 'BFS (blind)';
      if (a === 'dijkstra') return 'Dijkstra';
      if (a === 'greedy')   return 'Greedy Best-First';
      if (a === 'idastar')  return 'IDA*';
      return 'A* (Manhattan)';
    }

    // ---- playback ----
    var player = Lab.moduleA.createPlayer({
      onStep: function (st, i, total) {
        state = st;
        render(true);
        Lab.shared.sounds.tileMove();
        statusEl.innerHTML = 'Step <b>' + i + '</b> / ' + total;
        if (i === total && P().isGoal(state)) {
          Lab.shared.sounds.solved();
          showSolved('Reached goal in ' + total + ' optimal moves.');
        }
      },
      onDone: function () { setSolving(false); },
      speed: function () { return 720 - parseInt(speedEl.value, 10); }
    });

    function setSolving(on) {
      solving = on;
      S.$('#a-play',    root).disabled = on;
      S.$('#a-shuffle', root).disabled = on;
      S.$('#a-test',    root).disabled = on;
      render(false);
      if (!on) updateStatus();
    }

    function solve() {
      bannerEl.classList.remove('show');
      var puzzle = P();
      if (!puzzle.isSolvable(state)) { updateStatus('This configuration is unsolvable.'); return; }
      var algo = algoSel.value;
      var fn   = Lab.moduleA.solvers[algo];
      statusEl.textContent = 'Searching with ' + algoLabel(algo) + '…';
      setTimeout(function () {
        var res = fn(state);
        dashboard.set('algo',   algoLabel(algo));
        dashboard.set('time',   S.fmtMs(res.timeMs));
        dashboard.set('nodes',  S.fmtInt(res.nodesExpanded));
        dashboard.set('length', res.found ? (res.path.length - 1) + ' moves' : 'none');
        if (!res.found) { statusEl.textContent = 'No solution found.'; return; }
        setSolving(true);
        player.load(res.path);
        player.play();
      }, 30);
    }

    function shuffle() {
      player.pause(); setSolving(false);
      state = P().randomSolvable();
      moveCount = 0; manualHistory = [];
      pieces = null; tileMode = 'number';
      dashboard.reset();
      render(false); updateStatus();
    }

    function loadTest() {
      player.pause(); setSolving(false);
      if (P().gridSize === 3) {
        state = TEST_PUZZLE_3;
        updateStatus('Loaded standard test puzzle &middot; optimal depth <b>14</b>');
      } else {
        state = P().randomSolvable();
        updateStatus('Random 4×4 puzzle loaded &middot; use A*, Greedy, or IDA*');
      }
      moveCount = 0; manualHistory = [];
      pieces = null; tileMode = 'number';
      dashboard.reset();
      render(false);
    }

    // ---- grid size switch ----
    function switchSize(gs) {
      player.pause(); setSolving(false);
      Lab.moduleA.Puzzle = Lab.moduleA.createPuzzle(gs);
      buildTiles();
      state = Lab.moduleA.Puzzle.randomSolvable();
      moveCount = 0; manualHistory = [];
      pieces = null; tileMode = 'number';
      dashboard.reset();
      updateAlgoOptions();
      render(false);
      updateStatus('Switched to ' + gs + '×' + gs +
        (gs === 4 ? ' — BFS/Dijkstra disabled (too slow for 15-puzzle)' : ''));
    }

    // ---- save / load ----
    function savePuzzle() {
      var data = { state: state, moveCount: moveCount, gridSize: P().gridSize };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'puzzle.json'; a.click();
      URL.revokeObjectURL(url);
    }

    function applyLoadedPuzzle(text) {
      try {
        var data = JSON.parse(text);
        var gs   = data.gridSize || 3;
        var expectedLen = gs * gs;
        if (typeof data.state !== 'string' || data.state.length !== expectedLen) {
          statusEl.textContent = 'Invalid puzzle file.'; return;
        }
        if (gs !== P().gridSize) {
          if (sizeSel) sizeSel.value = String(gs);
          Lab.moduleA.Puzzle = Lab.moduleA.createPuzzle(gs);
          buildTiles();
          updateAlgoOptions();
        }
        player.pause(); setSolving(false);
        state     = data.state;
        moveCount = typeof data.moveCount === 'number' ? data.moveCount : 0;
        manualHistory = [];
        pieces = null; tileMode = 'number';
        dashboard.reset();
        render(false);
        updateStatus('Puzzle loaded — ' + (P().isSolvable(state) ? 'solvable' : 'unsolvable') + '.');
      } catch (e) {
        statusEl.textContent = 'Could not read puzzle file.';
      }
    }

    // ---- wire controls ----
    S.$('#a-shuffle',  root).addEventListener('click', shuffle);
    S.$('#a-test',     root).addEventListener('click', loadTest);
    S.$('#a-play',     root).addEventListener('click', solve);
    S.$('#a-step',     root).addEventListener('click', function () { if (player.total()) { solving = true; render(false); player.step(); } });
    S.$('#a-back',     root).addEventListener('click', function () { if (player.total()) { solving = true; render(false); player.stepBack(); } });
    S.$('#a-pause',    root).addEventListener('click', function () { player.pause(); setSolving(false); });
    S.$('#a-undo',     root).addEventListener('click', undoManual);
    S.$('#a-save',     root).addEventListener('click', savePuzzle);

    if (sizeSel) sizeSel.addEventListener('change', function () {
      switchSize(parseInt(sizeSel.value, 10));
    });

    // image upload
    var fileInput = S.$('#a-file', root);
    S.$('#a-upload', root).addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      statusEl.textContent = 'Slicing image…';
      Lab.moduleA.sliceImage(f, P().gridSize).then(function (p) {
        pieces = p; tileMode = 'image'; render(false);
        updateStatus('Image loaded &middot; ' + (P().isGoal(state) ? 'shuffle to scramble it' : 'ready'));
      }).catch(function (err) {
        statusEl.textContent = err.message || 'Could not process image.';
      });
      fileInput.value = '';
    });
    S.$('#a-numbers', root).addEventListener('click', function () {
      tileMode = 'number'; pieces = null; render(false); updateStatus();
    });

    var loadFileInput = S.$('#a-load-file', root);
    S.$('#a-load-btn', root).addEventListener('click', function () { loadFileInput.click(); });
    loadFileInput.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { applyLoadedPuzzle(reader.result); };
      reader.readAsText(f);
      loadFileInput.value = '';
    });

    // initial setup
    buildTiles();
    updateAlgoOptions();
    render(false);
    updateStatus('Loaded standard test puzzle &middot; optimal depth <b>14</b>');
  };
})();
