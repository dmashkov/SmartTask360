# SmartTask360 — Development Roadmap

**Планирование сессий разработки**

**Last Updated:** 2026-01-06 (Session 9: @Mentions & Comments)

---

## 📊 Overview

| Sprint | Duration | Sessions | Status |
|--------|----------|----------|--------|
| Sprint 0: Setup | 2 days | 2 sessions | ✅ Completed |
| Sprint 1: Core Backend | 1 week | 5 sessions | ✅ Completed |
| Sprint 2: Tasks Extended | 1 week | 7 sessions | ✅ Completed |
| Sprint 3: AI Integration | 1 week | 4 sessions | ✅ Completed |
| Sprint 4: Boards & Notifications | 1 week | 3-4 sessions | ✅ Completed |
| Sprint 5: Frontend Core | 1 week | 4-5 sessions | ✅ Completed |
| Sprint 6: Frontend Tasks & Kanban | 2 weeks | 10+ sessions | ✅ Completed + Enhanced |
| Sprint 7: Document Management | 1 day | 1 session | ✅ Completed |
| Sprint 8: Projects Foundation | 2 days | 2 sessions | ✅ Completed |
| Sprint 9: @Mentions & Comments | 1 day | 1 session | ✅ Completed |
| Sprint 10: Projects Full | 3 days | 2-3 sessions | ⏳ Next |
| Sprint 11: Gantt Chart | 2 days | 2 sessions | ⏳ Planned |
| Sprint 12: Polish & Testing | 1 week | 3-4 sessions | ⏳ Planned |

**Total MVP:** ~7-8 weeks, ~45-52 sessions
**Completed:** ~41 sessions (Sprint 0-9)
**Next:** Sprint 10 — Projects Full Development

### Sprint 9 Summary (2026-01-06) ✅
**@Mentions, Reactions & Read Status**
- ✅ Backend: mentioned_user_ids field (ARRAY UUID) on Comment model
- ✅ Backend: comment_read_status table for per-comment tracking
- ✅ Backend: Mention parsing with regex (`@Имя Фамилия`)
- ✅ Backend: User search endpoint (GET /users/search?q=)
- ✅ Backend: Reactions CRUD (toggle, remove, get summary)
- ✅ Backend: Endpoints: mark-read, unread-count
- ✅ Frontend: MentionInput with autocomplete dropdown
- ✅ Frontend: Linkify with @mention highlighting (blue background)
- ✅ Frontend: EmojiPicker and CommentReactions components
- ✅ Frontend: useMarkCommentsAsRead hook (auto-mark on view)
- ✅ Frontend: Kanban card indicators (💬 count + 🔵 unread + @ mentions)
- ✅ 3 new migrations (reactions, comment_id, mentions+read_status)

**Key Features:**
- @Mention format: `@Имя Фамилия` (Cyrillic + Latin)
- Reactions: 👍 ❤️ 😂 😮 😢 🎉
- Notifications created on @mention
- Board cache invalidated when comments marked read

### Sprint 7-8 Summary (2026-01-06) ✅
**Document Attachments in Comments**
- ✅ Backend: Added comment_id field to documents table with migration
- ✅ Backend: RFC 5987 encoding for Unicode filenames
- ✅ Frontend: File upload UI in CommentsSection
- ✅ Frontend: DocumentsSection component with type-based grouping
- ✅ Frontend: Bidirectional navigation via CustomEvent API
- ✅ Frontend: Download via backend API (solved MinIO hostname issue)
- ✅ Real-time cache invalidation
- ✅ Event-based tab switching with smooth scrolling & highlighting

**Key Lessons Learned:**
- MinIO presigned URLs with Docker hostname require backend proxy
- RFC 5987 encoding needed for non-ASCII filenames
- CustomEvent API excellent for cross-component communication

### Sprint 6 Enhancements (2026-01-04/05)
- ✅ Task hierarchy visualization (expand/collapse, lazy loading)
- ✅ Task urgency indicators (overdue/due today/due soon)
- ✅ UI refinements (subtasks inline, TaskDetailTabs, completion result)

---

## Sprint 0: Setup & Documentation

**Goal:** Подготовить инфраструктуру, документацию, запустить окружение

### ✅ Session 0.1 — Meta-Documentation (Jan 2, 2026)
**Duration:** 1-2h
**Status:** ✅ Completed

**Goal:** Создать файлы для управления разработкой

**Tasks:**
- [x] Create CONTEXT.md
- [x] Create ROADMAP.md
- [x] Create docs/SCHEMA_REGISTRY.md
- [x] Create docs/LESSONS_LEARNED.md

**Result:** Все мета-файлы созданы

---

### ✅ Session 0.2 — Infrastructure Setup (Jan 2, 2026)
**Duration:** 2-3h
**Status:** ✅ Completed

**Goal:** Запустить Docker окружение, создать первые миграции

**Tasks:**
- [x] Review and test docker-compose.yml
- [x] Create docker/init-db.sql (enable ltree + pg_trgm extensions)
- [x] Test `make up` and verify all services
- [x] Create first migration (enable extensions)
- [x] Test database connection from backend
- [x] Test MinIO connection and create bucket
- [x] Add Adminer for database management

**Result:**
- Docker окружение работает (PostgreSQL, MinIO, Backend, Frontend, Adminer)
- PostgreSQL с ltree и pg_trgm extensions
- MinIO bucket 'documents' создан
- Backend подключается к БД
- Adminer доступен на порту 8080

---

## Sprint 1: Core Backend

**Goal:** Реализовать базовые модули (Security, Users, Departments, Auth)

