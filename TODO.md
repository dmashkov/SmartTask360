# SmartTask360 — Implementation Plan

## Progress Tracking

- [x] Project planning and documentation
- [x] **Phase 0:** Project Setup (Sessions 0.1-0.2)
- [x] **Phase 1A:** Backend Core (Sessions 1.1-1.5)
- [x] **Phase 1B:** Backend Tasks Extended (Sessions 2.1-2.7) ✅
- [x] **Phase 1C:** Backend AI (Sessions 1C.1-1C.4) ✅
- [x] **Phase 1D:** Backend Boards & Notifications ✅
- [x] **Phase 2A:** Frontend Core ✅
- [x] **Phase 2B:** Frontend Tasks & Kanban ✅
- [ ] **Phase 2C:** Frontend AI & Polish

**Current:** Phase 2B completed — Frontend Tasks & Kanban завершен ✅
**Next:** Phase 2C - Frontend AI & Polish

---

## Phase 0: Project Setup ✅ COMPLETED (~12 hours)

### 0.1 Repository Setup (2h) ✅ Session 0.1
- [x] Create root directory structure
- [x] Initialize backend/ with FastAPI skeleton
- [x] Initialize frontend/ with Vite + React + TypeScript
- [x] Create docker/ directory
- [x] Add .gitignore, README.md
- [x] Add .env.example files

### 0.2 Docker Configuration (3h) ✅ Session 0.2
- [x] Create backend Dockerfile
- [x] Create frontend Dockerfile
- [x] Configure docker-compose.yml:
  - [x] PostgreSQL 15 with ltree extension
  - [x] MinIO
  - [x] Backend service
  - [x] Frontend service
- [x] Create docker-compose.dev.yml with hot-reload
- [x] Create Makefile with common commands

### 0.3 Backend Core Setup (4h) ✅ Session 0.2
- [x] Install dependencies (requirements.txt)
- [x] Create app/core/config.py (Settings)
- [x] Create app/core/database.py (engine, session, Base)
- [x] Create app/core/exceptions.py
- [x] Create app/core/dependencies.py (get_db)
- [x] Create app/core/pagination.py (minimal, extended later)
- [x] Create app/core/storage.py (MinIO)
- [x] Configure Alembic
- [x] Create app/main.py with CORS, exception handlers
- [x] Add health check endpoint

### 0.4 Frontend Base Setup (3h) ⚠️ Partial (Session 0.1)
- [x] Initialize Vite + React + TypeScript
- [x] Install dependencies (react-router, tanstack-query, axios, tailwind, etc.)
- [x] Configure Tailwind CSS
- [x] Configure path aliases (@/)
- [x] Create directory structure (minimal skeleton)
- [ ] Create API client (deferred to Phase 2A)
- [ ] Create QueryClient provider (deferred to Phase 2A)
- [ ] Create base Router (deferred to Phase 2A)

**Note:** Full frontend implementation deferred to Phase 2 (after backend MVP)

### 0.5 Project Documentation (4h) ✅
- [x] Create CLAUDE.md
- [x] Create docs/ARCHITECTURE.md
- [x] Create docs/DATA_MODEL.md
- [x] Create docs/API.md
- [x] Create docs/AI_INTEGRATION.md
- [x] Create TODO.md

---

## Phase 1A: Backend Core Modules ✅ COMPLETED

### 1A.1 Security Implementation (2h) ✅ Session 1.1
- [x] Implement password hashing (passlib + bcrypt)
- [x] Implement JWT token creation/validation
- [x] Create get_current_user dependency
- [x] Write security tests

### 1A.2 Users Module (4h) ✅ Sessions 1.1-1.2
- [x] Create models.py (User, UserRole enum)
- [x] Create schemas.py
- [x] Create service.py (UserService)
- [x] Create router.py (CRUD endpoints with JWT protection)
- [x] Create migration (b9234699044d)
- [x] Write tests

### 1A.3 Departments Module (4h) ✅ Session 1.4
- [x] Create models.py (Department with ltree)
- [x] Create schemas.py
- [x] Create service.py (hierarchy: children, descendants, ancestors)
- [x] Create router.py
- [x] Create migration (288f745ed472)
- [x] Write tests

### 1A.4 Auth Module (4h) ✅ Session 1.3
- [x] Create schemas.py
- [x] Create service.py (AuthService)
- [x] Create router.py
- [x] Implement login, refresh
- [x] Write tests

