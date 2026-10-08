# CLAUDE.md — SmartTask360

## Project Overview

**SmartTask360** — система полного цикла управления: от стратегии (BSC) через OKR и проекты до задач с AI-валидацией по методологии SMART.

**Ключевая идея:** 360° охват — каскадирование целей сверху вниз с интеллектуальным помощником на каждом уровне.

## Current Status

**✅ Phase 1A Completed** - Backend Core (Auth, Users, Departments, Tasks Foundation)
**✅ Phase 1B Completed** - Backend Tasks Extended (Tags, Comments, Checklists, Documents, History, Workflow)
**✅ Phase 1C Completed** - AI Integration (SMART validation, AI dialogs, AI comments)
**✅ Phase 1D Completed** - Boards & Notifications
**✅ Phase 2A Completed** - Frontend Core (Auth, Layout, Navigation)
**✅ Phase 2B Completed** - Frontend Tasks & Kanban

**📊 Backend MVP Complete:**
- 14 modules implemented
- 95+ API endpoints
- 200+ test scenarios
- 15 database migrations
- All tests passing ✅

**Implemented Backend Modules:**
- Auth, Users, Departments
- Tasks (with hierarchy, status workflow, acceptance flow)
- Tags, Comments, Checklists, Documents
- Workflow Templates, Task History
- AI (SMART validation, SMART Wizard, dialogs [clarify, decompose, technical, testing], risk analysis, comments)
- Boards (Kanban with WIP limits, status sync)
- Notifications (settings, unread tracking)
- System Settings (AI model, language, custom prompts)

**📊 Frontend Phase 2B Complete:**
- Auth module (login, context, protected routes)
- Tasks module (list with filters, detail page, create/edit modal, hierarchy)
- Boards module (Kanban with drag-and-drop, WIP limits)
- Shared UI components (Button, Input, Modal, etc.)
- Full Russian localization
- Task hierarchy visualization (expand/collapse with lazy loading)
- Task urgency indicators (overdue, due today, due soon)
- 60+ React components

**Latest Session (2026-01-08): AI Dialog Improvements ✅**
- ✅ New AI dialog types:
  - `technical` — обсуждение архитектуры, паттернов, технологий
  - `testing` — генерация тест-кейсов, граничных случаев
- ✅ Removed duplicate `estimate` dialog (decompose includes estimates)
- ✅ Removed duplicate AI comment types (risk/progress have separate buttons)
- ✅ Conversation history shows comment types with icons
- ✅ All AI prompts translated to Russian
- ✅ ResizableModal for AI chat dialogs

**Previous Session (2026-01-08): SMART Wizard & System Settings**
- ✅ SMART Wizard: 3-step AI-assisted task refinement
- ✅ System Settings module (AI model, language, custom prompts)
- ✅ SettingsPage with tabs (General, AI, Prompts)

**Previous Features (2026-01-07):**
- ✅ Tags module frontend (TagBadge, TagsSelect with inline creation)
- ✅ @Mentions system with autocomplete
- ✅ Comment reactions (emoji toggle)
- ✅ Per-comment read status tracking
- ✅ Document attachments in comments
- ✅ Task hierarchy tree with expand/collapse

**✅ Phase 1F Completed** - Gantt Chart (Session 13)

**Next:** Phase 2C.2 - Frontend AI & Polish → Sprint 14 (Polish & Testing)

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
│   │       ├── ai/
│   │       └── system_settings/
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
│   │   │   ├── ai/
│   │   │   └── settings/
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

### 3. SMART Validation & Wizard Flow (Implemented)
```
Option 1: Quick SMART Validation
  User creates task
    → POST /ai/validate-smart
    → Return validation result with scores
    → UI shows SmartValidationCard

Option 2: SMART Wizard (Interactive)
  User clicks "Мастер SMART"
    → Step 1: POST /ai/smart/analyze
      ← Returns questions for user
    → Step 2: POST /ai/smart/refine (with answers)
      ← Returns proposal (title, description, DoD)
    → Step 3: POST /ai/smart/apply
      ← Updates task, creates DoD checklist

Backend endpoints:
  - POST /ai/validate-smart - quick validation with scores
  - POST /ai/smart/analyze - wizard step 1: generate questions
  - POST /ai/smart/refine - wizard step 2: generate proposal
  - POST /ai/smart/apply - wizard step 3: apply changes
  - POST /ai/dialogs - start AI dialog for task refinement
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

### 8. Board Task Movement (Implemented)
```
Drag task to new column
    → BoardService.move_task()
    → Check WIP limit
    → Update BoardTask position
    → If column.mapped_status:
        → TaskService.change_status()
    → Return updated state

Frontend implementation:
  - @dnd-kit for drag-and-drop
  - Optimistic updates with React Query
  - WIP limit indicators on columns