### ✅ Session 1.1 — Security & Core Types (Jan 2, 2026)
**Duration:** 2h
**Status:** ✅ Completed

**Goal:** Implement security layer и общие типы

**Tasks:**
- [x] Create app/core/security.py (JWT, password hashing with bcrypt)
- [x] Create app/core/types.py (UserRole enum)
- [x] Create users/models.py (User model)
- [x] Create users/schemas.py (Pydantic validation)
- [x] Create migration for users table
- [x] Write security tests
- [x] Create admin user

**Result:**
- Security infrastructure работает (JWT + bcrypt)
- User model создана с department_id
- Migration b9234699044d применена
- Admin user: admin@smarttask360.com
- Fixed bcrypt compatibility issue (pinned <5.0.0)

**Files created:**
- `app/core/security.py`
- `app/core/dependencies.py`
- `app/core/types.py`
- `tests/test_security.py`

---

### ✅ Session 1.2 — Users CRUD API (Jan 2, 2026)
**Duration:** 2h
**Status:** ✅ Completed

**Goal:** Implement Users CRUD with JWT protection

**Tasks:**
- [x] Create app/modules/users/service.py (UserService with CRUD)
- [x] Create app/modules/users/router.py (REST endpoints)
- [x] Update main.py (include users router)
- [x] Test all CRUD endpoints
- [x] Fix bcrypt rebuild issue

**Result:**
- Users CRUD fully working with JWT authentication
- All endpoints protected: GET, POST, PATCH, DELETE
- Tests pass successfully

**Files created:**
- `app/modules/users/service.py`
- `app/modules/users/router.py`
- `app/core/dependencies.py` (get_db)
- `tests/test_users_api.py`

---

### ✅ Session 1.3 — Auth Module (Jan 2, 2026)
**Duration:** 1.5h
**Status:** ✅ Completed

**Goal:** Implement authentication (login, refresh token)

**Tasks:**
- [x] Create auth/schemas.py (LoginRequest, TokenResponse, RefreshTokenRequest)
- [x] Create auth/service.py (AuthService)
- [x] Create auth/router.py (POST /auth/login, /auth/refresh)
- [x] Update core/dependencies.py (get_current_user with JWT)
- [x] Protect all users endpoints
- [x] Test auth flows

**Result:**
- Login & refresh token работают
- JWT middleware для защиты endpoints
- All auth tests pass

**Files created:**
- `app/modules/auth/schemas.py`
- `app/modules/auth/service.py`
- `app/modules/auth/router.py`
- `tests/test_auth_api.py`

---

### ✅ Session 1.4 — Departments Module (Jan 2, 2026)
**Duration:** 2.5h
**Status:** ✅ Completed

**Goal:** Implement Departments with ltree hierarchy

**Tasks:**
- [x] Create departments module (models with custom LTREE type)
- [x] Create service with hierarchy methods (children, descendants, ancestors)
- [x] Create router with full CRUD + hierarchy endpoints
- [x] Create migration 288f745ed472
- [x] Test 3-level hierarchy
- [x] Fix ltree compatibility (UUID dashes → underscores)

**Result:**
- Departments with ltree hierarchy fully working
- Custom LTREE SQLAlchemy type implemented
- Hierarchy queries: get_children, get_descendants, get_ancestors
- All tests pass with 3-level tree structure

**Files created:**
- `app/modules/departments/models.py`
- `app/modules/departments/schemas.py`
- `app/modules/departments/service.py`
- `app/modules/departments/router.py`
- `alembic/versions/288f745ed472_create_departments_table.py`
- `tests/test_departments_api.py`

---

### ✅ Session 1.5 — Tasks Module Foundation (Jan 3, 2026)
**Duration:** 3h
**Status:** ✅ Completed

**Goal:** Implement core Tasks module with hierarchy, status workflow, and acceptance flow

**Tasks:**
- [x] Create Task model with ltree hierarchy (path, depth)
- [x] Add TaskPriority, TaskStatus, RejectionReason enums to core/types.py
- [x] Create comprehensive schemas (TaskCreate, TaskUpdate, TaskResponse, TaskAccept, TaskReject, TaskStatusChange)
- [x] Create TaskService with full CRUD + hierarchy support
- [x] Implement status change workflow with timestamps (started_at, completed_at)
- [x] Implement task acceptance/rejection flow
- [x] Create router with 16 endpoints (CRUD + hierarchy + status + acceptance)
- [x] Create migration d10f89879024
- [x] Register router in main.py
- [x] Write comprehensive test suite (13 scenarios)

**Result:**
- Tasks module fully functional with ltree hierarchy
- Status workflow with automatic timestamp tracking
- Task acceptance flow (accept/reject with reasons)
- All 13 test scenarios pass:
  - 3-level hierarchy creation and queries
  - Children/descendants/ancestors queries
  - Status changes with timestamps
  - Task assignment and acceptance
  - Task rejection with reasons
  - Task movement in hierarchy
  - Soft delete
  - Filtering (my tasks, created tasks, root tasks)

**Files created:**
- `app/modules/tasks/__init__.py`
- `app/modules/tasks/models.py` (Task model with 25+ fields)
- `app/modules/tasks/schemas.py` (6 schemas)
- `app/modules/tasks/service.py` (TaskService with 20+ methods)
- `app/modules/tasks/router.py` (16 endpoints)
- `app/core/types.py` (added TaskPriority, TaskStatus, RejectionReason)
- `alembic/versions/d10f89879024_create_tasks_table.py`
- `tests/test_tasks_api.py`

