const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
const TODOS_FILE = path.join(__dirname, 'todos.json');

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize todos file if it doesn't exist
if (!fs.existsSync(TODOS_FILE)) {
  fs.writeFileSync(TODOS_FILE, JSON.stringify([]));
}

// Helper functions
const readTodos = () => {
  try {
    const data = fs.readFileSync(TODOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading todos:', error);
    return [];
  }
};

const writeTodos = (todos) => {
  try {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
  } catch (error) {
    console.error('Error writing todos:', error);
    throw error;
  }
};

// GET /api/todos - Get all todos
app.get('/api/todos', (req, res) => {
  const todos = readTodos();
  res.json(todos);
});

// POST /api/todos - Add new todo
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const todos = readTodos();
  const newTodo = {
    id: Date.now(),
    title,
    completed: false
  };
  
  todos.push(newTodo);
  writeTodos(todos);
  res.status(201).json(newTodo);
});

// PUT /api/todos/:id - Update todo (toggle completion or edit title)
app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, completed } = req.body;
  const todos = readTodos();
  const todo = todos.find(t => t.id === id);
  
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  if (title !== undefined) todo.title = title;
  if (completed !== undefined) todo.completed = completed;
  
  writeTodos(todos);
  res.json(todo);
});

// DELETE /api/todos/:id - Delete todo
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todos = readTodos();
  const index = todos.findIndex(t => t.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todos.splice(index, 1);
  writeTodos(todos);
  res.status(204).send();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