```

### 9. Board-Project Relationship (Implemented)
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

### 12. Task Urgency Indicators (Implemented)
```typescript
// Frontend utility for urgency calculation
export function getTaskUrgency(task: { status, due_date, completed_at }): TaskUrgency {
  // Returns: status, label, tooltip, colorClass, icon, daysLeft
  // States: overdue 🔴 | due_today 🟠 | due_soon 🟡 | on_track | completed
}

UI Integration:
  - TaskRow: icon next to due date
  - TaskDetailPage: badge in header + icon in Details section
  - ChildTaskNode: icon in subtask tree

Features:
  - Shows for completed tasks if they were late
  - Russian pluralization (1 день, 2 дня, 5 дней)
  - Week-based display for long overdue periods
  - Color coding: red (overdue), orange (today), yellow (1-3 days)
```

### 13. Document Attachments in Comments (Implemented)
```typescript
// Backend: comment_id field links documents to comments
class Document(Base):
    comment_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True
    )

// Frontend: Attach files when creating comment
const handleSubmit = async () => {
  const comment = await createComment({ task_id, content });

  // Upload files with comment_id
  for (const { file } of selectedFiles) {
    await uploadDocument(taskId, file, undefined, "attachment", comment.id);
  }

  // Invalidate cache to show files immediately
  queryClient.invalidateQueries({ queryKey: ["documents", taskId] });
};

// Bidirectional Navigation with CustomEvent
// Comment → Document
const event = new CustomEvent('show-document', {
  detail: { documentId: doc.id }
});
window.dispatchEvent(event);

// Document → Comment
const event = new CustomEvent('show-comment', {
  detail: { commentId: doc.comment_id }
});
window.dispatchEvent(event);
```

**Features:**
- Documents grouped by type: 📋 Requirements | 📂 Attachments | ✅ Results
- Click document in comment → jump to Documents tab with scroll & highlight
- Click "→ из комментария" in document → jump to Comments tab
- Download via backend API (not presigned URLs - see pitfall #7)
- Proper Unicode filename encoding (see pitfall #6)
- Real-time cache invalidation

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
MINIO_EXTERNAL_URL=http://localhost:9000  # URL for browser access (not used for direct downloads)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=documents
MINIO_SECURE=false

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

### 6. File Download with Non-ASCII Filenames
**Problem:** `UnicodeEncodeError: 'latin-1' codec can't encode characters` when downloading files with Russian/Unicode names

**Root Cause:** HTTP headers (like Content-Disposition) must be ASCII (latin-1 encoded), but filenames can contain Unicode characters.

**Solution:** Use RFC 5987 encoding for Content-Disposition header
```python
from urllib.parse import quote

# Encode filename for Content-Disposition header
encoded_filename = quote(original_filename)

return Response(
    content=file_content,
    media_type=mime_type,
    headers={
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
    },
)
```

**Key Points:**
- Use `filename*=UTF-8''<encoded>` syntax (RFC 5987)
- URL-encode the filename with `quote()`
- Don't use regular `filename=` with non-ASCII characters
- Modern browsers support RFC 5987 encoding

### 7. MinIO Presigned URLs with Docker
**Problem:** MinIO generates presigned URLs with internal Docker hostname (`minio:9000`) which is inaccessible from browser

**Attempted Solutions that DON'T work:**
- ❌ Replacing hostname in URL breaks AWS signature
- ❌ Creating second MinIO client with external endpoint (can't connect from container)
- ❌ Setting `MINIO_SERVER_URL` environment variable (ignored by Python client)

**Working Solution:** Download files through backend API instead of presigned URLs
```typescript
// Frontend: Download via backend with authentication
const response = await api.get(`/documents/${documentId}/download`, {
  responseType: 'blob',
});

// Create blob and trigger download
const blob = new Blob([response.data]);
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
window.URL.revokeObjectURL(url);
```

**Benefits:**
- ✅ No hostname issues - all requests go through backend
- ✅ Full authentication control - backend validates access
- ✅ Works in any environment (Docker, localhost, production)
- ✅ No CORS issues
- ✅ Proper filename encoding handled by backend

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
make test                                    # = docker-compose exec backend pytest tests/ -v
docker compose exec backend pytest tests/test_tasks_api.py -v
docker compose exec backend pytest tests/ -k "test_create" -v
```

Tests are real pytest tests (`pytest.ini`, `tests/conftest.py`), not scripts:
- Run against an isolated DB `smarttask360_test`, created from scratch via Alembic on each session.
  The dev DB is never touched; `conftest.py` refuses non-`_test` database names.
- Each test runs in a rolled-back transaction; the app is called in-process (no running server needed).
- Fixtures: `client`, `auth_headers`, `admin_user`, `db_session`, `make_task`, `fake_ai`.
- AI is never called for real: use `fake_ai.reply({...} | "text" | Exception)` to queue replies.
- Document tests need MinIO (bucket `documents-test`) and skip if it is unreachable.
- Known gap: notifications on task assignment (`xfail`, see TODO in `tasks/service.py`).

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
