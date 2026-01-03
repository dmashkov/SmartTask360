# SmartTask360 — Data Model

**Status:** Updated for Phase 1B (Sprint 2 completed)

## Overview

MVP Phase 1A+1B includes implemented tables organized into layers:

1. **Core Layer** — Users, Departments
2. **Task Layer** — Tasks, Checklists, Comments, Documents
3. **Board Layer** — Boards, Columns, Placements
4. **Operational Layer** — Notifications, AI Conversations

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │      users       │         │   departments    │                         │
│  ├──────────────────┤         ├──────────────────┤                         │
│  │ id (PK)          │    ┌───►│ id (PK)          │◄──┐                     │
│  │ email (unique)   │    │    │ name             │   │                     │
│  │ password_hash    │    │    │ code (unique)    │   │ parent_id (self)    │
│  │ name             │    │    │ parent_id (FK)   │───┘                     │
│  │ role             │    │    │ head_id (FK)     │───┐                     │
│  │ department_id(FK)│────┘    │ created_at       │   │                     │
│  │ is_active        │         └──────────────────┘   │                     │
│  │ created_at       │◄───────────────────────────────┘                     │
│  │ updated_at       │                                                       │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              TASK LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                      ┌──────────────────┐            │
│  │      tasks       │                      │      tags        │            │
│  ├──────────────────┤                      ├──────────────────┤            │
│  │ id (PK)          │◄─────────────────────│ id (PK)          │            │
│  │ title            │      task_tags       │ name (unique)    │            │
│  │ description      │   ┌──────────────┐   │ color            │            │
│  │ status           │   │ task_id (FK) │   │ is_active        │            │
│  │ priority         │◄──┤ tag_id (FK)  ├──►│ created_at       │            │
│  │ creator_id (FK)  │   └──────────────┘   └──────────────────┘            │
│  │ assignee_id (FK) │                                                       │
│  │ parent_id (FK)   │───┐ (self-reference)                                  │
│  │ path (LTREE)     │◄──┘                                                   │
│  │ depth            │                                                       │
│  │ department_id(FK)│                                                       │
│  │ project_id (FK)  │                                                       │
│  │workflow_template │────┐                                                  │
│  │     _id (FK)     │    │                                                  │
│  │ source_doc_id(FK)│────┼──┐                                               │
│  │ source_quote     │    │  │                                               │
│  │ due_date         │    │  │   ┌──────────────────┐                       │
│  │ started_at       │    │  │   │    documents     │                       │
│  │ completed_at     │    │  │   ├──────────────────┤                       │
│  │ accepted_at      │    │  └──►│ id (PK)          │                       │
│  │acceptance_deadline    │      │ title            │                       │
│  │ rejection_reason │    │      │ type             │                       │
│  │ rejection_comment│    │      │ storage_bucket   │                       │
│  │ is_milestone     │    │      │ storage_key      │                       │
│  │ is_deleted       │    │      │ file_name        │                       │
│  │ estimated_hours  │    │      │ mime_type        │                       │
│  │ actual_hours     │    │      │ file_size        │                       │
│  │ created_at       │    │      │ content_text     │                       │
│  │ updated_at       │    │      │ uploaded_by (FK) │                       │
│  └────────┬─────────┘    │      │ uploaded_at      │                       │
│           │              │      │ metadata (JSON)  │                       │
│           │              │      └──────────────────┘                       │
│           │              │                                                  │
│           │              └──► workflow_templates (see Workflow Layer)       │
│           │                                                                 │
│           │                                                                 │
│  ┌────────┴─────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │  task_history    │    │  task_watchers   │    │task_participants │      │
│  ├──────────────────┤    ├──────────────────┤    ├──────────────────┤      │
│  │ id (PK)          │    │ task_id (PK,FK)  │    │ task_id (PK,FK)  │      │
│  │ task_id (FK)     │    │ user_id (PK,FK)  │    │ user_id (PK,FK)  │      │
│  │ changed_by_id(FK)│    └──────────────────┘    └──────────────────┘      │
│  │ action           │                                                       │
│  │ field_name       │                                                       │
│  │ old_value (JSONB)│                                                       │
│  │ new_value (JSONB)│                                                       │
│  │ comment          │                                                       │
│  │ extra_data(JSONB)│                                                       │
│  │ created_at       │                                                       │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHECKLISTS & COMMENTS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │    checklists    │         │ checklist_items  │                         │
│  ├──────────────────┤         ├──────────────────┤                         │
│  │ id (PK)          │◄────────│ id (PK)          │                         │
│  │ task_id (FK)     │         │ checklist_id(FK) │                         │
│  │ title            │         │ parent_id (FK)   │───┐ (self)              │
│  │ order_index      │         │ path (LTREE)     │◄──┘                     │
│  │ is_collapsed     │         │ depth            │                         │
│  │ created_at       │         │ title            │                         │
│  │ updated_at       │         │ is_completed     │                         │
│  └──────────────────┘         │ completed_at     │                         │
│                               │ completed_by(FK) │                         │
│                               │ assignee_id (FK) │                         │
│                               │ due_date         │                         │
│                               │ order_index      │                         │
│                               │ created_at       │                         │
│                               │ updated_at       │                         │
│                               └──────────────────┘                         │
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │     comments     │         │comment_attachments│                         │
│  ├──────────────────┤         ├──────────────────┤                         │
│  │ id (PK)          │◄────────│ comment_id (FK)  │                         │
│  │ task_id (FK)     │         │ document_id (FK) │────► documents          │
│  │ author_id (FK)   │         │ added_at         │                         │
│  │ author_type      │         └──────────────────┘                         │
│  │ content          │                                                       │
│  │ reply_to_id (FK) │───┐ (self-reference)                                 │
│  │ created_at       │◄──┘                                                   │
│  │ updated_at       │                                                       │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              BOARD LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │      boards      │    │  board_columns   │    │   board_tasks    │      │
│  ├──────────────────┤    ├──────────────────┤    ├──────────────────┤      │
│  │ id (PK)          │◄───│ id (PK)          │◄───│ board_id (FK)    │      │
│  │ name             │    │ board_id (FK)    │    │ task_id (FK)     │────► │
│  │ description      │    │ name             │    │ column_id (FK)   │      │
│  │ owner_id (FK)    │    │ mapped_status    │    │ order_index      │      │
│  │ project_id (FK)  │    │ order_index      │    │ added_at         │      │
│  │ department_id(FK)│    │ wip_limit        │    └──────────────────┘      │
│  │ workflow_template│    │ color            │                               │
│  │ is_private       │    └──────────────────┘    ┌──────────────────┐      │
│  │ created_at       │                            │  board_members   │      │
│  │ updated_at       │                            ├──────────────────┤      │
│  └──────────────────┘                            │ board_id (FK)    │      │
│           │                                      │ user_id (FK)     │      │
│           └─────────────────────────────────────►│ role             │      │
│                                                  │ added_at         │      │
│                                                  └──────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW CONFIG                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌────────────────────────┐                   │
│  │task_status_config│         │task_status_transitions │                   │
│  ├──────────────────┤         ├────────────────────────┤                   │
│  │ code (PK)        │◄────────│ from_status (FK)       │                   │
│  │ name             │◄────────│ to_status (FK)         │                   │
│  │ color            │         │ allowed_roles (ARRAY)  │                   │
│  │ order_index      │         │ requires_comment       │                   │
│  │ is_initial       │         └────────────────────────┘                   │
│  │ is_final         │                                                       │
│  │ is_active        │                                                       │
│  └──────────────────┘                                                       │
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────────┐                     │
│  │workflow_templates│         │ status_transitions   │                     │
│  ├──────────────────┤         ├──────────────────────┤                     │
│  │ id (PK)          │◄────────│ id (PK)              │                     │
│  │ name (unique)    │         │ template_id (FK)     │                     │
│  │ display_name     │         │ from_status          │                     │
│  │ description      │         │ to_status            │                     │
│  │ is_system        │         │ allowed_roles (JSONB)│                     │
│  │ statuses (JSONB) │         │ requires_comment     │                     │
│  │ created_at       │         │ requires_acceptance  │                     │
│  └──────────────────┘         │ validation_rules(JSONB)                    │
│                               │ display_order        │                     │
│                               │ created_at           │                     │
│                               └──────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          OPERATIONAL LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────────┐                     │
│  │  notifications   │         │notification_settings │                     │
│  ├──────────────────┤         ├──────────────────────┤                     │
│  │ id (PK)          │         │ user_id (PK, FK)     │                     │
│  │ user_id (FK)     │         │ notify_task_assigned │                     │
│  │ type             │         │ notify_task_comment  │                     │
│  │ title            │         │ notify_status_changed│                     │
│  │ content          │         │ notify_task_due_soon │                     │
│  │ entity_type      │         │ notify_task_overdue  │                     │
│  │ entity_id        │         │ notify_task_mention  │                     │
│  │ is_read          │         │ email_enabled        │                     │
│  │ priority         │         │ email_digest         │                     │
│  │ group_key        │         │ quiet_hours_enabled  │                     │
│  │ created_at       │         │ quiet_hours_start    │                     │
│  └──────────────────┘         │ quiet_hours_end      │                     │
│                               └──────────────────────┘                     │
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │ ai_conversations │                                                       │
│  ├──────────────────┤                                                       │
│  │ id (PK)          │                                                       │
│  │ task_id (FK)     │                                                       │
│  │ user_id (FK)     │                                                       │
│  │ conversation_type│                                                       │
│  │ messages (JSON)  │                                                       │
│  │ is_resolved      │                                                       │
│  │ result_summary   │                                                       │
│  │ created_at       │                                                       │
│  │ updated_at       │                                                       │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Enums

