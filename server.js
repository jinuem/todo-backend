const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const TODOS_FILE = path.join(__dirname, 'todos.json');

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Initialize todos.json if it doesn't exist
function initializeTodosFile() {
  if (!fs.existsSync(TODOS_FILE)) {
    fs.writeFileSync(TODOS_FILE, '[]', 'utf8');
  }
}

// Read todos from file
function readTodos() {
  try {
    // Initialize file if it doesn't exist
    if (!fs.existsSync(TODOS_FILE)) {
      fs.writeFileSync(TODOS_FILE, '[]', 'utf8');
    }
    const data = fs.readFileSync(TODOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write todos to file atomically
function writeTodos(todos) {
  const tempFile = TODOS_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(todos, null, 2), 'utf8');
  fs.renameSync(tempFile, TODOS_FILE);
}

// Generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/todos - Get all todos
app.get('/api/todos', (req, res) => {
  try {
    const todos = readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read todos' });
  }
});

// POST /api/todos - Create new todo
app.post('/api/todos', (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const todos = readTodos();
    const newTodo = {
      id: generateId(),
      title: title.trim(),
      completed: false
    };

    todos.push(newTodo);
    writeTodos(todos);
    
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /api/todos/:id - Update todo completion status
app.put('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed must be a boolean' });
    }

    const todos = readTodos();
    const todoIndex = todos.findIndex(todo => todo.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todos[todoIndex].completed = completed;
    writeTodos(todos);

    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id - Delete todo
app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const todos = readTodos();
    const todoIndex = todos.findIndex(todo => todo.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todos.splice(todoIndex, 1);
    writeTodos(todos);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