**Technical highlights:**
- LTREE for unlimited task nesting with efficient queries
- UUID → LTREE path conversion (dashes to underscores)
- Automatic status transition on assignment (NEW → ASSIGNED)
- Automatic status transition on acceptance (ASSIGNED → IN_PROGRESS)
- Timestamp tracking (started_at on IN_PROGRESS, completed_at on DONE)
- Soft delete with is_deleted flag
- Rich filtering capabilities (by assignee, creator, status, hierarchy level)

---

## Sprint 2: Tasks Extended Backend

**Goal:** Extend Tasks module with tags, workflow, comments, checklists
- [ ] Implement /logout endpoint
- [ ] Write tests for full auth flow

**Blockers:** Session 1.3

**Expected Result:**
- Full auth flow works
- Can register, login, refresh, logout
- Tokens работают

**Files to create:**
- `app/modules/auth/__init__.py`
- `app/modules/auth/schemas.py`
- `app/modules/auth/service.py`
- `app/modules/auth/router.py`
- `tests/modules/test_auth.py`

---

## Sprint 2: Tasks Backend

**Goal:** Реализовать Tasks, Checklists, Comments, Tags, Documents, Workflow

### Session 2.1 — Tags Module
**Duration:** 1-2h
**Status:** ⏳ Planned

**Goal:** Simple Tags CRUD

**Tasks:**
- [ ] Create tags module
- [ ] Migration
- [ ] Tests

**Blockers:** Session 1.4

**Files to create:**
- `app/modules/tags/*`
- Migration

---

### Session 2.2 — Workflow Module (Part 1: Config)
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Task status configuration

**Tasks:**
- [ ] Create workflow models (TaskStatusConfig, TaskStatusTransitions)
- [ ] Create schemas and service
- [ ] Create router for CRUD
- [ ] Migration with seed data (default statuses)
- [ ] Tests

**Blockers:** Session 2.1

**Files to create:**
- `app/modules/workflow/*`
- Migration with seed data

---

### Session 2.3 — Workflow Module (Part 2: Templates)
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Workflow templates (basic, agile, approval)

**Tasks:**
- [ ] Create WorkflowTemplate, WorkflowTemplateSteps models
- [ ] Implement template CRUD
- [ ] Seed system templates (basic, agile, approval)
- [ ] Tests

**Blockers:** Session 2.2

---

### Session 2.4 — Documents Module
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Document upload/download, text extraction

**Tasks:**
- [ ] Create documents models
- [ ] Implement upload (MinIO integration)
- [ ] Implement download
- [ ] Create extractors (PDF, DOCX, TXT)
- [ ] Migration
- [ ] Tests

**Blockers:** Session 2.3

**Files to create:**
- `app/modules/documents/*`
- `app/modules/documents/extractors/__init__.py`
- `app/modules/documents/extractors/pdf.py`
- `app/modules/documents/extractors/docx.py`
- `app/modules/documents/extractors/txt.py`

---

### Session 2.5 — Tasks Module (Part 1: Core)
**Duration:** 3-4h
**Status:** ⏳ Planned

**Goal:** Task model with LTREE hierarchy

**Tasks:**
- [ ] Create Task model with all fields
- [ ] Create TaskHistory, TaskWatcher, TaskParticipant models
- [ ] Create task_tags association table
- [ ] Create schemas (TaskCreate, TaskUpdate, TaskResponse)
- [ ] Create utils for LTREE path management
- [ ] Migration
- [ ] Basic tests

**Blockers:** Session 2.4

**Files to create:**
- `app/modules/tasks/models.py`
- `app/modules/tasks/schemas.py`
- `app/modules/tasks/utils.py`
- Migration

---

### Session 2.6 — Tasks Module (Part 2: Service & CRUD)
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** TaskService with CRUD operations

**Tasks:**
- [ ] Implement TaskService.create()
- [ ] Implement TaskService.get_by_id()
- [ ] Implement TaskService.update()
- [ ] Implement TaskService.delete() (soft delete)
- [ ] Implement TaskService.get_list() with filters
- [ ] Implement hierarchy methods (get_children, get_descendants, get_ancestors)
- [ ] Tests

**Blockers:** Session 2.5

**Files to create:**
- `app/modules/tasks/service.py`

---

### Session 2.7 — Tasks Module (Part 3: Router & Endpoints)
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Task API endpoints

**Tasks:**
- [ ] Create router with CRUD endpoints
- [ ] GET /tasks (list with pagination, filters)
- [ ] POST /tasks (create)
- [ ] GET /tasks/{id}
- [ ] PATCH /tasks/{id}
- [ ] DELETE /tasks/{id}
- [ ] GET /tasks/{id}/children
- [ ] Tests

**Blockers:** Session 2.6

**Files to create:**
- `app/modules/tasks/router.py`

---

### Session 2.8 — Tasks Module (Part 4: Status & Tags)
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Status changes, tag management

**Tasks:**
- [ ] Implement TaskService.change_status() with WorkflowService
- [ ] Implement TaskService.get_available_transitions()
- [ ] Implement tag operations (add_tag, remove_tag)
- [ ] Implement watchers operations
- [ ] POST /tasks/{id}/status endpoint
- [ ] POST /tasks/{id}/tags endpoint
- [ ] Tests

**Blockers:** Session 2.7

---

### Session 2.9 — Tasks Module (Part 5: Acceptance Flow)
**Duration:** 2-3h
**Status:** ⏳ Planned

**Goal:** Accept/Reject task flow

