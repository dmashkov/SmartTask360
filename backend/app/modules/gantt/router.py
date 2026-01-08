"""
SmartTask360 — Gantt Chart API Routes

API endpoints for task dependencies, baselines, and Gantt data.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.gantt.schemas import (
    BulkBaselineCreate,
    BulkDependencyCreate,
    GanttDateUpdate,
    GanttResponse,
    TaskBaselineResponse,
    TaskDependencyCreate,
    TaskDependencyResponse,
)
from app.modules.gantt.service import GanttService
from app.modules.tasks.schemas import TaskResponse
from app.modules.users.models import User

router = APIRouter(prefix="/gantt", tags=["gantt"])


# ============== Gantt Data ==============


@router.get("/projects/{project_id}", response_model=GanttResponse)
async def get_gantt_data(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GanttResponse:
    """
    Get Gantt chart data for a project.

    Returns all tasks with calculated dates, dependencies, and critical path.
    """
    service = GanttService(db)
    return await service.get_gantt_data(project_id)


# ============== Dependencies ==============


@router.post("/dependencies", response_model=TaskDependencyResponse)
async def create_dependency(
    data: TaskDependencyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskDependencyResponse:
    """
    Create a task dependency.

    Dependency types:
    - FS: Finish-to-Start (most common)
    - SS: Start-to-Start
    - FF: Finish-to-Finish
    - SF: Start-to-Finish
    """
    service = GanttService(db)
    try:
        return await service.create_dependency(data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/dependencies/bulk", response_model=list[TaskDependencyResponse])
async def create_dependencies_bulk(
    data: BulkDependencyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TaskDependencyResponse]:
    """Create multiple task dependencies at once."""
    service = GanttService(db)
    results = []
    errors = []

    for dep_data in data.dependencies:
        try:
            result = await service.create_dependency(dep_data, current_user.id)
            results.append(result)
        except ValueError as e:
            errors.append(
                f"Dependency {dep_data.predecessor_id} -> {dep_data.successor_id}: {str(e)}"
            )

    if errors and not results:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors},
        )

    return results


@router.delete("/dependencies/{predecessor_id}/{successor_id}")
async def delete_dependency(
    predecessor_id: UUID,
    successor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a task dependency."""
    service = GanttService(db)
    deleted = await service.delete_dependency(predecessor_id, successor_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependency not found",
        )
    return {"success": True, "message": "Dependency deleted"}


@router.get("/tasks/{task_id}/dependencies", response_model=list[TaskDependencyResponse])
async def get_task_dependencies(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TaskDependencyResponse]:
    """Get all dependencies for a task (both as predecessor and successor)."""
    service = GanttService(db)
    return await service.get_task_dependencies(task_id)


# ============== Baselines ==============


@router.post("/baselines", response_model=TaskBaselineResponse)
async def create_baseline(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskBaselineResponse:
    """
    Create a baseline snapshot for a task.

    Captures current planned dates and estimated hours.
    """
    from app.modules.gantt.schemas import TaskBaselineCreate

    baseline_data = TaskBaselineCreate(**data)
    service = GanttService(db)
    try:
        return await service.create_baseline(baseline_data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/baselines/bulk", response_model=list[TaskBaselineResponse])
async def create_baselines_bulk(
    data: BulkBaselineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TaskBaselineResponse]:
    """Create baselines for multiple tasks at once (e.g., entire project)."""
    service = GanttService(db)
    return await service.create_bulk_baselines(
        data.task_ids, data.baseline_name, current_user.id
    )


@router.get("/tasks/{task_id}/baselines", response_model=list[TaskBaselineResponse])
async def get_task_baselines(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TaskBaselineResponse]:
    """Get all baselines for a task."""
    service = GanttService(db)
    return await service.get_task_baselines(task_id)


@router.delete("/baselines/{baseline_id}")
async def delete_baseline(
    baseline_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a baseline."""
    service = GanttService(db)
    deleted = await service.delete_baseline(baseline_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Baseline not found",
        )
    return {"success": True, "message": "Baseline deleted"}


# ============== Task Date Updates ==============


@router.patch("/tasks/{task_id}/dates", response_model=TaskResponse)
async def update_task_dates(
    task_id: UUID,
    data: GanttDateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """
    Update task planned dates (typically from Gantt drag/resize).

    Only updates planned_start_date and planned_end_date.
    """
    service = GanttService(db)
    task = await service.update_task_dates(task_id, data)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return TaskResponse.model_validate(task)
