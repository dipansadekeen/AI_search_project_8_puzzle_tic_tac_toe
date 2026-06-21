# AI Search Lab

A single-page application demonstrating two faces of state-space search:

- **Module A — 8-Puzzle Solver**: single-agent search (BFS, Dijkstra, A*).
- **Module B — Tic-Tac-Toe**: adversarial search (Minimax, Alpha-Beta pruning).

Both modules live behind one tabbed entry point and share a single performance
dashboard component so algorithm behavior is directly comparable.

---

## How to run

**Double-click `index.html`.** That's it — no build step, no server, no
dependencies, no network. It works on Windows, macOS, and Linux in any modern
browser.

The app is plain HTML/CSS/JavaScript loaded through ordered `<script>` tags
rather than ES modules. This is deliberate: ES module `import`s are blocked
from the `file://` protocol in Chromium, so a module-based build would fail on
a double-clicked file. Classic scripts load fine from disk.

To run the test suite, open `tests/tests.html` in a browser.

---

## Architecture

```
ai-search-lab/
├── index.html              # single entry point: tabbed landing for both modules
├── css/
│   ├── main.css            # design system, shell, tabs, shared dashboard
│   ├── module_a.css        # puzzle board + sliding tiles
│   └── module_b.css        # tic-tac-toe board
├── js/
│   ├── shared/             # used by BOTH modules
│   │   ├── namespace.js    # single global (window.Lab); loaded first
│   │   ├── utils.js        # DOM + formatting helpers
│   │   ├── priority_queue.js  # binary min-heap (Dijkstra + A*)
│   │   └── dashboard.js    # shared performance dashboard component
│   ├── module_a/
│   │   ├── puzzle.js       # state model: neighbors, heuristics, solvability
│   │   ├── solvers/        # bfs.js, dijkstra.js, astar.js, _common.js
│   │   ├── image_slicer.js # upload → square crop → 3×3 tile images
│   │   ├── animation.js    # solution playback engine (play/pause/step/speed)
│   │   └── ui_a.js         # board rendering + controls
│   └── module_b/
│       ├── game.js         # board, win detection, legal moves
│       ├── minimax.js, alphabeta.js
│       └── ui_b.js         # board + game-mode controls
├── tests/tests.html        # in-browser test runner (3+ tests per algorithm)
├── verify.js               # optional Node harness (node verify.js)
└── assets/                 # default puzzle uses CSS-drawn tiles; no binaries required
```

The dashboard in `js/shared/dashboard.js` is one component instantiated by both
modules with their own field sets — a genuinely shared piece, not duplicated UI.

## Features

**Module A:** numbered default puzzle and custom image upload (.png/.jpg, auto
center-cropped and sliced); shuffle into a guaranteed-solvable state; manual
play by clicking tiles adjacent to the gap; and step-by-step solving with any of
the three algorithms, including pause / single-step (forward and back) / speed
control.

**Module B:** Human vs AI, AI vs AI, and Human vs Human modes; Minimax or
Alpha-Beta selectable for the AI; winning line highlighted; live per-move
dashboard.

**Shared dashboard:** decision time, nodes expanded/explored, solution length
(Module A), and pruning rate (Module B).

---

## Algorithms implemented

| Module | Algorithm | Notes |
|---|---|---|
| A | BFS (blind) | Complete and optimal on unit-cost moves; goal-checked on generation. |
| A | Dijkstra (uniform cost) | Min-heap frontier; behaves like BFS under unit costs. |
| A | A* | Manhattan-distance heuristic; consistent, so the closed set is safe. |
| B | Minimax | Full game-tree search; depth-adjusted scoring prefers faster wins. |
| B | Alpha-Beta | Identical decisions, prunes branches that cannot change the result. |

### Heuristic justification (admissibility)

