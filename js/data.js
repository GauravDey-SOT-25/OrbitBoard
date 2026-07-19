// ==========================================================
// data.js — Shared data models & pure utility functions
// Owner: shared (no single teammate — everyone depends on this)
// No DOM access here and no state mutation. Safe to import from
// any of the three role modules without creating circular logic.
// ==========================================================

export const columns = [
  { id: "backlog", title: "Backlog", color: "#94a0b3" },
  { id: "todo", title: "To Do", color: "#507de7" },
  { id: "progress", title: "In Progress", color: "#7256c9" },
  { id: "review", title: "Review", color: "#cf8b25" },
  { id: "done", title: "Done", color: "#1d9a6c" }
];

export const members = [
  { id: "rahul", name: "Rahul Sharma", initials: "RS", role: "Product Designer", color: "#c46572" },
  { id: "priya", name: "Priya Verma", initials: "PV", role: "Frontend Engineer", color: "#527bbf" },
  { id: "arjun", name: "Arjun Singh", initials: "AS", role: "Product Manager", color: "#9669b8" },
  { id: "neha", name: "Neha Gupta", initials: "NG", role: "QA Engineer", color: "#d48743" }
];

export function dayOffset(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const starterTasks = [
  { id: "task-1", columnId: "backlog", order: 0, title: "Explore onboarding flows", description: "Map the first-run journey and collect examples from comparable products.", assignee: "rahul", dueDate: dayOffset(9), priority: "Low" },
  { id: "task-2", columnId: "backlog", order: 1, title: "Audit existing content", description: "Identify pages that should be retained, rewritten, or removed.", assignee: "arjun", dueDate: dayOffset(5), priority: "Medium" },
  { id: "task-3", columnId: "todo", order: 0, title: "Homepage information architecture", description: "Create the primary navigation and page hierarchy for the new site.", assignee: "rahul", dueDate: dayOffset(2), priority: "High" },
  { id: "task-4", columnId: "todo", order: 1, title: "Set up component tokens", description: "Define reusable spacing, type, color, and elevation tokens.", assignee: "priya", dueDate: dayOffset(7), priority: "Medium" },
  { id: "task-5", columnId: "progress", order: 0, title: "Build responsive navigation", description: "Implement the desktop and mobile navigation patterns.", assignee: "priya", dueDate: dayOffset(1), priority: "High" },
  { id: "task-6", columnId: "progress", order: 1, title: "Write accessibility test plan", description: "Document keyboard and screen reader checks for the release.", assignee: "neha", dueDate: dayOffset(-1), priority: "High" },
  { id: "task-7", columnId: "review", order: 0, title: "Review visual direction", description: "Get stakeholder feedback on the approved visual exploration.", assignee: "arjun", dueDate: dayOffset(3), priority: "Medium" },
  { id: "task-8", columnId: "done", order: 0, title: "Kickoff and requirements", description: "Align scope, success metrics, owners, and delivery dates.", assignee: "arjun", dueDate: dayOffset(-4), priority: "Low" }
];

export const starterActivity = [
  { id: "activity-1", initials: "PV", actor: "Priya Verma", action: "moved", task: "Build responsive navigation", detail: "to In Progress", timestamp: Date.now() - 1000 * 60 * 12 },
  { id: "activity-2", initials: "RS", actor: "Rahul Sharma", action: "created", task: "Homepage information architecture", detail: "in To Do", timestamp: Date.now() - 1000 * 60 * 46 },
  { id: "activity-3", initials: "NG", actor: "Neha Gupta", action: "updated", task: "Write accessibility test plan", detail: "with a new deadline", timestamp: Date.now() - 1000 * 60 * 60 * 3 }
];

export function getMember(id) {
  return members.find((m) => m.id === id) || members[0];
}

export function getColumn(id) {
  return columns.find((c) => c.id === id) || columns[0];
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function deadlineState(dueDate) {
  const due = new Date(`${dueDate}T12:00:00`);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.ceil((due - startOfToday()) / msPerDay);
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "approaching";
  return "upcoming";
}

export function formatDueDate(dueDate) {
  const date = new Date(`${dueDate}T12:00:00`);
  const today = startOfToday();
  const days = Math.round((date - today) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "1 day late";
  if (days < 0) return `${Math.abs(days)} days late`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function relativeTime(timestamp) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
