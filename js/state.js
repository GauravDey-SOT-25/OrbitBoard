// ==========================================================
// state.js — Application state & board synchronization
// Owner: Shashank
//
// Single source of truth for tasks + activity. Nothing outside this
// file is allowed to mutate `tasks`/`activity` directly — every
// change goes through the functions exported here, which then
// notify subscribers so the UI re-renders instantly, with no page
// reload and no manual DOM syncing from the caller's side.
// ==========================================================

import { starterTasks, starterActivity, getMember, getColumn } from "./data.js";

const TASKS_KEY = "orbit-board-tasks";
const ACTIVITY_KEY = "orbit-board-activity";

let tasks = load(TASKS_KEY, starterTasks);
let activity = load(ACTIVITY_KEY, starterActivity);

const listeners = new Set();

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(fallback));
  } catch (error) {
    console.error(`state.js: failed to load "${key}", using defaults`, error);
    return JSON.parse(JSON.stringify(fallback));
  }
}

function persist() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  } catch (error) {
    console.error("state.js: failed to persist board", error);
  }
}

function notify(type, payload) {
  persist();
  listeners.forEach((fn) => fn({ type, payload, tasks, activity }));
}

/** Subscribe to every state change. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getTasks() {
  return tasks;
}

export function getActivity() {
  return activity;
}

export function getTaskById(id) {
  return tasks.find((t) => t.id === id);
}

function logActivity(assigneeId, action, taskTitle, detail) {
  const member = getMember(assigneeId);
  activity.unshift({
    id: `activity-${Date.now()}`,
    initials: member.initials,
    actor: member.name,
    action,
    task: taskTitle,
    detail,
    timestamp: Date.now()
  });
  activity = activity.slice(0, 30); // keep the feed bounded
}

/** Create a new task, appended to the end of its target column. */
export function createTask({ title, description, assignee, dueDate, priority, columnId }) {
  if (!title || !title.trim()) throw new Error("createTask: title is required");
  if (!getColumn(columnId)) throw new Error(`createTask: unknown column "${columnId}"`);

  const columnTasks = tasks.filter((t) => t.columnId === columnId);
  const task = {
    id: `task-${Date.now()}`,
    columnId,
    order: columnTasks.length,
    title: title.trim(),
    description: (description || "").trim(),
    assignee,
    dueDate,
    priority
  };

  tasks.push(task);
  logActivity(assignee, "created", task.title, `in ${getColumn(columnId).title}`);
  notify("create", task);
  return task;
}

/** Edit an existing task's fields (title, description, assignee, etc). */
export function updateTask(id, updates) {
  const task = getTaskById(id);
  if (!task) {
    console.warn(`updateTask: no task found with id "${id}"`);
    return null;
  }
  const clean = { ...updates };
  if (clean.title !== undefined) clean.title = clean.title.trim();
  if (clean.description !== undefined) clean.description = clean.description.trim();

  Object.assign(task, clean);
  logActivity(task.assignee, "updated", task.title, "with new details");
  notify("update", task);
  return task;
}

export function deleteTask(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    console.warn(`deleteTask: no task found with id "${id}"`);
    return false;
  }
  const [removed] = tasks.splice(index, 1);
  // Re-pack ordering in the column the task was removed from so gaps don't accumulate
  tasks
    .filter((t) => t.columnId === removed.columnId)
    .sort((a, b) => a.order - b.order)
    .forEach((t, i) => (t.order = i));

  notify("delete", { id });
  return true;
}

/**
 * Move a task to a (possibly new) column and position, keeping every
 * affected column's `order` field dense/contiguous. This is the single
 * entry point dragdrop.js calls on every successful drop — it also
 * covers same-column reordering.
 */
export function moveTask(taskId, destColumnId, destIndex = Infinity) {
  const task = getTaskById(taskId);
  if (!task) {
    console.warn(`moveTask: no task found with id "${taskId}"`); // edge case: stale drag
    return false;
  }
  if (!getColumn(destColumnId)) {
    console.warn(`moveTask: invalid destination column "${destColumnId}"`); // edge case: bad drop
    return false;
  }

  const sourceColumnId = task.columnId;
  const sameColumn = sourceColumnId === destColumnId;

  // Re-index the source column without the moved task
  tasks
    .filter((t) => t.columnId === sourceColumnId && t.id !== taskId)
    .sort((a, b) => a.order - b.order)
    .forEach((t, i) => (t.order = i));

  // Insert into the destination column at the requested position
  const destTasks = tasks
    .filter((t) => t.columnId === destColumnId && t.id !== taskId)
    .sort((a, b) => a.order - b.order);

  const clampedIndex = Math.max(0, Math.min(destIndex, destTasks.length)); // edge case: empty column / out-of-range index
  destTasks.splice(clampedIndex, 0, task);
  destTasks.forEach((t, i) => (t.order = i));

  task.columnId = destColumnId;

  if (!sameColumn) {
    logActivity(task.assignee, "moved", task.title, `from ${getColumn(sourceColumnId).title} to ${getColumn(destColumnId).title}`);
  }

  notify("move", task);
  return true;
}

export function clearActivity() {
  activity = [];
  notify("activity-clear", null);
}

/** Derived, always-fresh board stats — never stored twice. */
export function getStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.columnId === "done").length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}

export function getCountForColumn(columnId) {
  return tasks.filter((t) => t.columnId === columnId).length;
}
