# Sprint 2 Summary — Backend Tasks Extended

**Phase:** 1B - Backend Tasks Extended
**Duration:** 7 sessions
**Status:** ✅ COMPLETED
**Date:** January 2-3, 2026

---

## 🎯 Sprint Goals

Расширить функциональность Tasks модуля дополнительными возможностями:
- Теги для категоризации задач
- Комментарии с поддержкой threading
- Чек-листы с иерархией
- Управление документами
- История изменений (audit trail)
- Workflow templates с валидацией переходов
- Watchers и Participants для коллаборации

---

## ✅ Completed Sessions

### Session 2.1 - Tags Module (2h)
**Файлы:**
- [app/modules/tags/models.py](../backend/app/modules/tags/models.py)
- [app/modules/tags/schemas.py](../backend/app/modules/tags/schemas.py)
- [app/modules/tags/service.py](../backend/app/modules/tags/service.py)
- [app/modules/tags/router.py](../backend/app/modules/tags/router.py)
- [alembic/versions/xxx_create_tags_table.py](../backend/alembic/versions/)
- [tests/test_tags_api.py](../backend/tests/test_tags_api.py)

**Ключевые функции:**
- Many-to-many связь через `task_tags` таблицу
- Soft delete с флагом `is_active`
- Автоматическая реактивация удаленных тегов при создании с тем же именем
- Цветовая кодировка тегов (hex color)

**API Endpoints:** 9
- `POST /tags/` - создать тег
- `GET /tags/` - список всех тегов
- `GET /tags/{id}` - получить тег
- `PATCH /tags/{id}` - обновить тег
- `DELETE /tags/{id}` - удалить (soft delete)
- `POST /tags/{id}/reactivate` - реактивировать
- `POST /tasks/{task_id}/tags/{tag_id}` - добавить тег к задаче
- `DELETE /tasks/{task_id}/tags/{tag_id}` - удалить тег из задачи
- `GET /tasks/{task_id}/tags` - получить теги задачи

**Тесты:** 13 сценариев ✅

---

### Session 2.2 - Comments Module (2h)
**Файлы:**
- [app/modules/comments/models.py](../backend/app/modules/comments/models.py)
- [app/modules/comments/schemas.py](../backend/app/modules/comments/schemas.py)
- [app/modules/comments/service.py](../backend/app/modules/comments/service.py)
- [app/modules/comments/router.py](../backend/app/modules/comments/router.py)
- [alembic/versions/xxx_create_comments_table.py](../backend/alembic/versions/)
- [tests/test_comments_api.py](../backend/tests/test_comments_api.py)

**Ключевые функции:**
- Threading через `reply_to_id` (self-referential FK)
- `author_type`: user | system | ai
- Author-only редактирование и удаление
- Hard delete (комментарии удаляются навсегда)
- Cascade delete (удаление задачи удаляет все комментарии)

**API Endpoints:** 7
- `POST /comments/` - создать комментарий
- `GET /tasks/{task_id}/comments` - все комментарии задачи
- `GET /comments/{id}` - получить комментарий
- `PATCH /comments/{id}` - обновить (только автор)
- `DELETE /comments/{id}` - удалить (только автор)
- `GET /comments/{id}/replies` - получить ответы
- `GET /tasks/{task_id}/comments/tree` - древовидная структура

**Тесты:** 12 сценариев ✅

---

### Session 2.3 - Checklists Module (3h)
**Файлы:**
- [app/modules/checklists/models.py](../backend/app/modules/checklists/models.py)
- [app/modules/checklists/schemas.py](../backend/app/modules/checklists/schemas.py)
- [app/modules/checklists/service.py](../backend/app/modules/checklists/service.py)
- [app/modules/checklists/router.py](../backend/app/modules/checklists/router.py)
- [alembic/versions/xxx_create_checklists_tables.py](../backend/alembic/versions/)
- [tests/test_checklists_api.py](../backend/tests/test_checklists_api.py)

**Ключевые функции:**
- Иерархические элементы через string-based ltree paths
- Path format: "uuid.uuid.uuid" (разделитель точка)
- Автоматический расчет depth и path при создании
- Перемещение элементов с обновлением путей всех потомков
- Progress tracking (автоматический подсчет выполненных элементов)
- Position для упорядочивания элементов

