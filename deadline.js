// ==========================================
// OrbitBoard — Deadline Tracking
// ==========================================
 
/** Returns an ISO date string N days from today. Used for demo/seed due dates. */
export const dayOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
 
function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
 
/**
 * Classify a due date into a deadline state used for color coding.
 *   "overdue"     -> red    (past due)
 *   "approaching" -> yellow (due within 3 days)
 *   "upcoming"    -> green  (due later)
 */
export function deadlineState(dueDate) {
  const due = new Date(`${dueDate}T00:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.round((due - startOfToday()) / millisecondsPerDay);
 
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "approaching";
  return "upcoming";
}
 
/** Due date label, e.g. "Due today", "3 days late", "Aug 2". */
export function formatDueDate(dueDate) {
  const date = new Date(`${dueDate}T00:00:00`);
  const today = startOfToday();
  const days = Math.round((date - today) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "1 day late";
  if (days < 0) return `${Math.abs(days)} days late`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getDeadlineMeta(dueDate) {
  return {
    state: deadlineState(dueDate),
    label: formatDueDate(dueDate)
  };
}

export function renderDeadlineBadge(element, dueDate) {
  if (!element) return null;
  const meta = applyBadge(element, dueDate);
  liveBadges.set(element, dueDate);
  return meta;
}
 
function applyBadge(element, dueDate) {
  const meta = getDeadlineMeta(dueDate);
  element.textContent = meta.label;
  element.classList.remove("overdue", "approaching", "upcoming");
  element.classList.add(meta.state);
  element.title = `Deadline: ${dueDate}`;
  return meta;
}
 
// ------------------------------------------
// Live badge updates
// ------------------------------------------

const liveBadges = new Map();

export function refreshDeadlineBadges() {
  for (const [element, dueDate] of liveBadges) {
    if (!element.isConnected) {
      liveBadges.delete(element);
      continue;
    }
    applyBadge(element, dueDate);
  }
}

setInterval(refreshDeadlineBadges, 60000);