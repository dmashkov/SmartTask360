# CLAUDE.md — SmartTask360

## Project Overview

**SmartTask360** — система полного цикла управления: от стратегии (BSC) через OKR и проекты до задач с AI-валидацией по методологии SMART.

**Ключевая идея:** 360° охват — каскадирование целей сверху вниз с интеллектуальным помощником на каждом уровне.

## Current Status

**✅ Phase 1A Completed** - Backend Core (Auth, Users, Departments, Tasks Foundation)
**✅ Phase 1B Completed** - Backend Tasks Extended (Tags, Comments, Checklists, Documents, History, Workflow)
**✅ Phase 1C Completed** - AI Integration (SMART validation, AI dialogs, AI comments)
**✅ Phase 1D Completed** - Boards & Notifications

**📊 Backend MVP Complete:**
- 14 modules implemented
- 95+ API endpoints
- 200+ test scenarios
- 15 database migrations
- All tests passing ✅

**Implemented Modules:**
- Auth, Users, Departments
- Tasks (with hierarchy, status workflow, acceptance flow)
- Tags, Comments, Checklists, Documents
- Workflow Templates, Task History
- AI (SMART validation, dialogs, risk analysis, comments)
- Boards (Kanban with WIP limits, status sync)
- Notifications (settings, unread tracking)

**Next:** Phase 2A - Frontend Core

## Tech Stack

### Backend
- **Framework:** FastAPI (async)
- **Database:** PostgreSQL 15 with ltree extension
- **ORM:** SQLAlchemy 2.0 (async)
- **Migrations:** Alembic
- **Auth:** JWT (python-jose + passlib)
- **Storage:** MinIO (S3-compatible)
- **AI:** Anthropic Claude API

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6
- **DnD:** @dnd-kit

## Project Structure

```
smarttask360/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── core/                   # Shared infrastructure
│   │   │   ├── config.py           # Settings (pydantic-settings)
│   │   │   ├── database.py         # SQLAlchemy setup
│   │   │   ├── security.py         # JWT, password hashing
│   │   │   ├── dependencies.py     # DI (get_db, get_current_user)
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   ├── pagination.py       # Pagination helpers
│   │   │   └── storage.py          # MinIO client
│   │   └── modules/                # Feature modules
│   │       ├── auth/
│   │       ├── users/
│   │       ├── departments/
│   │       ├── tasks/
│   │       ├── checklists/
│   │       ├── comments/
│   │       ├── documents/
│   │       ├── tags/
│   │       ├── workflow/
│   │       ├── boards/
│   │       ├── notifications/
│   │       └── ai/
│   ├── alembic/                    # Migrations
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                    # App setup (Router, Providers)
│   │   ├── shared/                 # Shared code
│   │   │   ├── api/                # API client
│   │   │   ├── ui/                 # UI components
│   │   │   ├── hooks/              # Common hooks
│   │   │   ├── lib/                # Utilities
│   │   │   └── layout/             # Layout components
│   │   ├── modules/                # Feature modules
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   ├── boards/
│   │   │   ├── documents/
│   │   │   ├── notifications/
│   │   │   └── ai/
│   │   └── pages/                  # Page components
│   ├── package.json
│   └── vite.config.ts
├── docker/
├── docs/
└── docker-compose.yml
```

## Module Structure Convention

Each backend module follows this structure:

```
modules/{name}/
├── __init__.py
├── models.py      # SQLAlchemy models
├── schemas.py     # Pydantic schemas
├── service.py     # Business logic
└── router.py      # API endpoints
```

Each frontend module follows this structure:

```
modules/{name}/
├── types.ts       # TypeScript types
├── api.ts         # API functions
├── hooks/         # React Query hooks
├── components/    # Module components
└── index.ts       # Public exports
```

## Coding Conventions

### Python (Backend)

```python
# Imports order: stdlib, third-party, local
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.modules.tasks.service import TaskService

# Type hints everywhere
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> TaskResponse:
    ...

# Service pattern - all business logic in services
class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, task_id: UUID) -> Task | None:
        ...

# Router - thin layer, just HTTP handling
@router.get("/{task_id}")
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    service = TaskService(db)
    task = await service.get_by_id(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return TaskResponse.model_validate(task)
```

### TypeScript (Frontend)

```typescript
// Types first
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

// API functions return typed promises
export async function getTask(id: string): Promise<Task> {
  const { data } = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
  return data.data;
}

// Hooks use React Query
export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id),
  });
}

// Components are functional with explicit types
interface TaskCardProps {
  task: Task;
  onSelect?: (task: Task) => void;
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  return (
    <div onClick={() => onSelect?.(task)}>
      {task.title}
    </div>
  );
}
```

