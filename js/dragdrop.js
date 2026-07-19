// ==========================================================
// dragdrop.js — Drag & drop implementation
// Owner: Manish
//
// Pure interaction layer built on the native HTML5 Drag and Drop API
// (no external library needed for vanilla JS). This file only knows
// how to wire up drag events and figure out *where* a card was
// dropped — it never touches rendering or styling directly (that's
// ui.js) and it never mutates task data directly (that's state.js).
// ==========================================================

import { moveTask } from "./state.js";

let draggedTaskId = null;

/**
 * Make a task card draggable and wire dragstart/dragend.
 * `hooks.onDragStart` / `hooks.onDragEnd` let ui.js attach visual
 * feedback (opacity, classes) without dragdrop.js knowing about CSS.
 */
export function makeCardDraggable(cardEl, taskId, hooks = {}) {
  cardEl.draggable = true;
  cardEl.dataset.taskId = taskId;

  cardEl.addEventListener("dragstart", (event) => {
    draggedTaskId = taskId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    hooks.onDragStart?.(cardEl, event);
  });

  cardEl.addEventListener("dragend", (event) => {
    draggedTaskId = null;
    hooks.onDragEnd?.(cardEl, event);
  });
}

/**
 * Make a column element a valid drop target for every column on the
 * board (handles moving tasks between columns) and resolve the drop
 * position inside that column (handles reordering within a column).
 */
export function makeColumnDroppable(columnEl, columnId, hooks = {}) {
  columnEl.addEventListener("dragover", (event) => {
    event.preventDefault(); // required so `drop` fires at all
    event.dataTransfer.dropEffect = "move";
    hooks.onDragOver?.(columnEl, event);
  });

  columnEl.addEventListener("dragleave", (event) => {
    // Ignore bubbled dragleave events fired when moving between child elements
    if (!columnEl.contains(event.relatedTarget)) {
      hooks.onDragLeave?.(columnEl, event);
    }
  });

  columnEl.addEventListener("drop", (event) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;

    if (!taskId) {
      hooks.onDrop?.(columnEl, event); // still clear any leftover highlight styling
      return; // edge case: drop fired with nothing actually being dragged
    }

    const list = columnEl.querySelector(".task-list");
    const destIndex = list ? resolveDropIndex(list, event.clientY) : 0;

    moveTask(taskId, columnId, destIndex);
    hooks.onDrop?.(columnEl, event);
  });
}

/**
 * Determine the insertion index inside a column based on the pointer's
 * vertical position relative to the existing cards, so a card dropped
 * near the top of a column lands first, near the bottom lands last,
 * and dropping between two cards inserts it between them.
 */
function resolveDropIndex(listEl, pointerY) {
  const cards = [...listEl.querySelectorAll(".task-card:not(.is-dragging)")];
  for (let i = 0; i < cards.length; i++) {
    const box = cards[i].getBoundingClientRect();
    const midpoint = box.top + box.height / 2;
    if (pointerY < midpoint) return i;
  }
  return cards.length; // dropped below every card -> goes last
}

export function getDraggedTaskId() {
  return draggedTaskId;
}
