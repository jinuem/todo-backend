# TODO Backend

Express.js backend for the TODO application as per PRD requirements.

## Setup

```bash
npm install
npm start
```

Server runs on http://localhost:4000

## API Endpoints

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo completion status
- `DELETE /api/todos/:id` - Delete todo

## Data Storage

Uses `todos.json` file for persistence with atomic writes.
