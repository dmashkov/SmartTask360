# SmartTask360 — Architecture Overview

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SMARTTASK360 CONTEXT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          ┌─────────────────┐                                │
│                          │     Users       │                                │
│                          │  (Browser/App)  │                                │
│                          └────────┬────────┘                                │
│                                   │                                         │
│                                   ▼                                         │
│                          ┌─────────────────┐                                │
│                          │    Frontend     │                                │
│                          │  (React SPA)    │                                │
│                          └────────┬────────┘                                │
│                                   │ REST API                                │
│                                   ▼                                         │
│                          ┌─────────────────┐                                │
│                          │    Backend      │                                │
│                          │   (FastAPI)     │                                │
│                          └───┬─────┬───┬───┘                                │
│                              │     │   │                                    │
│              ┌───────────────┘     │   └───────────────┐                    │
│              │                     │                   │                    │
│              ▼                     ▼                   ▼                    │
│     ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐        │
│     │   PostgreSQL    │   │     MinIO       │   │   Claude API    │        │
│     │   (Database)    │   │   (Storage)     │   │      (AI)       │        │
│     └─────────────────┘   └─────────────────┘   └─────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 360° Goal Cascade

SmartTask360 supports full strategic cascade:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         360° GOAL CASCADE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    BSC (Balanced Scorecard)                          │  │
│   │  Financial │ Customer │ Internal Process │ Learning & Growth         │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    Strategic Objectives                              │  │
│   │  "Increase market share" │ "Improve customer satisfaction"           │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         OKR                                          │  │
│   │  Objective: "Launch in 3 new regions"                                │  │
│   │  KR1: "Open 3 offices by Q2"                                         │  │
│   │  KR2: "Hire 15 regional managers"                                    │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                       Programs                                       │  │
│   │  "Regional Expansion Program"                                        │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                       Projects                                       │  │
│   │  "Moscow Office Setup" │ "SPB Office Setup" │ "Kazan Office Setup"   │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    Tasks ← AI SMART Validation                       │  │
│   │  "Find office space 100m²" │ "Hire office manager" │ ...             │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │               Subtasks & Checklists                                  │  │
│   │  "Review 5 locations" │ "Negotiate lease" │ "Sign contract"          │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   MVP focuses on Tasks layer ────────────────────────────────────────────  │
│   Phase 2 adds BSC → OKR → Projects                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Architecture

### Backend Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MODULE DEPENDENCIES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           CORE (config, db, security)                       │
│                                     │                                       │
│           ┌─────────────────────────┼─────────────────────────┐             │
│           │                         │                         │             │
│           ▼                         ▼                         ▼             │
│        ┌──────┐               ┌──────────┐              ┌────────────┐      │
│        │ AUTH │               │  USERS   │              │DEPARTMENTS │      │
│        └──┬───┘               └────┬─────┘              └─────┬──────┘      │
│           │                        │                          │             │
│           └────────────────────────┼──────────────────────────┘             │
│                                    │                                        │
│     ┌──────────┬───────────────────┼───────────────────┬──────────┐        │
│     │          │                   │                   │          │        │
│     ▼          ▼                   ▼                   ▼          ▼        │
│  ┌──────┐  ┌──────────┐      ┌──────────┐       ┌──────────┐  ┌────┐      │
│  │ TAGS │  │DOCUMENTS │      │ WORKFLOW │       │    AI    │  │... │      │
│  └──┬───┘  └────┬─────┘      └────┬─────┘       └────┬─────┘  └────┘      │
│     │           │                 │                  │                     │
│     └───────────┴─────────────────┼──────────────────┘                     │
│                                   │                                        │
│                                   ▼                                        │
│                             ┌──────────┐                                   │
│                             │  TASKS   │◄────────────────────┐             │
│                             └────┬─────┘                     │             │
│                                  │                           │             │
│           ┌──────────────────────┼──────────────────────┐    │             │
│           │                      │                      │    │             │
│           ▼                      ▼                      ▼    │             │
│     ┌──────────┐          ┌──────────┐           ┌──────────┐│             │
│     │CHECKLISTS│          │ COMMENTS │           │  BOARDS  │┘             │
│     └────┬─────┘          └────┬─────┘           └────┬─────┘              │
│          │                     │                      │                    │
│          └─────────────────────┼──────────────────────┘                    │
│                                │                                           │
│                                ▼                                           │
│                        ┌──────────────┐                                    │
│                        │NOTIFICATIONS │                                    │
│                        └──────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Communication Rules

