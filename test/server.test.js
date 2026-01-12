const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const TODOS_FILE = path.join(__dirname, '..', 'todos.json');
const TEST_TODOS_FILE = path.join(__dirname, '..', 'todos.test.json');

describe('TODO Backend API', () => {
  beforeEach(() => {
    // Backup original todos.json if it exists
    if (fs.existsSync(TODOS_FILE)) {
      fs.copyFileSync(TODOS_FILE, TEST_TODOS_FILE);
    }
    // Start with empty todos
    fs.writeFileSync(TODOS_FILE, '[]', 'utf8');
  });

  afterEach(() => {
    // Restore original todos.json
    if (fs.existsSync(TEST_TODOS_FILE)) {
      fs.copyFileSync(TEST_TODOS_FILE, TODOS_FILE);
      fs.unlinkSync(TEST_TODOS_FILE);
    } else if (fs.existsSync(TODOS_FILE)) {
      fs.unlinkSync(TODOS_FILE);
    }
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /api/todos', () => {
    it('should return empty array initially', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('should return todos from file', async () => {
      const testTodos = [
        { id: '1', title: 'Test Todo', completed: false }
      ];
      fs.writeFileSync(TODOS_FILE, JSON.stringify(testTodos), 'utf8');

      const response = await request(app)
        .get('/api/todos')
        .expect(200);
      
      expect(response.body).toEqual(testTodos);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const newTodo = { title: 'New Todo' };
      
      const response = await request(app)
        .post('/api/todos')
        .send(newTodo)
        .expect(201);
      
      expect(response.body).toMatchObject({
        title: 'New Todo',
        completed: false
      });
      expect(response.body.id).toBeDefined();
    });

    it('should reject empty title', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: '' })
        .expect(400);
      
      expect(response.body.error).toBe('Title is required');
    });

    it('should reject missing title', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('Title is required');
    });

    it('should trim whitespace from title', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: '  Trimmed Todo  ' })
        .expect(201);
      
      expect(response.body.title).toBe('Trimmed Todo');
    });
  });

  describe('PUT /api/todos/:id', () => {
    let todoId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: 'Test Todo' });
      todoId = response.body.id;
    });

    it('should update todo completion status', async () => {
      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ completed: true })
        .expect(200);
      
      expect(response.body.completed).toBe(true);
      expect(response.body.id).toBe(todoId);
    });

    it('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .put('/api/todos/nonexistent')
        .send({ completed: true })
        .expect(404);
      
      expect(response.body.error).toBe('Todo not found');
    });

    it('should reject non-boolean completed value', async () => {
      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ completed: 'true' })
        .expect(400);
      
      expect(response.body.error).toBe('Completed must be a boolean');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    let todoId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: 'Test Todo' });
      todoId = response.body.id;
    });

    it('should delete todo', async () => {
      const response = await request(app)
        .delete(`/api/todos/${todoId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);

      // Verify todo is deleted
      const getTodos = await request(app).get('/api/todos');
      expect(getTodos.body).toEqual([]);
    });

    it('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .delete('/api/todos/nonexistent')
        .expect(404);
      
      expect(response.body.error).toBe('Todo not found');
    });
  });

  describe('File operations', () => {
    it('should create todos.json if it does not exist', async () => {
      // Delete the file
      if (fs.existsSync(TODOS_FILE)) {
        fs.unlinkSync(TODOS_FILE);
      }

      // Make a request that should trigger file creation
      await request(app)
        .get('/api/todos')
        .expect(200);

      // Check if file was created
      expect(fs.existsSync(TODOS_FILE)).toBe(true);
      const content = fs.readFileSync(TODOS_FILE, 'utf8');
      expect(JSON.parse(content)).toEqual([]);
    });

    it('should persist todos across requests', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ title: 'Persistent Todo' });

      // Get todos to verify persistence
      const getResponse = await request(app)
        .get('/api/todos');

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0]).toMatchObject({
        id: createResponse.body.id,
        title: 'Persistent Todo',
        completed: false
      });
    });
  });
});
