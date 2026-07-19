// ==========================================================
// ui.js — Rendering, visual feedback & performance
// Owner: Ayush Srivastav
//
// Subscribes to state.js and repaints the board whenever it changes.
// Owns every visual/UX concern: drop-target highlighting, drag
// opacity, transitions, and rendering performance. Delegates the
// actual drag-event wiring to dragdrop.js and never mutates task
// data directly — only ever through state.js.
// ==========================================================

import { columns, getMember, deadlineState, formatDueDate, relativeTime } from "./data.js";
import { getTasks, getActivity, getStats, deleteTask, subscribe } from "./state.js";
import { makeCardDraggable, makeColumnDroppable } from "./dragdrop.js";

let elements = {};

/**
 * Cache DOM references. Must be called after layout.js has mounted the
 * shell into the page — ui.js never queries the DOM at module-load time
 * since none of it exists yet at that point.
 */
export function initUI() {
  elements = {
    board: document.querySelector("#boardColumns"),
    teamList: document.querySelector("#teamList"),
    activityList: document.querySelector("#activityList"),
    completedCount: document.querySelector("#completedCount"),
    progressBar: document.querySelector("#progressBar"),
    progressText: document.querySelector("#progressText"),
    resultCount: document.querySelector("#resultCount"),
    cardTemplate: document.querySelector("#taskCardTemplate")
  };
}

const filters = { query: "", assignee: "all", priority: "all", due: "all" };
let editRequestHandler = null;

/** Let main.js hook into "edit" clicks without ui.js knowing about dialogs. */
export function onEditRequest(handler) {
  editRequestHandler = handler;
}

export function setFilter(key, value) {
  filters[key] = key === "query" ? value.trim().toLowerCase() : value;
  renderBoard();
}

export function resetFilters() {
  filters.query = "";
  filters.assignee = "all";
  filters.priority = "all";
  filters.due = "all";
  renderBoard();
}

// Debounce free-text search so typing doesn't trigger a full re-render per keystroke
let searchTimer = null;
export function onSearchInput(value) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => setFilter("query", value), 150);
}

function matchesFilters(task) {
  const haystack = `${task.title} ${task.description}`.toLowerCase();
  const matchesText = !filters.query || haystack.includes(filters.query);
  const matchesAssignee = filters.assignee === "all" || task.assignee === filters.assignee;
  const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
  const matchesDue = filters.due === "all" || deadlineState(task.dueDate) === filters.due;
  return matchesText && matchesAssignee && matchesPriority && matchesDue;
}

export function renderTeam(members) {
  if (!elements.teamList) return;
  elements.teamList.innerHTML = members
    .map(
      (member) => `
        <div class="team-person">
          <span class="member-avatar" style="background:${member.color}">${member.initials}</span>
          <span>${member.name}<small>${member.role}</small></span>
        </div>`
    )
    .join("");
}

/**
 * Full board repaint. Kept intentionally cheap: columns/cards are
 * built from lightweight template clones (no innerHTML string
 * concatenation per-card) and only touched when a change is
 * broadcast by state.js, never on a timer or during drag itself.
 */
export function renderBoard() {
  if (!elements.board) return;
  const tasks = getTasks();
  const visible = tasks.filter(matchesFilters);

  const fragment = document.createDocumentFragment();

  columns.forEach((column) => {
    const columnTasks = visible
      .filter((task) => task.columnId === column.id)
      .sort((a, b) => a.order - b.order);

    const columnEl = buildColumnShell(column, columnTasks.length);
    const list = columnEl.querySelector(".task-list");

    if (!columnTasks.length) {
      list.innerHTML = '<p class="empty-column">No matching tasks</p>';
    } else {
      columnTasks.forEach((task) => list.append(buildTaskCard(task)));
    }

    wireColumnDrop(columnEl, column.id);
    fragment.append(columnEl);
  });

  elements.board.innerHTML = "";
  elements.board.append(fragment);

  if (elements.resultCount) {
    elements.resultCount.textContent = `${visible.length} of ${tasks.length} tasks shown`;
  }
  renderStats();
}

function buildColumnShell(column, count) {
  const section = document.createElement("section");
  section.className = "board-column";
  section.dataset.columnId = column.id;
  section.innerHTML = `
    <div class="column-heading">
      <div class="column-label">
        <span class="column-dot" style="background:${column.color}"></span>
        <h3>${column.title}</h3>
        <span class="task-count">${count}</span>
      </div>
      <button class="column-menu" type="button" aria-label="${column.title} options">...</button>
    </div>
    <div class="task-list" aria-label="${column.title} tasks"></div>
  `;
  return section;
}

