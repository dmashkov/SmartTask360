# SmartTask360 — API Documentation

## Conventions

### Base URL
```
/api/v1
```

### Authentication
```
Authorization: Bearer <access_token>
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Success with Pagination:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "pages": 8
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "title": "Field is required"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Business rule conflict |
| UNPROCESSABLE_ENTITY | 422 | Valid data but cannot process |
| INTERNAL_ERROR | 500 | Server error |
| AI_SERVICE_ERROR | 503 | AI service unavailable |

---

## Auth Endpoints

### POST /auth/register
Create new user account.

### POST /auth/login
Authenticate user. Returns access_token + refresh_token.

### POST /auth/refresh
Refresh access token.

### POST /auth/logout
Invalidate refresh token.

### GET /auth/me
Get current user profile.

---

## Users Endpoints

### GET /users
List users with filters (role, department_id, is_active, q).

### GET /users/{id}
Get user by ID.

### POST /users
Create user (admin only).

### PATCH /users/{id}
Update user.

### DELETE /users/{id}
Deactivate user (admin only).

---

## Departments Endpoints

### GET /departments
Get department tree or flat list.

### GET /departments/{id}
Get department by ID.

### POST /departments
Create department.

### PATCH /departments/{id}
Update department.

### DELETE /departments/{id}
Delete department.

### GET /departments/{id}/users
Get users in department.

---

## Tasks Endpoints

### GET /tasks
List tasks with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Text search in title/description |
| status | string[] | Filter by status(es) |
| priority | string[] | Filter by priority(ies) |
| assignee_id | uuid[] | Filter by assignee(s) |
| creator_id | uuid | Filter by creator |
| project_id | uuid | Filter by project |
| board_id | uuid | Filter by board |
| tags | string[] | Filter by tag names |
| due_from | date | Due date range start |
| due_to | date | Due date range end |
| is_overdue | boolean | Only overdue tasks |
| is_unaccepted | boolean | Assigned but not accepted |
| parent_id | uuid | Filter by parent task |
| page | int | Page number (default: 1) |
| per_page | int | Items per page (default: 20, max: 100) |
| sort | string | Sort field (created_at, due_date, priority) |
| order | string | asc/desc |

**Preset Filters (via `preset` parameter):**
- `my_tasks` — assigned to current user
- `my_created` — created by current user
- `watching` — tasks user is watching
- `overdue` — past due date
- `due_today` — due today
- `due_week` — due this week
- `unaccepted` — assigned but not accepted within deadline

### GET /tasks/{id}
Get task with optional includes (children, checklists, comments, history).

### POST /tasks
Create task. Returns task + SMART validation result.

### PATCH /tasks/{id}
Update task.

### DELETE /tasks/{id}
Soft delete task.

### POST /tasks/{id}/status
Change task status with optional comment.

### GET /tasks/{id}/subtasks
Get subtasks (depth, flat options).

### GET /tasks/{id}/ancestors
Get path to root task.

### POST /tasks/{id}/tags
Add tags to task.

### DELETE /tasks/{id}/tags/{tag_id}
Remove tag from task.

### GET /tasks/{id}/watchers
Get task watchers.

### POST /tasks/{id}/watchers
Add watchers.

### DELETE /tasks/{id}/watchers/{user_id}
Remove watcher.

### POST /tasks/{id}/watch
Current user watches task.

### DELETE /tasks/{id}/watch
Current user unwatches task.

### POST /tasks/{id}/accept
Accept task as assignee. Changes status to "in_progress".

**Request:**
```json
{
  "comment": "Приступаю к работе"  // optional
}
```

### POST /tasks/{id}/reject
Reject/question task as assignee. Notifies task creator.

**Request:**
```json
{
  "reason": "unrealistic_deadline",
  "comment": "Срок нереалистичен, нужно минимум 2 недели"
}
```

**Reason values:** `unclear`, `no_resources`, `unrealistic_deadline`, `conflict`, `wrong_assignee`, `other`

---

## Checklists Endpoints

### GET /tasks/{task_id}/checklists
Get checklists for task.

### POST /tasks/{task_id}/checklists
Create checklist with items.

### PATCH /checklists/{id}
Update checklist.

### DELETE /checklists/{id}
Delete checklist.

### POST /checklists/{id}/items
Add item to checklist.

### PATCH /checklist-items/{id}
Update checklist item.

### POST /checklist-items/{id}/toggle
Toggle item completion.

### DELETE /checklist-items/{id}
Delete item.

### POST /checklist-items/reorder
Reorder items.

---

## Comments Endpoints

### GET /tasks/{task_id}/comments
Get comments for task.

### POST /tasks/{task_id}/comments
Create comment with optional attachments.

### PATCH /comments/{id}
Update comment (within 15 min).

### DELETE /comments/{id}
Delete comment.

---

## Documents Endpoints

### GET /documents
List documents with filters.

### GET /documents/{id}
Get document metadata.

### GET /documents/{id}/download
Download document file.

### POST /documents/upload
Upload document (multipart/form-data).

### PATCH /documents/{id}
Update document metadata.

### DELETE /documents/{id}
Delete document.

### POST /documents/{id}/reextract-text
Re-extract text content.

---

## AI Endpoints

### POST /ai/validate-smart
Validate text against SMART criteria.

**Request:**
```json
{
  "title": "Increase sales",
  "description": "Need to increase sales next quarter",
  "context": {
    "project_name": "Q1 Goals",
    "due_date": "2025-03-31"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_valid": false,
    "overall_score": 0.38,
    "criteria": {
      "specific": { "score": 0.3, "passed": false, "issue": "...", "suggestion": "..." },
      "measurable": { "score": 0.2, "passed": false, "issue": "...", "suggestion": "..." },
      "achievable": { "score": 0.5, "passed": false, "issue": "...", "suggestion": "..." },
      "relevant": { "score": 0.9, "passed": true },
      "time_bound": { "score": 0.6, "passed": false, "issue": "...", "suggestion": "..." }
    },
    "improved_title": "Увеличить продажи на 20% до 31.03.2025",
    "improved_description": "...",
    "questions": ["Какой бюджет?", "Какие продукты?"]
  }
}
```

### POST /ai/conversations
Start AI conversation for task refinement.

### GET /ai/conversations/{id}
Get conversation with history.

### POST /ai/conversations/{id}/messages
Send message to conversation.

### POST /ai/conversations/{id}/apply
Apply AI suggestions to task.

### POST /tasks/{task_id}/ai-comment
Generate AI comment (risk_analysis, decomposition, progress_review).

---

## Boards Endpoints

### GET /boards
List boards for user.

### GET /boards/{id}
Get board with columns and tasks.

### POST /boards
Create board with columns.

### PATCH /boards/{id}
Update board.

### DELETE /boards/{id}
Delete board.

### POST /boards/{id}/columns
Add column.

### PATCH /boards/{board_id}/columns/{column_id}
Update column.

### DELETE /boards/{board_id}/columns/{column_id}
Delete column.

### POST /boards/{id}/columns/reorder
Reorder columns.

### POST /boards/{id}/tasks
Add task to board.

### DELETE /boards/{id}/tasks/{task_id}
Remove task from board.

### POST /boards/{id}/tasks/move
Move task on board. Returns status change info.

### GET /boards/{id}/members
Get board members.

### POST /boards/{id}/members
Add board member.

### PATCH /boards/{id}/members/{user_id}
Update member role.

### DELETE /boards/{id}/members/{user_id}
Remove member.

---

## Notifications Endpoints

### GET /notifications
Get user notifications.

### GET /notifications/unread-count
Get unread count.

### POST /notifications/{id}/read
Mark as read.

### POST /notifications/read-all
Mark all as read.

### DELETE /notifications/{id}
Delete notification.

### GET /notifications/settings
Get notification settings.

### PATCH /notifications/settings
Update notification settings.

---

## Workflow Endpoints

### GET /workflow/statuses
Get all statuses.

### GET /workflow/transitions
Get all transitions.

### GET /workflow/transitions/from/{status}
Get available transitions from status.

### GET /workflow/templates
Get available workflow templates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "basic",
      "name": "Базовый",
      "description": "Новая → В работе → На проверке → Готово",
      "is_system": true
    },
    {
      "id": "uuid",
      "code": "agile",
      "name": "Agile/Scrum",
      "description": "Backlog → To Do → In Progress → Review → Done",
      "is_system": true
    }
  ]
}
```

### GET /workflow/templates/{id}
Get template with all steps.

### POST /workflow/templates
Create custom workflow template (admin/manager).

### PATCH /workflow/templates/{id}
Update custom template.

### DELETE /workflow/templates/{id}
Delete custom template (not system ones).

---

## Tags Endpoints

### GET /tags
List tags.

### GET /tags/{id}
Get tag.

### POST /tags
Create tag.

### PATCH /tags/{id}
Update tag.

### DELETE /tags/{id}
Deactivate tag.