**API Endpoints:** 17
- Checklist CRUD (4 endpoints)
- ChecklistItem CRUD (4 endpoints)
- `POST /checklist-items/{id}/toggle` - переключить completed
- `POST /checklist-items/{id}/move` - переместить к другому parent
- `GET /checklists/{id}/items` - все элементы
- `GET /checklists/{id}/items/tree` - древовидная структура
- `GET /checklists/{id}/stats` - статистика выполнения
- И другие

**Тесты:** 20 сценариев ✅

**Исправленные ошибки:**
- Path generation: использование `flush()` для получения ID перед установкой path
- Move endpoint: переход с query params на request body

---

### Session 2.4 - Documents Module (3h)
**Файлы:**
- [app/core/storage.py](../backend/app/core/storage.py) ← **NEW**
- [app/modules/documents/models.py](../backend/app/modules/documents/models.py)
- [app/modules/documents/schemas.py](../backend/app/modules/documents/schemas.py)
- [app/modules/documents/service.py](../backend/app/modules/documents/service.py)
- [app/modules/documents/router.py](../backend/app/modules/documents/router.py)
- [alembic/versions/xxx_create_documents_table.py](../backend/alembic/versions/)
- [tests/test_documents_api.py](../backend/tests/test_documents_api.py)

**Ключевые функции:**
- MinIO integration для хранения файлов
- `StorageService` - обертка над MinIO client
- File upload через multipart/form-data
- Presigned URLs для безопасного скачивания (TTL: 1 час)
- Валидация размера файла (max 100MB)
- Организация: `tasks/{task_id}/{filename}`

**API Endpoints:** 9
- `POST /documents/upload` - загрузить файл
- `GET /documents/{id}` - метаданные документа
- `GET /documents/{id}/download` - presigned URL
- `DELETE /documents/{id}` - удалить документ
- `GET /tasks/{task_id}/documents` - все документы задачи
- И другие

**Тесты:** 15 сценариев ✅

---

### Session 2.5 - Task History Module (2h)
**Файлы:**
- [app/modules/task_history/models.py](../backend/app/modules/task_history/models.py)
- [app/modules/task_history/schemas.py](../backend/app/modules/task_history/schemas.py)
- [app/modules/task_history/service.py](../backend/app/modules/task_history/service.py)
- [app/modules/task_history/router.py](../backend/app/modules/task_history/router.py)
- [alembic/versions/2cfdb4280aa0_create_task_history_table.py](../backend/alembic/versions/2cfdb4280aa0_create_task_history_table.py)
- [tests/test_task_history_api.py](../backend/tests/test_task_history_api.py)

**Ключевые функции:**
- Audit trail для всех изменений задач
- JSONB поля для `old_value`, `new_value`, `extra_data`
- Фильтрация по action, field_name, user, date range
- Summary statistics (total changes, unique users, action breakdown)
- Helper методы: `log_task_created()`, `log_field_change()`, `log_status_change()`

**API Endpoints:** 7
- `POST /task-history/` - создать запись
- `GET /task-history/tasks/{task_id}/history` - история задачи
- `GET /task-history/tasks/{task_id}/summary` - сводка
- `GET /task-history/users/me/activity` - моя активность
- `GET /task-history/users/{user_id}/activity` - активность пользователя
- `GET /task-history/recent` - последние изменения
- `DELETE /task-history/tasks/{task_id}/history` - удалить историю

**Тесты:** 16 сценариев ✅

**Исправленные ошибки:**
- Переименование `metadata` → `extra_data` (reserved name в SQLAlchemy)
- Route ordering: `/users/me/activity` перед `/users/{user_id}/activity`

---

### Session 2.6 - Workflow Module (4h)
**Файлы:**
- [app/modules/workflow/models.py](../backend/app/modules/workflow/models.py)
- [app/modules/workflow/schemas.py](../backend/app/modules/workflow/schemas.py)
- [app/modules/workflow/service.py](../backend/app/modules/workflow/service.py)
- [app/modules/workflow/router.py](../backend/app/modules/workflow/router.py)
- [alembic/versions/c283bdb228af_create_workflow_tables.py](../backend/alembic/versions/c283bdb228af_create_workflow_tables.py)
- [tests/test_workflow_api.py](../backend/tests/test_workflow_api.py)

