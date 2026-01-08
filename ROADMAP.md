# SmartTask360 — Development Roadmap

**Планирование сессий разработки**

**Last Updated:** 2026-01-09 (Session 13: Gantt Chart)

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
| Sprint 11: Projects Full | 1 day | 1 session | ✅ Completed |
| Sprint 12: SMART Wizard & Settings | 1 day | 1 session | ✅ Completed |
| Sprint 12.5: AI Dialog Improvements | 0.5 day | 1 session | ✅ Completed |
| Sprint 13: Gantt Chart | 1 day | 1 session | ✅ Completed |
| Sprint 14: Polish & Testing | 1 week | 3-4 sessions | ⏳ Next |

**Total MVP:** ~7-8 weeks, ~46-53 sessions
**Completed:** ~46 sessions (Sprint 0-13)
**Next:** Sprint 14 — Polish & Testing → MVP Complete!

---

## ✅ Completed Sprints Summary

### Sprint 13 (2026-01-09) — Gantt Chart ✅
**Backend Implementation**
- ✅ TaskDependency model with dependency types (FS, SS, FF, SF)
- ✅ TaskBaseline model for plan/fact comparison
- ✅ Added planned_start_date, planned_end_date to Task model
- ✅ Gantt service with CPM (Critical Path Method) algorithm
- ✅ Alembic migration for all new tables
- ✅ API endpoints: /gantt/projects/{id}, dependencies, baselines

**Frontend Implementation**
- ✅ GanttChart component (custom implementation, not frappe-gantt)
  - Day/Week/Month zoom levels
  - Task bars with status colors and progress indicators
  - Milestone markers (diamond shape)
  - Dependency lines with arrows
  - Critical path highlighting
  - Today line indicator
  - Task hierarchy (expand/collapse)
- ✅ GanttHeader — timeline scale (day/week/month)
- ✅ GanttTaskRow — individual task bar rendering
- ✅ GanttToolbar — zoom controls, critical path toggle, baseline creation
- ✅ Gantt tab added to ProjectDetailPage (4th tab)
- ✅ React Query hooks for Gantt data

**Technical Details**
- Custom implementation provides better control than frappe-gantt
- CPM algorithm calculates critical path in topological order
- Dependency types: Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish
- Baselines allow multiple plan versions per task

---

### Sprint 12.5 (2026-01-08) — AI Dialog Improvements ✅
**New Dialog Types**
- ✅ `technical` — обсуждение архитектуры, паттернов, технологий
- ✅ `testing` — генерация тест-кейсов, граничных случаев, критериев приёмки
- ✅ Removed `estimate` (duplicate of decompose which includes estimates)

**AI Comments Cleanup**
- ✅ Removed `risk` and `progress` from dropdown (separate buttons exist)
- ✅ Conversation history shows comment types with icons (💡⚠️📈🚫✨)

**Prompts**
- ✅ All dialog prompts translated to Russian
- ✅ Technical dialog: роль архитектора
- ✅ Testing dialog: роль QA-инженера

---

### Sprint 12 (2026-01-08) — SMART Wizard & System Settings ✅
**SMART Wizard Implementation**
- ✅ 3-step AI-assisted task refinement flow
- ✅ Step 1: Analyze task → generate clarifying questions
- ✅ Step 2: Refine with user answers → generate SMART proposal
- ✅ Step 3: Apply changes → update task + create DoD checklist
- ✅ SMARTWizard component with step indicator
- ✅ QuestionsStep: radio, checkbox, text inputs
- ✅ ProposalStep: side-by-side comparison, DoD editor
- ✅ AITab in TaskDetailPage with "Мастер SMART" button

**System Settings Module**
- ✅ Backend: SystemSettings model with migrations
- ✅ Backend: SystemSettingsService for settings management
- ✅ Backend: Router with GET/PATCH endpoints
- ✅ Frontend: SettingsPage with tabs (General, AI, Prompts)
- ✅ AI model selection (claude-sonnet-4, claude-opus-4, etc.)
- ✅ AI response language setting (Russian/English)
- ✅ Custom prompt templates for each AI feature

