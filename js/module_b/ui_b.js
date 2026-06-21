// Module B UI controller: Tic-Tac-Toe.
// Supports 3×3 (classic, full Minimax) and 4×4 (depth-limited, k=4-in-a-row).
// Human vs AI, AI vs AI, Human vs Human modes; algorithm selectable per AI.
// Includes undo (HvA), save/load game state.
(function () {
  var S = Lab.shared;

  Lab.moduleB.init = function (root) {
    var boardEl    = S.$('.ttt-board', root);
    var resultEl   = S.$('#b-result', root);
    var statusEl   = S.$('#b-status', root);
    var modeSel    = S.$('#b-mode', root);
    var sideSel    = S.$('#b-side', root);
    var algoSel    = S.$('#b-algo', root);
    var algoXSel   = S.$('#b-algo-x', root);
    var algoOSel   = S.$('#b-algo-o', root);
    var sizeSel    = S.$('#b-size', root);
    var sideRow    = S.$('#b-side-row', root);
    var algoRow    = S.$('#b-algo-row', root);
    var algoAvaRow = S.$('#b-algo-ava-row', root);

    var dashboard = Lab.shared.createDashboard(S.$('#b-dashboard', root), [
      { key: 'algo',  label: 'Algorithm' },
      { key: 'time',  label: 'Decision time' },
      { key: 'nodes', label: 'Nodes explored' },
      { key: 'prune', label: 'Pruning rate' }
    ]);

    // Returns the currently active game model (may change when board size switches).
    function G() { return Lab.moduleB.Game; }

    var board     = G().emptyBoard();
    var current   = 'X';
    var cells     = [];
    var busy      = false;
    var over      = false;
    var snapshots = []; // undo stack — each entry is { board, current }

    // ---- cell DOM ----

    // Clears the board element and creates one div per cell for the active grid size.
    // Toggles the .size-4 CSS class so the board resizes correctly.
    function buildCells() {
      var game = G();
      boardEl.innerHTML = '';
      cells = [];
      boardEl.classList.toggle('size-4', game.size === 4);
      for (var i = 0; i < game.boardSize; i++) {
        (function (idx) {
          var c = S.el('div', { class: 'ttt-cell clickable', 'data-i': idx });
          c.addEventListener('click', function () { onCellClick(idx); });
          cells.push(c);
          boardEl.appendChild(c);
        })(i);
      }
    }

    // ---- mode helpers ----

    // Returns the currently selected game mode string ('hva', 'ava', or 'hvh').
    function mode() { return modeSel.value; }

    // Returns which side the human has chosen to play in HvA mode.
    function humanSide() { return sideSel ? sideSel.value : 'X'; }

    // Returns a { X: bool, O: bool } map indicating which players are AI-controlled.
    function aiPlayers() {
      if (mode() === 'ava') return { X: true, O: true };
      if (mode() === 'hvh') return { X: false, O: false };
      var human = humanSide();
      return human === 'X' ? { X: false, O: true } : { X: true, O: false };
    }

    // Returns the algorithm key ('alphabeta' or 'minimax') for the given player.
    // In AvA mode each player has its own selector.
    function algoForPlayer(player) {
      if (mode() === 'ava') return player === 'X' ? algoXSel.value : algoOSel.value;
      return algoSel.value;
    }

    // Returns depth-limit opts for 4×4 boards; undefined triggers full search on 3×3.
    // Adaptive depth: shallower early (more branches) and deeper as the board fills.
    function searchOpts(ai) {
      var game = G();
      if (game.size === 4) {
        var emptyCells = 0;
        for (var i = 0; i < board.length; i++) if (!board[i]) emptyCells++;
        var maxDepth = emptyCells > 10 ? 6 : 8;
        return { maxDepth: maxDepth, evalFn: function (b, a) { return game.evaluate(b, a); } };
      }
      return undefined;
    }

    // Shows or hides the side-selector and algorithm rows based on the current mode.
    function updateModeUI() {
      var m = mode();
      if (sideRow)    sideRow.style.display    = (m === 'hva') ? '' : 'none';
      if (algoRow)    algoRow.style.display    = (m === 'hva') ? '' : 'none';
      if (algoAvaRow) algoAvaRow.style.display = (m === 'ava') ? '' : 'none';
      // Undo only makes sense in HvA (mixed human/AI turn sequence).
      var undoBtn = S.$('#b-undo', root);
      if (undoBtn) undoBtn.style.display = (m === 'hva') ? '' : 'none';
    }

    // ---- board rendering ----

    // Repaints all cells to match the current board state.
    // Marks the most recently placed cell with a pop animation and winning cells
    // with the win highlight class.
    function paint(placedIdx, winLine) {
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        c.className = 'ttt-cell';
        if      (board[i] === 'X') c.classList.add('x');
        else if (board[i] === 'O') c.classList.add('o');
        else if (!over && !isAiTurn()) c.classList.add('clickable');
        c.textContent = board[i] || '';
        if (winLine && winLine.indexOf(i) !== -1) c.classList.add('win');
        if (i === placedIdx) c.classList.add('placed');
      }
    }

    // Returns true when it is the AI's turn to move given the current player.
    function isAiTurn() { return aiPlayers()[current]; }

    // Checks the board for a winner or a full board and updates the result display.
    // Sets the `over` flag so further moves are blocked.
    function setResult() {
      var info = G().winnerInfo(board);
      if (info) {
        over = true;
        Lab.shared.sounds.win();
        resultEl.innerHTML = '<span class="' + info.winner.toLowerCase() + '">' +
          info.winner + '</span> wins.';
        paint(-1, info.line);
      } else if (G().isFull(board)) {
        over = true;
        Lab.shared.sounds.draw();
        resultEl.textContent = 'Draw.';
      } else {
        resultEl.textContent = '';
      }
    }

    // Records a move, advances the turn, pushes an undo snapshot, and checks for end.
    function place(idx, who) {
      board[idx] = who;
      current = G().other(who);
      snapshots.push({ board: board.slice(), current: current });
      Lab.shared.sounds.place();
      paint(idx, null);
      setResult();
    }

    // Handles a human click on a cell: validates legality and triggers the AI reply.
    function onCellClick(idx) {
      if (busy || over || board[idx] !== null) return;
      if (isAiTurn()) return;
      place(idx, current);
      maybeAiMove();
    }

    // ---- AI ----

    // Runs both the primary algorithm and its counterpart (Minimax or Alpha-Beta)
    // so the pruning rate can be displayed accurately in the dashboard.
    function runAi() {
      var who  = current;
      var algo = algoForPlayer(who);
      var opts = searchOpts(who);
      var primary = Lab.moduleB[algo](board, who, opts);
      // Always run both so the pruning rate stat reflects the real comparison.
      var mmNodes = algo === 'minimax'   ? primary.nodes : Lab.moduleB.minimax(board, who, opts).nodes;
      var abNodes = algo === 'alphabeta' ? primary.nodes : Lab.moduleB.alphabeta(board, who, opts).nodes;
      var pruning = (1 - abNodes / mmNodes) * 100;

      dashboard.set('algo',  algo === 'minimax' ? 'Minimax' : 'Alpha-Beta');
      dashboard.set('time',  S.fmtMs(primary.timeMs));
      dashboard.set('nodes', S.fmtInt(primary.nodes));
      dashboard.set('prune', pruning.toFixed(1) + '%');
      return primary.move;
    }

    // If it is the AI's turn, locks the UI, fires runAi() after a short delay
    // (so the browser can repaint first), then places the chosen move.
    // Chains automatically in AvA mode by calling itself recursively when not over.
    function maybeAiMove() {
      if (over) return;
      if (!isAiTurn()) { statusEl.innerHTML = 'Your move, <b>' + current + '</b>.'; return; }
      busy = true;
      statusEl.innerHTML = 'AI (<b>' + current + '</b>) is thinking…';
      paint(-1, null);
      setTimeout(function () {
        var who  = current;
        var move = runAi();
        place(move, who);
        busy = false;
        statusEl.textContent = '';
        if (!over && isAiTurn()) maybeAiMove();
        else if (!over) statusEl.innerHTML = 'Your move, <b>' + current + '</b>.';
      }, 260);
    }

    // ---- undo (HvA only) ----

    // Pops snapshots until it lands on a state where it is the human's turn.
    // This undoes both the human move and the AI reply in one action.
    function undo() {
      if (mode() !== 'hva' || busy) return;
      if (snapshots.length === 0) return;
      over = false;
      snapshots.pop();
      while (snapshots.length > 0 && aiPlayers()[snapshots[snapshots.length - 1].current]) {
        snapshots.pop();
      }
      var snap = snapshots.length > 0
        ? snapshots[snapshots.length - 1]
        : { board: G().emptyBoard(), current: 'X' };
      board   = snap.board.slice();
      current = snap.current;
      resultEl.textContent = '';
      statusEl.textContent = '';
      dashboard.reset();
      paint(-1, null);
      maybeAiMove();
    }

    // ---- save / load ----

    // Serialises the full game state (board, mode, algorithm choices, snapshots)
    // to a JSON file and triggers a browser download.
    function saveGame() {
      var game = G();
      var data = {
        boardGridSize: game.size, k: game.k,
        mode: mode(), algo: algoSel ? algoSel.value : 'alphabeta',
        humanSide: humanSide(),
        board: board.slice(), current: current, over: over,
        snapshots: snapshots
      };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = 'tictactoe.json'; a.click();
      URL.revokeObjectURL(url);
    }

    // Parses a JSON game file, switches board size if necessary, and restores all state.
    function applyLoadedGame(text) {
      try {
        var data = JSON.parse(text);
        var gs   = data.boardGridSize || 3;
        var k    = data.k || gs;
        var expectedLen = gs * gs;
        if (!Array.isArray(data.board) || data.board.length !== expectedLen) {
          statusEl.textContent = 'Invalid game file.'; return;
        }
        // Rebuild the board if the loaded game uses a different grid size.
        if (gs !== G().size) {
          if (sizeSel) sizeSel.value = String(gs);
          Lab.moduleB.Game = Lab.moduleB.createGame(gs, k);
          buildCells();
        }
        if (data.mode  && modeSel) modeSel.value = data.mode;
        if (data.algo  && algoSel) algoSel.value = data.algo;
        if (data.humanSide && sideSel) sideSel.value = data.humanSide;
        updateModeUI();

        board     = data.board.slice();
        current   = data.current || 'X';
        over      = !!data.over;
        busy      = false;
        snapshots = Array.isArray(data.snapshots) ? data.snapshots : [];

        dashboard.reset();
        resultEl.textContent = '';
        statusEl.textContent = '';
        var info = G().winnerInfo(board);
        paint(-1, info ? info.line : null);
        if (info) {
          over = true;
          resultEl.innerHTML = '<span class="' + info.winner.toLowerCase() + '">' + info.winner + '</span> wins.';
        } else if (G().isFull(board)) {
          over = true;
          resultEl.textContent = 'Draw.';
        } else if (!over) {
          maybeAiMove();
        }
      } catch (e) {
        statusEl.textContent = 'Could not read game file.';
      }
    }

    // ---- reset ----

    // Clears the board, resets all state variables, and triggers the first AI move
    // if the AI goes first in the current mode.
    function reset() {
      board     = G().emptyBoard();
      current   = 'X';
      over      = false; busy = false;
      snapshots = [];
      dashboard.reset();
      resultEl.textContent = '';
      statusEl.textContent = '';
      paint(-1, null);
      maybeAiMove();
    }

    // ---- wire controls ----
    S.$('#b-reset', root).addEventListener('click', reset);
    modeSel.addEventListener('change', function () { updateModeUI(); reset(); });
    if (sideSel)  sideSel.addEventListener('change',  reset);
    if (algoSel)  algoSel.addEventListener('change',  function () { dashboard.reset(); });
    if (algoXSel) algoXSel.addEventListener('change', function () { dashboard.reset(); });
    if (algoOSel) algoOSel.addEventListener('change', function () { dashboard.reset(); });

    // Switching board size creates a new game model and rebuilds the cell grid.
    if (sizeSel) sizeSel.addEventListener('change', function () {
      var sz = parseInt(sizeSel.value, 10);
      Lab.moduleB.Game = Lab.moduleB.createGame(sz, sz);
      buildCells();
      updateModeUI();
      reset();
    });

    var undoBtn = S.$('#b-undo', root);
    if (undoBtn) undoBtn.addEventListener('click', undo);

    var saveBtn = S.$('#b-save', root);
    if (saveBtn) saveBtn.addEventListener('click', saveGame);

    var loadFileInput = S.$('#b-load-file', root);
    var loadBtn       = S.$('#b-load-btn',  root);
    if (loadBtn) loadBtn.addEventListener('click', function () { loadFileInput.click(); });
    if (loadFileInput) loadFileInput.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { applyLoadedGame(reader.result); };
      reader.readAsText(f);
      loadFileInput.value = '';
    });

    // Initial setup: build cells, sync mode UI, start game.
    buildCells();
    updateModeUI();
    reset();
  };
})();
