# SmartTask360 — Development Context

**Last Updated:** 2026-01-08 (Session 12: SMART Wizard & System Settings)

---

## 🎯 Current Phase

**Phase 2C: Frontend AI** — 🔄 In Progress

### Current Sprint
Sprint 12: SMART Wizard & System Settings — ✅ Completed

### Recent Enhancements (2026-01-08 Session 12)
- ✅ SMART Wizard: 3-step AI-assisted task refinement
  - Step 1: Analyze task and generate clarifying questions
  - Step 2: Generate SMART proposal based on user answers
  - Step 3: Apply changes (title, description, DoD checklist)
- ✅ System Settings module (backend + frontend)
  - SystemSettings model with migrations
  - AI model selection (claude-sonnet-4, claude-opus-4, etc.)
  - AI response language setting (Russian/English)
  - Custom prompt templates for each AI feature
- ✅ Frontend components:
  - SMARTWizard with step indicator
  - QuestionsStep: radio, checkbox, text inputs
  - ProposalStep: side-by-side comparison, DoD editor
  - SettingsPage with tabs (General, AI, Prompts)
- ✅ Bug fixes: API response parsing, acceptance_criteria transformation

### Previous Enhancements (2026-01-07 Session 10-11)
- ✅ Tags module frontend (TagBadge, TagsSelect with inline creation)
- ✅ Projects module full development
- ✅ Members tab fix (ProjectMemberWithUser schema)
- ✅ Persistent Kanban task ordering

### Previous Enhancements (2026-01-06 Session 8-9)
- ✅ @Mentions system (`@Имя Фамилия` format with autocomplete)
- ✅ Comment reactions (emoji: 👍 ❤️ 😂 😮 😢 🎉)
- ✅ Per-comment read status tracking
- ✅ Document attachments in comments
- ✅ Bidirectional navigation (comments ↔ documents via CustomEvent)

### Current Session
Session 12: SMART Wizard & System Settings — ✅ Completed

### Next Up
Sprint 13 — Gantt Chart:
- TaskDependency model (predecessor/successor)
- GanttChart component (frappe-gantt)
- ViewSwitcher with Gantt tab

After Gantt → Sprint 14: Polish & Testing → MVP Complete!

---

## 📊 Progress Overview

### Completed Phases
- [x] **Phase 0:** Project Setup (100%)
- [x] **Phase 1A:** Backend Core (100%)
- [x] **Phase 1B:** Backend Tasks Extended (100%)
- [x] **Phase 1C:** Backend AI (100%)
- [x] **Phase 1D:** Boards & Notifications (100%)
- [x] **Phase 2A:** Frontend Core (100%)
- [x] **Phase 2B:** Frontend Tasks & Kanban (100%)

### Completed Sessions (22+ total)
**Sprint 0 (2 sessions):**
- [x] Session 0.1: Meta-documentation files
- [x] Session 0.2: Infrastructure Setup

**Sprint 1 (5 sessions):**
- [x] Session 1.1: Security & Core Types
- [x] Session 1.2: Users CRUD API
- [x] Session 1.3: Auth Module
- [x] Session 1.4: Departments Module
- [x] Session 1.5: Tasks Module Foundation

**Sprint 2 (7 sessions):**
- [x] Session 2.1: Tags Module
- [x] Session 2.2: Comments Module
- [x] Session 2.3: Checklists Module
- [x] Session 2.4: Documents Module
- [x] Session 2.5: Task History Module
- [x] Session 2.6: Workflow Module
- [x] Session 2.7: Tasks Module Extensions

**Sprint 3 (4 sessions):**
- [x] Session 1C.1: AI Module Setup
- [x] Session 1C.2: SMART Validation Enhancement
- [x] Session 1C.3: AI Task Dialogs
- [x] Session 1C.4: AI Comments & Analysis

**Sprint 4 (2 sessions):**
- [x] Session 1D.1: Boards Module
- [x] Session 1D.2: Notifications Module

**Sprint 5 (Frontend Core):**
- [x] Session 2A.1: Project Structure & Auth
- [x] Session 2A.2: Layout & Navigation

