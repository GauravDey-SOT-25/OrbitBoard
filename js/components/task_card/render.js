// UI Rendering, DOM Interactions, Data Management, and CRUD Module for OrbitBoard

// Import shared utility functions from script.js to avoid duplication
import { dayOffset, formatDueDate, deadlineState as getDeadlineState } from "../../script.js";

// ==========================================
// 1. Data Models & Local Storage Persistence
// ==========================================

const columns = [
  { id: "Backlog", title: "Backlog", color: "#94a0b3" },
  { id: "To Do", title: "To Do", color: "#507de7" },
  { id: "In Progress", title: "In Progress", color: "#7256c9" },
  { id: "Review", title: "Review", color: "#cf8b25" },
  { id: "Done", title: "Done", color: "#1d9a6c" }
];

const members = [
  { id: "arpita", name: "Arpita", initials: "AA", role: "Senior Developer", color: "#e11d48" },
  { id: "rahul", name: "Rahul Sharma", initials: "RS", role: "Product Designer", color: "#c46572" },
  { id: "priya", name: "Priya Verma", initials: "PV", role: "Frontend Engineer", color: "#527bbf" },
  { id: "arjun", name: "Arjun Singh", initials: "AS", role: "Product Manager", color: "#9669b8" },
  { id: "neha", name: "Neha Gupta", initials: "NG", role: "QA Engineer", color: "#d48743" }
];

const starterTasks = [
  {
    id: "task-1",
    title: "Explore onboarding flows",
    description: "Map the first-run journey and collect examples.",
    assignee: "Rahul Sharma",
    dueDate: dayOffset(9),
    priority: "Low",
    status: "Backlog"
  },
  {
    id: "task-2",
    title: "Audit existing content",
    description: "Identify pages that should be retained, rewritten, or removed.",
    assignee: "Arjun Singh",
    dueDate: dayOffset(5),
    priority: "Medium",
    status: "Backlog"
  },
  {
    id: "task-3",
    title: "Homepage information architecture",
    description: "Create the primary navigation and page hierarchy.",
    assignee: "Rahul Sharma",
    dueDate: dayOffset(2),
    priority: "High",
    status: "To Do"
  },
  {
    id: "task-4",
    title: "Set up component tokens",
    description: "Define reusable spacing, type, color, and elevation tokens.",
    assignee: "Priya Verma",
    dueDate: dayOffset(7),
    priority: "Medium",
    status: "To Do"
  },
  {
    id: "task-5",
    title: "Build responsive navigation",
    description: "Implement the desktop and mobile navigation patterns.",
    assignee: "Priya Verma",
    dueDate: dayOffset(1),
    priority: "High",
    status: "In Progress"
  },
  {
    id: "task-6",
    title: "Write accessibility test plan",
    description: "Document keyboard and screen reader checks for the release.",
    assignee: "Neha Gupta",
    dueDate: dayOffset(-1),
    priority: "High",
    status: "In Progress"
  },
  {
    id: "task-7",
    title: "Review visual direction",
    description: "Get stakeholder feedback on the approved visual exploration.",
    assignee: "Arjun Singh",
    dueDate: dayOffset(3),
    priority: "Medium",
    status: "Review"
  },
  {
    id: "task-8",
    title: "Kickoff and requirements",
    description: "Align scope, success metrics, owners, and delivery dates.",
    assignee: "Arjun Singh",
    dueDate: dayOffset(-4),
    priority: "Low",
    status: "Done"
  }
];

const STORAGE_KEY = "orbit-board-tasks-modular";
let tasks = [];

/**
 * Load tasks from Local Storage, falling back to starter tasks.
 * @returns {Array} List of task objects
 */
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    tasks = saved ? JSON.parse(saved) : starterTasks;
  } catch (error) {
    console.error("Error loading tasks from Local Storage:", error);
    tasks = starterTasks;
  }
  return tasks;
}

/**
 * Save tasks to Local Storage.
 */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks to Local Storage:", error);
  }
}

/**
 * Helper to look up a member object by name or ID.
 * @param {string} identifier - Name or ID of the member
 * @returns {Object} Member object
 */
function getMember(identifier) {
  return members.find(m => m.name === identifier || m.id === identifier) || members[0];
}