### UserRole
```python
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EXECUTOR = "executor"
```

### TaskStatus (Configurable)
Default statuses:
```python
class TaskStatus(str, Enum):
    DRAFT = "draft"
    NEW = "new"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    ON_REVIEW = "on_review"
    DONE = "done"
    CANCELLED = "cancelled"
```

### TaskPriority
```python
class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
```

### DocumentType
```python
class DocumentType(str, Enum):
    PROTOCOL = "protocol"
    REPORT = "report"
    ORDER = "order"
    ATTACHMENT = "attachment"
    OTHER = "other"
```

### AuthorType (for comments)
```python
class AuthorType(str, Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"
```

### ConversationType
```python
class ConversationType(str, Enum):
    SMART_VALIDATION = "smart_validation"
    DISCUSSION = "discussion"
    DECOMPOSITION = "decomposition"
```

### NotificationType
```python
class NotificationType(str, Enum):
    TASK_ASSIGNED = "task_assigned"
    TASK_COMMENT = "task_comment"
    TASK_MENTION = "task_mention"
    TASK_STATUS_CHANGED = "task_status_changed"
    TASK_DUE_SOON = "task_due_soon"
    TASK_OVERDUE = "task_overdue"
    CHECKLIST_ASSIGNED = "checklist_assigned"
    AI_VALIDATION_COMPLETE = "ai_validation_complete"
```