### 1A.5 Tasks Module Foundation (6h) ✅ Session 1.5
- [x] Create models.py (Task with ltree, status, priority, acceptance)
- [x] Create types.py (TaskPriority, TaskStatus, RejectionReason enums)
- [x] Create schemas.py (TaskCreate, TaskUpdate, TaskResponse, TaskAccept, TaskReject, TaskStatusChange)
- [x] Create service.py (CRUD + hierarchy + status + acceptance flow)
- [x] Create router.py (full CRUD + hierarchy endpoints + accept/reject)
- [x] Create migration (d10f89879024)
- [x] Register router in main.py
- [x] Write comprehensive tests (13 test scenarios)
- [x] Test 3-level hierarchy
- [x] Test status changes with timestamps
- [x] Test task acceptance/rejection flow

---

## Phase 1B: Backend Tasks Extended ✅ COMPLETED

**Status:** ✅ Завершено (Sessions 2.1-2.7)
**Summary:** [SPRINT_2_SUMMARY.md](docs/SPRINT_2_SUMMARY.md)

### 1B.1 Tags Module (2h) ✅ Session 2.1
- [x] Create models.py (Tag, task_tags)
- [x] Create schemas.py
- [x] Create service.py
- [x] Create router.py
- [x] Create migration
- [x] Write tests (13 scenarios)

### 1B.2 Workflow Module (4h) ✅ Session 2.6
- [x] Create models.py (WorkflowTemplate, StatusTransition)
- [x] Create schemas.py
- [x] Create service.py (WorkflowService)
- [x] Create router.py
- [x] Implement workflow templates (basic, agile, approval)
- [x] Implement template CRUD for custom templates
- [x] Create migration with seed data (system templates)
- [x] Write tests (22 scenarios)

### 1B.3 Documents Module (3h) ✅ Session 2.4
- [x] Create models.py (Document)
- [x] Create schemas.py
- [x] Create storage.py (MinIO integration)
- [x] Create service.py (upload, download, presigned URLs)
- [x] Create router.py
- [x] Create migration
- [x] Write tests (15 scenarios)

### 1B.4-1B.6 Tasks Module Extensions ✅ Session 2.7
- [x] Add workflow_template_id to Task model
- [x] Create task_watchers and task_participants tables
- [x] Implement change_status_with_workflow
- [x] Implement get_available_transitions
- [x] Implement watchers management
- [x] Implement participants management
- [x] Add router endpoints (10 new)
- [x] Write tests (19 scenarios)

### 1B.7 Checklists Module (3h) ✅ Session 2.3
- [x] Create models.py (Checklist, ChecklistItem)
- [x] Create schemas.py
- [x] Create service.py
- [x] Create router.py
- [x] Implement nested items with string-based ltree
- [x] Implement toggle, move, reorder
- [x] Create migration
- [x] Write tests (20 scenarios)

### 1B.8 Comments Module (2h) ✅ Session 2.2
- [x] Create models.py (Comment with threading)
- [x] Create schemas.py
- [x] Create service.py
- [x] Create router.py
- [x] Create migration
- [x] Write tests (12 scenarios)

### 1B.9 Task History Module (2h) ✅ Session 2.5 (BONUS)
- [x] Create models.py (TaskHistory with JSONB)
- [x] Create schemas.py
- [x] Create service.py (audit trail)
- [x] Create router.py
- [x] Create migration
- [x] Write tests (16 scenarios)

---

## Phase 1C: Backend AI ✅ COMPLETED (~19 hours)

**Status:** ✅ Завершено (Sessions 1C.1-1C.4)
**Summary:** [PHASE_1C_COMPLETE.md](docs/PHASE_1C_COMPLETE.md)

### 1C.1 AI Module Setup (4h) ✅
- [x] Create models.py (AIConversation, AIMessage with JSONB)
- [x] Create schemas.py (all conversation types)
- [x] Create client.py (AIClient with retry logic)
- [x] Create service.py (AIService)
- [x] Create router.py (conversation management)
- [x] Create migration (a1b2c3d4e5f6)
- [x] Write tests (12+ scenarios)
- [x] Configure real Anthropic API key

### 1C.2 SMART Validation Enhancement (6h) ✅
- [x] Create prompts.py with detailed examples
- [x] Build enhanced SMART validation prompt
- [x] Add SMART fields to Task model (smart_score, smart_is_valid, smart_validated_at)
- [x] Implement auto-save to tasks
- [x] Create /ai/validate-smart endpoint
- [x] Create /ai/tasks/{id}/apply-smart-suggestions endpoint
- [x] Create migration (b2c3d4e5f6a7)
- [x] Write tests (8 scenarios)

