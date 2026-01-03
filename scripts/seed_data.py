#!/usr/bin/env python3
"""Seed test data for SmartTask360"""

import requests
import json

API = "http://localhost:8000/api/v1"

def get_token():
    """Get fresh auth token"""
    resp = requests.post(f"{API}/auth/login", json={
        "email": "demo@smarttask360.com",
        "password": "demo1234"
    })
    resp.raise_for_status()
    return resp.json()["access_token"]

def main():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    print("Creating test tasks...")

    tasks_data = [
        {"title": "Реализовать Kanban доску", "description": "Создать компоненты для drag-and-drop", "priority": "high"},
        {"title": "Настроить CI/CD pipeline", "description": "GitHub Actions для тестов и деплоя", "priority": "medium"},
        {"title": "Добавить экспорт в PDF", "description": "Генерация отчётов по задачам", "priority": "medium"},
        {"title": "Интеграция с Telegram", "description": "Уведомления о задачах в Telegram", "priority": "low"},
        {"title": "Оптимизация БД", "description": "Добавить индексы и оптимизировать запросы", "priority": "high"},
        {"title": "Исправить баг с токенами", "description": "Refresh token не работает корректно", "priority": "critical"},
        {"title": "Документация API", "description": "Swagger документация для endpoints", "priority": "medium"},
        {"title": "Unit тесты", "description": "Покрыть тестами основные модули", "priority": "high"},
        {"title": "Настроить мониторинг", "description": "Sentry для отслеживания ошибок", "priority": "medium"},
        {"title": "Ревью архитектуры", "description": "Провести ревью перед релизом", "priority": "low"},
    ]

    created_tasks = []
    for task in tasks_data:
        resp = requests.post(f"{API}/tasks/", headers=headers, json=task)
        if resp.status_code == 201 or resp.status_code == 200:
            data = resp.json()
            created_tasks.append(data)
            print(f"  Created: {data['title']}")
        else:
            print(f"  Failed: {task['title']} - {resp.text}")

    print(f"\nCreated {len(created_tasks)} tasks")

    # Get boards
    print("\nGetting boards...")
    resp = requests.get(f"{API}/boards", headers=headers)
    boards = resp.json()

    for board in boards:
        print(f"  Board: {board['name']} (tasks: {board['task_count']})")

    # Add tasks to the new board (Sprint 3 - Frontend)
    sprint_board = None
    for board in boards:
        if "Sprint 3" in board["name"]:
            sprint_board = board
            break

    if sprint_board:
        print(f"\nAdding tasks to board: {sprint_board['name']}")

        # Get board details to find columns
        resp = requests.get(f"{API}/boards/{sprint_board['id']}", headers=headers)
        board_data = resp.json()

        columns = board_data.get("columns", [])
        columns.sort(key=lambda x: x["order_index"])

        print(f"  Columns: {[c['name'] for c in columns]}")

        if columns and created_tasks:
            # Distribute tasks across columns
            for i, task in enumerate(created_tasks[:8]):
                col_idx = i % len(columns)
                column = columns[col_idx]

                resp = requests.post(
                    f"{API}/boards/{sprint_board['id']}/tasks",
                    headers=headers,
                    json={
                        "task_id": task["id"],
                        "column_id": column["id"]
                    }
                )
                if resp.status_code in [200, 201]:
                    print(f"    Added '{task['title'][:30]}...' to '{column['name']}'")
                else:
                    print(f"    Failed to add task: {resp.text}")

    print("\nDone!")

if __name__ == "__main__":
    main()
