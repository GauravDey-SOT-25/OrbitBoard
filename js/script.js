const columns = [
  { id: "backlog", title: "Backlog", color: "#94a0b3" },
  { id: "todo", title: "To Do", color: "#507de7" },
  { id: "progress", title: "In Progress", color: "#7256c9" },
  { id: "review", title: "Review", color: "#cf8b25" },
  { id: "done", title: "Done", color: "#1d9a6c" }
];

const members = [
  { id: "rahul", name: "Rahul Sharma", initials: "RS", role: "Product Designer", color: "#c46572" },
  { id: "priya", name: "Priya Verma", initials: "PV", role: "Frontend Engineer", color: "#527bbf" },
  { id: "arjun", name: "Arjun Singh", initials: "AS", role: "Product Manager", color: "#9669b8" },
  { id: "neha", name: "Neha Gupta", initials: "NG", role: "QA Engineer", color: "#d48743" }
];

export const dayOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const starterTasks = [
  {
    id: "task-1",
    columnId: "backlog",
    title: "Explore onboarding flows",
    description: "Map the first-run journey and collect examples from comparable products.",
    assignee: "rahul",
    dueDate: dayOffset(9),
    priority: "Low"
  },
  {
    id: "task-2",
    columnId: "backlog",
    title: "Audit existing content",
    description: "Identify pages that should be retained, rewritten, or removed.",
    assignee: "arjun",
    dueDate: dayOffset(5),
    priority: "Medium"
  },
  {
    id: "task-3",
    columnId: "todo",
    title: "Homepage information architecture",
    description: "Create the primary navigation and page hierarchy for the new site.",
    assignee: "rahul",
    dueDate: dayOffset(2),
    priority: "High"
  },
  {
    id: "task-4",
    columnId: "todo",
    title: "Set up component tokens",
    description: "Define reusable spacing, type, color, and elevation tokens.",
    assignee: "priya",
    dueDate: dayOffset(7),
    priority: "Medium"
  },
  {
    id: "task-5",
    columnId: "progress",
    title: "Build responsive navigation",
    description: "Implement the desktop and mobile navigation patterns.",
    assignee: "priya",
    dueDate: dayOffset(1),
    priority: "High"
  },
  {
    id: "task-6",
    columnId: "progress",
    title: "Write accessibility test plan",
    description: "Document keyboard and screen reader checks for the release.",
    assignee: "neha",
    dueDate: dayOffset(-1),
    priority: "High"
  },
  {
    id: "task-7",
    columnId: "review",
    title: "Review visual direction",
    description: "Get stakeholder feedback on the approved visual exploration.",
    assignee: "arjun",
    dueDate: dayOffset(3),
    priority: "Medium"
  },
  {
    id: "task-8",
    columnId: "done",
    title: "Kickoff and requirements",
    description: "Align scope, success metrics, owners, and delivery dates.",
    assignee: "arjun",
    dueDate: dayOffset(-4),
    priority: "Low"
  }
];
const starterActivity = [
  {
    id: "activity-1",
    initials: "PV",
    actor: "Priya Verma",
    action: "moved",
    task: "Build responsive navigation",
    detail: "to In Progress",
    timestamp: Date.now() - 1000 * 60 * 12
  },
  {
    id: "activity-2",
    initials: "RS",
    actor: "Rahul Sharma",
    action: "created",
    task: "Homepage information architecture",
    detail: "in To Do",
    timestamp: Date.now() - 1000 * 60 * 46
  },
  {
    id: "activity-3",
    initials: "NG",
    actor: "Neha Gupta",
    action: "updated",
    task: "Write accessibility test plan",
    detail: "with a new deadline",
    timestamp: Date.now() - 1000 * 60 * 60 * 3
  }
];

const storageKey = "orbit-board-tasks";
const activityStorageKey = "orbit-board-activity";
let tasks = loadState(storageKey, starterTasks);
let activity = loadState(activityStorageKey, starterActivity);
let draggedTaskId = null;