The A* heuristic is **Manhattan distance**: for each tile, the number of rows
plus columns between its current cell and its goal cell, summed over all tiles.
A single legal move slides exactly one tile by exactly one cell, so it can
reduce this sum by at most 1. The true number of moves to solve the puzzle can
therefore never be smaller than the Manhattan sum — the heuristic never
overestimates, so it is admissible. (It is also consistent, which is why A* may
safely close a state when it is expanded.)

---

## Comparative Analysis

> Standardized test instances. **Module A:** start `[[8,1,3],[4,0,2],[7,6,5]]`,
> goal `[[1,2,3],[4,5,6],[7,8,0]]`, optimal depth 14. **Module B:** empty board,
> AI plays first as X; metrics are for the AI's first move.

Reference numbers from this implementation (reproduce them live in the dashboard
and include a screenshot):

| Algorithm | Nodes expanded/explored | Solution length |
|---|---|---|
| BFS (blind) | 3,633 | 14 |
| Dijkstra | 5,085 | 14 |
| A* (Manhattan) | 59 | 14 |
| Minimax (first move) | 549,946 | — (forced draw) |
| Alpha-Beta (first move) | 20,866 | — (forced draw) |

Observed Alpha-Beta pruning rate: **1 − 20,866 / 549,946 ≈ 96.2%**.

**1. Structural comparison.** Both problems are searches over a discrete state
space, but control of the next state differs fundamentally. In the 8-puzzle a
single agent controls every transition, so "solving" means finding a *path* from
start to goal. In Tic-Tac-Toe two adversaries alternate control, so "solving"
means finding a *strategy* — a policy that holds up against an opponent who is
actively working against you. The puzzle's space is a graph of configurations
reachable by your own moves; the game's space is a tree of move/counter-move
branches where alternating levels optimize opposite objectives.

**2. Algorithm fit.** A* fits the 8-puzzle because there is a meaningful
cost-to-go (an admissible heuristic estimating remaining moves) that a single
agent can greedily exploit. It does not transfer to Tic-Tac-Toe because there is
no single goal distance to estimate — the value of a position depends on what
the opponent does next, not on proximity to a fixed target. Conversely, Minimax
does not apply to the 8-puzzle because there is no opponent: every level would
"maximize," which simply collapses back into ordinary single-agent search.

**3. Empirical comparison — Module A.** A* expanded **59** nodes against
**3,633** for BFS and **5,085** for Dijkstra — roughly a 60× reduction. The
heuristic is doing the entire job: BFS and Dijkstra explore by distance alone
and fan out blindly, while Manhattan distance steers A* almost straight to the
goal. The point of including Dijkstra is exactly this contrast: on unit-cost
moves it is essentially BFS with a heap, so its node count confirms that the
queue discipline is *not* what saves work — the heuristic is.

**4. Empirical comparison — Module B.** Minimax explored **549,946** nodes (the
full game tree) for the opening move; Alpha-Beta explored **20,866** for the
identical decision, a pruning rate of about **96.2%**. Both return a forced draw
(score 0), as expected for perfect play.

**5. Trade-off analysis.**
- *BFS* — complete: yes; optimal: yes (unit cost); time: O(b^d); space: O(b^d) (the memory bottleneck).
- *Dijkstra* — complete: yes; optimal: yes; time: O(E + V log V); space: O(V); under unit cost, behaves like BFS.
- *A\** — complete: yes; optimal: yes with an admissible heuristic; time: exponential worst case but far better in practice; space: O(states stored) (still the main cost).
- *Minimax* — complete: yes (finite game); optimal: yes against an optimal opponent; time: O(b^m); space: O(bm).
- *Alpha-Beta* — same completeness/optimality as Minimax; time: as good as O(b^{m/2}) with ideal ordering; space: O(bm).

---

## Credits

Built by Md Shahrukh Islam for the AI Search Lab assignment. Algorithms implemented
from standard formulations (Russell & Norvig, *Artificial Intelligence: A Modern
Approach*). GenAI used as a coding assistant under the course policy; all logic
verified via `tests/tests.html` and `verify.js`.