**Sprint 6 (Frontend Tasks & Kanban):**
- [x] Session 2B.1: Task List & Filters
- [x] Session 2B.2: Task CRUD & Kanban

### In Progress
None - Sprint 6 completed

### Next Up
- **Phase 1E:** Projects Module (Backend + Frontend)
- **Phase 1F:** Gantt Chart
- **Phase 2C:** Frontend AI & Polish

---

## 🏗️ Active Modules

### Backend (Complete)
- `core/` — ✅ Security, types, dependencies
- `modules/users/` — ✅ CRUD with JWT protection
- `modules/auth/` — ✅ Login & refresh tokens
- `modules/departments/` — ✅ Hierarchical with ltree
- `modules/tasks/` — ✅ CRUD + hierarchy + status + acceptance + SMART
- `modules/tags/` — ✅ Tag management + task associations
- `modules/comments/` — ✅ Comments with threading, @mentions, reactions, read status
- `modules/checklists/` — ✅ Checklists with nested items (ltree)
- `modules/documents/` — ✅ MinIO upload/download
- `modules/workflow/` — ✅ Templates + transitions
- `modules/ai/` — ✅ SMART validation + SMART Wizard + dialogs + comments + risk analysis
- `modules/boards/` — ✅ Kanban with WIP limits, status sync
- `modules/notifications/` — ✅ Settings, unread tracking
- `modules/system_settings/` — ✅ AI model, language, custom prompts

### Frontend (Phase 2C In Progress)
- `shared/` — ✅ API client, UI components, hooks, layouts, utils
- `modules/auth/` — ✅ Login, AuthContext, ProtectedRoute
- `modules/tasks/` — ✅ List, filters, detail, create/edit modal, hierarchy tree
- `modules/boards/` — ✅ Kanban with drag-and-drop, WIP indicators
- `modules/tags/` — ✅ Tags CRUD, TagBadge, TagsSelect with inline creation
- `modules/ai/` — ✅ SMART Wizard, AITab, validation components
- `modules/settings/` — ✅ SettingsPage with AI/Prompts configuration
- `modules/notifications/` — ✅ Basic (NotificationBell, dropdown)

**Latest Components (2026-01-08):**
- `SMARTWizard` — 3-step AI-assisted task refinement
- `QuestionsStep` — radio, checkbox, text inputs for AI questions
- `ProposalStep` — side-by-side comparison with DoD editor
- `AITab` — AI features panel in TaskDetailPage
- `SettingsPage` — General, AI, Prompts tabs
- `useSmartAnalyze/Refine/Apply` — SMART Wizard hooks

**Previous Components (2026-01-07):**
- `TagBadge` — colored tag badge with auto text color
- `TagsSelect` — multi-select with inline tag creation
- `ProjectDetailPage` — tabs: Tasks, Kanban, Members

**Previous Components (2026-01-06):**
- `MentionInput` — textarea with @mention autocomplete
- `Linkify` — URL and @mention highlighting
- `CommentReactions` — reaction display and toggle

---

## 📦 Technology Stack Status

### Backend (MVP Complete)
- ✅ FastAPI with 14 modules
- ✅ SQLAlchemy async configured
- ✅ Pydantic Settings configured
- ✅ Alembic with 15+ migrations
- ✅ Security infrastructure (JWT + bcrypt)
- ✅ 14 modules: users, auth, departments, tasks, tags, comments, checklists, documents, workflow, ai, task_history, boards, notifications
- ✅ AI integration (Anthropic Claude API)
- ✅ SMART validation + dialogs + risk analysis
- ✅ 95+ API endpoints, 200+ test scenarios

### Frontend (Phase 2B Complete)
- ✅ Vite + React + TypeScript
- ✅ Tailwind CSS styling
- ✅ React Query for data fetching
- ✅ React Hook Form + Zod for forms
- ✅ React Router v6 for routing
- ✅ @dnd-kit for drag-and-drop
- ✅ Auth module (login, context, protected routes)
- ✅ Tasks module (list, filters, detail, create/edit)
- ✅ Boards module (Kanban with DnD, WIP limits)
- ✅ Full Russian localization

