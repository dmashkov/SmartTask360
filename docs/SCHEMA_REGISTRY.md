# SmartTask360 — Schema Registry

**Единый источник истины для всех схем данных**

⚠️ **ВАЖНО:** Перед созданием моделей, миграций, TypeScript типов — всегда сверяйся с этим файлом!

**Last Updated:** 2026-01-02

---

## 📋 Содержание

- [Core Layer](#core-layer)
  - [users](#users)
  - [departments](#departments)
- [Task Layer](#task-layer)
  - [tasks](#tasks)
  - [task_history](#task_history)
  - [task_watchers](#task_watchers)
  - [task_participants](#task_participants)
  - [task_tags](#task_tags-many-to-many)
  - [tags](#tags)
  - [documents](#documents)
- [Checklist Layer](#checklist-layer)
  - [checklists](#checklists)
  - [checklist_items](#checklist_items)
- [Comments Layer](#comments-layer)
  - [comments](#comments)
  - [comment_attachments](#comment_attachments)
- [Workflow Layer](#workflow-layer)
  - [task_status_config](#task_status_config)
  - [task_status_transitions](#task_status_transitions)
  - [workflow_templates](#workflow_templates)
  - [workflow_template_steps](#workflow_template_steps)
- [Board Layer](#board-layer)
  - [boards](#boards)
  - [board_columns](#board_columns)
  - [board_tasks](#board_tasks)
  - [board_members](#board_members)
- [Operational Layer](#operational-layer)
  - [notifications](#notifications)
  - [notification_settings](#notification_settings)
  - [ai_conversations](#ai_conversations)
- [Enums](#enums)

---

## Core Layer

### users

**Backend:** `app/modules/users/models.py`
**Frontend:** `src/modules/auth/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL | - | Login email |
| password_hash | VARCHAR(255) | NOT NULL | - | Bcrypt hash |
| name | VARCHAR(255) | NOT NULL | - | Display name |
| role | VARCHAR(20) | NOT NULL | - | Enum: admin/manager/executor |
| department_id | UUID | FK → departments, NULL | - | User's department |
| is_active | BOOLEAN | NOT NULL | TRUE | Soft delete flag |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
```

**API Response Shape (UserResponse):**
```typescript
{
  id: string;           // UUID
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'executor';
  department_id: string | null;
  is_active: boolean;
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}
```

---

### departments

**Backend:** `app/modules/departments/models.py`
**Frontend:** `src/modules/departments/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| name | VARCHAR(255) | NOT NULL | - | Department name |
| code | VARCHAR(50) | UNIQUE, NOT NULL | - | Short code (e.g., "IT", "HR") |
| parent_id | UUID | FK → departments, NULL | - | Parent department |
| head_id | UUID | FK → users, NULL | - | Department head |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_head ON departments(head_id);
CREATE INDEX idx_departments_code ON departments(code);
```

**API Response Shape (DepartmentResponse):**
```typescript
{
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  head_id: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Task Layer

### tasks

**Backend:** `app/modules/tasks/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| title | VARCHAR(500) | NOT NULL | - | Task title |
| description | TEXT | NULL | - | Full description (Markdown) |
| status | VARCHAR(50) | NOT NULL | 'draft' | Current status |
| priority | VARCHAR(20) | NOT NULL | 'medium' | Enum: low/medium/high/critical |
| creator_id | UUID | FK → users, NOT NULL | - | Who created the task |
| assignee_id | UUID | FK → users, NULL | - | Assigned to (can be null) |
| parent_id | UUID | FK → tasks, NULL | - | Parent task (null = root) |
| path | LTREE | NOT NULL | - | Hierarchy path (e.g., 'uuid1.uuid2') |
| depth | INTEGER | NOT NULL | 0 | Nesting level (0 = root) |
| source_document_id | UUID | FK → documents, NULL | - | Source document if created from doc |
| source_quote | TEXT | NULL | - | Quote from source document |
| due_date | TIMESTAMPTZ | NULL | - | Deadline |
| started_at | TIMESTAMPTZ | NULL | - | When work started (status → in_progress) |
| completed_at | TIMESTAMPTZ | NULL | - | When completed (status → done) |
| is_milestone | BOOLEAN | NOT NULL | FALSE | Is this a milestone |
| is_deleted | BOOLEAN | NOT NULL | FALSE | Soft delete flag |
| smart_score | JSONB | NULL | - | SMART validation result |
| smart_validated | BOOLEAN | NOT NULL | FALSE | Passed SMART validation |
| estimated_hours | DECIMAL(10,2) | NULL | - | Estimated effort (hours) |
| actual_hours | DECIMAL(10,2) | NULL | - | Actual effort (hours) |
| accepted_at | TIMESTAMPTZ | NULL | - | When assignee accepted |
| acceptance_deadline | TIMESTAMPTZ | NULL | - | Deadline to accept/reject |
| rejection_reason | VARCHAR(50) | NULL | - | Enum if rejected |
| rejection_comment | TEXT | NULL | - | Details if rejected |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_tasks_path_gist ON tasks USING GIST (path);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX idx_tasks_title_gin ON tasks USING GIN (to_tsvector('russian', title));
CREATE INDEX idx_tasks_description_gin ON tasks USING GIN (to_tsvector('russian', description));
```

**API Response Shape (TaskResponse):**
```typescript
{
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  creator_id: string;
  assignee_id: string | null;
  parent_id: string | null;
  depth: number;
  source_document_id: string | null;
  source_quote: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  is_milestone: boolean;
  smart_score: SmartScore | null;
  smart_validated: boolean;
  estimated_hours: number | null;
  actual_hours: number | null;
  accepted_at: string | null;
  acceptance_deadline: string | null;
  rejection_reason: RejectionReason | null;
  rejection_comment: string | null;
  created_at: string;
  updated_at: string;

  // Computed/joined fields (optional, depends on endpoint)
  creator?: UserResponse;
  assignee?: UserResponse;
  tags?: TagResponse[];
  subtasks_count?: number;
  comments_count?: number;
}
```

---

### task_history

**Backend:** `app/modules/tasks/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| task_id | UUID | FK → tasks, NOT NULL | - | Related task |
| changed_by | UUID | FK → users, NOT NULL | - | Who made the change |
| change_type | VARCHAR(50) | NOT NULL | - | Enum: created/status_change/assigned/etc |
| from_value | JSONB | NULL | - | Old value (JSON) |
| to_value | JSONB | NULL | - | New value (JSON) |
| comment | TEXT | NULL | - | Optional comment |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | When change happened |

**Indexes:**
```sql
CREATE INDEX idx_task_history_task ON task_history(task_id);
CREATE INDEX idx_task_history_created ON task_history(created_at DESC);
```

---

### task_watchers

**Backend:** `app/modules/tasks/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| task_id | UUID | PK, FK → tasks, NOT NULL | - | Watched task |
| user_id | UUID | PK, FK → users, NOT NULL | - | Watcher user |
| added_at | TIMESTAMPTZ | NOT NULL | NOW() | When started watching |

**Primary Key:** `(task_id, user_id)`

**Indexes:**
```sql
CREATE INDEX idx_task_watchers_user ON task_watchers(user_id);
```

---

### task_participants

**Backend:** `app/modules/tasks/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| task_id | UUID | PK, FK → tasks, NOT NULL | - | Parent task |
| user_id | UUID | PK, FK → users, NOT NULL | - | Participant user |
| participation_type | VARCHAR(50) | NOT NULL | - | Enum: subtask_assignee/checklist_assignee |
| source_task_id | UUID | FK → tasks, NULL | - | If from subtask |
| source_item_id | UUID | FK → checklist_items, NULL | - | If from checklist item |
| added_at | TIMESTAMPTZ | NOT NULL | NOW() | When added |

**Primary Key:** `(task_id, user_id, participation_type, COALESCE(source_task_id, '00000000-0000-0000-0000-000000000000'), COALESCE(source_item_id, '00000000-0000-0000-0000-000000000000'))`

**Indexes:**
```sql
CREATE INDEX idx_task_participants_user ON task_participants(user_id);
CREATE INDEX idx_task_participants_task ON task_participants(task_id);
```

---

### task_tags (many-to-many)

**Backend:** `app/modules/tasks/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| task_id | UUID | PK, FK → tasks, NOT NULL | - | Task |
| tag_id | UUID | PK, FK → tags, NOT NULL | - | Tag |

**Primary Key:** `(task_id, tag_id)`

---

### tags

**Backend:** `app/modules/tags/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| name | VARCHAR(100) | UNIQUE, NOT NULL | - | Tag name |
| color | VARCHAR(7) | NOT NULL | '#6B7280' | Hex color code |
| is_active | BOOLEAN | NOT NULL | TRUE | Soft delete |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |

**Indexes:**
```sql
CREATE INDEX idx_tags_name ON tags(name);
```

**API Response Shape (TagResponse):**
```typescript
{
  id: string;
  name: string;
  color: string; // Hex color
  is_active: boolean;
  created_at: string;
}
```

---

### documents

**Backend:** `app/modules/documents/models.py`
**Frontend:** `src/modules/documents/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| title | VARCHAR(500) | NOT NULL | - | Document title |
| type | VARCHAR(50) | NOT NULL | 'attachment' | Enum: protocol/report/order/attachment/other |
| storage_bucket | VARCHAR(100) | NOT NULL | - | MinIO bucket name |
| storage_key | VARCHAR(500) | NOT NULL | - | MinIO object key |
| file_name | VARCHAR(255) | NOT NULL | - | Original filename |
| mime_type | VARCHAR(100) | NOT NULL | - | MIME type |
| file_size | BIGINT | NOT NULL | - | File size in bytes |
| content_text | TEXT | NULL | - | Extracted text content |
| uploaded_by | UUID | FK → users, NOT NULL | - | Who uploaded |
| uploaded_at | TIMESTAMPTZ | NOT NULL | NOW() | Upload time |
| metadata | JSONB | NULL | - | Additional metadata |

**Indexes:**
```sql
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_content_gin ON documents USING GIN (to_tsvector('russian', content_text));
```

---

## Checklist Layer

### checklists

**Backend:** `app/modules/checklists/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| task_id | UUID | FK → tasks, NOT NULL | - | Parent task |
| title | VARCHAR(255) | NOT NULL | - | Checklist title |
| order_index | INTEGER | NOT NULL | 0 | Display order |
| is_collapsed | BOOLEAN | NOT NULL | FALSE | UI collapse state |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_checklists_task ON checklists(task_id);
```

---

### checklist_items

**Backend:** `app/modules/checklists/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| checklist_id | UUID | FK → checklists, NOT NULL | - | Parent checklist |
| parent_id | UUID | FK → checklist_items, NULL | - | Parent item (null = root) |
| path | LTREE | NOT NULL | - | Hierarchy path |
| depth | INTEGER | NOT NULL | 0 | Nesting level |
| title | VARCHAR(500) | NOT NULL | - | Item text |
| is_completed | BOOLEAN | NOT NULL | FALSE | Completion status |
| completed_at | TIMESTAMPTZ | NULL | - | When completed |
| completed_by | UUID | FK → users, NULL | - | Who completed |
| assignee_id | UUID | FK → users, NULL | - | Assigned to |
| due_date | TIMESTAMPTZ | NULL | - | Item deadline |
| order_index | INTEGER | NOT NULL | 0 | Display order |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_path_gist ON checklist_items USING GIST (path);
CREATE INDEX idx_checklist_items_assignee ON checklist_items(assignee_id);
```

---

## Comments Layer

### comments

**Backend:** `app/modules/comments/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| task_id | UUID | FK → tasks, NOT NULL | - | Parent task |
| author_id | UUID | FK → users, NULL | - | Author (null if AI/system) |
| author_type | VARCHAR(20) | NOT NULL | 'user' | Enum: user/ai/system |
| content | TEXT | NOT NULL | - | Comment text (Markdown) |
| reply_to_id | UUID | FK → comments, NULL | - | Parent comment (thread) |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
```

---

### comment_attachments

**Backend:** `app/modules/comments/models.py`
**Frontend:** `src/modules/tasks/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| comment_id | UUID | PK, FK → comments, NOT NULL | - | Parent comment |
| document_id | UUID | PK, FK → documents, NOT NULL | - | Attached document |
| added_at | TIMESTAMPTZ | NOT NULL | NOW() | When attached |

**Primary Key:** `(comment_id, document_id)`

---

## Workflow Layer

### task_status_config

**Backend:** `app/modules/workflow/models.py`
**Frontend:** `src/modules/workflow/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| code | VARCHAR(50) | PK, NOT NULL | - | Status code (e.g., 'draft', 'done') |
| name | VARCHAR(100) | NOT NULL | - | Display name |
| color | VARCHAR(7) | NOT NULL | '#6B7280' | Hex color code |
| order_index | INTEGER | NOT NULL | 0 | Display order |
| is_initial | BOOLEAN | NOT NULL | FALSE | Can be initial status |
| is_final | BOOLEAN | NOT NULL | FALSE | Is terminal status |
| is_active | BOOLEAN | NOT NULL | TRUE | Soft delete |

**Primary Key:** `code`

---

### task_status_transitions

**Backend:** `app/modules/workflow/models.py`
**Frontend:** `src/modules/workflow/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| from_status | VARCHAR(50) | PK, FK → task_status_config, NOT NULL | - | Source status |
| to_status | VARCHAR(50) | PK, FK → task_status_config, NOT NULL | - | Target status |
| allowed_roles | VARCHAR(20)[] | NOT NULL | - | Array of roles (admin/manager/executor) |
| requires_comment | BOOLEAN | NOT NULL | FALSE | Comment required |

**Primary Key:** `(from_status, to_status)`

---

### workflow_templates

**Backend:** `app/modules/workflow/models.py`
**Frontend:** `src/modules/workflow/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| code | VARCHAR(50) | UNIQUE, NOT NULL | - | Template code (basic/agile/approval) |
| name | VARCHAR(100) | NOT NULL | - | Display name |
| description | TEXT | NULL | - | Template description |
| is_system | BOOLEAN | NOT NULL | FALSE | System template (not editable) |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |

---

### workflow_template_steps

**Backend:** `app/modules/workflow/models.py`
**Frontend:** `src/modules/workflow/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| template_id | UUID | PK, FK → workflow_templates, NOT NULL | - | Parent template |
| from_status | VARCHAR(50) | PK, NOT NULL | - | Source status code |
| to_status | VARCHAR(50) | PK, NOT NULL | - | Target status code |
| allowed_roles | VARCHAR(20)[] | NOT NULL | - | Array of roles |
| requires_comment | BOOLEAN | NOT NULL | FALSE | Comment required |
| order_index | INTEGER | NOT NULL | 0 | Display order |

**Primary Key:** `(template_id, from_status, to_status)`

---

## Board Layer

### boards

**Backend:** `app/modules/boards/models.py`
**Frontend:** `src/modules/boards/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| name | VARCHAR(255) | NOT NULL | - | Board name |
| description | TEXT | NULL | - | Board description |
| owner_id | UUID | FK → users, NOT NULL | - | Board owner |
| project_id | UUID | NULL | - | Linked project (FK in Phase 2) |
| department_id | UUID | FK → departments, NULL | - | Linked department |
| workflow_template | VARCHAR(50) | NOT NULL | 'basic' | Workflow template code |
| is_private | BOOLEAN | NOT NULL | FALSE | Private board flag |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_boards_department ON boards(department_id);
```

---

### board_columns

**Backend:** `app/modules/boards/models.py`
**Frontend:** `src/modules/boards/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| board_id | UUID | FK → boards, NOT NULL | - | Parent board |
| name | VARCHAR(100) | NOT NULL | - | Column name |
| mapped_status | VARCHAR(50) | FK → task_status_config, NULL | - | Mapped task status (optional) |
| order_index | INTEGER | NOT NULL | 0 | Display order |
| wip_limit | INTEGER | NULL | - | Work-in-progress limit (null = no limit) |
| color | VARCHAR(7) | NOT NULL | '#6B7280' | Hex color code |

**Indexes:**
```sql
CREATE INDEX idx_board_columns_board ON board_columns(board_id);
```

---

### board_tasks

**Backend:** `app/modules/boards/models.py`
**Frontend:** `src/modules/boards/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| board_id | UUID | PK, FK → boards, NOT NULL | - | Board |
| task_id | UUID | PK, FK → tasks, NOT NULL | - | Task (unique per board) |
| column_id | UUID | FK → board_columns, NOT NULL | - | Current column |
| order_index | INTEGER | NOT NULL | 0 | Position in column |
| added_at | TIMESTAMPTZ | NOT NULL | NOW() | When added to board |

**Primary Key:** `(board_id, task_id)`

**Indexes:**
```sql
CREATE INDEX idx_board_tasks_column ON board_tasks(column_id);
CREATE INDEX idx_board_tasks_task ON board_tasks(task_id);
```

---

### board_members

**Backend:** `app/modules/boards/models.py`
**Frontend:** `src/modules/boards/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| board_id | UUID | PK, FK → boards, NOT NULL | - | Board |
| user_id | UUID | PK, FK → users, NOT NULL | - | User |
| role | VARCHAR(20) | NOT NULL | 'member' | Enum: viewer/member/admin |
| added_at | TIMESTAMPTZ | NOT NULL | NOW() | When added |

**Primary Key:** `(board_id, user_id)`

---

## Operational Layer

### notifications

**Backend:** `app/modules/notifications/models.py`
**Frontend:** `src/modules/notifications/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| user_id | UUID | FK → users, NOT NULL | - | Recipient |
| type | VARCHAR(50) | NOT NULL | - | Notification type enum |
| title | VARCHAR(255) | NOT NULL | - | Notification title |
| content | TEXT | NULL | - | Notification content |
| entity_type | VARCHAR(50) | NULL | - | Related entity type (task/comment/etc) |
| entity_id | UUID | NULL | - | Related entity ID |
| is_read | BOOLEAN | NOT NULL | FALSE | Read status |
| priority | VARCHAR(20) | NOT NULL | 'normal' | Enum: low/normal/high/urgent |
| group_key | VARCHAR(255) | NULL | - | For grouping similar notifications |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |

**Indexes:**
```sql
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

### notification_settings

**Backend:** `app/modules/notifications/models.py`
**Frontend:** `src/modules/notifications/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| user_id | UUID | PK, FK → users, NOT NULL | - | User |
| notify_task_assigned | BOOLEAN | NOT NULL | TRUE | Notify when assigned task |
| notify_task_comment | BOOLEAN | NOT NULL | TRUE | Notify on task comment |
| notify_status_changed | BOOLEAN | NOT NULL | TRUE | Notify on status change |
| notify_task_due_soon | BOOLEAN | NOT NULL | TRUE | Notify before due date |
| notify_task_overdue | BOOLEAN | NOT NULL | TRUE | Notify when overdue |
| notify_task_mention | BOOLEAN | NOT NULL | TRUE | Notify when mentioned (@user) |
| email_enabled | BOOLEAN | NOT NULL | FALSE | Send email notifications |
| email_digest | VARCHAR(20) | NOT NULL | 'daily' | Enum: instant/hourly/daily/weekly |
| quiet_hours_enabled | BOOLEAN | NOT NULL | FALSE | Quiet hours enabled |
| quiet_hours_start | TIME | NULL | - | Quiet hours start time |
| quiet_hours_end | TIME | NULL | - | Quiet hours end time |

**Primary Key:** `user_id`

---

### ai_conversations

**Backend:** `app/modules/ai/models.py`
**Frontend:** `src/modules/ai/types.ts`

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Primary key |
| task_id | UUID | FK → tasks, NULL | - | Related task (null for standalone) |
| user_id | UUID | FK → users, NOT NULL | - | User who initiated |
| conversation_type | VARCHAR(50) | NOT NULL | - | Enum: smart_validation/discussion/decomposition |
| messages | JSONB | NOT NULL | '[]' | Array of messages (role, content) |
| is_resolved | BOOLEAN | NOT NULL | FALSE | Conversation resolved |
| result_summary | TEXT | NULL | - | Summary of conversation result |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | Creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | Last update time |

**Indexes:**
```sql
CREATE INDEX idx_ai_conversations_task ON ai_conversations(task_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
```

---

## Enums

### UserRole
```python
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EXECUTOR = "executor"
```

```typescript
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EXECUTOR = 'executor',
}
```

---

### TaskStatus (Configurable via task_status_config)
**Default values:**
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

```typescript
enum TaskStatus {
  DRAFT = 'draft',
  NEW = 'new',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  ON_REVIEW = 'on_review',
  DONE = 'done',
  CANCELLED = 'cancelled',
}
```

---

### TaskPriority
```python
class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
```

```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
```

---

### DocumentType
```python
class DocumentType(str, Enum):
    PROTOCOL = "protocol"
    REPORT = "report"
    ORDER = "order"
    ATTACHMENT = "attachment"
    OTHER = "other"
```

```typescript
enum DocumentType {
  PROTOCOL = 'protocol',
  REPORT = 'report',
  ORDER = 'order',
  ATTACHMENT = 'attachment',
  OTHER = 'other',
}
```

---

### AuthorType
```python
class AuthorType(str, Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"
```

```typescript
enum AuthorType {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}
```

---

### ConversationType
```python
class ConversationType(str, Enum):
    SMART_VALIDATION = "smart_validation"
    DISCUSSION = "discussion"
    DECOMPOSITION = "decomposition"
```

```typescript
enum ConversationType {
  SMART_VALIDATION = 'smart_validation',
  DISCUSSION = 'discussion',
  DECOMPOSITION = 'decomposition',
}
```

---

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

```typescript
enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMMENT = 'task_comment',
  TASK_MENTION = 'task_mention',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  CHECKLIST_ASSIGNED = 'checklist_assigned',
  AI_VALIDATION_COMPLETE = 'ai_validation_complete',
}
```

---

### ParticipationType
```python
class ParticipationType(str, Enum):
    SUBTASK_ASSIGNEE = "subtask_assignee"
    CHECKLIST_ASSIGNEE = "checklist_assignee"
```

```typescript
enum ParticipationType {
  SUBTASK_ASSIGNEE = 'subtask_assignee',
  CHECKLIST_ASSIGNEE = 'checklist_assignee',
}
```

---

### BoardMemberRole
```python
class BoardMemberRole(str, Enum):
    VIEWER = "viewer"
    MEMBER = "member"
    ADMIN = "admin"
```

```typescript
enum BoardMemberRole {
  VIEWER = 'viewer',
  MEMBER = 'member',
  ADMIN = 'admin',
}
```

---

### EmailDigest
```python
class EmailDigest(str, Enum):
    INSTANT = "instant"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
```

```typescript
enum EmailDigest {
  INSTANT = 'instant',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}
```

---

### RejectionReason
```python
class RejectionReason(str, Enum):
    UNCLEAR = "unclear"                          # Задача непонятна
    NO_RESOURCES = "no_resources"                # Нет ресурсов/доступов
    UNREALISTIC_DEADLINE = "unrealistic_deadline" # Срок нереалистичен
    CONFLICT = "conflict"                        # Конфликт с другими задачами
    WRONG_ASSIGNEE = "wrong_assignee"            # Не моя компетенция
    OTHER = "other"                              # Другое
```

```typescript
enum RejectionReason {
  UNCLEAR = 'unclear',
  NO_RESOURCES = 'no_resources',
  UNREALISTIC_DEADLINE = 'unrealistic_deadline',
  CONFLICT = 'conflict',
  WRONG_ASSIGNEE = 'wrong_assignee',
  OTHER = 'other',
}
```

---

## 🔄 Update Protocol

**При изменении схемы:**
1. ✅ Обновить этот файл ПЕРВЫМ
2. ✅ Создать Alembic миграцию
3. ✅ Обновить SQLAlchemy модель
4. ✅ Обновить Pydantic схемы
5. ✅ Обновить TypeScript типы
6. ✅ Обновить тесты

**Контрольный чек:**
- [ ] SCHEMA_REGISTRY.md обновлен
- [ ] Migration создана и проверена
- [ ] Backend models синхронизированы
- [ ] Frontend types синхронизированы
- [ ] API docs обновлены (если нужно)