## API Conventions

### Base URL
```
/api/v1
```

### Response Format
```json
// Success
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "per_page": 20, "total": 100 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "field": "title", "error": "required" }
  }
}
```

### Error Codes
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `UNPROCESSABLE_ENTITY` (422)
- `INTERNAL_ERROR` (500)
- `AI_SERVICE_ERROR` (503)

## Key Patterns

### 1. Task Hierarchy (LTREE)
Tasks support unlimited nesting via PostgreSQL ltree:

```python
class Task(Base):
    id: Mapped[UUID]
    parent_id: Mapped[UUID | None]
    path: Mapped[str]  # ltree: "root_id.parent_id.task_id"
    depth: Mapped[int]

# Query all descendants
select(Task).where(Task.path.descendant_of(parent_task.path))
```

### 2. Hierarchical Data with String-based LTREE
For entities without native ltree support (like checklists), use UUID-based paths:

```python
class ChecklistItem(Base):
    id: Mapped[UUID]
    parent_id: Mapped[UUID | None]
    path: Mapped[str]  # Format: "uuid.uuid.uuid"
    depth: Mapped[int]

# CRITICAL: Use flush() to get ID before building path
async def create_item(self, item_data):
    item = ChecklistItem(..., path="")
    self.db.add(item)
    await self.db.flush()  # Get item.id

    if parent:
        item.path = f"{parent.path}.{item.id}"
    else:
        item.path = str(item.id)

    await self.db.commit()
```

### 3. SMART Validation Flow (To be implemented in Phase 1C)
```
User creates task
    → TaskService.create()
    → AIService.validate_smart()
    → Return (task, smart_result)
    → UI shows validation result
    → User can: accept, apply suggestions, or start dialog
```

### 4. Status Transitions with Workflow Validation
```python
# WorkflowService validates transitions
validation = await workflow_service.validate_transition(
    template_id=workflow_id,
    from_status="in_progress",
    to_status="done",
    user_role=user.role,
    has_comment=bool(comment)
)

# Tasks can have optional workflow
# If no workflow → all transitions allowed
# If workflow assigned → validate before transition
```

### 5. Task Acceptance Flow
```
Task assigned → Assignee must Accept or Reject within deadline

Accept:
  - POST /tasks/{id}/accept
  - Status → "in_progress"
  - accepted_at = now()

Reject (has questions):
  - POST /tasks/{id}/reject
  - Reason: unclear | no_resources | unrealistic_deadline | conflict | wrong_assignee | other
  - Comment required
  - Notifies creator
  - Status unchanged

Escalation:
  - 48h without action → Reminder to assignee
  - 72h without action → Notification to manager
```

### 6. Soft Delete vs Hard Delete Strategy
**Soft Delete (Tags):**
- Use is_active flag
- Implement reactivation logic
- Prevents data loss
- Good for reusable entities

**Hard Delete (Comments, Documents, History):**
- Permanent deletion
- Use CASCADE for cleanup
- Good for truly deleted content

### 7. Many-to-Many Relationships
```python
# Use Table() for association tables
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

# Make operations idempotent
async def add_watcher(self, task_id, user_id):
    stmt = insert(task_watchers).values(task_id=task_id, user_id=user_id)
    stmt = stmt.on_conflict_do_nothing()  # Idempotent
    await self.db.execute(stmt)
```

### 8. Board Task Movement (To be implemented in Phase 1D)
```
Drag task to new column
    → BoardService.move_task()
    → Check WIP limit
    → Update BoardTask position
    → If column.mapped_status:
        → TaskService.change_status()
    → Return updated state
```

### 9. Board-Project Relationship (To be implemented in Phase 1D)
```
One Board = One Project (or Department)

Board attributes:
  - project_id: links to project
  - workflow_template: "basic" | "agile" | "approval" | custom
  - Columns can have mapped_status (optional)

Workflow Templates (system):
  - basic: Новая → В работе → На проверке → Готово
  - agile: Backlog → To Do → In Progress → Review → Done
  - approval: Черновик → На согласовании → Утверждено → Готово
```

### 10. File Storage with MinIO
```python
# Use StorageService wrapper for all file operations
storage = StorageService()

# Upload
object_name = storage.upload_file(file_data, object_name, content_type, size)

# Generate presigned URL for downloads (valid 1 hour)
url = storage.get_presigned_url(object_name)

# Organization: tasks/{task_id}/{filename}
```