1. **Modules communicate ONLY through service interfaces**
   ```python
   # ✓ Good - use service
   from app.modules.users.service import UserService
   user = await UserService(db).get_by_id(user_id)
   
   # ✗ Bad - direct model import
   from app.modules.users.models import User
   user = await db.get(User, user_id)
   ```

2. **No circular dependencies**
   - Tasks → Notifications (not vice versa)
   - Comments → Tasks (not vice versa)

3. **Shared types in core/**
   ```python
   # core/types.py
   from enum import Enum
   
   class UserRole(str, Enum):
       ADMIN = "admin"
       MANAGER = "manager"
       EXECUTOR = "executor"
   ```

4. **Each module has prefixed router**
   ```python
   # tasks/router.py
   router = APIRouter(prefix="/tasks", tags=["tasks"])
   ```

## Data Flow

### Task Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TASK CREATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐                                                           │
│  │   Frontend   │                                                           │
│  │ TaskForm.tsx │                                                           │
│  └──────┬───────┘                                                           │
│         │ POST /api/v1/tasks                                                │
│         │ {title, description, ...}                                         │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │   Router     │                                                           │
│  │  router.py   │                                                           │
│  └──────┬───────┘                                                           │
│         │ Validate request, get current_user                                │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │   Service    │                                                           │
│  │  service.py  │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         ├─────────────────────────────────────────┐                         │
│         │ 1. Create task with status='draft'      │                         │
│         │ 2. Update path (LTREE)                  │                         │
│         │ 3. Record history                       │                         │
│         ▼                                         │                         │
│  ┌──────────────┐                                 │                         │
│  │  AIService   │ if not skip_smart_validation    │                         │
│  │              │◄────────────────────────────────┘                         │
│  └──────┬───────┘                                                           │
│         │ 4. Call Claude API                                                │
│         │ 5. Parse SMART result                                             │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │Notifications │                                                           │
│  │   Service    │ if assignee_id                                            │
│  └──────┬───────┘                                                           │
│         │ 6. Notify assignee                                                │
│         ▼                                                                   │
│  ┌──────────────┐                                                           │
│  │   Response   │                                                           │
│  │ {task, smart}│                                                           │
│  └──────────────┘                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Change Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATUS CHANGE FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  POST /api/v1/tasks/{id}/status                                             │
│  {status: "done", comment: "Completed"}                                     │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        TaskService.change_status()                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  WorkflowService.validate_transition(from, to, role, has_comment)    │  │
│  │                                                                       │  │
│  │  - Check transition exists                                            │  │
│  │  - Check role is allowed                                              │  │
│  │  - Check comment requirement                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ├── Invalid? → raise ForbiddenError                                │
│         │                                                                   │
│         ▼ Valid                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Update task:                                                         │  │
│  │  - task.status = new_status                                           │  │
│  │  - task.started_at = now() if entering in_progress                    │  │
│  │  - task.completed_at = now() if entering done                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Record TaskHistory(change_type="status_change")                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  NotificationService.send() to:                                       │  │
│  │  - Assignee                                                           │  │
│  │  - Watchers                                                           │  │
│  │  - Creator (if different)                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Task Acceptance Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TASK ACCEPTANCE FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          Task assigned to executor                          │
│                                     │                                       │
│                                     ▼                                       │
│                    ┌────────────────────────────────┐                       │
│                    │   Notification sent            │                       │
│                    │   + acceptance_deadline set    │                       │
│                    │     (default: +48h)            │                       │
│                    └────────────────┬───────────────┘                       │
│                                     │                                       │
│                         ┌───────────┴───────────┐                           │
│                         ▼                       ▼                           │
│                   Executor opens           Timer expires                    │
│                      task                   (48h)                           │
│                         │                       │                           │
│                         ▼                       ▼                           │
│              ┌──────────────────────┐    Reminder sent                      │
│              │  Two buttons:        │    to executor                        │
│              │                      │         │                             │
│              │  [Взять в работу]    │         ▼                             │
│              │  [Есть вопросы]      │    Timer expires                      │
│              └──────────┬───────────┘    (72h total)                        │
│                         │                       │                           │
│           ┌─────────────┴─────────────┐         ▼                           │
│           ▼                           ▼   Escalation to                     │
│      Accept                      Reject    manager                          │
│           │                           │                                     │
│           ▼                           ▼                                     │
│  ┌─────────────────────┐   ┌─────────────────────┐                         │
│  │ POST /tasks/{id}/   │   │ POST /tasks/{id}/   │                         │
│  │      accept         │   │      reject         │                         │
│  │                     │   │                     │                         │
│  │ - status →          │   │ - reason (enum)     │                         │
│  │   "in_progress"     │   │ - comment (text)    │                         │
│  │ - accepted_at = now │   │ - notify creator    │                         │
│  │ - notify creator    │   │ - status unchanged  │                         │
│  └─────────────────────┘   └─────────────────────┘                         │
│                                                                             │
│  Rejection reasons:                                                         │
│  • unclear — Задача непонятна                                               │
│  • no_resources — Нет ресурсов/доступов                                     │
│  • unrealistic_deadline — Срок нереалистичен                                │
│  • conflict — Конфликт с другими задачами                                   │
│  • wrong_assignee — Не моя компетенция                                      │
│  • other — Другое                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Kanban Drag-Drop Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KANBAN DRAG-DROP FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User drags task card from Column A to Column B                             │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Frontend: onDragEnd()                                                │  │
│  │  POST /api/v1/boards/{id}/tasks/move                                  │  │
│  │  {task_id, to_column_id, to_index, update_task_status: true}          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  BoardService.move_task()                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Check WIP limit:                                                     │  │
│  │  current_count = count tasks in to_column                             │  │
│  │  if column.wip_limit and current_count >= wip_limit:                  │  │
│  │      return {warning: "WIP limit exceeded"}                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Update BoardTask:                                                    │  │
│  │  - column_id = to_column_id                                           │  │
│  │  - order_index = to_index                                             │  │
│  │  - Reindex other tasks in both columns                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ├── update_task_status AND column.mapped_status?                   │
│         │                                                                   │
│         ▼ Yes                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TaskService.change_status(task_id, column.mapped_status)             │  │
│  │  (Triggers full status change flow)                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Return: {board_task, status_changed: true, new_status: "in_progress"}│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Board Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BOARD-PROJECT RELATIONSHIP                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Design Decision: One Board = One Project (or Department)                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Project A                                   │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                    Board "Project A"                          │  │   │
│  │  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┐         │  │   │
│  │  │  │ Backlog │ To Do   │In Progr.│ Review  │  Done   │         │  │   │
│  │  │  │         │         │         │         │         │         │  │   │
│  │  │  │ mapped: │ mapped: │ mapped: │ mapped: │ mapped: │         │  │   │
│  │  │  │  null   │  new    │in_progr.│on_review│  done   │         │  │   │
│  │  │  └─────────┴─────────┴─────────┴─────────┴─────────┘         │  │   │
│  │  │                                                               │  │   │
│  │  │  workflow_template: "agile"                                   │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Key Points:                                                                │
│  • Board.project_id links board to a project                               │
│  • Each board can use different workflow_template                          │
│  • Columns can be mapped to statuses (optional)                            │
│  • Moving card to mapped column → changes task status                      │
│  • Changing task status → moves card to mapped column                      │
│  • Task belongs to ONE board only (no duplication)                         │
│                                                                             │
│  Workflow Templates (system):                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ "basic"  │ Новая → В работе → На проверке → Готово                  │   │
│  │ "agile"  │ Backlog → To Do → In Progress → Review → Done            │   │
│  │ "approval" │ Черновик → На согласовании → Утверждено → Готово       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Custom templates can be created per organization.                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Design

### Key Tables (MVP Phase 1)

```sql
-- Core entities
users              -- User accounts
departments        -- Organizational hierarchy (self-referential)

-- Tasks domain
tasks              -- Main task entity with LTREE hierarchy
task_history       -- Audit log of changes
task_watchers      -- Users watching a task
task_participants  -- Users involved (auto-populated)
task_tags          -- Many-to-many task <-> tag

-- Task details
checklists         -- Checklist containers
checklist_items    -- Checklist items with LTREE hierarchy
comments           -- Task comments
comment_attachments -- Comment file attachments

-- Supporting
tags               -- Tag dictionary
documents          -- Uploaded documents
task_status_config -- Status configuration
task_status_transitions -- Allowed transitions

-- Boards
boards             -- Kanban boards
board_columns      -- Board columns
board_tasks        -- Task placement on boards
board_members      -- Board access control

-- AI
ai_conversations   -- AI dialog history

-- Notifications
notifications      -- User notifications
notification_settings -- User preferences
```

### LTREE Usage

Tasks and checklist items use PostgreSQL LTREE for efficient hierarchy queries:

```sql
-- Example: Task hierarchy
-- Parent: 550e8400-e29b-41d4-a716-446655440000
-- Child:  660e8400-e29b-41d4-a716-446655440001

tasks:
  id: 660e8400-e29b-41d4-a716-446655440001
  parent_id: 550e8400-e29b-41d4-a716-446655440000
  path: '550e8400e29b41d4a716446655440000.660e8400e29b41d4a716446655440001'
  depth: 1

-- Query all descendants
SELECT * FROM tasks 
WHERE path <@ '550e8400e29b41d4a716446655440000';

-- Query ancestors (path to root)
SELECT * FROM tasks
WHERE path @> '660e8400e29b41d4a716446655440001'
ORDER BY depth;
```

## Security

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Login                                                                   │
│     POST /api/v1/auth/login {email, password}                               │
│     → Verify credentials                                                    │
│     → Generate access_token (30 min) + refresh_token (7 days)               │
│     → Return tokens                                                         │
│                                                                             │
│  2. API Calls                                                               │
│     Authorization: Bearer {access_token}                                    │
│     → Decode JWT                                                            │
│     → Load user from DB                                                     │
│     → Inject as dependency                                                  │
│                                                                             │
│  3. Token Refresh                                                           │
│     POST /api/v1/auth/refresh {refresh_token}                               │
│     → Verify refresh token                                                  │
│     → Generate new access_token                                             │
│     → Return new token                                                      │
│                                                                             │
│  4. Logout                                                                  │
│     POST /api/v1/auth/logout                                                │
│     → Blacklist refresh token                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authorization

Role-based access control with three roles:

| Role | Capabilities |
|------|--------------|
| admin | Full system access, user management, workflow config |
| manager | Create/manage tasks, manage team, view reports |
| executor | Work on assigned tasks, create subtasks |

```python
# Dependency for role checking
def require_role(*roles: UserRole):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(403, "Insufficient permissions")
        return current_user
    return checker

# Usage
@router.post("/")
async def create_user(
    data: UserCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    ...
```

## AI Integration

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI INTEGRATION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AIService                                    │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   validate   │  │    dialog    │  │   comment    │              │   │
│  │  │    _smart    │  │   methods    │  │   methods    │              │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │   │
│  │         │                 │                 │                       │   │
│  │         └─────────────────┼─────────────────┘                       │   │
│  │                           │                                         │   │
│  │                           ▼                                         │   │
│  │                    ┌──────────────┐                                 │   │
│  │                    │   AIClient   │                                 │   │
│  │                    │              │                                 │   │
│  │                    │ - complete() │                                 │   │
│  │                    │ - retry      │                                 │   │
│  │                    │ - parse JSON │                                 │   │
│  │                    └──────┬───────┘                                 │   │
│  │                           │                                         │   │
│  └───────────────────────────┼─────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│                    ┌──────────────────┐                                    │
│                    │  Anthropic API   │                                    │
│                    │    (Claude)      │                                    │
│                    └──────────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### MVP (Current)
- Single PostgreSQL instance
- Single MinIO instance
- Monolithic backend
- No caching

### Future Improvements
- Read replicas for PostgreSQL
- Redis for caching (status configs, user sessions)
- Background jobs (Celery/ARQ) for notifications, AI calls
- CDN for static files
- Horizontal scaling for API servers
- Event sourcing for audit trail (Phase 2+)
