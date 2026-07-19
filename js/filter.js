export function matchesFilters(task, filters) {
  const query = (filters.search || "").trim().toLowerCase();
  const matchesText = !query || `${task.title} ${task.description}`.toLowerCase().includes(query);

  const selectedAssignee = (filters.assignee || "all").trim().toLowerCase();
  const taskAssignee = String(task.assignee || "").trim().toLowerCase();
  const matchesAssignee = selectedAssignee === "all" ||
    taskAssignee === selectedAssignee ||
    taskAssignee.includes(selectedAssignee) ||
    selectedAssignee.includes(taskAssignee);

  const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
  const matchesDue = filters.due === "all" || deadlineState(task.dueDate) === filters.due;
  return matchesText && matchesAssignee && matchesPriority && matchesDue;
}

export function gatherFilterValues(elements) {
  return {
    search: elements.search?.value || "",
    assignee: elements.assigneeFilter?.value || "all",
    priority: elements.priorityFilter?.value || "all",
    due: elements.dueFilter?.value || "all"
  };
}

export function clearFilters(elements) {
  if (elements.search) elements.search.value = "";
  if (elements.assigneeFilter) elements.assigneeFilter.value = "all";
  if (elements.priorityFilter) elements.priorityFilter.value = "all";
  if (elements.dueFilter) elements.dueFilter.value = "all";
}

function deadlineState(dueDate) {
  const due = new Date(`${dueDate}T12:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.ceil((due - startOfToday()) / millisecondsPerDay);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "approaching";
  return "upcoming";
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}