### 11. Audit Trail with JSONB
```python
class TaskHistory(Base):
    action: Mapped[str]  # created, updated, status_changed, etc.
    field_name: Mapped[str | None]
    old_value: Mapped[dict | None]  # JSONB - flexible storage
    new_value: Mapped[dict | None]  # JSONB - flexible storage
    extra_data: Mapped[dict | None]  # NOT 'metadata' (reserved name!)
```

## Common Commands

```bash
# Development
make up              # Start all services
make down            # Stop all services
make logs            # View logs
make migrate         # Run migrations
make shell-backend   # Shell into backend container
make shell-db        # psql into database

# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/smarttask360
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=documents

ANTHROPIC_API_KEY=your-api-key
AI_MODEL=claude-sonnet-4-20250514
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api/v1
```

## What NOT to Do

1. **Don't import models across modules** — use service interfaces
2. **Don't put business logic in routers** — use services
3. **Don't use raw SQL** — use SQLAlchemy ORM
4. **Don't store secrets in code** — use environment variables
5. **Don't skip type hints** — full typing everywhere
6. **Don't create circular dependencies** — check dependency graph
7. **Don't forget migrations** — every model change needs migration
8. **Don't use reserved SQLAlchemy names** — avoid 'metadata', 'query', etc.
9. **Don't order parametrized routes before specific routes** — /users/me must come before /users/{id}
10. **Don't use .value on string fields** — check if field is already a string, not an enum

## Common Pitfalls & Solutions (from Sprint 2)

### 1. ID Generation Timing
**Problem:** Using `item.id` before commit returns None

**Solution:** Use `flush()` to get ID without committing
```python
item = ChecklistItem(...)
self.db.add(item)
await self.db.flush()  # Get ID assigned
item.path = str(item.id)  # Now safe to use
await self.db.commit()
```

### 2. FastAPI Route Ordering
**Problem:** /users/me gets matched as /users/{user_id}

**Solution:** Always put specific routes before parametrized routes
```python
@router.get("/users/me")  # Specific first
@router.get("/users/{user_id}")  # Parametrized second
```

### 3. JSONB NULL Handling in Migrations
**Problem:** `column is of type jsonb but expression is of type text`

**Solution:** Explicitly handle NULL values
```sql
CASE WHEN t.field IS NULL THEN NULL ELSE t.field::jsonb END
```

### 4. Query Parameters with Optional UUIDs
**Problem:** 422 validation errors when passing None

**Solution:** Use request body with Pydantic schema instead
```python
# BAD
async def move(item_id: UUID, new_parent: UUID | None = None):

# GOOD
class MoveRequest(BaseModel):
    new_parent_id: UUID | None = None

async def move(item_id: UUID, data: MoveRequest):
```

### 5. Many-to-Many Idempotency
**Problem:** Adding same relationship twice causes errors

**Solution:** Use on_conflict_do_nothing()
```python
stmt = insert(task_watchers).values(...)
stmt = stmt.on_conflict_do_nothing()
await self.db.execute(stmt)
```

## AI Integration Notes

### Temperature Settings
- SMART validation: 0.3 (deterministic)
- Dialogs: 0.7 (creative)
- Comments: 0.5 (balanced)

### Error Handling
AI calls should always have fallback:
```python
try:
    result = await ai_service.validate_smart(data)
except AIError:
    result = SmartValidationResult(
        is_valid=False,
        warning="AI service unavailable"
    )
```

### Context Building
Always include relevant context in AI prompts:
- Task title and description
- Source document (if linked)
- Project goals (if in project)
- Parent task context (if subtask)

## Testing

### Backend
```bash
pytest tests/ -v
pytest tests/test_tasks.py -v
pytest tests/ -k "test_create" -v
```

### Frontend
```bash
npm test
npm run test:coverage
```

## Product Vision: 360° Coverage

SmartTask360 covers the full strategic cycle:

```
┌─────────────────────────────────────────────────────────────────┐
│                        SmartTask360                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BSC (Balanced Scorecard)                                      │
│   └── Strategic Goals                                           │
│       └── OKR (Objectives & Key Results)                        │
│           └── Programs                                          │
│               └── Projects                                      │
│                   └── Tasks ← AI SMART Validation               │
│                       └── Subtasks                              │
│                           └── Checklists                        │
│                                                                 │
│   Each level cascades down with AI assistance                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

MVP focuses on Tasks layer with foundation for expansion.
