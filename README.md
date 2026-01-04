# SmartTask360

**Система полного цикла управления: от стратегии до задач с AI-помощником**

360° охват — каскадирование целей от BSC через OKR к проектам и задачам с интеллектуальной валидацией по методологии SMART.

## 🎯 Ключевые возможности

- **SMART-валидация** — AI анализирует формулировку задачи и предлагает улучшения
- **Принятие задач** — исполнитель осознанно принимает или возвращает задачу с вопросами
- **Интерактивные диалоги** — уточнение задач через диалог с AI
- **AI-комментарии** — анализ рисков, декомпозиция, оценка прогресса
- **Гибкая иерархия** — неограниченная вложенность задач
- **Kanban-доски** — визуализация с привязкой к проектам и шаблонами workflow
- **Шаблоны workflow** — базовый, agile, с утверждением + кастомные
- **Чек-листы** — вложенные пункты с назначением исполнителей
- **Документы** — связь задач с протоколами и документами-основаниями

## 🔄 Полный цикл (360°)

```
BSC (Balanced Scorecard)
└── Стратегические цели
    └── OKR (Objectives & Key Results)
        └── Программы
            └── Проекты
                └── Задачи ← AI SMART-валидация
                    └── Подзадачи
                        └── Чек-листы
```

## 🛠 Технологический стек

### Backend
- FastAPI (Python 3.11+)
- PostgreSQL 15 с ltree
- SQLAlchemy 2.0 (async)
- MinIO (S3-совместимое хранилище)
- Anthropic Claude API

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router v6

## 📁 Структура проекта

```
smarttask360/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── core/      # Shared infrastructure
│   │   └── modules/   # Feature modules
│   ├── alembic/       # Migrations
│   └── tests/
├── frontend/          # React frontend
│   └── src/
│       ├── app/       # App setup
│       ├── shared/    # Shared code
│       ├── modules/   # Feature modules
│       └── pages/     # Page components
├── docker/            # Docker configs
├── docs/              # Documentation
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── API.md
│   └── AI_INTEGRATION.md
├── CLAUDE.md          # AI assistant context
├── TODO.md            # Implementation plan
└── docker-compose.yml
```

## 🚀 Быстрый старт

### Требования

- Docker & Docker Compose
- Node.js 20+ (для локальной разработки frontend)
- Python 3.11+ (для локальной разработки backend)

### Запуск через Docker

```bash
# Клонировать репозиторий
git clone <repo-url>
cd smarttask360

# Создать .env файлы из примеров
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Добавить Anthropic API key в backend/.env
# ANTHROPIC_API_KEY=your-key

# Запустить все сервисы
make up

# Применить миграции
make migrate
```

Приложение будет доступно:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

### Локальная разработка

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## 📋 Основные команды

```bash
make up              # Запустить все сервисы
make down            # Остановить сервисы
make logs            # Показать логи
make migrate         # Применить миграции
make shell-backend   # Терминал в backend контейнере
make shell-db        # psql в базу данных
```

## 📖 Документация

- [CLAUDE.md](./CLAUDE.md) — контекст для разработки с AI
- [Architecture](./docs/ARCHITECTURE.md) — архитектура системы
- [Data Model](./docs/DATA_MODEL.md) — модель данных
- [API](./docs/API.md) — документация API
- [AI Integration](./docs/AI_INTEGRATION.md) — интеграция с Claude

## 🎯 Roadmap

**Current Status (2026-01-04):** Phase 2B completed + enhancements, preparing for Projects module

### Phase 1: Backend Development
- [x] **Phase 1A:** Backend Core — Auth, Users, Departments, Tasks Foundation ✅
- [x] **Phase 1B:** Backend Tasks Extended — Tags, Comments, Checklists, Documents, History, Workflow ✅
- [x] **Phase 1C:** Backend AI — SMART validation, AI dialogs, AI comments ✅
- [x] **Phase 1D:** Backend Boards & Notifications — Kanban, notifications, escalation ✅
- [ ] **Phase 1E:** Projects Module — Backend + Frontend ⏳ Next (2026-01-05)
- [ ] **Phase 1F:** Gantt Chart — Task dependencies, timeline view

### Phase 2: Frontend Development
- [x] **Phase 2A:** Frontend Core — React setup, auth, layout ✅
- [x] **Phase 2B:** Frontend Tasks & Kanban — task management UI, boards, hierarchy, urgency ✅
- [ ] **Phase 2C:** Frontend AI & Polish — AI integration UI, final polish

### Phase 3 — Стратегический слой
- [ ] Проекты и программы
- [ ] Диаграмма Гантта
- [ ] OKR
- [ ] BSC (Balanced Scorecard)
- [ ] Расширенная аналитика
- [ ] Сохранённые фильтры

### Phase 3 — Enterprise
- [ ] Аудит и compliance
- [ ] Интеграции (Jira, Bitrix)
- [ ] SSO
- [ ] Multi-tenant

## 📄 Лицензия

MIT

## 👥 Команда

Разработано с помощью Claude AI.