### 1C.3 AI Dialogs (5h) ✅
- [x] Build task dialog system prompt
- [x] Implement start_task_dialog (4 types: clarify, decompose, estimate, general)
- [x] Implement complete_task_dialog with summary
- [x] Implement context preservation in conversations
- [x] Create /ai/tasks/{id}/start-dialog endpoint
- [x] Create /ai/conversations/{id}/complete-dialog endpoint
- [x] Create /ai/conversations/{id}/messages endpoint
- [x] Write tests (15 scenarios)

### 1C.4 AI Comments & Analysis (4h) ✅
- [x] Create risk analysis prompts (4 categories)
- [x] Create comment generation prompts (5 types)
- [x] Create progress review prompts
- [x] Implement analyze_task_risks
- [x] Implement generate_ai_comment
- [x] Implement review_task_progress
- [x] Create /ai/analyze-risks endpoint
- [x] Create /ai/generate-comment endpoint
- [x] Create /ai/review-progress endpoint
- [x] Create /ai/tasks/{id}/auto-comment endpoint
- [x] Write tests (13 scenarios)

---

## Phase 1D: Backend Boards & Notifications ✅ COMPLETED (~14 hours)

### 1D.1 Boards Module (8h) ✅
- [x] Create models.py (Board, BoardColumn, BoardTask, BoardMember)
- [x] Create schemas.py
- [x] Create service.py (BoardService)
- [x] Implement move_task with WIP limits
- [x] Implement status sync on move
- [x] Create router.py
- [x] Create migration
- [x] Write tests (25+ scenarios)

### 1D.2 Notifications Module (6h) ✅
- [x] Create models.py (Notification, NotificationSettings)
- [x] Create schemas.py
- [x] Create service.py (NotificationService)
- [x] Implement send, send_bulk
- [x] Implement settings
- [x] Create router.py
- [x] Convenience methods for common notifications
- [x] Create migration
- [x] Write tests (17 scenarios)

---

## Phase 2A: Frontend Core ✅ COMPLETED (~19 hours)

### 2A.1 Base UI Components (8h) ✅
- [x] Button (variants: primary, secondary, ghost, danger, outline)
- [x] Input (text, password, with icons)
- [x] Textarea
- [x] Select
- [x] Checkbox
- [x] Badge (status, priority)
- [x] Avatar (single, stack)
- [x] Card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- [x] Modal (Modal, ModalHeader, ModalBody, ModalFooter)
- [x] Dropdown (Dropdown, DropdownItem, DropdownDivider, DropdownLabel)
- [x] Spinner (Spinner, Loading, LoadingOverlay)
- [x] Toast (ToastProvider, useToast)
- [x] Tooltip
- [x] Progress (Progress, ProgressCircle)
- [x] EmptyState
- [x] Configure color scheme in Tailwind

### 2A.2 Auth UI (6h) ✅
- [x] Create auth module (api, types, hooks)
- [x] Create AuthContext (AuthProvider, useAuth)
- [x] Create LoginPage
- [x] Create RegisterPage
- [x] Create ProtectedRoute
- [x] Configure axios interceptors with token refresh
- [x] Create useLogin, useRegister, useLogout, useCurrentUser hooks
- [x] Update Router

### 2A.3 Layout & Navigation (5h) ✅
- [x] Create MainLayout
- [x] Create Sidebar with navigation
- [x] Create Header with search and user menu
- [x] Create UserMenu with Dropdown
- [x] Add navigation items (Dashboard, Tasks, Boards, Documents, Team, Settings)
- [x] Add notifications badge placeholder
- [x] Make responsive (mobile sidebar toggle)
- [x] Update Router with MainLayout

---

## Phase 2B: Frontend Tasks & Kanban ✅ COMPLETED (~42 hours)

### 2B.1 Tasks Module API & Types (4h) ✅
- [x] Create types.ts
- [x] Create api.ts (all methods)
- [x] Create useTasks hook
- [x] Create useTask hook
- [x] Create useTaskMutations hook

### 2B.2 Task List Page (6h) ✅
- [x] Create TaskFilters
- [x] Create TaskList with sticky header
- [x] Create TaskRow
- [x] Create TaskTableHeader with sorting
- [x] Create TasksPage
- [x] Implement filtering (status, priority, search)
- [x] Implement client-side sorting

### 2B.3 Task Create/Edit Modal (6h) ✅
- [x] Create TaskFormModal
- [x] Create TaskForm with react-hook-form
- [x] Implement validation with zod
- [x] Priority and status selects

### 2B.4 Task Detail Page (10h) ✅
- [x] Create TaskDetailPage
- [x] Create TaskHeader with breadcrumb
- [x] Create TaskInfo (metadata display)
- [x] Create TaskDescription
- [x] Create StatusChangeButtons
- [x] Create action buttons (Edit, Delete)

