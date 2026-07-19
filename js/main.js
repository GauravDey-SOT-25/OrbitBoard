// ==========================================================
// main.js — Bootstrap / orchestration
// Owner: shared
//
// Wires the DOM (form, filters, dialog) to the three role modules.
// Kept deliberately thin: it never touches task data directly and
// never builds board markup directly — it just delegates to
// state.js and ui.js.
// ==========================================================

import { columns, members, dayOffset, getTaskById } from "./data.js";
import { createTask, updateTask, clearActivity } from "./state.js";
import { initUI, renderTeam, renderBoard, renderActivity, setFilter, resetFilters, onSearchInput, onEditRequest } from "./ui.js";
import { renderShell } from "./layout.js";

let elements = {};
let editingTaskId = null;

/**
 * Cache the dialog/filter/form elements. Called after layout.js has
 * mounted the shell — nothing here exists at module-load time.
 */
function cacheElements() {
  elements = {
    search: document.querySelector("#taskSearch"),
    assigneeFilter: document.querySelector("#assigneeFilter"),
    priorityFilter: document.querySelector("#priorityFilter"),
    dueFilter: document.querySelector("#dueFilter"),
    clearFilters: document.querySelector("#clearFilters"),
    clearActivity: document.querySelector("#clearActivity"),
    dialog: document.querySelector("#taskDialog"),
    dialogTitle: document.querySelector("#dialogTitle"),
    submitBtn: document.querySelector("#submitTaskBtn"),
    form: document.querySelector("#taskForm"),
    title: document.querySelector("#taskTitle"),
    description: document.querySelector("#taskDescription"),
    assignee: document.querySelector("#taskAssignee"),
    dueDate: document.querySelector("#taskDueDate"),
    priority: document.querySelector("#taskPriority"),
    status: document.querySelector("#taskStatus"),
    openDialog: document.querySelector("#openTaskModal"),
    closeDialog: document.querySelector("#closeTaskModal"),
    cancelTask: document.querySelector("#cancelTask")
  };
}

function populateSelects() {
  const memberOptions = members.map((m) => `<option value="${m.id}">${m.name}</option>`).join("");
  if (elements.assigneeFilter) elements.assigneeFilter.insertAdjacentHTML("beforeend", memberOptions);
  if (elements.assignee) elements.assignee.innerHTML = memberOptions;
  if (elements.status) elements.status.innerHTML = columns.map((c) => `<option value="${c.id}">${c.title}</option>`).join("");
}

function openCreateDialog() {
  editingTaskId = null;
  elements.form.reset();
  if (elements.dialogTitle) elements.dialogTitle.textContent = "Create task";
  if (elements.submitBtn) elements.submitBtn.textContent = "Create task";

  elements.dueDate.min = dayOffset(0);
  elements.dueDate.value = dayOffset(5);
  elements.assignee.value = members[0].id;
  elements.status.value = "todo";
  elements.priority.value = "Medium";

  elements.dialog.showModal();
  elements.title.focus();
}

function openEditDialog(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;

  editingTaskId = taskId;
  if (elements.dialogTitle) elements.dialogTitle.textContent = "Edit task";
  if (elements.submitBtn) elements.submitBtn.textContent = "Save changes";

  const todayStr = dayOffset(0);
  elements.dueDate.min = task.dueDate < todayStr ? task.dueDate : todayStr;

  elements.title.value = task.title;
  elements.description.value = task.description;
  elements.assignee.value = task.assignee;
  elements.dueDate.value = task.dueDate;
  elements.priority.value = task.priority;
  elements.status.value = task.columnId;

  elements.dialog.showModal();
  elements.title.focus();
}

function closeDialog() {
  elements.dialog.close();
  editingTaskId = null;
}

function handleFormSubmit(event) {
  event.preventDefault();
  const title = elements.title.value.trim();
  if (!title) {
    elements.title.focus();
    return;
  }

  const payload = {
    title,
    description: elements.description.value.trim(),
    assignee: elements.assignee.value,
    dueDate: elements.dueDate.value,
    priority: elements.priority.value,
    columnId: elements.status.value
  };

  if (editingTaskId) {
    updateTask(editingTaskId, payload);
  } else {
    createTask(payload);
  }

  closeDialog();
}

function attachEvents() {
  elements.openDialog?.addEventListener("click", openCreateDialog);
  elements.closeDialog?.addEventListener("click", closeDialog);
  elements.cancelTask?.addEventListener("click", closeDialog);
  elements.form?.addEventListener("submit", handleFormSubmit);

  elements.search?.addEventListener("input", (e) => onSearchInput(e.target.value));
  elements.assigneeFilter?.addEventListener("change", (e) => setFilter("assignee", e.target.value));
  elements.priorityFilter?.addEventListener("change", (e) => setFilter("priority", e.target.value));
  elements.dueFilter?.addEventListener("change", (e) => setFilter("due", e.target.value));

  elements.clearFilters?.addEventListener("click", () => {
    if (elements.search) elements.search.value = "";
    if (elements.assigneeFilter) elements.assigneeFilter.value = "all";
    if (elements.priorityFilter) elements.priorityFilter.value = "all";
    if (elements.dueFilter) elements.dueFilter.value = "all";
    resetFilters();
  });

  elements.clearActivity?.addEventListener("click", clearActivity);

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement.tagName;
    if (event.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
      event.preventDefault();
      elements.search?.focus();
    }
  });

  onEditRequest(openEditDialog);
}

function init() {
  renderShell("#app"); // layout.js builds all markup into #app
  cacheElements();     // main.js's own dialog/filter refs
  initUI();             // ui.js's own board/sidebar refs

  populateSelects();
  renderTeam(members);
  renderBoard();
  renderActivity();
  attachEvents();
}

document.addEventListener("DOMContentLoaded", init);
