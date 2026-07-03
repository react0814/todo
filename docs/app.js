const STORAGE_KEY = 'todos';

let todos = [];
let currentFilter = 'all';

const PRIORITY_LABEL = { high: '高', medium: '中', low: '低' };
const PRIORITY_WEIGHT = { high: 2, medium: 1, low: 0 };

// ── Storage ──────────────────────────────────────────────────────────────────

function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function sortTodos() {
  todos.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  });
}

function fetchTodos() {
  todos = loadTodos();
  sortTodos();
  render();
}

function addTodo() {
  const input = document.getElementById('newTodo');
  const priority = document.getElementById('priority').value;
  const title = input.value.trim();
  if (!title) {
    input.focus();
    return;
  }
  todos.push({
    id: crypto.randomUUID(),
    title,
    completed: false,
    priority,
    created_at: new Date().toISOString(),
  });
  saveTodos();
  input.value = '';
  input.focus();
  fetchTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  saveTodos();
  fetchTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  fetchTodos();
}

function updateTitle(id, newTitle) {
  const trimmed = newTitle.trim();
  const todo = todos.find(t => t.id === id);
  if (!todo || trimmed === todo.title) return;
  if (!trimmed) {
    render(); // revert empty edit
    return;
  }
  todo.title = trimmed;
  saveTodos();
  fetchTodos();
}

// ── Rendering ────────────────────────────────────────────────────────────────

function filteredTodos() {
  if (currentFilter === 'active')    return todos.filter(t => !t.completed);
  if (currentFilter === 'completed') return todos.filter(t => t.completed);
  return todos;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function render() {
  const list = document.getElementById('todo-list');
  const stats = document.getElementById('stats');
  const items = filteredTodos();
  const done = todos.filter(t => t.completed).length;

  stats.textContent = `${done} / ${todos.length} 件完了`;

  if (items.length === 0) {
    const msg = currentFilter === 'completed'
      ? '完了済みのタスクはありません'
      : currentFilter === 'active'
      ? '未完了のタスクはありません'
      : 'タスクを追加してみましょう！';
    list.innerHTML = `
      <li class="empty-state">
        <span class="empty-icon">✓</span>${escapeHtml(msg)}
      </li>`;
    return;
  }

  list.innerHTML = items.map(todo => `
    <li class="todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}"
        data-id="${todo.id}">
      <input type="checkbox" ${todo.completed ? 'checked' : ''}
             title="${todo.completed ? '未完了に戻す' : '完了にする'}"
             onchange="toggleTodo('${todo.id}')">
      <span class="todo-title"
            contenteditable="true"
            spellcheck="false"
            onblur="updateTitle('${todo.id}', this.textContent)"
            onkeydown="handleTitleKey(event, '${todo.id}', this)"
      >${escapeHtml(todo.title)}</span>
      <span class="badge badge-${todo.priority}">${PRIORITY_LABEL[todo.priority]}</span>
      <button class="delete-btn" title="削除" onclick="deleteTodo('${todo.id}')">✕</button>
    </li>
  `).join('');
}

function handleTitleKey(event, id, el) {
  if (event.key === 'Enter') {
    event.preventDefault();
    el.blur();
  }
  if (event.key === 'Escape') {
    const todo = todos.find(t => t.id === id);
    if (todo) el.textContent = todo.title;
    el.blur();
  }
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  render();
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  fetchTodos();

  document.getElementById('newTodo').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTodo();
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });
});