### 2B.5 Kanban Board (10h) ✅
- [x] Create boards module (types, api, hooks)
- [x] Create KanbanBoard
- [x] Create KanbanColumn with WIP limits
- [x] Create KanbanCard
- [x] Create BoardsPage (list of boards)
- [x] Create BoardDetailPage
- [x] Implement HTML5 drag-and-drop
- [x] Implement WIP limit indicator
- [x] Implement task move API

### 2B.6 Localization (Bonus) ✅
- [x] Translate all UI to Russian
- [x] Badge labels for status/priority
- [x] Auth pages localization
- [x] Navigation and layout localization

### 2B.7 Backend Filters (Bonus) ✅
- [x] Add status, priority, search filters to GET /tasks/
- [x] Update TaskService.get_all() with filter logic

---

## Phase 2C: Frontend AI & Polish (~31 hours)

### 2C.1 SMART Validation UI (5h)
- [ ] Create ai module (types, api, hooks)
- [ ] Create SmartValidationResult
- [ ] Create SmartCriterionCard
- [ ] Create SmartScoreIndicator
- [ ] Integrate with TaskFormModal
- [ ] Add inline indicator on task cards

### 2C.2 AI Dialog UI (8h)
- [ ] Create useAIConversation hook
- [ ] Create useAIComment hook
- [ ] Create AIDialogPanel
- [ ] Create AIMessage
- [ ] Create AIDialogInput
- [ ] Create AISuggestionCard
- [ ] Create AICommentMenu
- [ ] Create AILoadingIndicator
- [ ] Integrate with TaskFormModal and TaskDetailPage

### 2C.3 Notifications UI (5h)
- [ ] Create notifications module
- [ ] Create NotificationsDropdown
- [ ] Create NotificationItem
- [ ] Create NotificationBadge
- [ ] Create NotificationsPage
- [ ] Integrate with Header
- [ ] Add polling for unread count

### 2C.4 Dashboard (5h)
- [ ] Create DashboardPage
- [ ] Create QuickStats
- [ ] Create MyTasksList
- [ ] Create RecentNotifications
- [ ] Add quick create button

### 2C.5 Polish & Testing (8h)
- [ ] Code review all modules
- [ ] Test all user flows
- [ ] Fix bugs
- [ ] Add loading states everywhere
- [ ] Add error handling and error boundaries
- [ ] Test mobile responsive
- [ ] Optimize performance
- [ ] Final testing

---

## Summary

| Phase | Hours | Description |
|-------|-------|-------------|
| Phase 0 | 12h | Project setup |
| Phase 1A | 14h | Backend core |
| Phase 1B | 35h | Backend tasks (updated) |
| Phase 1C | 19h | Backend AI |
| Phase 1D | 14h | Backend boards & notifications |
| Phase 2A | 19h | Frontend core |
| Phase 2B | 42h | Frontend tasks & kanban |
| Phase 2C | 31h | Frontend AI & polish |
| **Total MVP** | **186h** | ~6 weeks |

---

## Phase 2: Strategic Layer (Post-MVP)

### 2.1 Projects & Programs
- [ ] Create projects module (models, schemas, service, router)
- [ ] Create programs module
- [ ] Link tasks to projects
- [ ] Project dashboard with progress
- [ ] Project-level permissions

### 2.2 Gantt Chart
- [ ] Research Gantt libraries (frappe-gantt, dhtmlx-gantt, custom)
- [ ] Create Gantt component
- [ ] Task dependencies visualization
- [ ] Drag-drop for dates/duration
- [ ] Critical path highlighting
- [ ] Export to PDF/PNG
- [ ] Milestones on timeline
- [ ] Resource allocation view

### 2.3 OKR Module
- [ ] Objectives CRUD
- [ ] Key Results with progress tracking
- [ ] Link OKR to projects/tasks
- [ ] OKR dashboard
- [ ] Cascade view (Objective → KR → Projects → Tasks)

### 2.4 Advanced Analytics
- [ ] Task completion trends
- [ ] Team velocity metrics
- [ ] Acceptance time analytics
- [ ] SMART score distribution
- [ ] Overdue analysis

### 2.5 Advanced Search & Filters
- [ ] Saved filters (views)
- [ ] Full-text search in documents
- [ ] Advanced query builder
- [ ] Export search results

---

## Notes

- Start with Phase 0 to set up development environment
- Backend phases (1A-1D) can be done in parallel with documentation
- Frontend phases (2A-2C) depend on backend API
- AI integration (1C, 2C.1-2C.2) requires Anthropic API key
- Testing should happen throughout, not just at the end