**Bug Fixes**
- ✅ Fixed API response parsing (response.data vs response.data.data)
- ✅ Fixed acceptance_criteria transformation (strings to objects)
- ✅ Fixed checklist service method names (create_checklist, create_item)
- ✅ Added React StrictMode protection for wizard initialization

---

### Sprint 11 (2026-01-07) — Projects Full & Kanban Improvements ✅
- ✅ Fix Members tab white screen (ProjectMemberWithUser schema)
- ✅ Persistent Kanban task ordering (kanban_position field)
- ✅ Kanban board filters (status, priority, search)

---

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
- ✅ AI dialogs (clarify, decompose, technical, testing, general)
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

### Sprint 12.5 — AI Dialog UI & SMART UI
**Duration:** 1 day | **Sessions:** 1 | **Status:** ⏳ Next

**Goal:** Завершение AI-интерфейса (диалоги, SMART-индикаторы, AI-комментарии)

#### Session 12.5.1 — AI Dialog UI
**Tasks:**
- [ ] `AIDialogPanel` — панель чата с AI (clarify/decompose/estimate)
- [ ] `AIMessage` — компонент сообщения (user/assistant стили)
- [ ] `AIDialogInput` — поле ввода с кнопкой отправки
- [ ] `AISuggestionCard` — карточка предложения от AI
- [ ] Интеграция в `AITab` (продолжение диалога)
- [ ] `useAIDialog` — хук для работы с диалогами

#### Session 12.5.2 — SMART UI & AI Comments
**Tasks:**
- [ ] `SmartCriterionCard` — карточка критерия S/M/A/R/T с оценкой
- [ ] `SmartScoreIndicator` — компактный индикатор для TaskRow/KanbanCard
- [ ] `AICommentMenu` — меню генерации AI-комментариев
- [ ] Кнопка "Сгенерировать комментарий" в CommentsSection

#### Session 12.5.3 — AI Duplicate Detection
**Tasks:**
- [ ] Backend: `/ai/check-duplicates` endpoint — поиск похожих задач
- [ ] AI prompt для сравнения задач по title/description
- [ ] Frontend: предупреждение при создании задачи о возможных дублях
- [ ] UI: список похожих задач с возможностью перейти или продолжить создание

---

### Sprint 13 — Gantt Chart
**Duration:** 2 days | **Sessions:** 2 | **Status:** ⏳ After AI UI

**Goal:** Gantt-диаграмма как третий режим просмотра задач проекта

#### Session 13.1 — Task Dependencies + Gantt Component
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

#### Session 13.2 — Gantt Integration + View Switcher
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

### Sprint 14 — Polish & Testing
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

**Completed Sessions:** ~45 / ~50
**Current Sprint:** Sprint 12.5 Completed → Ready for Sprint 13
**Latest Session:** Session 12.5 — AI Dialog Improvements ✅

**MVP Goal:**
```
Project → Tasks → 3 View Modes:
  ├── Таблица (Table) ✅ есть (+ hierarchy + urgency + tags)
  ├── Kanban ✅ есть (+ comment indicators)
  └── Gantt ⏳ Sprint 13
```

**Recent Achievements (2026-01-08 Session 12.5):**
- ✅ New AI dialog types: `technical` and `testing`
- ✅ Removed duplicate dialogs and comment types
- ✅ Conversation history with comment type icons
- ✅ All AI prompts in Russian

**Previous Achievements (2026-01-08 Session 12):**
- ✅ SMART Wizard 3-step flow (analyze → refine → apply)
- ✅ System Settings module (AI model, language, prompts)
- ✅ SettingsPage with tabs (General, AI, Prompts)

**Previous Achievements (2026-01-07 Session 10-11):**
- ✅ Tags module frontend (TagBadge, TagsSelect)
- ✅ Projects module full development
- ✅ Kanban improvements (filters, persistent ordering)

**Next Session Preview:**
Sprint 13 — Gantt Chart
- **Backend:** TaskDependency model (predecessor/successor)
- **Backend:** Dependency types: FS, SS, FF, SF
- **Frontend:** GanttChart component (frappe-gantt)
- **Frontend:** Add Gantt tab to ProjectDetailPage
- **Frontend:** Zoom controls (day/week/month)
