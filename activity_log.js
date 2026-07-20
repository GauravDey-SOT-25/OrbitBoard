// ==========================================
// OrbitBoard — Activity Log
// ==========================================

import { deadlineState } from "./deadline.js";

const ACTIVITY_KEY = "orbit-board-activity";
const MAX_STORED_ENTRIES = 50;
const VISIBLE_ENTRIES = 8;

const starterActivity = [
  {
    id: "activity-1",
    actor: "Priya Verma",
    initials: "PV",
    message: "Priya Verma moved 'Build responsive navigation' to In Progress",
    urgency: null,
    timestamp: Date.now() - 1000 * 60 * 12
  },
  {
    id: "activity-2",
    actor: "Rahul Sharma",
    initials: "RS",
    message: "Rahul Sharma assigned task 'Fix Navbar Bug' to Neha Gupta",
    urgency: null,
    timestamp: Date.now() - 1000 * 60 * 46
  },
  {
    id: "activity-3",
    actor: "Someone",
    initials: "?",
    message: "Deadline updated for 'Write accessibility test plan'",
    urgency: "approaching",
    timestamp: Date.now() - 1000 * 60 * 60 * 3
  }
];

function loadActivity() {
  try {
    const saved = localStorage.getItem(ACTIVITY_KEY);
    return saved ? JSON.parse(saved) : starterActivity;
  } catch {
    return starterActivity;
  }
}

let activity = loadActivity();

function saveActivity() {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  } catch (error) {
    console.error("Error saving activity log to Local Storage:", error);
  }
}

function initialsFromName(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "?";
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Relative time for activity timestamps, e.g. "12m ago". */
export function relativeTime(timestamp) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function buildMessage({ actor, action, task, detail }) {
  switch (action) {
    case "moved":
      // detail = destination column, e.g. "Review"
      return `${actor} moved '${task}' to ${detail}`;
    case "assigned":
      // detail = new assignee's name, e.g. "Mike"
      return actor
        ? `${actor} assigned task '${task}' to ${detail}`
        : `Task '${task}' was assigned to ${detail}`;
    case "deadline":
      // PRD's example has no actor at all for this one.
      return `Deadline updated for '${task}'`;
    case "created":
      return `${actor} created task '${task}'${detail ? ` ${detail}` : ""}`;
    case "deleted":
      return `${actor} deleted task '${task}'${detail ? ` ${detail}` : ""}`;
    default:
      return `${actor} ${action} '${task}'${detail ? ` ${detail}` : ""}`;
  }
}

/**
 * Record a new activity entry and re-render the panel.
 * Other teams' modules call this whenever a task is created, edited,
 * deleted, moved, or reassigned so the log reflects real actions.
 *
 * @param {Object} entry
 * @param {string} [entry.actor]   - Name of the member associated with the action.
 *                                   Omit for "deadline" entries, which read as
 *                                   "Deadline updated for 'Task'" with no actor.
 * @param {string} entry.action    - One of: "created", "moved", "assigned", "deadline", "deleted".
 * @param {string} entry.task      - Task title.
 * @param {string} [entry.detail]  - Action-specific context:
 *                                     moved     -> destination column, e.g. "Review"
 *                                     assigned  -> new assignee's name, e.g. "Mike"
 *                                     created/deleted -> e.g. "in To Do" / "from Done"
 * @param {string} [entry.dueDate] - Raw due date (YYYY-MM-DD), used with "deadline"
 *                                   entries to flag urgency (overdue/approaching/upcoming)
 *                                   via deadline.js, even though it isn't printed in the text.
 */
export function logActivity({ actor, action, task, detail = "", dueDate }) {
  const urgency = dueDate ? deadlineState(dueDate) : null; // "overdue" | "approaching" | "upcoming"
  const message = buildMessage({ actor, action, task, detail });

  activity.unshift({
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor: actor || "Someone",
    initials: initialsFromName(actor),
    message,
    urgency,
    timestamp: Date.now()
  });

  if (activity.length > MAX_STORED_ENTRIES) activity.length = MAX_STORED_ENTRIES;
  saveActivity();
  renderActivity();
}

/** Clear the entire activity log (wired to the "Clear" button). */
export function clearActivityLog() {
  activity = [];
  saveActivity();
  renderActivity();
}

function renderActivity() {
  const list = document.querySelector("#activityList");
  if (!list) return;

  if (!activity.length) {
    list.innerHTML = '<li class="empty-activity">No activity yet.</li>';
    return;
  }

  list.innerHTML = activity
    .slice(0, VISIBLE_ENTRIES)
    .map((entry) => `
      <li class="activity-item">
        <span class="activity-icon">${escapeHtml(entry.initials)}</span>
        <p class="activity-copy">${escapeHtml(entry.message)}.<time class="activity-time">${relativeTime(entry.timestamp)}</time></p>
      </li>
    `)
    .join("");
}

function attachActivityEvents() {
  document.querySelector("#clearActivity")?.addEventListener("click", clearActivityLog);
  document.addEventListener("orbit:activity", (event) => logActivity(event.detail));
}

function init() {
  renderActivity();
  attachActivityEvents();
  setInterval(renderActivity, 60000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
