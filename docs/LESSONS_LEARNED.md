# SmartTask360 — Lessons Learned

**Цель:** Фиксация типовых проблем, решений и best practices в процессе разработки.

---

## 📚 Содержание

- [Архитектурные решения](#архитектурные-решения)
- [Backend Patterns](#backend-patterns)
- [Frontend Patterns](#frontend-patterns)
- [Database & Migrations](#database--migrations)
- [AI Integration](#ai-integration)
- [Testing](#testing)
- [DevOps & Docker](#devops--docker)

---

## Архитектурные решения

### ✅ Модульная изоляция

**Проблема:** Изменения в одном модуле ломают другие модули.

**Решение:** Строгая модульная архитектура с communication через service interfaces.

```python
# ✅ ПРАВИЛЬНО
from app.modules.users.service import UserService

async def get_task_with_assignee(task_id: UUID, db: AsyncSession):
    user_service = UserService(db)
    assignee = await user_service.get_by_id(task.assignee_id)

# ❌ НЕПРАВИЛЬНО
from app.modules.users.models import User

async def get_task_with_assignee(task_id: UUID, db: AsyncSession):
    assignee = await db.get(User, task.assignee_id)
```

**Почему:** Прямой импорт моделей создает tight coupling. Если структура User изменится, сломается весь код, который импортирует модель.

---

### ✅ Service Pattern

**Проблема:** Бизнес-логика размазана по роутерам, сложно тестировать и переиспользовать.

**Решение:** Вся бизнес-логика в Service классах, роутеры только для HTTP обработки.

```python
# service.py
class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_task(self, data: TaskCreate, creator_id: UUID) -> Task:
        # Вся бизнес-логика здесь
        task = Task(**data.dict(), creator_id=creator_id)
        self.db.add(task)
        await self.db.commit()
        return task

# router.py
@router.post("/")
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TaskService(db)
    task = await service.create_task(data, current_user.id)
    return TaskResponse.model_validate(task)
```

**Почему:** Service можно переиспользовать в других роутерах, фоновых задачах, тестах.

---

## Backend Patterns

### 🔄 Async/Await Everywhere

**Урок:** В FastAPI + SQLAlchemy 2.0 используем async повсюду.

```python
# ✅ ПРАВИЛЬНО
async def get_task(task_id: UUID, db: AsyncSession) -> Task | None:
    result = await db.execute(select(Task).where(Task.id == task_id))
    return result.scalar_one_or_none()

# ❌ НЕПРАВИЛЬНО (sync в async контексте)
def get_task(task_id: UUID, db: Session) -> Task | None:
    return db.query(Task).filter(Task.id == task_id).first()
```

---

### 🎯 Pydantic для валидации

**Урок:** Pydantic schemas для входящих/исходящих данных, SQLAlchemy models для БД.

```python
# models.py (SQLAlchemy)
class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500))

# schemas.py (Pydantic)
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None

class TaskResponse(BaseModel):
    id: UUID
    title: str

    model_config = ConfigDict(from_attributes=True)
```

---

## Frontend Patterns

### 🎨 TypeScript Strict Types

**Урок:** Никогда не используем `any`, всегда явные типы.

```typescript
// ✅ ПРАВИЛЬНО
interface Task {
  id: string;
  title: string;
  assignee: User | null;
}

async function getTask(id: string): Promise<Task> {
  const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
  return response.data.data;
}

// ❌ НЕПРАВИЛЬНО
async function getTask(id: any): Promise<any> {
  const response = await api.get(`/tasks/${id}`);
  return response.data.data;
}
```

---

### 🔄 React Query для Server State

**Урок:** React Query для всех API запросов, не useState для server data.

```typescript
// ✅ ПРАВИЛЬНО
export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id),
  });
}

function TaskDetail({ id }: { id: string }) {
  const { data: task, isLoading, error } = useTask(id);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <div>{task.title}</div>;
}

// ❌ НЕПРАВИЛЬНО
function TaskDetail({ id }: { id: string }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTask(id).then(setTask).finally(() => setLoading(false));
  }, [id]);

  // Нет caching, refetching, error handling...
}
```

---

## Database & Migrations

### 🗂️ LTREE для иерархий

**Урок:** PostgreSQL LTREE extension идеален для task/checklist hierarchies.

```python
# models.py - Custom LTREE type для SQLAlchemy
class LTREE(UserDefinedType):
    """Custom SQLAlchemy type for PostgreSQL ltree"""
    cache_ok = True

    def get_col_spec(self, **kw):
        return "LTREE"

    def bind_processor(self, dialect):
        def process(value):
            return value
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            return value
        return process

class Task(Base):
    path: Mapped[str] = mapped_column(LTREE, nullable=False)
    depth: Mapped[int] = mapped_column(Integer, default=0)

# ⚠️ ВАЖНО: UUID содержат дефисы, а LTREE их не поддерживает!
# Решение: заменяем дефисы на подчеркивания
task.path = str(task.id).replace("-", "_")

# Запрос всех потомков (используем text() для ltree операторов)
descendants = await db.execute(
    select(Task)
    .where(text(f"path <@ '{parent_task.path}'"))  # <@ = descendant of
    .where(Task.id != parent_id)
)

# Запрос всех предков
ancestors = await db.execute(
    select(Task)
    .where(text(f"path @> '{task.path}'"))  # @> = ancestor of
    .where(Task.id != task_id)
    .order_by(Task.path)
)
```

**Почему:**
- LTREE дает O(log n) для иерархических запросов vs рекурсивные CTE
- GIST индексы на path делают запросы мгновенными даже на больших деревьях
- SQLAlchemy не поддерживает ltree операторы из коробки → используем text()

**Ловушки:**
1. ❌ LTREE не поддерживает дефисы → нужна конвертация UUID
2. ❌ Alembic autogenerate не работает с custom types → пишем миграции руками
3. ❌ SQLAlchemy ORM не знает про `<@` и `@>` → используем `text()` для запросов

---

### 🔄 Автоматические переходы статусов

**Урок:** Бизнес-логика должна автоматически управлять статусами при определенных действиях.

```python
# service.py
async def create(self, task_data: TaskCreate, creator_id: UUID) -> Task:
    task = Task(
        status=task_data.status.value,
        assignee_id=task_data.assignee_id,
        # ... other fields
    )

    # Автоматический переход NEW → ASSIGNED при назначении
    if task.assignee_id and task.status == TaskStatus.NEW.value:
        task.status = TaskStatus.ASSIGNED.value

    await self.db.commit()
    return task

async def accept_task(self, task_id: UUID, user_id: UUID) -> Task:
    # Принятие задачи автоматически переводит в IN_PROGRESS
    task.accepted_at = datetime.utcnow()
    task.status = TaskStatus.IN_PROGRESS.value
    task.started_at = datetime.utcnow()  # Отслеживаем начало работы

    await self.db.commit()
    return task

async def change_status(self, task_id: UUID, new_status: TaskStatus) -> Task:
    task.status = new_status.value

    # Отслеживаем ключевые моменты
    if new_status == TaskStatus.IN_PROGRESS and not task.started_at:
        task.started_at = datetime.utcnow()
    elif new_status == TaskStatus.DONE and not task.completed_at:
        task.completed_at = datetime.utcnow()

    await self.db.commit()
    return task
```

**Почему:**
- Консистентность: одинаковое поведение везде
- Аналитика: можем измерять время выполнения (completed_at - started_at)
- UX: пользователь не думает о статусах, система делает правильные переходы

**Применяется к:**
- NEW → ASSIGNED (при assignee_id)
- ASSIGNED → IN_PROGRESS (при accept)
- IN_PROGRESS → DONE (при complete)

---

### 📝 Alembic Migration Best Practices

**Урок:** Всегда проверяем автогенерированные миграции вручную.

```bash
# Создание миграции
alembic revision --autogenerate -m "Add users table"

# ❗ ВАЖНО: Открыть и проверить сгенерированный файл
# - Проверить nullable/non-nullable
# - Проверить defaults
# - Проверить indexes
# - Добавить data migrations если нужно

# Применение
alembic upgrade head
```

---

## AI Integration

### 🤖 Temperature Settings

**Урок:** Разные задачи требуют разных температур.

```python
# config.py
AI_TEMPERATURE_VALIDATION = 0.3  # Детерминированная валидация
AI_TEMPERATURE_DIALOG = 0.7      # Креативные диалоги
AI_TEMPERATURE_COMMENTS = 0.5    # Сбалансированные комментарии
```

**Почему:**
- Низкая (0.3) — для консистентных результатов (SMART validation)
- Высокая (0.7) — для креативности (диалоги, brainstorming)
- Средняя (0.5) — для баланса (risk analysis, suggestions)

---

### 🔄 AI Fallback Strategy

**Урок:** Система должна работать даже если AI недоступен.

```python
async def create_task_with_validation(data: TaskCreate) -> tuple[Task, SmartResult | None]:
    task = await task_service.create(data)

    try:
        smart_result = await ai_service.validate_smart(task)
    except AIServiceError:
        logger.warning(f"AI validation failed for task {task.id}")
        smart_result = None  # Продолжаем работу без валидации

    return task, smart_result
```

---

## Testing

### 🧪 Test Structure

**Урок:** Следуем AAA pattern (Arrange, Act, Assert).

```python
async def test_create_task():
    # Arrange
    db = await get_test_db()
    user = await create_test_user(db)
    data = TaskCreate(title="Test task")

    # Act
    service = TaskService(db)
    task = await service.create_task(data, user.id)

    # Assert
    assert task.title == "Test task"
    assert task.creator_id == user.id
    assert task.status == "draft"
```

---

## DevOps & Docker

### 🐳 Docker Compose для разработки

**Урок:** Используем volumes для hot-reload.

```yaml
# docker-compose.yml
services:
  backend:
    volumes:
      - ./backend:/app  # Hot reload
    command: uvicorn app.main:app --host 0.0.0.0 --reload

  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules  # Важно: exclude node_modules
    command: npm run dev -- --host 0.0.0.0
```

---

## 📌 Общие принципы

1. **DRY, но не переоптимизируй:** Дублирование лучше плохой абстракции
2. **Explicit > Implicit:** Явные типы, явные зависимости
3. **Fail fast:** Ранняя валидация, понятные ошибки
4. **Документируй решения:** Не что делает код, а почему так решили
5. **Тестируй граничные случаи:** null, empty, duplicates, permissions

---

**Примечание:** Этот документ обновляется по мере накопления опыта в проекте.
