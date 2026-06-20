// Node verification harness. Loads the browser logic files with a tiny
// window/Lab/performance shim, then runs the standardized test instances.
const fs = require('fs');
const path = require('path');

global.window = {};
global.window.Lab = {};
global.Lab = global.window.Lab; // same object; files mutate it via window.Lab or bare Lab
if (typeof performance === 'undefined') {
  global.performance = { now: () => Number(process.hrtime.bigint()) / 1e6 };
}

const base = path.join(__dirname, 'js');
const files = [
  'shared/namespace.js',
  'shared/utils.js',
  'shared/priority_queue.js',
  'module_a/puzzle.js',
  'module_a/solvers/_common.js',
  'module_a/solvers/bfs.js',
  'module_a/solvers/dijkstra.js',
  'module_a/solvers/astar.js',
  'module_b/game.js',
  'module_b/minimax.js',
  'module_b/alphabeta.js',
];

// utils.js touches document/navigator only inside functions, but fmtInt uses
// toLocaleString which is fine. Provide a no-op document for safety.
global.document = { createElement: () => ({ classList: { add() {}, remove() {} }, appendChild() {}, setAttribute() {} }) };

for (const f of files) {
  const code = fs.readFileSync(path.join(base, f), 'utf8');
  eval(code);
}

const L = global.Lab;
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name + (extra ? '  ' + extra : '')); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  ' + extra : '')); }
}

console.log('\n=== Module A: 8-Puzzle ===');
const TEST = '813402765'; // [[8,1,3],[4,0,2],[7,6,5]]
const P = L.moduleA.Puzzle;
check('goal manhattan == 0', P.manhattan(P.GOAL) === 0);
check('test puzzle is solvable', P.isSolvable(TEST));
check('goal is solvable', P.isSolvable(P.GOAL));

const bfs = L.moduleA.solvers.bfs(TEST);
const dij = L.moduleA.solvers.dijkstra(TEST);
const ast = L.moduleA.solvers.astar(TEST);

const bfsLen = bfs.path.length - 1;
const dijLen = dij.path.length - 1;
const astLen = ast.path.length - 1;

check('BFS finds optimal depth 14', bfsLen === 14, '(len=' + bfsLen + ', nodes=' + bfs.nodesExpanded + ')');
check('Dijkstra finds optimal depth 14', dijLen === 14, '(len=' + dijLen + ', nodes=' + dij.nodesExpanded + ')');
check('A* finds optimal depth 14', astLen === 14, '(len=' + astLen + ', nodes=' + ast.nodesExpanded + ')');
check('A* expands far fewer than BFS', ast.nodesExpanded < bfs.nodesExpanded / 5,
  '(A*=' + ast.nodesExpanded + ' vs BFS=' + bfs.nodesExpanded + ')');

// validate the BFS path is a legal sequence of moves ending at goal
function validPath(pth) {
  for (let i = 1; i < pth.length; i++) {
    const succ = P.neighbors(pth[i - 1]).map(s => s.state);
    if (succ.indexOf(pth[i]) === -1) return false;
  }
  return pth[pth.length - 1] === P.GOAL;
}
check('BFS path is legal & ends at goal', validPath(bfs.path));
check('A* path is legal & ends at goal', validPath(ast.path));

console.log('\n=== Module B: Tic-Tac-Toe (empty board, AI = X, first move) ===');
const G = L.moduleB.Game;
const empty = G.emptyBoard();
const mm = L.moduleB.minimax(empty, 'X');
const ab = L.moduleB.alphabeta(empty, 'X');
const pruning = (1 - ab.nodes / mm.nodes) * 100;

check('Minimax & Alpha-Beta agree on score', mm.score === ab.score, '(score=' + mm.score + ')');
check('Alpha-Beta visits <= Minimax', ab.nodes <= mm.nodes,
  '(MM=' + mm.nodes + ', AB=' + ab.nodes + ')');
check('Alpha-Beta prunes something', ab.nodes < mm.nodes,
  '(pruning=' + pruning.toFixed(1) + '%)');

// terminal / win detection
const winBoard = ['X', 'X', 'X', null, null, null, null, null, null];
check('winner detects a row', G.winner(winBoard) === 'X');
const drawBoard = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
check('full board with no line is a draw', G.winner(drawBoard) === null && G.isFull(drawBoard));

// AI never loses from empty: best first-move score should be a draw value or win
check('AI first-move score is non-losing', mm.score >= 0);

console.log('\n=== METRICS FOR REPORT ===');
console.log(JSON.stringify({
  moduleA_test_puzzle: TEST,
  bfs:      { nodesExpanded: bfs.nodesExpanded, solutionLength: bfsLen, timeMs: +bfs.timeMs.toFixed(2) },
  dijkstra: { nodesExpanded: dij.nodesExpanded, solutionLength: dijLen, timeMs: +dij.timeMs.toFixed(2) },
  astar:    { nodesExpanded: ast.nodesExpanded, solutionLength: astLen, timeMs: +ast.timeMs.toFixed(2) },
  moduleB_first_move: {
    minimax_nodes: mm.nodes,
    alphabeta_nodes: ab.nodes,
    pruning_rate_pct: +pruning.toFixed(1),
    minimax_move: mm.move, alphabeta_move: ab.move
  }
}, null, 2));

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail === 0 ? 0 : 1);
