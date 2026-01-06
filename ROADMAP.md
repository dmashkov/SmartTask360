# SmartTask360 — Development Roadmap

**Планирование сессий разработки**

**Last Updated:** 2026-01-07 (Session 10: Tags Module)

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
| Sprint 10: Tags Module | 1 day | 1 session | ✅ Completed |
| Sprint 11: Projects Full | 3 days | 2-3 sessions | ⏳ Next |
| Sprint 12: Gantt Chart | 2 days | 2 sessions | ⏳ Planned |
| Sprint 13: Polish & Testing | 1 week | 3-4 sessions | ⏳ Planned |

**Total MVP:** ~7-8 weeks, ~45-52 sessions
**Completed:** ~42 sessions (Sprint 0-10)
**Next:** Sprint 11 — Projects Full Development

---

## ✅ Completed Sprints Summary

### Sprint 10 (2026-01-07) — Tags Module ✅
**Frontend Tags Implementation**
- ✅ Created `modules/tags/` module structure
- ✅ types.ts — Tag, TagCreate, TagUpdate, TagAssign interfaces
- ✅ api.ts — All CRUD + task tag operations
- ✅ hooks/useTags.ts — React Query hooks (useTags, useTaskTags, useAssignTagsToTask, etc.)
- ✅ TagBadge component — colored badge with auto text color
- ✅ TagsSelect component — multi-select with create-on-the-fly
- ✅ Integration: TaskFormModal — tag selection in create/edit forms
- ✅ Integration: TaskDetailPage — tags display in header

**Key Features:**
- TagsSelect allows creating new tags inline
- Auto-assigns random color from predefined palette
- TagBadge calculates text color based on background brightness
- Backend API already existed (Sprint 2)

---

### Sprint 9 (2026-01-06) — @Mentions, Reactions & Read Status ✅
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

---

### Sprint 7-8 (2026-01-06) — Document Attachments in Comments ✅
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

---

### Sprint 6 Enhancements (2026-01-04/05) ✅
- ✅ Task hierarchy visualization (expand/collapse, lazy loading)
- ✅ Task urgency indicators (overdue/due today/due soon)
- ✅ UI refinements (subtasks inline, TaskDetailTabs, completion result)
- ✅ 60+ React components total

**Components Created:**
- TaskExpandButton — expand/collapse control with chevron
- ParentTaskLink — navigation to parent task
- ChildTaskNode — recursive subtask tree node
- ChildTasksTree — subtasks tree container
- TaskDetailTabs — Documents, Comments, History tabs

---

### Sprint 5 — Frontend Core ✅
- ✅ Frontend structure (app/, shared/, modules/, pages/)
- ✅ Auth module (login, context, protected routes)
- ✅ Shared UI components (Button, Input, Modal, Select, etc.)
- ✅ Layout (MainLayout, Sidebar, Header)
- ✅ React Query setup, API client

---

### Sprint 4 — Boards & Notifications ✅
- ✅ Boards module (Board, BoardColumn, BoardTask models)
- ✅ Kanban with drag-drop and WIP limits
- ✅ Status sync when moving cards
- ✅ Notifications module (Notification, NotificationSettings)
- ✅ Notification preferences per user

---

### Sprint 3 — AI Integration ✅
- ✅ AIConversation, AIMessage models
- ✅ Anthropic API integration (claude-sonnet-4-20250514)
- ✅ SMART validation with scoring
- ✅ AI dialogs (clarify, decompose, estimate, general)
- ✅ Risk analysis, AI comments, progress reviews
- ✅ 15+ AI-related endpoints

---

### Sprint 2 — Tasks Extended Backend ✅
- ✅ Tags module (Tag model, many-to-many with tasks)
- ✅ Workflow module (WorkflowTemplate, status transitions)
- ✅ Documents module (upload/download, MinIO integration)
- ✅ Comments module (with mentions parsing)
- ✅ Checklists module (Checklist, ChecklistItem with hierarchy)
- ✅ Task history tracking

---

