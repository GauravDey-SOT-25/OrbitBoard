# Orbit Board — Modular Vanilla JS Build

A Trello-style task board built with plain HTML, CSS, and JavaScript
(ES modules — no frameworks, no build step). The JS is split into
files that map directly onto the three roles from the team plan.

## How to run it

Because the JS uses native ES modules (`import`/`export`), open it
through a local server rather than double-clicking the HTML file
(`file://` URLs block module imports in most browsers):

```bash
cd orbit-board
python3 -m http.server 8000
# then visit http://localhost:8000
```

Any static server works (`npx serve`, VS Code's "Live Server", etc).

## File map

```
orbit-board/
├── index.html              Links only — <head> assets + a single <div id="app">
├── css/
│   ├── styles.css          Layout, board, sidebar, cards, responsive rules
│   └── task.css            Dialog animation, form-error states, card action buttons
└── js/
    ├── layout.js             Builds all page markup (header, sidebar, board, dialog,
    │                         card <template>) and mounts it into #app at runtime
    ├── data.js               Shared data & pure helpers (no owner — everyone imports this)
    ├── state.js              ← Shashank — State Management & Board Synchronization
    ├── dragdrop.js           ← Manish   — Drag & Drop Implementation
    ├── ui.js                 ← Ayush Srivastav — UI, UX & Performance
    └── main.js               Bootstrap: mounts the shell, then wires the DOM to the
                              three modules above
```

`index.html` intentionally contains **no board/dialog/card markup**. `js/layout.js`
is the only file that owns that HTML — it builds it as a template string and
injects it into `#app` when the app boots. Every other module queries the
elements `layout.js` creates; none of them write page structure themselves.

## Boot sequence (`main.js`)

```
renderShell("#app")   // layout.js → injects header/sidebar/board/dialog/template
cacheElements()        // main.js  → grabs its own dialog/filter refs
initUI()                // ui.js    → grabs its own board/sidebar refs
populateSelects() → renderTeam() → renderBoard() → renderActivity() → attachEvents()
```

Because the DOM doesn't exist until `renderShell()` runs, `ui.js` and `main.js`
query their elements lazily (inside `initUI()` / `cacheElements()`) instead of
at module-load time.

## Who owns what

### `js/state.js` — Shashank (State Management & Board Synchronization)
- Single source of truth for `tasks` and `activity`, persisted to `localStorage`.
- `createTask`, `updateTask`, `deleteTask`, `moveTask` are the *only* ways
  task data changes — nothing else in the app touches the arrays directly.
- A tiny pub/sub (`subscribe`) notifies the UI layer on every change, so the
  board updates instantly with no page reload and no manual DOM syncing.
- `moveTask` re-indexes both the source and destination columns so task
  order stays dense after every drag, and handles edge cases like an
  invalid destination column or a stale/duplicate drop.
- `getStats()` / `getCountForColumn()` recompute completed-task counts and
  percentages on demand — a single derived source of truth, never stored twice.

### `js/dragdrop.js` — Manish (Drag & Drop Implementation)
- Built on the native HTML5 Drag and Drop API (`draggable`, `dragstart`,
  `dragover`, `dragend`, `drop`) — no external library needed for a
  vanilla-JS build.
- `makeCardDraggable(card, taskId)` wires a card's drag lifecycle.
- `makeColumnDroppable(column, columnId)` makes every column a valid drop
  target and calls `state.moveTask()` on drop.
- `resolveDropIndex()` reads the pointer's vertical position against the
  existing cards to support **reordering within a column**, not just
  moving between columns.
- Exposes `hooks` (`onDragStart`, `onDragOver`, etc.) so `ui.js` can attach
  visual feedback without `dragdrop.js` knowing anything about CSS classes.

### `js/ui.js` — Ayush Srivastav (UI, UX & Performance)
- Subscribes to `state.js` and repaints the board whenever it changes.
- Owns all visual feedback: the `.is-dragging` opacity state, the
  `.is-drop-target` highlight on columns during drag-over, and the CSS
  transitions defined in `task.css`/`styles.css`.
- Search input is **debounced** (150ms) so typing doesn't trigger a
  render on every keystroke.
- Board re-render builds column/card DOM via `<template>` cloning and a
  single `DocumentFragment` append instead of repeated `innerHTML`
  concatenation, and only fires on state-change events — never on a timer
  or during the drag itself — to avoid unnecessary re-renders.
- Responsive behavior (desktop / tablet / mobile) lives in the CSS media
  queries in `styles.css`, which this module's markup is built to match.

### `js/main.js` — Bootstrap
- Populates the assignee/status `<select>` elements.
- Wires the "Add task" / edit dialog, filter controls, and the `/`
  search shortcut.
- Deliberately thin: it never builds board markup and never mutates task
  data directly — it only calls into `state.js` and `ui.js`.

## Workflow this file split enables

```
Manish (dragdrop.js)
   │  fires state.moveTask() on drop
   ▼
Shashank (state.js)
   │  mutates + persists tasks, notifies subscribers
   ▼
Ayush Srivastav (ui.js)
   │  re-renders the board + visual feedback
   ▼
Final user experience
```

Each file only imports what it needs (`dragdrop.js` imports `moveTask`
from `state.js`; `ui.js` imports render data from `state.js` and drag
wiring from `dragdrop.js`), so each teammate can work on their file
without stepping on the others' code.
