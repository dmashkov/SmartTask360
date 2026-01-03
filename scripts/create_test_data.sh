#!/bin/bash
# Script to create test data for SmartTask360

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTRjYWI3Ny05YjZjLTQ1OWUtYTFkMC04ZTc4NTAwZTFmOTQiLCJlbWFpbCI6ImRlbW9Ac21hcnR0YXNrMzYwLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc2NzQ3OTEzN30.LjSTHBV8VFMscGh7hIRMsAz2edwOjLU8FqFPoE9nrrI"
API="http://localhost:8000/api/v1"

echo "Creating test tasks..."

# Task 1 - Done
TASK1=$(curl -s -X POST "$API/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Разработать API авторизации",
    "description": "Создать endpoints для login, logout, refresh token. Реализовать JWT токены.",
    "priority": "high",
    "status": "done"
  }')
echo "Task 1: $TASK1"

# Task 2 - In Progress
TASK2=$(curl -s -X POST "$API/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Реализовать Kanban доску",
    "description": "Создать компоненты для отображения задач на Kanban доске с поддержкой drag-and-drop",
    "priority": "high",
    "status": "in_progress"
  }')
echo "Task 2: $TASK2"

# Task 3 - In Progress
TASK3=$(curl -s -X POST "$API/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Настроить CI/CD pipeline",
    "description": "Настроить GitHub Actions для автоматического тестирования и деплоя",
    "priority": "medium",
    "status": "in_progress"
  }')
echo "Task 3: $TASK3"

# Task 4 - New
TASK4=$(curl -s -X POST "$API/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Добавить экспорт отчётов в PDF",
    "description": "Реализовать генерацию PDF отчётов по задачам и проектам",
    "priority": "medium",
    "status": "new"
  }')
echo "Task 4: $TASK4"

# Task 5 - New
TASK5=$(curl -s -X POST "$API/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Интеграция с Telegram",
    "description": "Реализовать отправку уведомлений о задачах в Telegram",
    "priority": "low",
    "status": "new"
  }')
echo "Task 5: $TASK5"

# Task 6 - In Review
TASK6=$(curl -s -X POST "$API/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Оптимизация запросов к БД",
    "description": "Добавить индексы и оптимизировать медленные запросы",
    "priority": "high",
    "status": "in_review"
  }')
echo "Task 6: $TASK6"

# Task 7 - Critical
TASK7=$(curl -s -X POST "$API/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Исправить баг с refresh token",
    "description": "При истечении токена пользователя не перенаправляет на страницу входа",
    "priority": "critical",
    "status": "in_progress"
  }')
echo "Task 7: $TASK7"

# Task 8 - With due date
TASK8=$(curl -s -X POST "$API/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Подготовить документацию API",
    "description": "Создать Swagger документацию для всех endpoints",
    "priority": "medium",
    "status": "new",
    "due_date": "2026-01-10T18:00:00"
  }')
echo "Task 8: $TASK8"

echo ""
echo "Creating new board..."

# Create new board
BOARD=$(curl -s -X POST "$API/boards?template=agile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sprint 3 - Frontend",
    "description": "Kanban доска для Sprint 3 - разработка фронтенда"
  }')
echo "Board: $BOARD"

echo ""
echo "Done! Test data created."
