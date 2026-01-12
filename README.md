# TODO Backend

Express.js backend for the TODO web application as per PRD requirements.

## Setup

```bash
npm install
npm start
```

Server runs on http://localhost:4000

## API Endpoints

### GET /api/todos
Returns all todos
```json
[
  { "id": "string", "title": "string", "completed": boolean }
]
```

### POST /api/todos
Create a new todo
```json
Request: { "title": "string" }
Response: { "id": "string", "title": "string", "completed": false }
```

### PUT /api/todos/:id
Update todo completion status
```json
Request: { "completed": boolean }
Response: { "id": "string", "title": "string", "completed": boolean }
```

### DELETE /api/todos/:id
Delete a todo
```json
Response: { "success": true }
```

### GET /api/health
Health check endpoint
```json
Response: { "status": "ok" }
```

## Features

- RESTful API for TODO operations (CRUD)
- JSON file storage with atomic writes
- CORS enabled for frontend integration
- Comprehensive error handling
- Input validation and sanitization
- Unit tests with Jest and Supertest

## Testing

```bash
npm test
```

## Implementation

The server provides a complete REST API for TODO management with file-based persistence, meeting all PRD requirements for the TODO web application backend.
