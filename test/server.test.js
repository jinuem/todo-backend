const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import the app
const express = require('express');
const cors = require('cors');

const app = express();
const TODOS_FILE = 'test-todos.json';

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Helper functions
const readTodos = () => {
  try {
    if (!fs.existsSync(TODOS_FILE)) {
      fs.writeFileSync(TODOS_FILE, '[]');
      return [];
    }
    const data = fs.readFileSync(TODOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeTodos = (todos) => {
  const tempFile = TODOS_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(todos, null, 2));
  fs.renameSync(tempFile, TODOS_FILE);
};

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Routes
app.get('/api/todos', (req, res) => {
  try {
    const todos = readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read todos' });
  }
});

app.post('/api/todos', (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
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

describe('TODO API', () => {
  beforeEach(() => {
    if (fs.existsSync(TODOS_FILE)) {
      fs.unlinkSync(TODOS_FILE);
    }
  });

  afterAll(() => {
    if (fs.existsSync(TODOS_FILE)) {
      fs.unlinkSync(TODOS_FILE);
    }
  });

  describe('GET /api/todos', () => {
    it('should return empty array initially', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: 'Test todo' });
      
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: 'Test todo',
        completed: false
      });
      expect(res.body.id).toBeDefined();
    });

    it('should reject empty title', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: '' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title must be a non-empty string');
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update todo completion', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ title: 'Test todo' });
      
      const todoId = createRes.body.id;
      
      const updateRes = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ completed: true });
      
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.completed).toBe(true);
    });

    it('should return 404 for unknown id', async () => {
      const res = await request(app)
        .put('/api/todos/unknown')
        .send({ completed: true });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Todo not found');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete todo', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ title: 'Test todo' });
      
      const todoId = createRes.body.id;
      
      const deleteRes = await request(app)
        .delete(`/api/todos/${todoId}`);
      
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });

    it('should return 404 for unknown id', async () => {
      const res = await request(app)
        .delete('/api/todos/unknown');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Todo not found');
    });
  });
});
