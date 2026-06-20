// Tic-Tac-Toe game model.
// Board: array of 9 cells, each 'X', 'O', or null. Index layout:
//   0 1 2
//   3 4 5
//   6 7 8
(function () {
  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  function emptyBoard() { return [null, null, null, null, null, null, null, null, null]; }

  function legalMoves(board) {
    var moves = [];
    for (var i = 0; i < 9; i++) if (board[i] === null) moves.push(i);
    return moves;
  }

  // Returns { winner: 'X'|'O', line: [a,b,c] } or null.
  function winnerInfo(board) {
    for (var i = 0; i < LINES.length; i++) {
      var a = LINES[i][0], b = LINES[i][1], c = LINES[i][2];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: LINES[i] };
      }
    }
    return null;
  }

  function winner(board) {
    var info = winnerInfo(board);
    return info ? info.winner : null;
  }

  function isFull(board) {
    for (var i = 0; i < 9; i++) if (board[i] === null) return false;
    return true;
  }

  function isTerminal(board) { return winner(board) !== null || isFull(board); }
  function other(player) { return player === 'X' ? 'O' : 'X'; }

  Lab.moduleB.Game = {
    LINES: LINES,
    emptyBoard: emptyBoard,
    legalMoves: legalMoves,
    winner: winner,
    winnerInfo: winnerInfo,
    isFull: isFull,
    isTerminal: isTerminal,
    other: other
  };
})();