function buildTaskCard(task) {
  const fragment = elements.cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".task-card");
  const member = getMember(task.assignee);
  const state = deadlineState(task.dueDate);
  const priorityClass = task.priority.toLowerCase();

  card.dataset.taskId = task.id;

  const priorityBadge = card.querySelector(".priority-badge");
  priorityBadge.textContent = task.priority;
  priorityBadge.classList.add(priorityClass);

  const statusEl = card.querySelector(".card-status");
  if (statusEl) statusEl.textContent = task.title.length > 30 ? "" : ""; // status label lives in the column heading; keep empty for spacing

  card.querySelector(".task-card-title").textContent = task.title;
  card.querySelector(".task-card-description").textContent = task.description || "No additional description.";

  const avatar = card.querySelector(".card-avatar");
  avatar.textContent = member.initials;
  avatar.style.background = member.color;
  card.querySelector(".assignee-name").textContent = member.name.split(" ")[0];

  const due = card.querySelector(".due-date");
  due.textContent = formatDueDate(task.dueDate);
  due.classList.add(state);
  due.title = `Deadline: ${task.dueDate}`;

  card.setAttribute(
    "aria-label",
    `${task.title}, ${task.priority} priority, assigned to ${member.name}, ${formatDueDate(task.dueDate)}`
  );

  wireCardDrag(card, task.id);

  const editBtn = card.querySelector(".edit-task-btn");
  editBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    editRequestHandler?.(task.id);
  });

  const deleteBtn = card.querySelector(".delete-task-btn");
  deleteBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    handleDelete(task.id);
  });

  const menuBtn = card.querySelector(".card-menu");
  menuBtn?.addEventListener("click", (event) => event.stopPropagation());

  return fragment;
}

/** Visual feedback while a card is being dragged. */
function wireCardDrag(cardEl, taskId) {
  makeCardDraggable(cardEl, taskId, {
    onDragStart: (el) => {
      // rAF avoids the "ghost" drag image itself picking up the dimmed style
      requestAnimationFrame(() => el.classList.add("is-dragging"));
    },
    onDragEnd: (el) => {
      el.classList.remove("is-dragging");
      clearDropHighlights();
    }
  });
}

/** Visual feedback for valid drop targets while dragging over a column. */
function wireColumnDrop(columnEl, columnId) {
  makeColumnDroppable(columnEl, columnId, {
    onDragOver: (el) => el.classList.add("is-drop-target"),
    onDragLeave: (el) => el.classList.remove("is-drop-target"),
    onDrop: (el) => el.classList.remove("is-drop-target")
  });
}

function clearDropHighlights() {
  document.querySelectorAll(".board-column.is-drop-target").forEach((el) => el.classList.remove("is-drop-target"));
}

function handleDelete(id) {
  const task = getTasks().find((t) => t.id === id);
  if (!task) return;
  const confirmed = confirm(`Delete task "${task.title}"?`);
  if (confirmed) deleteTask(id);
}

function renderStats() {
  const { completed, percentage } = getStats();
  if (elements.completedCount) elements.completedCount.textContent = completed;
  if (elements.progressBar) elements.progressBar.style.width = `${percentage}%`;
  if (elements.progressText) elements.progressText.textContent = `${percentage}% of the work is complete`;
}

export function renderActivity() {
  if (!elements.activityList) return;
  const activity = getActivity();

  if (!activity.length) {
    elements.activityList.innerHTML = '<li class="empty-activity">No activity yet.</li>';
    return;
  }

  elements.activityList.innerHTML = activity
    .slice(0, 7)
    .map(
      (entry) => `
        <li class="activity-item">
          <span class="activity-icon">${entry.initials}</span>
          <p class="activity-copy"><strong>${entry.actor}</strong> ${entry.action} <strong>${entry.task}</strong> ${entry.detail}.<time class="activity-time">${relativeTime(entry.timestamp)}</time></p>
        </li>`
    )
    .join("");
}

/**
 * Only re-render the pieces that could plausibly have changed instead
 * of a blind full repaint on every state event — keeps drag/drop and
 * bulk edits smooth even as the task list grows.
 */
subscribe(({ type }) => {
  renderBoard();
  if (type === "create" || type === "move" || type === "update" || type === "activity-clear" || type === "delete") {
    renderActivity();
  }
});