**Tasks:**
- [ ] Implement TaskService.accept_task()
- [ ] Implement TaskService.reject_task()
- [ ] Add acceptance_deadline calculation
- [ ] POST /tasks/{id}/accept endpoint
- [ ] POST /tasks/{id}/reject endpoint
- [ ] Integration with notifications (stub for now)
- [ ] Tests

**Blockers:** Session 2.8

---

### Session 2.10 — Checklists Module
**Duration:** 2-3h
**Status:** ⏳ Planned

**Goal:** Checklists with nested items (LTREE)

**Tasks:**
- [ ] Create Checklist, ChecklistItem models
- [ ] Create schemas and service
- [ ] Implement nested items with LTREE
- [ ] Implement toggle, reorder operations
- [ ] Create router
- [ ] Integration with TaskService (participants)
- [ ] Migration
- [ ] Tests

**Blockers:** Session 2.9

**Files to create:**
- `app/modules/checklists/*`
- Migration

---

### Session 2.11 — Comments Module
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Comments with attachments and mentions

**Tasks:**
- [ ] Create Comment, CommentAttachment models
- [ ] Create schemas and service
- [ ] Implement parse_mentions utility
- [ ] Create router
- [ ] Migration
- [ ] Tests

**Blockers:** Session 2.10

**Files to create:**
- `app/modules/comments/*`
- `app/modules/comments/utils.py` (parse_mentions)
- Migration

---

## Sprint 3: AI Integration ✅ COMPLETED

**Goal:** AI-powered SMART validation, dialogs, comments
**Status:** ✅ Завершено (Sessions 1C.1-1C.4)
**Summary:** [docs/PHASE_1C_COMPLETE.md](docs/PHASE_1C_COMPLETE.md)

### ✅ Session 1C.1 — AI Module Setup (Jan 3, 2026)
**Duration:** 4h
**Status:** ✅ Completed

**Goal:** AI infrastructure with Anthropic API

**Tasks:**
- [x] Create AIConversation, AIMessage models with JSONB
- [x] Create comprehensive schemas (all conversation types)
- [x] Create AIClient with retry logic and exponential backoff
- [x] Create AIService with conversation management
- [x] Create router with conversation endpoints
- [x] Configure real Anthropic API key
- [x] Create migration a1b2c3d4e5f6
- [x] Write tests (12+ scenarios)

**Result:**
- AI module infrastructure fully operational
- Real Anthropic API integrated (claude-sonnet-4-20250514)
- Retry logic working (3 attempts, 1s/2s/4s delays)
- SMART validation endpoint functional
- All tests passing with real API

**Files created:**
- `app/modules/ai/models.py` (AIConversation, AIMessage)
- `app/modules/ai/schemas.py` (10+ schemas)
- `app/modules/ai/client.py` (AIClient with AsyncAnthropic)
- `app/modules/ai/service.py` (AIService)
- `app/modules/ai/router.py` (conversation management)
- `alembic/versions/a1b2c3d4e5f6_create_ai_tables.py`
- `tests/test_ai_api.py`

---

### ✅ Session 1C.2 — SMART Validation Enhancement (Jan 3, 2026)
**Duration:** 6h
**Status:** ✅ Completed

**Goal:** Enhanced SMART validation with auto-save to tasks

**Tasks:**
- [x] Create prompts.py with detailed examples
- [x] Build enhanced SMART prompt (high/low score examples)
- [x] Add SMART fields to Task model (smart_score, smart_is_valid, smart_validated_at)
- [x] Implement auto-save integration with TaskService
- [x] Create /ai/validate-smart endpoint
- [x] Create /ai/tasks/{id}/apply-smart-suggestions endpoint
- [x] Create /ai/tasks/{id}/smart-validations endpoint
- [x] Create migration b2c3d4e5f6a7
- [x] Write tests (8 scenarios)

**Result:**
- Detailed SMART prompts with scoring guidelines (0.9-1.0 excellent to 0.0-0.2 missing)
- Auto-save to tasks (smart_score stored in JSONB)
- Apply suggestions updates task description
- Validation history accessible
- All tests passing

**Files created:**
- `app/modules/ai/prompts.py` (build_smart_validation_prompt)
- Migration: `b2c3d4e5f6a7_add_smart_fields_to_tasks.py`
- `tests/test_smart_enhanced_api.py`

**Files modified:**
- `app/modules/tasks/models.py` (added 3 SMART fields)
- `app/modules/tasks/schemas.py` (extended TaskResponse)
- `app/modules/tasks/service.py` (added update_smart_score)
- `app/modules/ai/service.py` (enhanced validate_task_smart)
- `app/modules/ai/router.py` (added 2 endpoints)

---

### ✅ Session 1C.3 — AI Task Dialogs (Jan 3, 2026)
**Duration:** 5h
**Status:** ✅ Completed

**Goal:** Interactive multi-turn AI dialogs for task clarification

**Tasks:**
- [x] Build task dialog system prompt
- [x] Implement start_task_dialog (4 types: clarify, decompose, estimate, general)
- [x] Implement complete_task_dialog with summary extraction
- [x] Implement context preservation across messages
- [x] Create /ai/tasks/{id}/start-dialog endpoint
- [x] Create /ai/conversations/{id}/complete-dialog endpoint
- [x] Enhance /ai/conversations/{id}/messages with context
- [x] Write tests (15 scenarios)

**Result:**
- Multi-turn conversations working (6+ message exchanges)
- Context preserved (task details in conversation.context)
- Dialog types: clarify, decompose, estimate, general
- Summary generation with key points and recommendations
- Optional apply changes to task
- All tests passing

**Files created:**
- `tests/test_ai_dialogs.py` (15 test scenarios)