const elements = {
  board: document.querySelector("#boardColumns"),
  teamList: document.querySelector("#teamList"),
  activityList: document.querySelector("#activityList"),
  completedCount: document.querySelector("#completedCount"),
  progressBar: document.querySelector("#progressBar"),
  progressText: document.querySelector("#progressText"),
  resultCount: document.querySelector("#resultCount"),
  search: document.querySelector("#taskSearch"),
  assigneeFilter: document.querySelector("#assigneeFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  dueFilter: document.querySelector("#dueFilter"),
  clearFilters: document.querySelector("#clearFilters"),
  dialog: document.querySelector("#taskDialog"),
  form: document.querySelector("#taskForm"),
  title: document.querySelector("#taskTitle"),
  description: document.querySelector("#taskDescription"),
  assignee: document.querySelector("#taskAssignee"),
  dueDate: document.querySelector("#taskDueDate"),
  priority: document.querySelector("#taskPriority"),
  status: document.querySelector("#taskStatus"),
  openDialog: document.querySelector("#openTaskModal"),
  closeDialog: document.querySelector("#closeTaskModal"),
  cancelTask: document.querySelector("#cancelTask"),
  clearActivity: document.querySelector("#clearActivity"),
  cardTemplate: document.querySelector("#taskCardTemplate")
};

function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
  localStorage.setItem(activityStorageKey, JSON.stringify(activity));
}

function getMember(id) {
  return members.find((member) => member.id === id) || members[0];
}

