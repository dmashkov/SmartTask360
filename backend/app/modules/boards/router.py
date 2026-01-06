"""
SmartTask360 — Board router (API endpoints)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.types import BoardMemberRole
from app.modules.boards.schemas import (
    BoardColumnCreate,
    BoardColumnReorder,
    BoardColumnResponse,
    BoardColumnUpdate,
    BoardCreate,
    BoardFullResponse,
    BoardListResponse,
    BoardMemberAdd,
    BoardMemberResponse,
    BoardMemberUpdate,
    BoardMemberWithDetails,
    BoardResponse,
    BoardTaskAdd,
    BoardTaskMove,
    BoardTaskResponse,
    BoardTaskWithDetails,
    BoardUpdate,
    MoveResult,
)
from app.modules.boards.service import BoardService
from app.modules.tasks.models import Task
from app.modules.users.models import User

router = APIRouter(prefix="/boards", tags=["boards"])


# =============================================================================
# Board CRUD
# =============================================================================


@router.get("", response_model=list[BoardListResponse])
async def list_boards(
    include_archived: bool = Query(False, description="Include archived boards"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List boards accessible to current user.
    Includes owned boards, member of boards, and public boards.
    """
    service = BoardService(db)
    boards = await service.get_boards_for_user(
        user_id=current_user.id,
        include_archived=include_archived,
        skip=skip,
        limit=limit,
    )

    # Enrich with stats
    result = []
    for board in boards:
        stats = await service.get_board_stats(board.id)
        result.append(
            BoardListResponse(
                id=board.id,
                name=board.name,
                description=board.description,
                owner_id=board.owner_id,
                is_private=board.is_private,
                is_archived=board.is_archived,
                column_count=stats["column_count"],
                task_count=stats["task_count"],
                member_count=stats["member_count"],
                created_at=board.created_at,
            )
        )
    return result