**Files modified:**
- `app/modules/ai/schemas.py` (added 4 dialog schemas)
- `app/modules/ai/service.py` (added start_task_dialog, complete_task_dialog)
- `app/modules/ai/router.py` (added 2 dialog endpoints)
- `app/modules/ai/prompts.py` (added build_task_dialog_prompt)

---

### ✅ Session 1C.4 — AI Comments & Analysis (Jan 3, 2026)
**Duration:** 4h
**Status:** ✅ Completed

**Goal:** Risk analysis, comment generation, progress reviews

**Tasks:**
- [x] Create risk analysis prompts (4 categories: Technical, Resource, Schedule, Quality)
- [x] Create comment generation prompts (5 types: insight, risk, blocker, suggestion, progress)
- [x] Create progress review prompts with subtask analysis
- [x] Implement analyze_task_risks
- [x] Implement generate_ai_comment
- [x] Implement review_task_progress
- [x] Create /ai/analyze-risks endpoint
- [x] Create /ai/generate-comment endpoint
- [x] Create /ai/review-progress endpoint
- [x] Create /ai/tasks/{id}/auto-comment endpoint (generate + create comment)
- [x] Write tests (13 scenarios)

**Result:**
- Risk analysis identifies 11 risks with severity/probability/mitigation
- 5 comment types working (insight, risk, blocker, suggestion, progress)
- Progress review with going_well/concerns/next_steps
- Auto-comment creates actual Comment records
- All tests passing

**Files created:**
- `tests/test_ai_comments.py` (13 test scenarios)

**Files modified:**
- `app/modules/ai/schemas.py` (added 8 schemas for risks/comments/progress)
- `app/modules/ai/prompts.py` (added 3 prompt builders)
- `app/modules/ai/service.py` (added 3 methods)
- `app/modules/ai/router.py` (added 4 endpoints)

---

## Sprint 4: Boards & Notifications

**Goal:** Kanban boards и система уведомлений

### Session 4.1 — Boards Module (Part 1: Models & Basic CRUD)
**Duration:** 2-3h
**Status:** ⏳ Planned

**Goal:** Board, Column, BoardTask models

**Tasks:**
- [ ] Create Board, BoardColumn, BoardTask, BoardMember models
- [ ] Create schemas and basic service
- [ ] Create router for board CRUD
- [ ] Migration
- [ ] Tests

**Blockers:** Session 3.4

**Files to create:**
- `app/modules/boards/*`
- Migration

---

### Session 4.2 — Boards Module (Part 2: Drag-Drop & Status Sync)
**Duration:** 2-3h
**Status:** ⏳ Planned

**Goal:** move_task с WIP limits и status sync

**Tasks:**
- [ ] Implement BoardService.move_task()
- [ ] Implement WIP limit check
- [ ] Implement status sync (if column has mapped_status)
- [ ] POST /boards/{id}/tasks/move endpoint
- [ ] Tests

**Blockers:** Session 4.1

---

### Session 4.3 — Notifications Module
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Notification system

**Tasks:**
- [ ] Create Notification, NotificationSettings models
- [ ] Create schemas and service
- [ ] Implement NotificationService.send(), send_bulk()
- [ ] Implement settings CRUD
- [ ] Create router
- [ ] Integration points (TaskService, CommentService, etc.)
- [ ] Migration
- [ ] Tests

**Blockers:** Session 4.2

**Files to create:**
- `app/modules/notifications/*`
- Migration

---

## Sprint 5: Frontend Core

**Goal:** Базовая структура frontend, UI компоненты, Auth

### Session 5.1 — Frontend Structure & Base Components
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Setup frontend structure, create base UI components

**Tasks:**
- [ ] Create directory structure (app/, shared/, modules/, pages/)
- [ ] Create shared/ui components (Button, Input, Select, etc.)
- [ ] Configure Tailwind color scheme
- [ ] Create shared/api/client.ts (axios instance)
- [ ] Create shared/lib/utils.ts
- [ ] Tests (optional for MVP)

**Blockers:** Session 4.3 (backend ready)

**Files to create:**
- `src/app/`, `src/shared/`, `src/modules/`, `src/pages/`
- `src/shared/ui/Button.tsx`
- `src/shared/ui/Input.tsx`
- `src/shared/ui/Select.tsx`
- `src/shared/ui/Modal.tsx`
- `src/shared/ui/Spinner.tsx`
- ... (see TODO.md Phase 2A.1)

---

### Session 5.2 — Auth Module (Frontend)
**Duration:** 2-3h
**Status:** ⏳ Planned

**Goal:** Auth UI и flow

**Tasks:**
- [ ] Create auth module (types, api, hooks)
- [ ] Create AuthContext
- [ ] Create LoginForm, RegisterForm
- [ ] Create LoginPage, RegisterPage
- [ ] Create ProtectedRoute
- [ ] Configure axios interceptors (tokens)
- [ ] Update Router

**Blockers:** Session 5.1

**Files to create:**
- `src/modules/auth/types.ts`
- `src/modules/auth/api.ts`
- `src/modules/auth/hooks/useAuth.ts`
- `src/modules/auth/components/LoginForm.tsx`
- `src/modules/auth/components/RegisterForm.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`

---

### Session 5.3 — Layout & Navigation
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Main layout с навигацией

**Tasks:**
- [ ] Create MainLayout
- [ ] Create Sidebar with navigation
- [ ] Create Header with UserMenu
- [ ] Add notifications badge (stub)
- [ ] Make responsive
- [ ] Update Router with layout

**Blockers:** Session 5.2