**Ключевые функции:**
- `WorkflowTemplate` - шаблоны workflow с набором статусов
- `StatusTransition` - разрешенные переходы с правилами
- JSONB для statuses и transition rules
- Системные vs кастомные шаблоны (защита системных от изменений)
- Валидация переходов по ролям, обязательным полям

**Системные шаблоны:**
1. **basic**: Новая → В работе → На проверке → Готово (4 перехода)
2. **agile**: Backlog → To Do → In Progress → Review → Testing → Done (8 переходов)
3. **approval**: Черновик → На согласовании → Утверждено/Отклонено → Готово (6 переходов)

**API Endpoints:** 13
- Template CRUD (6 endpoints)
- Transition CRUD (5 endpoints)
- `POST /workflow/validate-transition` - валидация перехода
- `GET /workflow/templates/{id}/available-transitions` - доступные переходы

**Тесты:** 22 сценария ✅

**Исправленные ошибки:**
- JSONB cast для `validation_rules` в migration (NULL handling)

---

### Session 2.7 - Tasks Extensions (3h)
**Файлы:**
- [app/modules/tasks/models.py](../backend/app/modules/tasks/models.py) - обновлен
- [app/modules/tasks/schemas.py](../backend/app/modules/tasks/schemas.py) - обновлен
- [app/modules/tasks/service.py](../backend/app/modules/tasks/service.py) - обновлен
- [app/modules/tasks/router.py](../backend/app/modules/tasks/router.py) - обновлен
- [alembic/versions/d3324f3ce3cf_add_task_workflow_and_relations.py](../backend/alembic/versions/d3324f3ce3cf_add_task_workflow_and_relations.py)
- [tests/test_tasks_extended_api.py](../backend/tests/test_tasks_extended_api.py)

**Ключевые функции:**

**Workflow Integration:**
- Добавлено поле `workflow_template_id` в Task
- `change_status_with_workflow()` - смена статуса с валидацией
- `get_available_status_transitions()` - доступные переходы для роли
- Автоматическая валидация при наличии workflow

**Watchers (Наблюдатели):**
- Many-to-many через `task_watchers` таблицу
- Пользователи получают уведомления об изменениях (TODO: notifications)
- Идемпотентность добавления

**Participants (Участники):**
- Many-to-many через `task_participants` таблицу
- Активные участники выполнения задачи
- Отделены от watchers по назначению

**Новые API Endpoints:** 10
- `POST /tasks/{id}/status-workflow` - смена статуса с workflow
- `GET /tasks/{id}/available-transitions` - доступные переходы
- `POST /tasks/{id}/watchers` - добавить наблюдателя
- `DELETE /tasks/{id}/watchers/{user_id}` - удалить наблюдателя
- `GET /tasks/{id}/watchers` - список наблюдателей
- `GET /tasks/me/watched` - задачи, за которыми наблюдаю
- `POST /tasks/{id}/participants` - добавить участника
- `DELETE /tasks/{id}/participants/{user_id}` - удалить участника
- `GET /tasks/{id}/participants` - список участников
- `GET /tasks/me/participated` - задачи, в которых участвую

**Тесты:** 19 сценариев ✅

**Исправленные ошибки:**
- Route paths: `/watched/me` → `/me/watched` (конфликт с `/{task_id}`)
- `current_user.role.value` → `current_user.role` (already string)

---

## 📊 Sprint Statistics

### Modules
- **7 новых модулей** полностью реализованы
- **1 модуль** (Tasks) значительно расширен

### Code
- **72+ новых API endpoints**
- **8 database migrations** выполнены успешно
- **117+ тестовых сценариев** (все прошли ✅)
- **~10,000 строк кода** написано

### Database Tables
- `tags` + `task_tags` (many-to-many)
- `comments`
- `checklists` + `checklist_items`
- `documents`
- `task_history`
- `workflow_templates` + `status_transitions`
- `task_watchers` + `task_participants` (many-to-many)

### Technologies Used
- **FastAPI** - async REST API
- **SQLAlchemy 2.0** - async ORM with Mapped types
- **PostgreSQL** - JSONB, ltree-like paths
- **Alembic** - database migrations
- **MinIO** - object storage
- **Pydantic v2** - validation
- **httpx** - async testing

---

