"""
SmartTask360 — Main Application Entry Point
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print(f"Starting SmartTask360...")
    yield
    # Shutdown
    print("Shutting down SmartTask360...")


app = FastAPI(
    title="SmartTask360",
    description="Full-cycle task management with AI-powered SMART validation",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )


# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SmartTask360"}


# API info
@app.get("/")
async def root():
    return {
        "name": "SmartTask360",
        "version": "0.1.0",
        "description": "Full-cycle task management with AI-powered SMART validation",
        "docs": "/docs",
    }


# Include routers
from app.modules.ai.router import router as ai_router
from app.modules.auth.router import router as auth_router
from app.modules.boards.router import router as boards_router
from app.modules.checklists.router import router as checklists_router
from app.modules.comments.router import router as comments_router
from app.modules.departments.router import router as departments_router
from app.modules.documents.router import router as documents_router
from app.modules.notifications.router import router as notifications_router
from app.modules.projects.router import router as projects_router
from app.modules.system_settings.router import router as system_settings_router
from app.modules.tags.router import router as tags_router
from app.modules.task_history.router import router as task_history_router
from app.modules.tasks.router import router as tasks_router
from app.modules.users.router import router as users_router
from app.modules.views.router import router as views_router
from app.modules.workflow.router import router as workflow_router

app.include_router(ai_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(boards_router, prefix="/api/v1")
app.include_router(checklists_router, prefix="/api/v1")
app.include_router(comments_router, prefix="/api/v1")
app.include_router(departments_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(system_settings_router, prefix="/api/v1")
app.include_router(tags_router, prefix="/api/v1")
app.include_router(task_history_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(views_router, prefix="/api/v1")
app.include_router(workflow_router, prefix="/api/v1")
