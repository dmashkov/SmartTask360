.PHONY: help up down logs build migrate shell-backend shell-db test lint clean

# Default target
help:
	@echo "SmartTask360 — Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  up              Start all services"
	@echo "  down            Stop all services"
	@echo "  logs            Show logs (all services)"
	@echo "  logs-backend    Show backend logs"
	@echo "  logs-frontend   Show frontend logs"
	@echo "  build           Build all containers"
	@echo "  migrate         Run database migrations"
	@echo "  makemigrations  Create new migration"
	@echo "  shell-backend   Shell into backend container"
	@echo "  shell-db        psql into database"
	@echo "  test            Run backend tests"
	@echo "  lint            Run linters"
	@echo "  clean           Remove containers and volumes"
	@echo ""

# Docker commands
up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

build:
	docker-compose build

# Database commands
migrate:
	docker-compose exec backend alembic upgrade head

makemigrations:
	@read -p "Migration message: " msg; \
	docker-compose exec backend alembic revision --autogenerate -m "$$msg"

shell-db:
	docker-compose exec db psql -U smarttask -d smarttask360

# Development shells
shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

# Testing
test:
	docker-compose exec backend pytest tests/ -v

test-cov:
	docker-compose exec backend pytest tests/ -v --cov=app --cov-report=html

# Linting
lint:
	docker-compose exec backend ruff check app/
	docker-compose exec backend mypy app/

lint-fix:
	docker-compose exec backend ruff check app/ --fix

# Cleanup
clean:
	docker-compose down -v
	docker system prune -f

# Quick restart
restart-backend:
	docker-compose restart backend

restart-frontend:
	docker-compose restart frontend

# Initial setup
init: build up migrate
	@echo ""
	@echo "╔═══════════════════════════════════════════════════════════╗"
	@echo "║              SmartTask360 is ready!                       ║"
	@echo "╠═══════════════════════════════════════════════════════════╣"
	@echo "║  Frontend:  http://localhost:5173                         ║"
	@echo "║  Backend:   http://localhost:8000                         ║"
	@echo "║  API Docs:  http://localhost:8000/docs                    ║"
	@echo "║  MinIO:     http://localhost:9001                         ║"
	@echo "╚═══════════════════════════════════════════════════════════╝"