**Files to create:**
- `src/shared/layout/MainLayout.tsx`
- `src/shared/layout/Sidebar.tsx`
- `src/shared/layout/Header.tsx`
- `src/shared/layout/UserMenu.tsx`

---

### Session 5.4 — React Query Setup & API Integration
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** QueryClient, base hooks, API patterns

**Tasks:**
- [ ] Setup QueryClient provider
- [ ] Create base API response types
- [ ] Create example hooks (useUsers)
- [ ] Error handling patterns
- [ ] Loading states patterns

**Blockers:** Session 5.3

---

## Sprint 6: Frontend Tasks & Kanban

**Goal:** Task management UI, Kanban board

### Session 6.1 — Tasks Module (Frontend: API & Types)
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Types и API functions для задач

**Tasks:**
- [ ] Create src/modules/tasks/types.ts (from SCHEMA_REGISTRY)
- [ ] Create src/modules/tasks/api.ts (all methods)
- [ ] Create hooks (useTasks, useTask, useTaskMutations)

**Blockers:** Session 5.4

---

### Session 6.2 — Task List Page
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Task list с фильтрами

**Tasks:**
- [ ] Create TaskListFilters
- [ ] Create TaskListTable
- [ ] Create TaskRow
- [ ] Create TaskQuickActions
- [ ] Create TasksPage
- [ ] Implement filtering, sorting, pagination

**Blockers:** Session 6.1

---

### Session 6.3 — Task Create/Edit Modal
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Task form с SMART validation checkbox

**Tasks:**
- [ ] Create TaskFormModal
- [ ] Create TaskForm with react-hook-form + zod
- [ ] Create UserSelect, TagSelect, DatePicker
- [ ] Add SMART validation checkbox
- [ ] Integration с AI validation

**Blockers:** Session 6.2

---

### Session 6.4 — Task Detail Page (Part 1)
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Task header, info, description

**Tasks:**
- [ ] Create TaskDetailPage
- [ ] Create TaskHeader
- [ ] Create TaskInfo
- [ ] Create TaskDescription
- [ ] Status change UI

**Blockers:** Session 6.3

---

### Session 6.5 — Task Detail Page (Part 2)
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Subtasks, checklists, comments

**Tasks:**
- [ ] Create TaskSubtasks
- [ ] Create TaskChecklists, ChecklistItem
- [ ] Create TaskComments, CommentItem, CommentForm

**Blockers:** Session 6.4

---

### Session 6.6 — Kanban Board (Part 1: Layout)
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Kanban layout без drag-drop

**Tasks:**
- [ ] Create boards module (types, api, hooks)
- [ ] Create KanbanBoard
- [ ] Create KanbanColumn
- [ ] Create KanbanCard
- [ ] Create KanbanFilters
- [ ] Static rendering

**Blockers:** Session 6.5

---

### Session 6.7 — Kanban Board (Part 2: Drag-Drop)
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** Drag-and-drop с @dnd-kit

**Tasks:**
- [ ] Setup @dnd-kit
- [ ] Implement drag-and-drop
- [ ] Implement move_task API call
- [ ] WIP limit warning
- [ ] Status sync indicator

**Blockers:** Session 6.6

---

### Session 6.8 — Documents UI
**Duration:** 2-3h
**Status:** ⏳ Planned

**Goal:** Document upload/view

**Tasks:**
- [ ] Create documents module
- [ ] Create DocumentList, DocumentUploadModal
- [ ] Create DocumentViewer
- [ ] Create DocumentsPage
- [ ] Text selection for task creation (bonus)

**Blockers:** Session 6.7

---

### ✅ Session 6.9 — Task Hierarchy & Urgency (2026-01-04)
**Duration:** 6h
**Status:** ✅ Completed
**Date:** 2026-01-04

**Goal:** Visualize task hierarchies and add urgency indicators

**Tasks:**
- [x] Create TaskExpandButton component (expand/collapse with chevron)
- [x] Create ParentTaskLink component (navigation to parent)
- [x] Create ChildTaskNode component (recursive tree node)
- [x] Create ChildTasksTree container component
- [x] Add useTaskChildren hook (lazy loading via GET /tasks?parent_id=...)
- [x] Integrate hierarchy into TaskRow (expand button + indent)
- [x] Fix duplicate children rendering (filter root tasks only)
- [x] Restructure TaskDetailPage:
  - Remove "Подзадачи" tab, make subtasks inline
  - Position subtasks between Description and Status Actions
  - Make compact with reduced spacing
- [x] Add placeholder tabs: Documents, Comments, History
- [x] Add completion result placeholder (for done tasks)
- [x] Create getTaskUrgency() utility function:
  - Calculate urgency: overdue 🔴, due_today 🟠, due_soon 🟡 (1-3 days)
  - Handle completed tasks (show if late)
  - Russian pluralization (1 день, 2 дня, 5 дней, недели)
  - Week-based display for long overdue
- [x] Add urgency to TaskRow (icon next to due date)
- [x] Add urgency to TaskDetailPage (badge in header + icon in Details)
- [x] Add urgency to ChildTaskNode (icon in tree)

**Result:**
- Task hierarchy fully functional with lazy loading
- Subtasks render once (root tasks filter working)
- TaskDetailPage compact and logical
- Urgency indicators in all views with tooltips
- All TypeScript compilation passing

**Files created:**
- `frontend/src/modules/tasks/components/TaskExpandButton.tsx`
- `frontend/src/modules/tasks/components/ParentTaskLink.tsx`
- `frontend/src/modules/tasks/components/ChildTaskNode.tsx`
- `frontend/src/modules/tasks/components/ChildTasksTree.tsx`