### Sprint 1 — Core Backend ✅
- ✅ Security layer (JWT, bcrypt)
- ✅ Users CRUD with roles
- ✅ Auth module (login, refresh)
- ✅ Departments with ltree hierarchy
- ✅ Tasks foundation (ltree hierarchy, status workflow, acceptance flow)

---

### Sprint 0 — Setup & Documentation ✅
- ✅ Docker environment (PostgreSQL, MinIO, Backend, Frontend)
- ✅ Database with ltree + pg_trgm extensions
- ✅ Meta-documentation (CLAUDE.md, CONTEXT.md, ROADMAP.md)

---

## ⏳ Upcoming Sprints

### Sprint 11 — Projects Full Development
**Duration:** 3 days | **Sessions:** 2-3 | **Status:** ⏳ Next

**Goal:** Полноценный модуль проектов для привязки задач и досок

#### Session 11.1 — Backend Enhancements
**Tasks:**
- [ ] Review existing Projects module (Sprint 8 foundation)
- [ ] Add project statistics endpoint (completion %, task counts by status)
- [ ] Add project timeline endpoints (for Gantt)
- [ ] Add project activity feed
- [ ] **Extend TaskResponse to include tags** (for TaskRow display)
- [ ] Tests for new functionality

#### Session 11.2 — Frontend Enhancements
**Tasks:**
- [ ] ProjectStatsCard component (% completion, task counts)
- [ ] ProjectTimeline component (start/end dates visual)
- [ ] ProjectActivityFeed component
- [ ] Enhanced ProjectDetailPage with all new components
- [ ] ViewSwitcher component (Table / Kanban / Gantt tabs)
- [ ] **Tags display in TaskRow** (requires backend extension from 11.1)

---

### Sprint 12 — Gantt Chart
**Duration:** 2 days | **Sessions:** 2 | **Status:** ⏳ Planned

**Goal:** Gantt-диаграмма как третий режим просмотра задач проекта

#### Session 12.1 — Task Dependencies + Gantt Component
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

#### Session 12.2 — Gantt Integration + View Switcher
**Tasks:**
- [ ] Add Gantt tab to ProjectDetailPage via ViewSwitcher
- [ ] Implement dependency arrows visualization
- [ ] Implement zoom controls (day/week/month)
- [ ] Implement task click → TaskDetailPage
- [ ] Sync changes across all three views
- [ ] Add loading and empty states

**Expected Result:**
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

### Sprint 13 — Polish & Testing
**Duration:** 1 week | **Sessions:** 3-4 | **Status:** ⏳ Planned

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

**Expected Result:** MVP ready for demo! 🎉

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

---

## 📊 Progress Tracking

**Completed Sessions:** ~42 / ~50
**Current Sprint:** Sprint 10 Completed → Ready for Sprint 11
**Latest Session:** Session 10 — Tags Module ✅

**MVP Goal:**
```
Project → Tasks → 3 View Modes:
  ├── Таблица (Table) ✅ есть (+ hierarchy + urgency + tags)
  ├── Kanban ✅ есть (+ comment indicators)
  └── Gantt ⏳ Sprint 12
```

**Recent Achievements (2026-01-07 Session 10):**
- ✅ Tags module frontend (types, api, hooks)
- ✅ TagBadge component with auto text color
- ✅ TagsSelect multi-select with inline tag creation
- ✅ Integration in TaskFormModal and TaskDetailPage
- ✅ 8 new files in `modules/tags/`

**Previous Achievements (2026-01-06 Session 9):**
- ✅ @Mentions system (`@Имя Фамилия` format with autocomplete)
- ✅ Comment reactions (emoji toggle: 👍 ❤️ 😂 😮 😢 🎉)
- ✅ Per-comment read status tracking
- ✅ Kanban indicators (comment count + unread dot + mentions)

**Next Session Preview:**
Sprint 11 — Projects Full Development
- **Backend:** Extend TaskResponse to include tags (for TaskRow)
- **Backend:** Project statistics, timeline, activity feed endpoints
- **Frontend:** Tags display in TaskRow
- **Frontend:** ProjectStatsCard, ProjectActivityFeed components
- **Frontend:** ViewSwitcher polish (Table/Kanban/Gantt)
