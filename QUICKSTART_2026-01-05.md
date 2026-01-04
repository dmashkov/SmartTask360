# Quick Start — 2026-01-05

**Date:** 2026-01-05
**Status:** Ready to start
**Full Plan:** [docs/PLAN_2026-01-05.md](docs/PLAN_2026-01-05.md)

---

## 🚀 Before You Start

```bash
# Start services
docker-compose up -d

# Check all containers are running
docker-compose ps

# Frontend should be accessible at http://localhost:5173
# Backend API at http://localhost:8000
# API Docs at http://localhost:8000/docs
```

---

## 📋 Sessions Overview

### Session 1: Search and Filtering (3h)
- **Goal:** Improved search + saved filter views
- **Backend:** UserView model + CRUD endpoints
- **Frontend:** Global search placeholder, enhanced TaskList search, ViewSelector
- **Start with:** `docs/PLAN_2026-01-05.md` Section "Session 1"

### Session 2: Checklists (3-4h)
- **Goal:** Multiple checklists per task (alternative to subtasks)
- **Key:** NO nesting for MVP, flat structure only
- **Backend:** Review existing module, add progress calculation
- **Frontend:** ChecklistsPanel, ChecklistCard, ChecklistItem
- **Start with:** `docs/PLAN_2026-01-05.md` Section "Session 2"

### Session 3: Projects (4-5h) — CRITICAL
- **Goal:** Full Projects module — what makes SmartTask360 more than "just a task tracker"
- **Backend:** Complete module (models, service, router, tests)
- **Frontend:** ProjectsPage, ProjectDetailPage (3 tabs), integration
- **Start with:** `docs/PLAN_2026-01-05.md` Section "Session 3"

---

## 🎯 Key Decisions

1. **Global Search:** Placeholder only (stub UI, no implementation)
2. **Checklists:** Multiple per task, NO nesting, flat structure
3. **Projects:** FULL development — architecture, lifecycle, roles, metrics, 3-tab UI

---

## 📁 Key Files to Know

### Documentation
- `CONTEXT.md` — Current state, recent enhancements
- `TODO.md` — Full implementation plan
- `ROADMAP.md` — Sessions timeline
- `CLAUDE.md` — Project conventions
- `docs/PLAN_2026-01-05.md` — TODAY'S DETAILED PLAN ⭐

### Recent Code (Session 6.9 - 2026-01-04)
- `frontend/src/modules/tasks/components/TaskExpandButton.tsx`
- `frontend/src/modules/tasks/components/ChildTaskNode.tsx`
- `frontend/src/shared/lib/utils.ts` (getTaskUrgency function)
- `frontend/src/pages/TaskDetailPage.tsx` (restructured)

### Backend Modules (Reference)
- `backend/app/modules/tasks/` — Tasks module
- `backend/app/modules/checklists/` — Checklists (already exists!)
- `backend/app/modules/boards/` — Boards module

---

## ✅ Success Criteria

### End of Session 1
- [ ] Global search icon visible in Header (placeholder)
- [ ] TaskList search works with debounce and highlight
- [ ] Can save and load filter views
- [ ] Backend tests pass (views module)

### End of Session 2
- [ ] Can create multiple checklists per task
- [ ] Can add/remove checklist items
- [ ] Checkbox toggle works
- [ ] Progress bar shows checklist completion
- [ ] Checklists visible on TaskDetailPage

### End of Session 3
- [ ] Can create project with code and dates
- [ ] Can add team members with roles
- [ ] Project page shows stats and progress
- [ ] Tasks filtered by project
- [ ] 3 tabs work (Overview, Tasks, Boards)
- [ ] Backend tests pass (15+ scenarios)
- [ ] "Проекты" visible in navigation
- [ ] Can select project in TaskFormModal

---

## 🔧 Common Commands

```bash
# Backend
cd backend
alembic revision --autogenerate -m "Message"
alembic upgrade head
pytest tests/test_*.py -v

# Frontend
cd frontend
npm run dev
npm run build
npm run type-check

# Docker
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose restart backend
docker-compose restart frontend
```

---

## 🐛 If Something Goes Wrong

1. **TypeScript errors:**
   ```bash
   cd frontend
   npm run type-check
   ```

2. **Backend errors:**
   ```bash
   docker-compose logs backend
   ```

3. **Database issues:**
   ```bash
   docker-compose exec db psql -U postgres -d smarttask360
   ```

4. **Fresh start:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## 📝 Notes for Testing

**User will test modules in parallel with development.**

After each session:
- [ ] Check console for errors
- [ ] Test main user flows
- [ ] Note bugs in separate list (don't fix immediately)
- [ ] Continue to next session

---

## 🎉 Let's Go!

Start with Session 1, work through systematically. **Projects (Session 3) is the most important** — it's what differentiates SmartTask360 from simple task trackers.

**Good luck! 🚀**