function getColumn(id) {
  return columns.find((column) => column.id === id);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function deadlineState(dueDate) {
  const due = new Date(`${dueDate}T12:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.ceil((due - startOfToday()) / millisecondsPerDay);

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

function relativeTime(timestamp) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function matchesFilters(task) {
  const query = elements.search.value.trim().toLowerCase();
  const matchesText = !query || `${task.title} ${task.description}`.toLowerCase().includes(query);
  const matchesAssignee = elements.assigneeFilter.value === "all" || task.assignee === elements.assigneeFilter.value;
  const matchesPriority = elements.priorityFilter.value === "all" || task.priority === elements.priorityFilter.value;
  const matchesDue = elements.dueFilter.value === "all" || deadlineState(task.dueDate) === elements.dueFilter.value;
  return matchesText && matchesAssignee && matchesPriority && matchesDue;
}

function renderTeam() {
  elements.teamList.innerHTML = members.map((member) => `
    <div class="team-person">
      <span class="member-avatar" style="background:${member.color}">${member.initials}</span>
      <span>${member.name}<small>${member.role}</small></span>
    </div>
  `).join("");
}

function renderBoard() {
  const visibleTasks = tasks.filter(matchesFilters);
  elements.board.innerHTML = "";

  columns.forEach((column) => {
    const columnTasks = visibleTasks.filter((task) => task.columnId === column.id);
    const boardColumn = document.createElement("section");
    boardColumn.className = "board-column";
    boardColumn.dataset.columnId = column.id;
    boardColumn.innerHTML = `
      <div class="column-heading">
        <div class="column-label">
          <span class="column-dot" style="background:${column.color}"></span>
          <h3>${column.title}</h3>
          <span class="task-count">${columnTasks.length}</span>
        </div>
        <button class="column-menu" type="button" aria-label="${column.title} options">...</button>
      </div>
      <div class="task-list" aria-label="${column.title} tasks"></div>
    `;

    const taskList = boardColumn.querySelector(".task-list");
    if (!columnTasks.length) {
      taskList.innerHTML = '<p class="empty-column">No matching tasks</p>';
    } else {
      columnTasks.forEach((task) => taskList.append(createTaskCard(task)));
    }

    enableDropZone(boardColumn);
    elements.board.append(boardColumn);
  });

  elements.resultCount.textContent = `${visibleTasks.length} of ${tasks.length} tasks shown`;
  renderProgress();
}

function createTaskCard(task) {
  const fragment = elements.cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".task-card");
  const member = getMember(task.assignee);
  const state = deadlineState(task.dueDate);
  const priorityClass = task.priority.toLowerCase();

  card.dataset.taskId = task.id;
  card.querySelector(".priority-badge").textContent = task.priority;
  card.querySelector(".priority-badge").classList.add(priorityClass);
  card.querySelector(".card-status").textContent = getColumn(task.columnId).title;
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
  card.setAttribute("aria-label", `${task.title}, ${task.priority} priority, assigned to ${member.name}, ${formatDueDate(task.dueDate)}`);

  card.addEventListener("dragstart", (event) => {
    draggedTaskId = task.id;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
  });
  card.addEventListener("dragend", () => {
    draggedTaskId = null;
    card.classList.remove("is-dragging");
    document.querySelectorAll(".board-column").forEach((column) => column.classList.remove("is-drop-target"));
  });
  card.querySelector(".card-menu")?.addEventListener("click", (event) => event.stopPropagation());

  return fragment;
}

function enableDropZone(columnElement) {
  columnElement.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    columnElement.classList.add("is-drop-target");
  });
  columnElement.addEventListener("dragleave", (event) => {
    if (!columnElement.contains(event.relatedTarget)) columnElement.classList.remove("is-drop-target");
  });
  columnElement.addEventListener("drop", (event) => {
    event.preventDefault();
    columnElement.classList.remove("is-drop-target");
    moveTask(event.dataTransfer.getData("text/plain") || draggedTaskId, columnElement.dataset.columnId);
  });
}

function moveTask(taskId, destinationColumnId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || task.columnId === destinationColumnId) return;

  const from = getColumn(task.columnId);
  const to = getColumn(destinationColumnId);
  task.columnId = destinationColumnId;
  const member = getMember(task.assignee);
  activity.unshift({
    id: `activity-${Date.now()}`,
    initials: member.initials,
    actor: member.name,
    action: "moved",
    task: task.title,
    detail: `from ${from.title} to ${to.title}`,
    timestamp: Date.now()
  });
  saveState();
  renderBoard();
  renderActivity();
}

function renderProgress() {
  const completed = tasks.filter((task) => task.columnId === "done").length;
  const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  elements.completedCount.textContent = completed;
  elements.progressBar.style.width = `${percentage}%`;
  elements.progressText.textContent = `${percentage}% of the work is complete`;
}

function renderActivity() {
  if (!activity.length) {
    elements.activityList.innerHTML = '<li class="empty-activity">No activity yet.</li>';
    return;
  }
  elements.activityList.innerHTML = activity.slice(0, 7).map((entry) => `
    <li class="activity-item">
      <span class="activity-icon">${entry.initials}</span>
      <p class="activity-copy"><strong>${entry.actor}</strong> ${entry.action} <strong>${entry.task}</strong> ${entry.detail}.<time class="activity-time">${relativeTime(entry.timestamp)}</time></p>
    </li>
  `).join("");
}

function populateSelects() {
  const memberOptions = members.map((member) => `<option value="${member.id}">${member.name}</option>`).join("");
  elements.assigneeFilter.insertAdjacentHTML("beforeend", memberOptions);
  elements.assignee.innerHTML = memberOptions;
  elements.status.innerHTML = columns.map((column) => `<option value="${column.id}">${column.title}</option>`).join("");
}

function openTaskDialog() {
  elements.form.reset();
  elements.dueDate.min = dayOffset(0);
  elements.dueDate.value = dayOffset(5);
  elements.assignee.value = members[0].id;
  elements.status.value = "todo";
  elements.dialog.showModal();
  elements.title.focus();
}

function closeTaskDialog() {
  elements.dialog.close();
}

function addTask(event) {
  event.preventDefault();
  const title = elements.title.value.trim();
  if (!title) {
    elements.title.focus();
    return;
  }

  const task = {
    id: `task-${Date.now()}`,
    columnId: elements.status.value,
    title,
    description: elements.description.value.trim(),
    assignee: elements.assignee.value,
    dueDate: elements.dueDate.value,
    priority: elements.priority.value
  };
  tasks.push(task);
  const member = getMember(task.assignee);
  activity.unshift({
    id: `activity-${Date.now()}`,
    initials: member.initials,
    actor: member.name,
    action: "created",
    task: task.title,
    detail: `in ${getColumn(task.columnId).title}`,
    timestamp: Date.now()
  });
  saveState();
  renderBoard();
  renderActivity();
  closeTaskDialog();
}

function clearFilters() {
  elements.search.value = "";
  elements.assigneeFilter.value = "all";
  elements.priorityFilter.value = "all";
  elements.dueFilter.value = "all";
  renderBoard();
}

function attachEvents() {
  [elements.search, elements.assigneeFilter, elements.priorityFilter, elements.dueFilter].forEach((control) => {
    control.addEventListener("input", renderBoard);
    control.addEventListener("change", renderBoard);
  });
  elements.clearFilters.addEventListener("click", clearFilters);
  elements.openDialog.addEventListener("click", openTaskDialog);
  elements.closeDialog.addEventListener("click", closeTaskDialog);
  elements.cancelTask.addEventListener("click", closeTaskDialog);
  elements.form.addEventListener("submit", addTask);
  elements.clearActivity.addEventListener("click", () => {
    activity = [];
    saveState();
    renderActivity();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      event.preventDefault();
      elements.search.focus();
    }
  });
}

populateSelects();
renderTeam();
renderBoard();
renderActivity();
attachEvents();
