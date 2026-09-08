const STORAGE_KEY = "simple-todo.tasks";
const LEGACY_STORAGE_KEY = "taskflow.tasks";

const state = {
  tasks: loadTasks(),
  filter: "all",
  sort: "newest"
};

const elements = {
  form: document.querySelector("#task-form"),
  input: document.querySelector("#task-input"),
  list: document.querySelector("#task-list"),
  empty: document.querySelector("#empty-state"),
  emptyTitle: document.querySelector("#empty-title"),
  emptyCopy: document.querySelector("#empty-copy"),
  progress: document.querySelector("#progress-text"),
  clearCompleted: document.querySelector("#clear-completed"),
  sort: document.querySelector("#sort-select"),
  counts: {
    all: document.querySelector("#all-count"),
    active: document.querySelector("#active-count"),
    completed: document.querySelector("#completed-count")
  }
};

function loadTasks() {
  try {
    const savedValue = localStorage.getItem(STORAGE_KEY)
      ?? localStorage.getItem(LEGACY_STORAGE_KEY)
      ?? "[]";
    const saved = JSON.parse(savedValue);
    return Array.isArray(saved) ? saved.filter(task => task && typeof task.text === "string") : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function visibleTasks() {
  const tasks = state.tasks.filter(task => (
    state.filter === "all" ||
    (state.filter === "active" && !task.completed) ||
    (state.filter === "completed" && task.completed)
  ));
  return tasks.sort((a, b) => {
    if (state.sort === "az") return a.text.localeCompare(b.text);
    if (state.sort === "za") return b.text.localeCompare(a.text);
    return state.sort === "oldest" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
  });
}

function render() {
  const visible = visibleTasks();
  elements.list.replaceChildren(...visible.map(createTaskElement));
  elements.empty.hidden = visible.length > 0;
  elements.emptyTitle.textContent = state.tasks.length === 0 ? "Nothing here yet" : "No matching tasks";
  elements.emptyCopy.textContent = state.tasks.length === 0
    ? "Add a task above and make some room in your head."
    : "Try another filter or add a new task.";

  const completed = state.tasks.filter(task => task.completed).length;
  elements.counts.all.textContent = state.tasks.length;
  elements.counts.active.textContent = state.tasks.length - completed;
  elements.counts.completed.textContent = completed;
  elements.progress.textContent = `${state.tasks.length} ${state.tasks.length === 1 ? "task" : "tasks"} · ${completed} done`;
  elements.clearCompleted.hidden = completed === 0;
  document.querySelectorAll(".filter-button").forEach(button => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-complete" : ""}`;
  item.dataset.id = task.id;

  const check = document.createElement("button");
  check.className = "task-check";
  check.type = "button";
  check.setAttribute("aria-label", task.completed ? `Mark "${task.text}" active` : `Complete "${task.text}"`);
  check.addEventListener("click", () => toggleTask(task.id));

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const remove = document.createElement("button");
  remove.className = "delete-button";
  remove.type = "button";
  remove.setAttribute("aria-label", `Delete "${task.text}"`);
  remove.textContent = "×";
  remove.addEventListener("click", () => deleteTask(task.id));

  item.append(check, text, remove);
  return item;
}

function addTask(text) {
  const id = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.tasks.push({ id, text, completed: false, createdAt: Date.now() });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(task => task.id !== id);
  saveTasks();
  render();
}

elements.form.addEventListener("submit", event => {
  event.preventDefault();
  const text = elements.input.value.trim();
  if (!text) return;
  addTask(text);
  elements.input.value = "";
  elements.input.focus();
});

document.querySelectorAll(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    render();
  });
});

elements.sort.addEventListener("change", event => {
  state.sort = event.target.value;
  render();
});

elements.clearCompleted.addEventListener("click", () => {
  state.tasks = state.tasks.filter(task => !task.completed);
  saveTasks();
  render();
});

render();
