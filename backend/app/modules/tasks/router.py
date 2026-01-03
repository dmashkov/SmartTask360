"""
SmartTask360 — Tasks API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.tasks.schemas import (
    AvailableTransitionsResponse,
    TaskAccept,
    TaskCreate,
    TaskParticipantRequest,
    TaskReject,
    TaskResponse,
    TaskStatusChange,
    TaskStatusChangeWorkflow,
    TaskUpdate,
    TaskWatcherRequest,
)
from app.modules.tasks.service import TaskService
from app.modules.users.models import User

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskResponse])
async def get_tasks(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks with optional filters (hierarchical order by path)"""
    service = TaskService(db)
    tasks = await service.get_all(
        skip=skip,
        limit=limit,
        status=status,
        priority=priority,
        search=search,
    )
    return tasks


@router.get("/roots", response_model=list[TaskResponse])
async def get_root_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all root-level tasks"""
    service = TaskService(db)
    tasks = await service.get_root_tasks()
    return tasks


@router.get("/my", response_model=list[TaskResponse])
async def get_my_tasks(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get tasks assigned to current user"""
    service = TaskService(db)
    tasks = await service.get_by_assignee(current_user.id, skip=skip, limit=limit)
    return tasks


@router.get("/created", response_model=list[TaskResponse])
async def get_created_tasks(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get tasks created by current user"""
    service = TaskService(db)
    tasks = await service.get_by_creator(current_user.id, skip=skip, limit=limit)
    return tasks


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get task by ID"""
    service = TaskService(db)
    task = await service.get_by_id(task_id)

    if not task or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return task


@router.get("/{task_id}/children", response_model=list[TaskResponse])
async def get_task_children(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get direct children of a task"""
    service = TaskService(db)

    # Verify task exists
    task = await service.get_by_id(task_id)
    if not task or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    children = await service.get_children(task_id)
    return children


@router.get("/{task_id}/descendants", response_model=list[TaskResponse])
async def get_task_descendants(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all descendants of a task (entire subtree)"""
    service = TaskService(db)

    # Verify task exists
    task = await service.get_by_id(task_id)
    if not task or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    descendants = await service.get_descendants(task_id)
    return descendants


@router.get("/{task_id}/ancestors", response_model=list[TaskResponse])
async def get_task_ancestors(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all ancestors of a task (path to root)"""
    service = TaskService(db)

    # Verify task exists
    task = await service.get_by_id(task_id)
    if not task or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    ancestors = await service.get_ancestors(task_id)
    return ancestors


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new task"""
    service = TaskService(db)

    try:
        task = await service.create(task_data, creator_id=current_user.id)
        return task
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update task"""
    service = TaskService(db)

    try:
        task = await service.update(task_id, task_data)

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        return task
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete task"""
    service = TaskService(db)
    success = await service.delete(task_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return None


@router.post("/{task_id}/status", response_model=TaskResponse)
async def change_task_status(
    task_id: UUID,
    status_data: TaskStatusChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change task status with optional comment"""
    service = TaskService(db)

    task = await service.change_status(task_id, status_data, user_id=current_user.id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return task


@router.post("/{task_id}/accept", response_model=TaskResponse)
async def accept_task(
    task_id: UUID,
    accept_data: TaskAccept,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept task as assignee (changes status to in_progress)"""
    service = TaskService(db)

    try:
        task = await service.accept_task(task_id, accept_data, user_id=current_user.id)

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        return task
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{task_id}/reject", response_model=TaskResponse)
async def reject_task(
    task_id: UUID,
    reject_data: TaskReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject task as assignee (has questions)"""
    service = TaskService(db)

    try:
        task = await service.reject_task(task_id, reject_data, user_id=current_user.id)

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        return task
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ===== Workflow Integration Endpoints =====


@router.post("/{task_id}/status-workflow", response_model=TaskResponse)
async def change_status_with_workflow(
    task_id: UUID,
    status_data: TaskStatusChangeWorkflow,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Change task status with workflow validation

    Validates transition using workflow template if task has one
    """
    service = TaskService(db)

    try:
        task = await service.change_status_with_workflow(
            task_id=task_id,
            new_status=status_data.new_status,
            user_role=current_user.role,
            comment=status_data.comment,
        )

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        return task
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{task_id}/available-transitions", response_model=AvailableTransitionsResponse)
async def get_available_transitions(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get available status transitions for task based on workflow and user role"""
    service = TaskService(db)

    task = await service.get_by_id(task_id)
    if not task or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    available_statuses = await service.get_available_status_transitions(
        task_id=task_id, user_role=current_user.role
    )

    return AvailableTransitionsResponse(
        current_status=task.status, available_statuses=available_statuses
    )


# ===== Watchers Management Endpoints =====


@router.post("/{task_id}/watchers", status_code=status.HTTP_204_NO_CONTENT)
async def add_watcher(
    task_id: UUID,
    watcher_data: TaskWatcherRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add user as watcher to task"""
    service = TaskService(db)

    success = await service.add_watcher(task_id, watcher_data.user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return None


@router.delete("/{task_id}/watchers/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_watcher(
    task_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove user from task watchers"""
    service = TaskService(db)

    success = await service.remove_watcher(task_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watcher not found",
        )

    return None


@router.get("/{task_id}/watchers", response_model=list[UUID])
async def get_watchers(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of users watching this task"""
    service = TaskService(db)
    watchers = await service.get_watchers(task_id)
    return watchers


@router.get("/me/watched", response_model=list[TaskResponse])
async def get_watched_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks current user is watching"""
    service = TaskService(db)
    tasks = await service.get_watched_tasks(current_user.id)
    return tasks


# ===== Participants Management Endpoints =====


@router.post("/{task_id}/participants", status_code=status.HTTP_204_NO_CONTENT)
async def add_participant(
    task_id: UUID,
    participant_data: TaskParticipantRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add user as participant to task"""
    service = TaskService(db)

    success = await service.add_participant(task_id, participant_data.user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return None


@router.delete(
    "/{task_id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_participant(
    task_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove user from task participants"""
    service = TaskService(db)

    success = await service.remove_participant(task_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found",
        )

    return None


@router.get("/{task_id}/participants", response_model=list[UUID])
async def get_participants(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of users participating in this task"""
    service = TaskService(db)
    participants = await service.get_participants(task_id)
    return participants


@router.get("/me/participated", response_model=list[TaskResponse])
async def get_participated_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks current user is participating in"""
    service = TaskService(db)
    tasks = await service.get_participated_tasks(current_user.id)
    return tasks
