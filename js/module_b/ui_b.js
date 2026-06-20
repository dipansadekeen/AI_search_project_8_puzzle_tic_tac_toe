// Module B UI controller: Tic-Tac-Toe with Human vs AI, AI vs AI, and
// Human vs Human modes; Minimax / Alpha-Beta selectable for the AI.
// Each AI move runs the chosen solver for the decision and also runs the
// other solver on the same position so the pruning rate is reported honestly.
(function () {
  var S = Lab.shared;
  var G = Lab.moduleB.Game;

  Lab.moduleB.init = function (root) {
    var boardEl = S.$('.ttt-board', root);
    var resultEl = S.$('#b-result', root);
    var statusEl = S.$('#b-status', root);
    var modeSel = S.$('#b-mode', root);
    var algoSel = S.$('#b-algo', root);

    var dashboard = Lab.shared.createDashboard(S.$('#b-dashboard', root), [
      { key: 'algo', label: 'Algorithm' },
      { key: 'time', label: 'Decision time' },
      { key: 'nodes', label: 'Nodes explored' },
      { key: 'prune', label: 'Pruning rate' }
    ]);

    var board = G.emptyBoard();
    var current = 'X';        // X always moves first
    var cells = [];
    var busy = false;         // AI thinking / animating
    var over = false;

    // build cells
    for (var i = 0; i < 9; i++) {
      (function (idx) {
        var c = S.el('div', { class: 'ttt-cell clickable', 'data-i': idx });
        c.addEventListener('click', function () { onCellClick(idx); });
        cells.push(c);
        boardEl.appendChild(c);
      })(i);
    }

    function mode() { return modeSel.value; } // 'hva' | 'ava' | 'hvh'
    function aiPlayers() {
      if (mode() === 'ava') return { X: true, O: true };
      if (mode() === 'hvh') return { X: false, O: false };
      return { X: false, O: true }; // human X vs AI O
    }

    function paint(placedIdx, winLine) {
      for (var i = 0; i < 9; i++) {
        var c = cells[i];
        c.className = 'ttt-cell';
        if (board[i] === 'X') c.classList.add('x');
        else if (board[i] === 'O') c.classList.add('o');
        else if (!over && !isAiTurn()) c.classList.add('clickable');
        c.textContent = board[i] || '';
        if (winLine && winLine.indexOf(i) !== -1) c.classList.add('win');
        if (i === placedIdx) c.classList.add('placed');
      }
    }

    function isAiTurn() { return aiPlayers()[current]; }

    function setResult() {
      var info = G.winnerInfo(board);
      if (info) {
        over = true;
        resultEl.innerHTML = '<span class="' + info.winner.toLowerCase() + '">' +
          info.winner + '</span> wins.';
        paint(-1, info.line);
      } else if (G.isFull(board)) {
        over = true;
        resultEl.textContent = 'Draw.';
      } else {
        resultEl.textContent = '';
      }
    }

    function place(idx, who) {
      board[idx] = who;
      current = G.other(who);
      paint(idx, null);
      setResult();
    }

    function onCellClick(idx) {
      if (busy || over || board[idx] !== null) return;
      if (isAiTurn()) return; // not a human's turn
      place(idx, current);
      maybeAiMove();
    }

    function runAi() {
      var algo = algoSel.value; // 'minimax' | 'alphabeta'
      var primary = Lab.moduleB[algo](board, current);
      // run the counterpart on the same position for an honest pruning rate
      var mmNodes = algo === 'minimax' ? primary.nodes : Lab.moduleB.minimax(board, current).nodes;
      var abNodes = algo === 'alphabeta' ? primary.nodes : Lab.moduleB.alphabeta(board, current).nodes;
      var pruning = (1 - abNodes / mmNodes) * 100;

      dashboard.set('algo', algo === 'minimax' ? 'Minimax' : 'Alpha-Beta');
      dashboard.set('time', S.fmtMs(primary.timeMs));
      dashboard.set('nodes', S.fmtInt(primary.nodes));
      dashboard.set('prune', pruning.toFixed(1) + '%');
      return primary.move;
    }

    function maybeAiMove() {
      if (over) return;
      if (!isAiTurn()) { statusEl.innerHTML = 'Your move, <b>' + current + '</b>.'; return; }
      busy = true;
      statusEl.innerHTML = 'AI (<b>' + current + '</b>) is thinking\u2026';
      paint(-1, null);
      setTimeout(function () {
        var who = current;
        var move = runAi();
        place(move, who);
        busy = false;
        statusEl.textContent = '';
        // chain for AI vs AI
        if (!over && isAiTurn()) maybeAiMove();
        else if (!over) statusEl.innerHTML = 'Your move, <b>' + current + '</b>.';
      }, 260);
    }

    function reset() {
      board = G.emptyBoard();
      current = 'X';
      over = false; busy = false;
      dashboard.reset();
      resultEl.textContent = '';
      statusEl.textContent = '';
      paint(-1, null);
      maybeAiMove(); // if X is an AI (AI vs AI), it starts immediately
    }

    S.$('#b-reset', root).addEventListener('click', reset);
    modeSel.addEventListener('change', reset);
    algoSel.addEventListener('change', function () { dashboard.reset(); });

    reset();
  };
})();
