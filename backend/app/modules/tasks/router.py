"""
SmartTask360 — Tasks API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.tasks.excel_schemas import ImportResult
from app.modules.tasks.excel_service import ExcelService
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
    UserBrief,
)
from app.modules.tasks.service import TaskService
from app.modules.users.models import User

router = APIRouter(prefix="/tasks", tags=["tasks"])


def task_to_response(task, children_count: int = 0) -> TaskResponse:
    """Convert Task model to TaskResponse with children_count"""
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        author_id=task.author_id,
        creator_id=task.creator_id,
        assignee_id=task.assignee_id,
        parent_id=task.parent_id,
        path=task.path,
        depth=task.depth,
        department_id=task.department_id,
        project_id=task.project_id,
        workflow_template_id=task.workflow_template_id,
        source_document_id=task.source_document_id,
        source_quote=task.source_quote,
        due_date=task.due_date,
        started_at=task.started_at,
        completed_at=task.completed_at,
        is_milestone=task.is_milestone,
        is_deleted=task.is_deleted,
        estimated_hours=task.estimated_hours,
        actual_hours=task.actual_hours,
        accepted_at=task.accepted_at,
        acceptance_deadline=task.acceptance_deadline,
        rejection_reason=task.rejection_reason,
        rejection_comment=task.rejection_comment,
        completion_result=task.completion_result,
        smart_score=task.smart_score,
        smart_validated_at=task.smart_validated_at,
        smart_is_valid=task.smart_is_valid,
        children_count=children_count,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("/", response_model=list[TaskResponse])
async def get_tasks(
    skip: int = 0,
    limit: int = 100,
    status: list[str] | None = Query(default=None),
    priority: list[str] | None = Query(default=None),
    search: str | None = None,
    project_id: UUID | None = None,
    no_project: bool | None = None,
    assignee_id: UUID | None = None,
    creator_id: UUID | None = None,
    is_overdue: bool | None = None,
    parent_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks with optional filters (hierarchical order by path)

    Filters:
    - status: list of statuses to include (e.g., ?status=new&status=in_progress)
    - priority: list of priorities to include
    - assignee_id: filter by task executor
    - creator_id: filter by task creator (who set the task)
    - is_overdue: if true, only show overdue tasks
    - parent_id: filter by parent task (for getting children)
    - no_project: if true, only show tasks without project
    """
    service = TaskService(db)
    tasks = await service.get_all(
        skip=skip,
        limit=limit,
        status=status,
        priority=priority,
        search=search,
        project_id=project_id,
        no_project=no_project,
        assignee_id=assignee_id,
        creator_id=creator_id,
        is_overdue=is_overdue,
        parent_id=parent_id,
    )

    # Get children counts for all tasks in one query
    task_ids = [task.id for task in tasks]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(task, children_counts.get(task.id, 0)) for task in tasks]


@router.get("/roots", response_model=list[TaskResponse])
async def get_root_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all root-level tasks"""
    service = TaskService(db)
    tasks = await service.get_root_tasks()

    task_ids = [task.id for task in tasks]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(task, children_counts.get(task.id, 0)) for task in tasks]


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

    task_ids = [task.id for task in tasks]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(task, children_counts.get(task.id, 0)) for task in tasks]


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

    task_ids = [task.id for task in tasks]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(task, children_counts.get(task.id, 0)) for task in tasks]


# ===== Excel Export/Import Endpoints =====


@router.get("/export/excel")
async def export_tasks_excel(
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    project_id: UUID | None = None,
    department_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export tasks to Excel file with optional filters"""
    service = ExcelService(db)
    excel_data = await service.export_tasks(
        status=status,
        priority=priority,
        search=search,
        project_id=project_id,
        department_id=department_id,
    )

    filename = f"tasks_export_{current_user.id}.xlsx"
    return StreamingResponse(
        iter([excel_data]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/template")
async def get_import_template(
    current_user: User = Depends(get_current_user),
):
    """Get Excel template for task import"""
    service = ExcelService(None)  # No DB needed for template
    template_data = service.generate_template()

    return StreamingResponse(
        iter([template_data]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=tasks_import_template.xlsx"},
    )


@router.post("/import/excel", response_model=ImportResult)
async def import_tasks_excel(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import tasks from Excel file"""
    # Validate file type
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть в формате Excel (.xlsx или .xls)",
        )

    # Read file content
    try:
        file_data = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Не удалось прочитать файл: {str(e)}",
        )

    # Check file size (max 10MB)
    if len(file_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл слишком большой (максимум 10MB)",
        )

    service = ExcelService(db)
    result = await service.import_tasks(file_data, current_user.id)

    return result


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

    children_count = await service.get_children_count(task_id)
    return task_to_response(task, children_count)


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

    task_ids = [t.id for t in children]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(t, children_counts.get(t.id, 0)) for t in children]


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

    task_ids = [t.id for t in descendants]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(t, children_counts.get(t.id, 0)) for t in descendants]


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

    task_ids = [t.id for t in ancestors]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(t, children_counts.get(t.id, 0)) for t in ancestors]


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new task"""
    service = TaskService(db)

    try:
        task = await service.create(task_data, current_user_id=current_user.id)
        # Newly created task has 0 children
        return task_to_response(task, 0)
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

        children_count = await service.get_children_count(task_id)
        return task_to_response(task, children_count)
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

    children_count = await service.get_children_count(task_id)
    return task_to_response(task, children_count)


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

        children_count = await service.get_children_count(task_id)
        return task_to_response(task, children_count)
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

        children_count = await service.get_children_count(task_id)
        return task_to_response(task, children_count)
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

        children_count = await service.get_children_count(task_id)
        return task_to_response(task, children_count)
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


@router.get("/{task_id}/watchers", response_model=list[UserBrief])
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

    task_ids = [task.id for task in tasks]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(task, children_counts.get(task.id, 0)) for task in tasks]


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


@router.get("/{task_id}/participants", response_model=list[UserBrief])
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

    task_ids = [task.id for task in tasks]
    children_counts = await service.get_children_counts(task_ids)

    return [task_to_response(task, children_counts.get(task.id, 0)) for task in tasks]
