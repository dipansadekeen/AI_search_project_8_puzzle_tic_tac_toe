# AI Search Lab

A single-page application demonstrating two faces of state-space search:

- **Module A — N-Puzzle Solver**: single-agent search (BFS, Dijkstra, A\*, Greedy Best-First, IDA\*) on 3×3 (8-puzzle) and 4×4 (15-puzzle) boards.
- **Module B — Tic-Tac-Toe**: adversarial search (Minimax, Alpha-Beta pruning) on 3×3 classic and 4×4 (k=4-in-a-row) boards.

Both modules live behind one tabbed entry point and share a single performance
dashboard component so algorithm behavior is directly comparable.

---

## How to run

**Double-click `index.html`.** 

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
│   ├── module_a.css        # puzzle board + sliding tiles (3×3 and 4×4)
│   └── module_b.css        # tic-tac-toe board (3×3 and 4×4)
├── js/
│   ├── shared/             # used by BOTH modules
│   │   ├── namespace.js    # single global (window.Lab); loaded first
│   │   ├── utils.js        # DOM + formatting helpers
│   │   ├── priority_queue.js  # binary min-heap (Dijkstra, A*, Greedy)
│   │   ├── dashboard.js    # shared performance dashboard component
│   │   └── sounds.js       # Web Audio API sound effects + mute toggle
│   ├── module_a/
│   │   ├── puzzle.js       # factory createPuzzle(G): neighbors, heuristics,
│   │   │                   #   solvability check, hex state encoding (3×3 & 4×4)
│   │   ├── solvers/
│   │   │   ├── _common.js  # shared reconstruct helper
│   │   │   ├── bfs.js      # blind BFS (disabled for 4×4)
│   │   │   ├── dijkstra.js # uniform-cost search (disabled for 4×4)
│   │   │   ├── astar.js    # A* with pluggable heuristic (default: Manhattan)
│   │   │   ├── greedy.js   # Greedy Best-First (h only, not optimal)
│   │   │   └── idastar.js  # IDA* (iterative-deepening A*)
│   │   ├── image_slicer.js # upload → square crop → G×G tile images
│   │   ├── animation.js    # solution playback engine (play/pause/step/speed)
│   │   └── ui_a.js         # board rendering, controls, undo/save/load
│   └── module_b/
│       ├── game.js         # factory createGame(size, k): board, win detection,
│       │                   #   line generation, heuristic evaluation (4×4)
│       ├── minimax.js      # Minimax with optional depth limit + eval function
│       ├── alphabeta.js    # Alpha-Beta pruning (same interface as minimax)
│       └── ui_b.js         # board + game-mode controls, undo/save/load
├── tests/tests.html        # in-browser test runner (3+ tests per algorithm)
├── verify.js               # optional Node harness (node verify.js)
└── assets/                 # default puzzle uses CSS-drawn tiles; no binaries required
```

The dashboard in `js/shared/dashboard.js` is one component instantiated by both
modules with their own field sets — a genuinely shared piece, not duplicated UI.

---

## Features

### Module A — N-Puzzle Solver

- **Grid sizes**: 3×3 (8-puzzle) and 4×4 (15-puzzle), switchable at runtime.
- **Algorithms**: BFS, Dijkstra, A\* (Manhattan), Greedy Best-First, IDA\*. BFS and Dijkstra are disabled for 4×4 (state space too large).
- **Manual play**: click any tile adjacent to the gap; move counter tracked.
- **Playback controls**: Solve & play, Step forward/back, Pause, Speed slider.
- **Image mode**: upload a .png/.jpg; it is center-cropped and sliced into G×G tiles. Works for both grid sizes.
- **Undo**: steps back through manual moves one at a time.
- **Save / Load**: exports and imports the current board state as JSON (preserves grid size and move count).
- **Performance dashboard**: algorithm name, decision time, nodes expanded, solution length.

### Module B — Tic-Tac-Toe

- **Board sizes**: 3×3 classic and 4×4 (k=4-in-a-row), switchable at runtime.
- **Game modes**: Human vs AI, AI vs AI, Human vs Human.
- **HvA**: choose to play as X (first) or O (second).
- **AvA**: independent algorithm selector per player (X and O can use different algorithms).
- **Algorithms**: Minimax and Alpha-Beta for both 3×3 (full search) and 4×4 (depth-limited with heuristic evaluation).
- **4×4 search**: adaptive depth limit (6 when >10 cells empty, 8 as board fills) with exponential line-score heuristic.
- **Winning line** highlighted on the board when a player wins.
- **Undo**: available in HvA mode; steps back past the AI reply to the previous human move.
- **Save / Load**: exports and imports the full game state as JSON.
- **Performance dashboard**: algorithm, decision time, nodes explored, pruning rate.

### Shared

- **Dark / Light mode**: toggles via the ☀/☾ button; preference saved in `localStorage`.
- **Sound effects**: synthesised tones via the Web Audio API (no audio files). Tile slide and solved chime in Module A; cell place, win fanfare, and draw tone in Module B. 🔊/🔇 mute button in the topbar; preference saved in `localStorage`.

## Algorithms implemented

| Module | Algorithm | Notes |
|---|---|---|
| A | BFS (blind) | Complete and optimal on unit-cost moves; goal-checked on generation. Disabled for 4×4. |
| A | Dijkstra (uniform cost) | Min-heap frontier; behaves like BFS under unit costs. Disabled for 4×4. |
| A | A\* (Manhattan) | Consistent heuristic; closed set safe; fewest nodes among complete algorithms. |
| A | Greedy Best-First | Expands by h(n) alone — fast in practice but not optimal or complete in general. |
| A | IDA\* | Iterative-deepening A\*: O(bd) memory, same f=g+h threshold; finds optimal solutions. |
| B | Minimax | Full game-tree search (3×3) or depth-limited with heuristic eval (4×4). |
| B | Alpha-Beta | Identical decisions to Minimax, prunes branches that cannot change the result. |

### Heuristic justification (admissibility)

The **Manhattan distance** heuristic used by A\*, Greedy, and IDA\* sums, for each
tile, the number of rows plus columns between its current cell and its goal cell.
A single legal move slides exactly one tile by exactly one cell, so it can reduce
this sum by at most 1. The true cost can therefore never be smaller than the
Manhattan sum — the heuristic never overestimates, so it is **admissible**.
It is also **consistent** (h(n) ≤ c(n,n′) + h(n′)), which is why A\* may safely
close a state when it is expanded, and why IDA\*'s threshold sequence is
non-decreasing (guaranteeing optimality).

Greedy Best-First uses the same heuristic but ignores the path cost g(n), so it
is neither optimal nor complete in general — it trades optimality for speed.

---

## Comparative Analysis

> Standardized test instances. **Module A:** start `[[8,1,3],[4,0,2],[7,6,5]]`,
> goal `[[1,2,3],[4,5,6],[7,8,0]]`, optimal depth 14. **Module B:** empty board,
> Tic-Tac-Toe dashboard run; metrics below match the exported report/PDF.

Reference numbers from this implementation (reproduce them live in the dashboard
and include a screenshot):

| Algorithm | Nodes expanded/explored | Solution length | Decision time / pruning |
|---|---:|---:|---:|
| BFS (blind) | 3,633 | 14 | 6.8 ms |
| Dijkstra | 5,085 | 14 | 11.2 ms |
| A\* (Manhattan) | 59 | 14 | 0.4 ms |
| Greedy Best-First | 258 | 72 | 1.0 ms |
| IDA\* | 105 | 14 | 0.5 ms |
| Minimax | 56,716 | — | 0%, 0%, 0% pruning |
| Alpha-Beta | 2,615 | — | 95.8%, 76.2%, 47.4% pruning |

Observed Alpha-Beta reduction across the recorded Tic-Tac-Toe moves:
**1 − 2,615 / 56,716 ≈ 95.4%** overall, with move-level pruning rates of
**95.8%**, **76.2%**, and **47.4%**.

**1. Structural comparison.** Both problems are searches over a discrete state
space, but control of the next state differs fundamentally. In the 8-puzzle a
single agent controls every transition, so "solving" means finding a *path* from
start to goal. In Tic-Tac-Toe two adversaries alternate control, so "solving"
means finding a *strategy* — a policy that holds up against an opponent who is
actively working against you. The puzzle's space is a graph of configurations
reachable by your own moves; the game's space is a tree of move/counter-move
branches where alternating levels optimize opposite objectives.

**2. Algorithm fit.** A\* fits the 8-puzzle because there is a meaningful
cost-to-go (an admissible heuristic estimating remaining moves) that a single
agent can greedily exploit. IDA\* solves the same problem with O(bd) memory
instead of A\*'s O(states), at the cost of re-expanding nodes across iterations
— a worthwhile trade for the 15-puzzle where A\*'s memory use becomes prohibitive.
Greedy Best-First drops the path cost entirely and races toward the goal; it often
finds a solution quickly but may overshoot the optimal depth. Neither Greedy nor
IDA\* transfer to Tic-Tac-Toe because there is no fixed goal distance — the value
of a position depends on what the opponent does next. Conversely, Minimax does
not apply to the 8-puzzle because there is no opponent: every level would
"maximize," which simply collapses back into ordinary single-agent search.

**3. Empirical comparison — Module A.** A\* expanded **59** nodes against
**3,633** for BFS and **5,085** for Dijkstra, while still returning the same
optimal **14-move** solution. The time measurements show the same pattern:
BFS took **6.8 ms**, Dijkstra took **11.2 ms**, and A\* took only **0.4 ms**.
The heuristic is doing the practical work: BFS and Dijkstra explore by distance
from the start, while Manhattan distance steers A\* toward the goal. Greedy
Best-First expanded **258** nodes in **1.0 ms**, but its solution was **72**
moves, showing the cost of ignoring path cost. IDA\* expanded **105** nodes in
**0.5 ms** and still found the optimal depth.

**4. Empirical comparison — Module B.** In the recorded Tic-Tac-Toe dashboard
run, Minimax explored **56,716** total nodes and Alpha-Beta explored **2,615**
nodes. That is **54,101** fewer searched nodes, or about **95.4%** less search
overall. The move-level pruning rates were **95.8%**, **76.2%**, and **47.4%**;
Minimax correctly reports **0%** pruning because standard Minimax does not cut
off branches. Alpha-Beta therefore preserves the same decision logic as Minimax
but avoids branches that cannot affect the final result.

**5. Trade-off analysis.**
- *BFS* — complete: yes; optimal: yes (unit cost); time: O(b^d); space: O(b^d) (the memory bottleneck).
- *Dijkstra* — complete: yes; optimal: yes; time: O(E + V log V); space: O(V); under unit cost, behaves like BFS.
- *A\** — complete: yes; optimal: yes with admissible heuristic; time: exponential worst case but far better in practice; space: O(states stored).
- *Greedy Best-First* — complete: no (can loop); optimal: no; time/space better than A\* in practice; trades guarantees for speed.
- *IDA\** — complete: yes; optimal: yes with admissible heuristic; time: O(b^d) per iteration; space: O(bd) — linear, unlike A\*.
- *Minimax* — complete: yes (finite game); optimal: yes against an optimal opponent; time: O(b^m); space: O(bm).
- *Alpha-Beta* — same completeness/optimality as Minimax; time: as good as O(b^{m/2}) with ideal ordering; space: O(bm).

## Credits

Built by Dipan Sadekeen and Md Shahrukh Islam for the AI Search Lab assignment. Algorithms implemented
from standard formulations (Russell & Norvig, *Artificial Intelligence: A Modern
Approach*). GenAI used as a coding assistant under the course policy; all logic
verified via `tests/tests.html` and `verify.js`.