### Infrastructure
- ✅ Docker Compose configured (PostgreSQL, MinIO, Backend, Frontend, Adminer)
- ✅ All containers running and tested
- ✅ PostgreSQL with ltree and pg_trgm extensions enabled
- ✅ MinIO with 'documents' bucket created
- ✅ Adminer UI for database management (port 8080)
- ✅ Makefile with common commands
- ✅ Git initialized with commits

---

## 🔑 Key Decisions Made

### Architecture
- **Modular architecture** — strict module isolation
- **Service pattern** — all business logic in services, thin routers
- **LTREE for hierarchies** — efficient task and checklist tree queries
- **One Board = One Project** — simplified board-project relationship

### Technology
- **PostgreSQL ltree extension** — for task/checklist hierarchies
- **MinIO** — S3-compatible object storage for documents
- **Anthropic Claude API** — AI integration (API key configured)
- **TypeScript strict mode** — no `any`, full type safety

### Workflow
- **Configurable statuses** — workflow templates (basic, agile, approval)
- **Task acceptance flow** — assignee must accept or reject within 48h
- **AI temperatures:** 0.3 (validation), 0.7 (dialog), 0.5 (comments)
- **Git initialized** — local version control with commits

---

## 📝 Known Issues / Technical Debt

### Current
- Test scripts (test_*.py) should be moved to tests/ directory or removed before production
- ANTHROPIC_API_KEY exposed in .env (move to .env.local for production)
- bcrypt version pinned to <5.0.0 due to passlib compatibility (monitor for passlib updates)

### Deferred (Post-MVP)
- Caching layer (Redis)
- Background jobs (Celery/ARQ)
- Read replicas for PostgreSQL
- Event sourcing for audit trail

---

## 🎓 Important Patterns

### Backend Module Structure
```
modules/{name}/
├── __init__.py
├── models.py      # SQLAlchemy models
├── schemas.py     # Pydantic schemas
├── service.py     # Business logic
└── router.py      # API endpoints
```

### Frontend Module Structure
```
modules/{name}/
├── types.ts       # TypeScript types
├── api.ts         # API functions
├── hooks/         # React Query hooks
├── components/    # Module components
└── index.ts       # Public exports
```

### Cross-Module Communication
- ✅ Use service interfaces
- ❌ Never import models directly from other modules
- ✅ Share types via core/types.py or shared schemas

---

## 🚀 Next Session Preview

**Phase 1F:** Gantt Chart

**Goal:** Gantt-диаграмма как третий режим просмотра задач проекта

**Backend Tasks:**
1. Create TaskDependency model (predecessor_id, successor_id, type)
2. Add dependency types: FS (finish-to-start), SS, FF, SF
3. Create schemas (TaskDependencyCreate, TaskDependencyResponse)
4. Add endpoints: POST/DELETE /tasks/{id}/dependencies
5. Create migration
6. Write tests

**Frontend Tasks:**
1. Install frappe-gantt (lightweight, MIT license)
2. Create GanttChart wrapper component
3. Create GanttBar with drag handles
4. Add Gantt tab to ProjectDetailPage ViewSwitcher
5. Implement zoom controls (day/week/month)
6. Implement task click → TaskDetailPage

**Important Notes:**
- После Gantt → Phase 2C (Polish & Testing)
- Три режима просмотра задач проекта: Таблица / Kanban / Gantt
- Start session with: `docker-compose up -d`

**Blockers:** None

---

## 📌 Quick References

- **Main docs:** [CLAUDE.md](CLAUDE.md), [README.md](README.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Data model:** [docs/DATA_MODEL.md](docs/DATA_MODEL.md)
- **API spec:** [docs/API.md](docs/API.md)
- **Plan:** [TODO.md](TODO.md)
- **Roadmap:** [ROADMAP.md](ROADMAP.md)
- **Schema reference:** [docs/SCHEMA_REGISTRY.md](docs/SCHEMA_REGISTRY.md)
- **Lessons:** [docs/LESSONS_LEARNED.md](docs/LESSONS_LEARNED.md)