@router.post("", response_model=BoardResponse, status_code=201)
async def create_board(
    board_data: BoardCreate,
    template: str | None = Query(
        "basic",
        description="Column template: basic, agile, approval, or None",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new board with optional default columns"""
    service = BoardService(db)
    board = await service.create_board(
        board_data=board_data,
        owner_id=current_user.id,
        create_default_columns=template,
    )
    return BoardResponse.model_validate(board)


@router.get("/{board_id}", response_model=BoardFullResponse)
async def get_board(
    board_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get board with all columns, tasks, and members"""
    service = BoardService(db)

    board = await service.get_board_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if not await service._can_view_board(board_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get columns
    columns = await service.get_columns(board_id)
    column_responses = []
    for col in columns:
        task_count = await service.get_column_task_count(col.id)
        column_responses.append(
            BoardColumnResponse(
                id=col.id,
                board_id=col.board_id,
                name=col.name,
                mapped_status=col.mapped_status,
                order_index=col.order_index,
                color=col.color,
                wip_limit=col.wip_limit,
                is_collapsed=col.is_collapsed,
                task_count=task_count,
                created_at=col.created_at,
                updated_at=col.updated_at,
            )
        )

    # Get tasks with details
    from sqlalchemy import select

    from app.modules.comments.service import CommentService

    comment_service = CommentService(db)
    board_tasks = await service.get_board_tasks(board_id)
    task_responses = []
    for bt in board_tasks:
        result = await db.execute(select(Task).where(Task.id == bt.task_id))
        task = result.scalar_one_or_none()
        if task:
            # Get comment counts for this task
            comment_counts = await comment_service.get_unread_comments_count(
                current_user.id, bt.task_id
            )
            task_responses.append(
                BoardTaskWithDetails(
                    id=bt.id,
                    board_id=bt.board_id,
                    task_id=bt.task_id,
                    column_id=bt.column_id,
                    order_index=bt.order_index,
                    added_at=bt.added_at,
                    moved_at=bt.moved_at,
                    task_title=task.title,
                    task_status=task.status,
                    task_priority=task.priority,
                    task_assignee_id=task.assignee_id,
                    task_due_date=task.due_date,
                    total_comments_count=comment_counts["total"],
                    unread_comments_count=comment_counts["unread"],
                    unread_mentions_count=comment_counts["unread_mentions"],
                )
            )

    # Get members with user details
    members = await service.get_members(board_id)
    member_responses = []
    for m in members:
        from app.modules.users.models import User as UserModel

        result = await db.execute(select(UserModel).where(UserModel.id == m.user_id))
        user = result.scalar_one_or_none()
        if user:
            member_responses.append(
                BoardMemberWithDetails(
                    id=m.id,
                    board_id=m.board_id,
                    user_id=m.user_id,
                    role=m.role,
                    added_at=m.added_at,
                    user_name=user.name,
                    user_email=user.email,
                )
            )

    return BoardFullResponse(
        id=board.id,
        name=board.name,
        description=board.description,
        owner_id=board.owner_id,
        project_id=board.project_id,
        department_id=board.department_id,
        workflow_template_id=board.workflow_template_id,
        is_private=board.is_private,
        is_archived=board.is_archived,
        created_at=board.created_at,
        updated_at=board.updated_at,
        columns=column_responses,
        tasks=task_responses,
        members=member_responses,
    )


@router.patch("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: UUID,
    board_data: BoardUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update board settings"""
    service = BoardService(db)

    try:
        board = await service.update_board(board_id, board_data, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    return BoardResponse.model_validate(board)


@router.delete("/{board_id}", status_code=204)
async def delete_board(
    board_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete board (owner only)"""
    service = BoardService(db)

    try:
        deleted = await service.delete_board(board_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if not deleted:
        raise HTTPException(status_code=404, detail="Board not found")


# =============================================================================
# Column Management
# =============================================================================


@router.get("/{board_id}/columns", response_model=list[BoardColumnResponse])
async def list_columns(
    board_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all columns in a board"""
    service = BoardService(db)

    if not await service._can_view_board(board_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    columns = await service.get_columns(board_id)
    result = []
    for col in columns:
        task_count = await service.get_column_task_count(col.id)
        result.append(
            BoardColumnResponse(
                id=col.id,
                board_id=col.board_id,
                name=col.name,
                mapped_status=col.mapped_status,
                order_index=col.order_index,
                color=col.color,
                wip_limit=col.wip_limit,
                is_collapsed=col.is_collapsed,
                task_count=task_count,
                created_at=col.created_at,
                updated_at=col.updated_at,
            )
        )
    return result


@router.post("/{board_id}/columns", response_model=BoardColumnResponse, status_code=201)
async def create_column(
    board_id: UUID,
    column_data: BoardColumnCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new column in board"""
    service = BoardService(db)

    try:
        column = await service.create_column(board_id, column_data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return BoardColumnResponse(
        id=column.id,
        board_id=column.board_id,
        name=column.name,
        mapped_status=column.mapped_status,
        order_index=column.order_index,
        color=column.color,
        wip_limit=column.wip_limit,
        is_collapsed=column.is_collapsed,
        task_count=0,
        created_at=column.created_at,
        updated_at=column.updated_at,
    )


@router.patch("/{board_id}/columns/{column_id}", response_model=BoardColumnResponse)
async def update_column(
    board_id: UUID,
    column_id: UUID,
    column_data: BoardColumnUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update column settings"""
    service = BoardService(db)

    # Verify column belongs to board
    column = await service.get_column_by_id(column_id)
    if not column or column.board_id != board_id:
        raise HTTPException(status_code=404, detail="Column not found")

    try:
        column = await service.update_column(column_id, column_data, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    task_count = await service.get_column_task_count(column.id)
    return BoardColumnResponse(
        id=column.id,
        board_id=column.board_id,
        name=column.name,
        mapped_status=column.mapped_status,
        order_index=column.order_index,
        color=column.color,
        wip_limit=column.wip_limit,
        is_collapsed=column.is_collapsed,
        task_count=task_count,
        created_at=column.created_at,
        updated_at=column.updated_at,
    )


@router.delete("/{board_id}/columns/{column_id}", status_code=204)
async def delete_column(
    board_id: UUID,
    column_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete column (moves tasks to first remaining column)"""
    service = BoardService(db)

    # Verify column belongs to board
    column = await service.get_column_by_id(column_id)
    if not column or column.board_id != board_id:
        raise HTTPException(status_code=404, detail="Column not found")

    try:
        deleted = await service.delete_column(column_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not deleted:
        raise HTTPException(status_code=404, detail="Column not found")


@router.post("/{board_id}/columns/reorder", response_model=list[BoardColumnResponse])
async def reorder_columns(
    board_id: UUID,
    reorder_data: BoardColumnReorder,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reorder columns in board"""
    service = BoardService(db)

    try:
        columns = await service.reorder_columns(
            board_id, reorder_data.column_ids, current_user.id
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    result = []
    for col in columns:
        task_count = await service.get_column_task_count(col.id)
        result.append(
            BoardColumnResponse(
                id=col.id,
                board_id=col.board_id,
                name=col.name,
                mapped_status=col.mapped_status,
                order_index=col.order_index,
                color=col.color,
                wip_limit=col.wip_limit,
                is_collapsed=col.is_collapsed,
                task_count=task_count,
                created_at=col.created_at,
                updated_at=col.updated_at,
            )
        )
    return result


# =============================================================================
# Task Management on Board
# =============================================================================


@router.post("/{board_id}/tasks", response_model=BoardTaskResponse, status_code=201)
async def add_task_to_board(
    board_id: UUID,
    task_data: BoardTaskAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add existing task to board"""
    service = BoardService(db)

    try:
        board_task = await service.add_task_to_board(
            board_id, task_data, current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return BoardTaskResponse.model_validate(board_task)


@router.delete("/{board_id}/tasks/{task_id}", status_code=204)
async def remove_task_from_board(
    board_id: UUID,
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove task from board"""
    service = BoardService(db)

    try:
        removed = await service.remove_task_from_board(
            board_id, task_id, current_user.id
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if not removed:
        raise HTTPException(status_code=404, detail="Task not found on board")


@router.post("/{board_id}/tasks/{task_id}/move", response_model=MoveResult)
async def move_task(
    board_id: UUID,
    task_id: UUID,
    move_data: BoardTaskMove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Move task to different column and/or position.
    Handles WIP limits and optional status sync.
    """
    service = BoardService(db)

    result = await service.move_task(board_id, task_id, move_data, current_user.id)

    if not result.success:
        if "permission" in result.message.lower():
            raise HTTPException(status_code=403, detail=result.message)
        elif "not found" in result.message.lower():
            raise HTTPException(status_code=404, detail=result.message)
        elif result.wip_warning:
            raise HTTPException(status_code=409, detail=result.message)
        else:
            raise HTTPException(status_code=400, detail=result.message)

    return result


@router.post(
    "/{board_id}/columns/{column_id}/tasks/reorder",
    response_model=list[BoardTaskResponse],
)
async def reorder_tasks_in_column(
    board_id: UUID,
    column_id: UUID,
    task_ids: list[UUID],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reorder tasks within a column"""
    service = BoardService(db)

    # Verify column belongs to board
    column = await service.get_column_by_id(column_id)
    if not column or column.board_id != board_id:
        raise HTTPException(status_code=404, detail="Column not found")

    try:
        board_tasks = await service.reorder_tasks_in_column(
            column_id, task_ids, current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return [BoardTaskResponse.model_validate(bt) for bt in board_tasks]


# =============================================================================
# Member Management
# =============================================================================


@router.get("/{board_id}/members", response_model=list[BoardMemberWithDetails])
async def list_members(
    board_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all members of a board"""
    service = BoardService(db)

    if not await service._can_view_board(board_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    members = await service.get_members(board_id)
    result = []

    from sqlalchemy import select
    from app.modules.users.models import User as UserModel

    for m in members:
        user_result = await db.execute(
            select(UserModel).where(UserModel.id == m.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            result.append(
                BoardMemberWithDetails(
                    id=m.id,
                    board_id=m.board_id,
                    user_id=m.user_id,
                    role=m.role,
                    added_at=m.added_at,
                    user_name=user.name,
                    user_email=user.email,
                )
            )

    return result


@router.post("/{board_id}/members", response_model=BoardMemberResponse, status_code=201)
async def add_member(
    board_id: UUID,
    member_data: BoardMemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add member to board"""
    service = BoardService(db)

    try:
        member = await service.add_member(board_id, member_data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return BoardMemberResponse.model_validate(member)


@router.patch(
    "/{board_id}/members/{user_id}", response_model=BoardMemberResponse
)
async def update_member_role(
    board_id: UUID,
    user_id: UUID,
    member_data: BoardMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update member role"""
    service = BoardService(db)

    try:
        member = await service.update_member_role(
            board_id, user_id, member_data.role, current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    return BoardMemberResponse.model_validate(member)


@router.delete("/{board_id}/members/{user_id}", status_code=204)
async def remove_member(
    board_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove member from board"""
    service = BoardService(db)

    try:
        removed = await service.remove_member(board_id, user_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if not removed:
        raise HTTPException(status_code=404, detail="Member not found")