**Files modified:**
- `frontend/src/shared/lib/utils.ts` (added getTaskUrgency, TaskUrgency types)
- `frontend/src/modules/tasks/components/TaskRow.tsx` (expand, urgency)
- `frontend/src/modules/tasks/components/TaskList.tsx` (root tasks filter)
- `frontend/src/pages/TaskDetailPage.tsx` (tabs, subtasks, urgency)
- `frontend/src/modules/tasks/hooks/useTasks.ts` (added useTaskChildren)

---

## Sprint 6.5: Projects Module

**Goal:** Полноценный модуль проектов для привязки задач и досок

### Session 6.5.1 — Backend Projects (Models, Service, Router)
**Duration:** 4-5h
**Status:** ⏳ Planned

**Goal:** Создать backend модуль проектов

**Tasks:**
- [ ] Create Project model:
  - id, name, code (unique), description
  - status (planning, active, on_hold, completed, archived)
  - owner_id, department_id
  - start_date, due_date, completed_at
  - settings (JSONB for custom fields)
  - is_deleted, created_at, updated_at
- [ ] Create ProjectMember model (project_id, user_id, role)
- [ ] Create ProjectStatus, ProjectMemberRole enums
- [ ] Create schemas (ProjectCreate, ProjectUpdate, ProjectResponse, ProjectWithStats)
- [ ] Create ProjectService:
  - CRUD operations
  - get_project_tasks, get_project_boards
  - get_project_stats (% completion, task counts by status)
  - Member management (add, remove, update role)
- [ ] Create router with 10+ endpoints
- [ ] Create migration with FK constraints
- [ ] Register in main.py
- [ ] Write tests (15+ scenarios)

**Files to create:**
- `backend/app/modules/projects/__init__.py`
- `backend/app/modules/projects/models.py`
- `backend/app/modules/projects/schemas.py`
- `backend/app/modules/projects/service.py`
- `backend/app/modules/projects/router.py`
- `alembic/versions/*_create_projects_table.py`
- `tests/test_projects_api.py`

---

### Session 6.5.2 — Backend Integration + Frontend Projects
**Duration:** 4-5h
**Status:** ⏳ Planned

**Goal:** Интеграция с tasks/boards + frontend модуль

**Tasks:**
- [ ] Update TaskService.get_all() — add project_id filter
- [ ] Update GET /tasks — add project_id query param
- [ ] Update BoardService — add project filter
- [ ] Create frontend modules/projects/:
  - types.ts
  - api.ts
  - hooks/ (useProjects, useProject, useProjectMutations)
- [ ] Create components:
  - ProjectSelect (for forms)
  - ProjectCard (for list)
  - ProjectBadge (inline indicator)
- [ ] Create pages:
  - ProjectsPage (list + create)
  - ProjectDetailPage (info, stats, tasks, boards, members)
- [ ] Integration:
  - Add ProjectSelect to TaskFormModal
  - Add project_id filter to TaskFilters
  - Add "Проекты" to Sidebar
  - Update Router

**Files to create:**
- `frontend/src/modules/projects/types.ts`
- `frontend/src/modules/projects/api.ts`
- `frontend/src/modules/projects/hooks/*.ts`
- `frontend/src/modules/projects/components/*.tsx`
- `frontend/src/pages/projects/*.tsx`

---

## Sprint 6.6: Gantt Chart

**Goal:** Gantt-диаграмма как третий режим просмотра задач проекта

### Session 6.6.1 — Backend Dependencies + Gantt Component
**Duration:** 4-5h
**Status:** ⏳ Planned

**Goal:** Зависимости задач + базовый Gantt компонент

**Tasks:**
- [ ] Create TaskDependency model:
  - predecessor_id, successor_id
  - type: FS (finish-to-start), SS, FF, SF
- [ ] Create schemas and service methods
- [ ] Add endpoints: POST/DELETE /tasks/{id}/dependencies
- [ ] Create migration
- [ ] Install frappe-gantt (lightweight, MIT license)
- [ ] Create GanttChart wrapper component
- [ ] Create GanttBar with drag handles
- [ ] Implement date editing via drag

**Files to create:**
- `backend/app/modules/tasks/dependencies.py` (or extend models.py)
- `alembic/versions/*_create_task_dependencies.py`
- `frontend/src/modules/gantt/GanttChart.tsx`
- `frontend/src/modules/gantt/GanttBar.tsx`

---

### Session 6.6.2 — Gantt Integration + View Switcher
**Duration:** 3-4h
**Status:** ⏳ Planned

**Goal:** Интеграция Gantt в ProjectDetailPage

**Tasks:**
- [ ] Create ViewSwitcher component (Таблица / Kanban / Gantt)
- [ ] Add Gantt tab to ProjectDetailPage
- [ ] Implement dependency arrows visualization
- [ ] Implement zoom controls (day/week/month)
- [ ] Implement task click → TaskDetailPage
- [ ] Sync changes across all three views
- [ ] Add loading and empty states