## 🔧 Technical Patterns Established

### Service Pattern
Вся бизнес-логика в Service классах, роутеры — тонкий слой HTTP handling.

### Soft vs Hard Delete
- **Soft delete:** Tags (is_active flag, reactivation)
- **Hard delete:** Comments, Documents, History

### Many-to-Many Relationships
- Tags ↔ Tasks
- Watchers ↔ Tasks
- Participants ↔ Tasks

### Hierarchical Data
- **Real ltree:** Departments
- **String-based ltree:** Tasks, Checklist Items
- Path format: "uuid.uuid.uuid" или "uuid_uuid_uuid"

### JSONB Usage
- Workflow statuses и rules
- Task history old/new values
- Flexible metadata storage

### Cascade Deletes
- ON DELETE CASCADE для зависимых сущностей
- ON DELETE SET NULL для optional связей

---

## 🐛 Common Issues Encountered & Solved

### 1. Path Generation (Checklists)
**Проблема:** `item.id` was None before commit
**Решение:** Use `flush()` to get ID, then set path

### 2. Query Params vs Body (Checklists)
**Проблема:** Optional UUID in query params caused validation errors
**Решение:** Create schema, use request body instead

### 3. Reserved Names (Task History)
**Проблема:** 'metadata' is reserved in SQLAlchemy
**Решение:** Rename to 'extra_data'

### 4. Route Ordering (Task History, Tasks)
**Проблема:** Parametrized routes matched before specific routes
**Решение:** Define specific routes (e.g., `/users/me/activity`) before parametrized (`/users/{id}/activity`)

### 5. JSONB Type Casting (Workflow)
**Проблема:** NULL values in JSONB columns caused type mismatch
**Решение:** `CASE WHEN x IS NULL THEN NULL ELSE x::jsonb END`

### 6. Enum vs String (Tasks Extensions)
**Проблема:** `current_user.role.value` but role is already string
**Решение:** Use `current_user.role` directly

### 7. Alembic Autogenerate
**Проблема:** Consistently tried to drop existing tables
**Решение:** Manually rewrite migrations every time

---

## 🎓 Key Learnings

1. **Always use flush() when you need ID before commit**
   - Essential for path generation in hierarchical structures

2. **Route ordering matters in FastAPI**
   - Specific routes before parametrized routes
   - Use path prefixes carefully

3. **JSONB is powerful for flexible data**
   - But requires proper type casting in raw SQL
   - NULL handling is important

4. **Service pattern keeps code clean**
   - Easy to test business logic separately
   - Routers stay thin and focused

5. **Many-to-many with Table() is straightforward**
   - No need for association model if no extra fields
   - CASCADE deletes work well

6. **Idempotency is important**
   - Check existence before adding (watchers, participants)
   - Return success even if already exists

---

## 🚀 What's Next

### Phase 1C: AI Integration (~19 hours)
- AI Module Setup
- SMART Validation (Anthropic Claude API)
- AI Dialogs for Task Refinement
- AI-Generated Comments

### Phase 1D: Boards & Notifications (~15 hours)
- Kanban Boards with Columns
- Board-Project Relationship
- Notification System
- Real-time Updates

### Phase 2: Frontend Development
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Task Management UI
- Kanban Board UI
- AI Integration UI

---

## ✅ Sprint 2 Completion Checklist

- [x] Tags Module - теги с many-to-many
- [x] Comments Module - комментарии с threading
- [x] Checklists Module - иерархические чек-листы
- [x] Documents Module - файлы с MinIO
- [x] Task History Module - audit trail
- [x] Workflow Module - шаблоны workflow
- [x] Tasks Extensions - workflow integration, watchers, participants
- [x] All migrations executed successfully
- [x] All tests passing (117+ scenarios)
- [x] Main.py updated with all routers
- [x] Documentation updated

**Sprint 2 Status: ✅ COMPLETED**

---

## 👥 Team Notes

**Методология:** Incremental development с тестированием после каждого модуля
**Качество кода:** Высокое (type hints везде, service pattern, comprehensive tests)
**Документация:** Inline docstrings, API documentation via FastAPI/Swagger

**Готовность к продакшену:** Backend API готов для интеграции с фронтендом

---

*Документ создан: 2026-01-03*
*Последнее обновление: 2026-01-03*