/**
 * Helper to look up a column object by ID.
 * @param {string} id - Column ID
 * @returns {Object} Column object
 */
function getColumn(id) {
  return columns.find(c => c.id === id) || columns[0];
}

// ==========================================
// 2. Task CRUD Operations
// ==========================================

/**
 * Find a task by its unique ID.
 * @param {string} id - Task ID
 * @returns {Object|undefined} Task object or undefined if not found
 */
function getTaskById(id) {
  return tasks.find((t) => t.id === id);
}

/**
 * Create a new task object, push it to tasks list, and persist.
 */
function createTask(title, description, assignee, dueDate, priority, status) {
  const newTask = {
    id: `task-${Date.now()}`,
    title: title.trim(),
    description: description.trim(),
    assignee: assignee.trim(),
    dueDate,
    priority,
    status
  };
  tasks.push(newTask);
  saveTasks();
  return newTask;
}

/**
 * Edit/Update an existing task in place and persist.
 */
function editTask(id, updatedFields) {
  const task = getTaskById(id);
  if (task) {
    // Sanitize text inputs if they are part of updatedFields
    if (updatedFields.title !== undefined) updatedFields.title = updatedFields.title.trim();
    if (updatedFields.description !== undefined) updatedFields.description = updatedFields.description.trim();
    if (updatedFields.assignee !== undefined) updatedFields.assignee = updatedFields.assignee.trim();

    Object.assign(task, updatedFields);
    saveTasks();
    return task;
  }
  return null;
}

/**
 * Delete a task from the list and persist.
 */
function deleteTask(id) {
  console.log("deleteTask called for ID:", id, "Current tasks count:", tasks.length);
  const index = tasks.findIndex((t) => t.id === id);
  if (index !== -1) {
    tasks.splice(index, 1);
    saveTasks();
    console.log("Task successfully deleted. Remaining tasks count:", tasks.length);
    return true;
  }
  console.error("deleteTask failed: ID not found in tasks list:", id);
  return false;
}

// ==========================================
// 3. Task Input Validation
// ==========================================

/**
 * Validate a task data object.
 * @param {Object} data - Task data to validate
 * @returns {Object} { isValid: boolean, errors: Object }
 */