### ParticipationType
```python
class ParticipationType(str, Enum):
    SUBTASK_ASSIGNEE = "subtask_assignee"
    CHECKLIST_ASSIGNEE = "checklist_assignee"
```

### BoardMemberRole
```python
class BoardMemberRole(str, Enum):
    VIEWER = "viewer"
    MEMBER = "member"
    ADMIN = "admin"
```

### EmailDigest
```python
class EmailDigest(str, Enum):
    INSTANT = "instant"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
```

### RejectionReason
```python
class RejectionReason(str, Enum):
    UNCLEAR = "unclear"              # Задача непонятна
    NO_RESOURCES = "no_resources"    # Нет ресурсов/доступов
    UNREALISTIC_DEADLINE = "unrealistic_deadline"  # Срок нереалистичен
    CONFLICT = "conflict"            # Конфликт с другими задачами
    WRONG_ASSIGNEE = "wrong_assignee"  # Не моя компетенция
    OTHER = "other"                  # Другое
```

## Table Details

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| name | VARCHAR(255) | NOT NULL | Display name |
| role | VARCHAR(20) | NOT NULL | admin/manager/executor |
| department_id | UUID | FK → departments | User's department |
| is_active | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update |

### tasks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| title | VARCHAR(500) | NOT NULL | Task title |
| description | TEXT | | Full description |
| status | VARCHAR(50) | NOT NULL | Current status |
| priority | VARCHAR(20) | DEFAULT 'medium' | Priority level |
| creator_id | UUID | FK → users, NOT NULL | Who created |
| assignee_id | UUID | FK → users | Assigned to |
| parent_id | UUID | FK → tasks | Parent task |
| path | LTREE | NOT NULL | Hierarchy path |
| depth | INTEGER | DEFAULT 0 | Nesting level |
| source_document_id | UUID | FK → documents | Source document |
| source_quote | TEXT | | Quote from document |
| due_date | TIMESTAMP | | Deadline |
| started_at | TIMESTAMP | | When work started |
| completed_at | TIMESTAMP | | When completed |
| is_milestone | BOOLEAN | DEFAULT FALSE | Is milestone |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete |
| smart_score | JSONB | | SMART validation result |
| smart_validated | BOOLEAN | DEFAULT FALSE | Passed SMART |
| estimated_hours | DECIMAL(10,2) | | Estimated effort |
| actual_hours | DECIMAL(10,2) | | Actual effort |
| accepted_at | TIMESTAMP | | When assignee accepted |
| acceptance_deadline | TIMESTAMP | | Deadline to accept/reject |
| rejection_reason | VARCHAR(50) | | Reason if rejected |
| rejection_comment | TEXT | | Details if rejected |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update |

## Default Status Workflow

```
                    ┌─────────────┐
                    │    DRAFT    │ ← Initial (created without validation)
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
        ┌───────────│     NEW     │ ← Initial (validated)
        │           └──────┬──────┘
        │                  │
        │                  ▼
        │           ┌─────────────┐
        │           │  ASSIGNED   │
        │           └──────┬──────┘
        │                  │
        │                  ▼
        │           ┌─────────────┐
        ├──────────►│ IN_PROGRESS │◄──────────┐
        │           └──────┬──────┘           │
        │                  │                  │
        │                  ▼                  │
        │           ┌─────────────┐           │
        │           │  ON_REVIEW  │───────────┘ (needs rework)
        │           └──────┬──────┘
        │                  │
        │                  ▼
        │           ┌─────────────┐
        │           │    DONE     │ ← Final
        │           └─────────────┘
        │
        │           ┌─────────────┐
        └──────────►│  CANCELLED  │ ← Final
                    └─────────────┘
```

## Indexes Summary

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);

-- Tasks
CREATE INDEX idx_tasks_path_gist ON tasks USING GIST (path);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- Full-text search on tasks
CREATE INDEX idx_tasks_title_gin ON tasks USING GIN (to_tsvector('russian', title));
CREATE INDEX idx_tasks_description_gin ON tasks USING GIN (to_tsvector('russian', description));

-- Documents
CREATE INDEX idx_documents_content_gin ON documents USING GIN (to_tsvector('russian', content_text));

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;
```