**Result:**
```
┌─────────────────────────────────────────────────────────────┐
│  Project: Website Redesign                                  │
│  ┌──────────┬──────────┬──────────┐                        │
│  │ Таблица  │  Kanban  │  Gantt   │  ← ViewSwitcher        │
│  └──────────┴──────────┴──────────┘                        │
│                                                             │
│  [Gantt Chart View]                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Task 1    ████████████                              │   │
│  │ Task 2         ├──────────────────                  │   │
│  │ Task 3                    ████████████              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Sprint 7: AI UI & Polish

**Goal:** AI UI, notifications, dashboard, финальная полировка

### Session 7.1 — SMART Validation UI
**Duration:** 2-3h
**Status:** ⏳ Planned

**Goal:** UI для SMART результатов

**Tasks:**
- [ ] Create ai module (types, api, hooks)
- [ ] Create SmartValidationResult
- [ ] Create SmartCriterionCard
- [ ] Create SmartScoreIndicator
- [ ] Integration with TaskFormModal
- [ ] Inline indicators on task cards

**Blockers:** Session 6.8

---

### Session 7.2 — AI Dialog UI
**Duration:** 3h
**Status:** ⏳ Planned

**Goal:** AI dialog panel

**Tasks:**
- [ ] Create useAIConversation, useAIComment hooks
- [ ] Create AIDialogPanel
- [ ] Create AIMessage, AIDialogInput
- [ ] Create AISuggestionCard
- [ ] Integration with TaskFormModal and TaskDetailPage

**Blockers:** Session 7.1

---

### Session 7.3 — Notifications UI
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Notifications dropdown и страница

**Tasks:**
- [ ] Create notifications module
- [ ] Create NotificationsDropdown
- [ ] Create NotificationItem, NotificationBadge
- [ ] Create NotificationsPage
- [ ] Integration with Header
- [ ] Polling for unread count

**Blockers:** Session 7.2

---

### Session 7.4 — Dashboard
**Duration:** 2h
**Status:** ⏳ Planned

**Goal:** Dashboard page

**Tasks:**
- [ ] Create DashboardPage
- [ ] Create QuickStats
- [ ] Create MyTasksList
- [ ] Create RecentNotifications
- [ ] Quick create button

**Blockers:** Session 7.3

---

### Session 7.5 — Polish & Testing
**Duration:** 4h
**Status:** ⏳ Planned

**Goal:** Final review, bugs, optimization

**Tasks:**
- [ ] Code review all modules
- [ ] Test all user flows
- [ ] Fix bugs
- [ ] Add loading states everywhere
- [ ] Error handling and boundaries
- [ ] Mobile responsive check
- [ ] Performance optimization
- [ ] Final testing

**Blockers:** Session 7.4

**Expected Result:** MVP готов к демо! 🎉

---

## 📝 Session Template

Используй этот шаблон для новых сессий:

```markdown
### Session X.Y — Title
**Duration:** Xh
**Status:** ⏳ Planned / 🟡 In Progress / ✅ Completed
**Date:** YYYY-MM-DD (when started)

**Goal:** One sentence goal

**Tasks:**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Blockers:** Session X.Y (description)

**Expected Result:**
- What we should have after this session

**Files to create/modify:**
- List of files
```

---

## 🎯 Post-MVP: Strategic Layer (Phase 3)

После завершения MVP начинаем Phase 3 — полная иерархия 360°:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SmartTask360 Hierarchy                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   BSC (Balanced Scorecard)                                      │
│   └── Strategic Goals (4 perspectives)                          │
│       └── OKR (Objectives & Key Results)                        │
│           └── Programs (portfolio of projects)                  │
│               └── Projects ← MVP включает этот уровень          │
│                   └── Tasks ← AI SMART Validation               │
│                       └── Subtasks                              │
│                           └── Checklists                        │
│                                                                 │
│   Each level cascades down with AI assistance                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3.1: Programs Module
- Program model (id, name, description, owner_id, status)
- ProgramProject association (many-to-many)
- Programs → Projects hierarchy
- Program dashboard with aggregated stats

### Phase 3.2: OKR Module
- Objective model (title, period, owner_id)
- KeyResult model (objective_id, target, current, unit)
- OKR → Programs/Projects linking
- Progress tracking with check-ins
- OKR cascade view

### Phase 3.3: BSC (Balanced Scorecard) Module
- 4 Perspectives: Financial, Customer, Internal, Learning & Growth
- Strategic Goals per perspective
- KPIs with targets and actuals
- Strategy map visualization
- Full cascade: BSC → OKR → Programs → Projects → Tasks

### Phase 3.4: Gantt Chart Advanced (extends MVP)
- Critical path highlighting
- Export to PDF/PNG
- Milestones on timeline
- Resource allocation view
- Baseline comparison
- Progress tracking overlay

### Phase 3.5: Advanced Analytics & Search
- Task completion trends
- Team velocity metrics
- Saved filters (views)
- Advanced query builder

См. [TODO.md](TODO.md) Phase 3 для деталей.

---

## 📊 Progress Tracking

**Completed Sessions:** ~41 / ~50
**Current Sprint:** Sprint 9 Completed → Ready for Sprint 10
**Latest Session:** Session 9 — @Mentions, Reactions & Read Status ✅

**MVP Goal:**
```
Project → Tasks → 3 View Modes:
  ├── Таблица (Table) ✅ есть (+ hierarchy + urgency)
  ├── Kanban ✅ есть (+ comment indicators)
  └── Gantt ⏳ Sprint 11
```

**Recent Achievements (2026-01-06 Session 9):**
- ✅ @Mentions system (`@Имя Фамилия` format with autocomplete)
- ✅ Comment reactions (emoji toggle: 👍 ❤️ 😂 😮 😢 🎉)
- ✅ Per-comment read status tracking
- ✅ Kanban indicators (comment count + unread dot + mentions)
- ✅ 11 new files (MentionInput, Linkify, EmojiPicker, etc.)
- ✅ 3 new migrations

**Next Session Preview:**
Sprint 10 — Projects Full Development
- Complete project pages and components
- Project-task-board integration
- Team member management UI
- Stats and analytics