function validateTask(data) {
  const errors = {};

  if (!data.title || data.title.trim() === "") {
    errors.title = "Title cannot be empty.";
  }

  if (!data.description || data.description.trim() === "") {
    errors.description = "Description cannot be empty.";
  }

  if (!data.assignee || data.assignee.trim() === "") {
    errors.assignee = "Assignee selection is required.";
  }

  if (!data.priority || data.priority.trim() === "") {
    errors.priority = "Priority selection is required.";
  }

  if (!data.status || data.status.trim() === "") {
    errors.status = "Status selection is required.";
  }

  if (!data.dueDate) {
    errors.dueDate = "Due Date is required.";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const inputDate = new Date(`${data.dueDate}T00:00:00`);
    if (isNaN(inputDate.getTime())) {
      errors.dueDate = "Invalid date format.";
    } else if (inputDate < today) {
      errors.dueDate = "Due Date cannot be before today's date.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Display validation errors below their respective input elements in the form.
 */
function displayErrors(formElement, errors) {
  clearErrors(formElement);

  Object.keys(errors).forEach((fieldName) => {
    const selector = `[name="${fieldName}"], #${fieldName}, #task${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
    const input = formElement.querySelector(selector);
    
    if (input) {
      input.classList.add("input-error");
      
      const errorSpan = document.createElement("span");
      errorSpan.className = "error-msg";
      errorSpan.textContent = errors[fieldName];
      errorSpan.id = `error-${fieldName}`;
      
      input.parentNode.appendChild(errorSpan);
    }
  });
}

/**
 * Remove all error messages and style overrides from a form.
 */
function clearErrors(formElement) {
  formElement.querySelectorAll(".input-error").forEach((input) => {
    input.classList.remove("input-error");
  });
  
  formElement.querySelectorAll(".error-msg").forEach((msg) => {
    msg.remove();
  });
}

// ==========================================
// 4. UI Rendering & DOM Interactions
// ==========================================

// DOM element references
const elements = {
  board: document.querySelector("#boardColumns"),
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
  dialogTitle: document.querySelector("#dialogTitle"),
  submitBtn: document.querySelector("#submitTaskBtn"),
  title: document.querySelector("#taskTitle"),
  description: document.querySelector("#taskDescription"),
  assignee: document.querySelector("#taskAssignee"),
  dueDate: document.querySelector("#taskDueDate"),
  priority: document.querySelector("#taskPriority"),
  status: document.querySelector("#taskStatus"),
  openDialog: document.querySelector("#openTaskModal"),
  closeDialog: document.querySelector("#closeTaskModal"),
  cancelTask: document.querySelector("#cancelTask"),
  cardTemplate: document.querySelector("#taskCardTemplate")
};

let editingTaskId = null; // Track if we are editing an existing task
let draggedTaskId = null;  // Track if we are dragging a task card

/**
 * Determine if a task matches all active filter criteria.
 */
function matchesFilters(task) {
  const query = elements.search ? elements.search.value.trim().toLowerCase() : "";
  const matchesText = !query || `${task.title} ${task.description}`.toLowerCase().includes(query);
  
  const assigneeVal = elements.assigneeFilter ? elements.assigneeFilter.value : "all";
  const matchesAssignee = assigneeVal === "all" || task.assignee === assigneeVal;
  
  const priorityVal = elements.priorityFilter ? elements.priorityFilter.value : "all";
  const matchesPriority = priorityVal === "all" || task.priority === priorityVal;
  
  const dueVal = elements.dueFilter ? elements.dueFilter.value : "all";
  const matchesDue = dueVal === "all" || getDeadlineState(task.dueDate) === dueVal;
  
  return matchesText && matchesAssignee && matchesPriority && matchesDue;
}

/**
 * Create a task card element from the template.
 */
function createTaskCard(task) {
  const fragment = elements.cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".task-card");
  const member = getMember(task.assignee);
  const deadState = getDeadlineState(task.dueDate);
  const priorityLower = task.priority.toLowerCase();

  // Populate data attributes & styling
  card.dataset.taskId = task.id;
  
  // Title & description
  card.querySelector(".task-card-title").textContent = task.title;
  card.querySelector(".task-card-description").textContent = task.description || "No description provided.";
  
  // Priority Badge
  const pBadge = card.querySelector(".priority-badge");
  pBadge.textContent = task.priority;
  pBadge.className = `priority-badge px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${priorityLower}`;

  // Status Badge
  const statusBadge = card.querySelector(".card-status");
  if (statusBadge) {
    statusBadge.textContent = task.status;
  }

  // Assignee avatar
  const avatar = card.querySelector(".card-avatar");
  avatar.textContent = member.initials;
  avatar.style.backgroundColor = member.color;
  card.querySelector(".assignee-name").textContent = member.name.split(" ")[0];

  // Due Date Badge
  const dueBadge = card.querySelector(".due-date");
  dueBadge.textContent = formatDueDate(task.dueDate);
  dueBadge.className = `due-date flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${deadState}`;
  dueBadge.title = `Deadline: ${task.dueDate}`;

  // Accessibility
  card.setAttribute("aria-label", `${task.title}, ${task.priority} priority, assigned to ${member.name}, due ${formatDueDate(task.dueDate)}`);

  // Drag and drop event listeners
  card.addEventListener("dragstart", (e) => {
    draggedTaskId = task.id;
    card.classList.add("opacity-40");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
  });

  card.addEventListener("dragend", () => {
    draggedTaskId = null;
    card.classList.remove("opacity-40");
    document.querySelectorAll(".board-column").forEach(col => col.classList.remove("border-blue-400", "bg-blue-50"));
  });

  // Action Buttons event listeners
  const editBtn = card.querySelector(".edit-task-btn");
  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditDialog(task.id);
    });
  }

  const deleteBtn = card.querySelector(".delete-task-btn");
  if (deleteBtn) {
    const svgChild = deleteBtn.querySelector("svg");
    if (svgChild) {
      svgChild.style.pointerEvents = "none";
    }
    deleteBtn.addEventListener("click", (e) => {
      console.log("Delete button click handler fired. Task ID:", task.id);
      e.stopPropagation();
      handleDeleteTask(task.id);
    });
  }

  return fragment;
}

/**
 * Main rendering loop that filters tasks and places them in columns.
 */
function renderTasks() {
  const allTasks = tasks;
  const visibleTasks = allTasks.filter(matchesFilters);
  
  if (!elements.board) return;
  elements.board.innerHTML = "";

  columns.forEach((column) => {
    const columnTasks = visibleTasks.filter((task) => task.status === column.id);
    
    const boardColumn = document.createElement("section");
    boardColumn.className = "board-column flex flex-col min-w-[250px] flex-1 bg-slate-100/80 border border-slate-200 p-3 rounded-lg min-h-[500px] transition-colors";
    boardColumn.dataset.columnId = column.id;
    boardColumn.innerHTML = `
      <div class="column-heading flex items-center justify-between mb-3 px-1">
        <div class="column-label flex items-center gap-2">
          <span class="column-dot w-2 h-2 rounded-full" style="background:${column.color}"></span>
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">${column.title}</h3>
          <span class="task-count text-[10px] bg-slate-200 text-slate-600 font-mono px-1.5 py-0.5 rounded-full">${columnTasks.length}</span>
        </div>
      </div>
      <div class="task-list flex flex-col gap-2 flex-grow min-h-[420px]" aria-label="${column.title} tasks"></div>
    `;

    const taskList = boardColumn.querySelector(".task-list");
    if (!columnTasks.length) {
      taskList.innerHTML = `<div class="empty-column border border-dashed border-slate-300 rounded-lg p-6 text-center text-xs text-slate-400 font-semibold select-none flex items-center justify-center h-[120px]">No tasks</div>`;
    } else {
      columnTasks.forEach((task) => {
        taskList.appendChild(createTaskCard(task));
      });
    }

    enableDropZone(boardColumn);
    elements.board.appendChild(boardColumn);
  });

  // Update summary stats
  updateProgressStats(allTasks);

  if (elements.resultCount) {
    elements.resultCount.textContent = `${visibleTasks.length} of ${allTasks.length} tasks shown`;
  }
}

/**
 * Set up dragover and drop handlers on column.
 */
function enableDropZone(columnElement) {
  columnElement.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    columnElement.classList.add("border-blue-400", "bg-blue-50/80");
  });

  columnElement.addEventListener("dragleave", (e) => {
    if (!columnElement.contains(e.relatedTarget)) {
      columnElement.classList.remove("border-blue-400", "bg-blue-50/80");
    }
  });

  columnElement.addEventListener("drop", (e) => {
    e.preventDefault();
    columnElement.classList.remove("border-blue-400", "bg-blue-50/80");
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    const destColumnId = columnElement.dataset.columnId;
    
    if (taskId && destColumnId) {
      const task = getTaskById(taskId);
      if (task && task.status !== destColumnId) {
        editTask(taskId, { status: destColumnId });
        renderTasks();
      }
    }
  });
}

/**
 * Recalculate and update the progress indicator stats.
 */
function updateProgressStats(allTasks) {
  const completed = allTasks.filter(t => t.status === "Done").length;
  const percentage = allTasks.length ? Math.round((completed / allTasks.length) * 100) : 0;

  if (elements.completedCount) {
    elements.completedCount.textContent = completed;
  }
  if (elements.progressBar) {
    elements.progressBar.style.width = `${percentage}%`;
  }
  if (elements.progressText) {
    elements.progressText.textContent = `${percentage}% of tasks completed`;
  }
}

/**
 * Open the task modal in "Create" mode.
 */
function openCreateDialog() {
  editingTaskId = null;
  clearErrors(elements.form);
  elements.form.reset();
  
  if (elements.dialogTitle) elements.dialogTitle.textContent = "Create task";
  if (elements.submitBtn) elements.submitBtn.textContent = "Create task";
  
  const todayStr = new Date().toISOString().slice(0, 10);
  if (elements.dueDate) {
    elements.dueDate.min = todayStr;
    elements.dueDate.value = todayStr;
  }
  if (elements.status) {
    elements.status.value = "To Do"; // Default starting column
  }
  if (elements.priority) {
    elements.priority.value = "Medium";
  }

  elements.dialog.showModal();
  if (elements.title) elements.title.focus();
}

/**
 * Open the task modal in "Edit" mode.
 */
function openEditDialog(id) {
  const task = getTaskById(id);
  if (!task) return;

  editingTaskId = id;
  clearErrors(elements.form);

  if (elements.dialogTitle) elements.dialogTitle.textContent = "Edit task";
  if (elements.submitBtn) elements.submitBtn.textContent = "Save changes";

  const todayStr = new Date().toISOString().slice(0, 10);
  if (elements.dueDate) {
    elements.dueDate.min = task.dueDate < todayStr ? task.dueDate : todayStr;
  }

  // Populate values
  elements.title.value = task.title;
  elements.description.value = task.description;
  elements.assignee.value = task.assignee;
  elements.dueDate.value = task.dueDate;
  elements.priority.value = task.priority;
  elements.status.value = task.status;

  elements.dialog.showModal();
  if (elements.title) elements.title.focus();
}

/**
 * Close the task dialog modal.
 */
function closeDialog() {
  elements.dialog.close();
  editingTaskId = null;
  clearErrors(elements.form);
}

/**
 * Handle form submission for both Creating and Editing tasks.
 */
function handleFormSubmit(e) {
  e.preventDefault();
  
  const title = elements.title.value;
  const description = elements.description.value;
  const assignee = elements.assignee.value;
  const dueDate = elements.dueDate.value;
  const priority = elements.priority.value;
  const status = elements.status.value;

  const data = { title, description, assignee, dueDate, priority, status };
  
  const validationResult = validateTask(data);
  
  if (!validationResult.isValid) {
    displayErrors(elements.form, validationResult.errors);
    return;
  }

  if (editingTaskId) {
    editTask(editingTaskId, data);
  } else {
    createTask(title, description, assignee, dueDate, priority, status);
  }

  renderTasks();
  closeDialog();
}

/**
 * Prompt user and delete task if confirmed.
 */
function handleDeleteTask(id) {
  console.log("handleDeleteTask initiated for ID:", id);
  const task = getTaskById(id);
  console.log("Retrieved task for deletion:", task);
  if (!task) {
    console.error("handleDeleteTask aborted: task not found for ID:", id);
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete the task: "${task.title}"?`);
  console.log("User confirmed deletion:", confirmed);
  if (confirmed) {
    const deleted = deleteTask(id);
    console.log("Deletion execution result:", deleted);
    renderTasks();
  }
}

/**
 * Populate select dropdowns for assignees and statuses.
 */
function populateDropdownOptions() {
  if (elements.assignee) {
    elements.assignee.innerHTML = members
      .map(m => `<option value="${m.name}">${m.name} (${m.role})</option>`)
      .join("");
  }
  
  if (elements.assigneeFilter) {
    elements.assigneeFilter.innerHTML = '<option value="all">Everyone</option>' +
      members.map(m => `<option value="${m.name}">${m.name}</option>`).join("");
  }

  if (elements.status) {
    elements.status.innerHTML = columns
      .map(col => `<option value="${col.id}">${col.title}</option>`)
      .join("");
  }
}

/**
 * Attach and bind all DOM event handlers.
 */
function attachEventHandlers() {
  if (elements.openDialog) elements.openDialog.addEventListener("click", openCreateDialog);
  if (elements.closeDialog) elements.closeDialog.addEventListener("click", closeDialog);
  if (elements.cancelTask) elements.cancelTask.addEventListener("click", closeDialog);
  if (elements.form) elements.form.addEventListener("submit", handleFormSubmit);

  // Filters event listeners
  const filterControls = [elements.search, elements.assigneeFilter, elements.priorityFilter, elements.dueFilter];
  filterControls.forEach((control) => {
    if (control) {
      control.addEventListener("input", renderTasks);
      control.addEventListener("change", renderTasks);
    }
  });

  if (elements.clearFilters) {
    elements.clearFilters.addEventListener("click", () => {
      if (elements.search) elements.search.value = "";
      if (elements.assigneeFilter) elements.assigneeFilter.value = "all";
      if (elements.priorityFilter) elements.priorityFilter.value = "all";
      if (elements.dueFilter) elements.dueFilter.value = "all";
      renderTasks();
    });
  }

  // Keyboard shortcut: pressing '/' focuses the search field
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      if (elements.search) elements.search.focus();
    }
  });
}

// Boot module on load
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  populateDropdownOptions();
  renderTasks();
  attachEventHandlers();
});
