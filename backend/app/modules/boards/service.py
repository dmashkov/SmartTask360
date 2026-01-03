"""
SmartTask360 — Board service (business logic)
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.types import BoardMemberRole, TaskStatus
from app.modules.boards.models import Board, BoardColumn, BoardMember, BoardTask
from app.modules.boards.schemas import (
    BoardColumnCreate,
    BoardColumnUpdate,
    BoardCreate,
    BoardMemberAdd,
    BoardTaskAdd,
    BoardTaskMove,
    BoardUpdate,
    ColumnTemplate,
    DEFAULT_COLUMNS,
    MoveResult,
)
from app.modules.tasks.models import Task


class BoardService:
    """Service for board operations with WIP limits and status sync"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =========================================================================
    # Board CRUD
    # =========================================================================

    async def get_board_by_id(self, board_id: UUID) -> Board | None:
        """Get board by ID"""
        result = await self.db.execute(select(Board).where(Board.id == board_id))
        return result.scalar_one_or_none()

    async def get_boards_for_user(
        self,
        user_id: UUID,
        include_archived: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Board]:
        """
        Get boards accessible to user.
        Includes: owned boards, member of boards, public boards in same department
        """
        # Get boards where user is owner or member
        query = (
            select(Board)
            .outerjoin(BoardMember, Board.id == BoardMember.board_id)
            .where(
                (Board.owner_id == user_id)
                | (BoardMember.user_id == user_id)
                | (Board.is_private == False)
            )
        )

        if not include_archived:
            query = query.where(Board.is_archived == False)

        query = (
            query.distinct()
            .order_by(Board.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_board(
        self,
        board_data: BoardCreate,
        owner_id: UUID,
        create_default_columns: str | None = "basic",
    ) -> Board:
        """
        Create new board.

        Args:
            board_data: Board creation data
            owner_id: User ID of the board owner
            create_default_columns: Template name for default columns (basic/agile/approval/None)
        """
        board = Board(
            name=board_data.name,
            description=board_data.description,
            owner_id=owner_id,
            project_id=board_data.project_id,
            department_id=board_data.department_id,
            workflow_template_id=board_data.workflow_template_id,
            is_private=board_data.is_private,
        )
        self.db.add(board)
        await self.db.flush()

        # Add owner as admin member
        owner_member = BoardMember(
            board_id=board.id,
            user_id=owner_id,
            role=BoardMemberRole.ADMIN.value,
        )
        self.db.add(owner_member)

        # Create default columns if template specified
        if create_default_columns and create_default_columns in DEFAULT_COLUMNS:
            templates = DEFAULT_COLUMNS[create_default_columns]
            for i, template in enumerate(templates):
                column = BoardColumn(
                    board_id=board.id,
                    name=template.name,
                    mapped_status=template.mapped_status,
                    color=template.color,
                    wip_limit=template.wip_limit,
                    order_index=i,
                )
                self.db.add(column)

        await self.db.commit()
        await self.db.refresh(board)
        return board

    async def update_board(
        self, board_id: UUID, board_data: BoardUpdate, user_id: UUID
    ) -> Board | None:
        """Update board (only owner/admin can update)"""
        board = await self.get_board_by_id(board_id)
        if not board:
            return None

        # Check permission
        if not await self._can_admin_board(board_id, user_id):
            raise PermissionError("Only owner or admin can update board")

        update_data = board_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(board, field, value)

        await self.db.commit()
        await self.db.refresh(board)
        return board

    async def delete_board(self, board_id: UUID, user_id: UUID) -> bool:
        """Delete board (only owner can delete)"""
        board = await self.get_board_by_id(board_id)
        if not board:
            return False

        if board.owner_id != user_id:
            raise PermissionError("Only owner can delete board")

        await self.db.execute(sql_delete(Board).where(Board.id == board_id))
        await self.db.commit()
        return True

    # =========================================================================
    # Column Management
    # =========================================================================

    async def get_columns(self, board_id: UUID) -> list[BoardColumn]:
        """Get all columns for a board ordered by order_index"""
        result = await self.db.execute(
            select(BoardColumn)
            .where(BoardColumn.board_id == board_id)
            .order_by(BoardColumn.order_index)
        )
        return list(result.scalars().all())

    async def get_column_by_id(self, column_id: UUID) -> BoardColumn | None:
        """Get column by ID"""
        result = await self.db.execute(
            select(BoardColumn).where(BoardColumn.id == column_id)
        )
        return result.scalar_one_or_none()

    async def create_column(
        self, board_id: UUID, column_data: BoardColumnCreate, user_id: UUID
    ) -> BoardColumn:
        """Create new column in board"""
        board = await self.get_board_by_id(board_id)
        if not board:
            raise ValueError(f"Board {board_id} not found")

        if not await self._can_admin_board(board_id, user_id):
            raise PermissionError("Only owner or admin can create columns")

        # Determine order_index
        if column_data.order_index is None:
            # Get max order_index and add 1
            result = await self.db.execute(
                select(func.max(BoardColumn.order_index)).where(
                    BoardColumn.board_id == board_id
                )
            )
            max_order = result.scalar() or -1
            order_index = max_order + 1
        else:
            order_index = column_data.order_index
            # Shift existing columns
            await self.db.execute(
                update(BoardColumn)
                .where(BoardColumn.board_id == board_id)
                .where(BoardColumn.order_index >= order_index)
                .values(order_index=BoardColumn.order_index + 1)
            )

        column = BoardColumn(
            board_id=board_id,
            name=column_data.name,
            mapped_status=column_data.mapped_status,
            color=column_data.color,
            wip_limit=column_data.wip_limit,
            order_index=order_index,
        )
        self.db.add(column)
        await self.db.commit()
        await self.db.refresh(column)
        return column

    async def update_column(
        self, column_id: UUID, column_data: BoardColumnUpdate, user_id: UUID
    ) -> BoardColumn | None:
        """Update column"""
        column = await self.get_column_by_id(column_id)
        if not column:
            return None

        if not await self._can_admin_board(column.board_id, user_id):
            raise PermissionError("Only owner or admin can update columns")

        update_data = column_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(column, field, value)

        await self.db.commit()
        await self.db.refresh(column)
        return column

    async def delete_column(self, column_id: UUID, user_id: UUID) -> bool:
        """Delete column (moves tasks to first column or fails if only column)"""
        column = await self.get_column_by_id(column_id)
        if not column:
            return False

        if not await self._can_admin_board(column.board_id, user_id):
            raise PermissionError("Only owner or admin can delete columns")

        # Check if this is the only column
        columns = await self.get_columns(column.board_id)
        if len(columns) <= 1:
            raise ValueError("Cannot delete the only column")

        # Move tasks to first column that isn't this one
        target_column = next(c for c in columns if c.id != column_id)
        await self.db.execute(
            update(BoardTask)
            .where(BoardTask.column_id == column_id)
            .values(column_id=target_column.id)
        )

        # Delete column
        await self.db.execute(sql_delete(BoardColumn).where(BoardColumn.id == column_id))

        # Reorder remaining columns
        await self._reorder_columns(column.board_id)

        await self.db.commit()
        return True

    async def reorder_columns(
        self, board_id: UUID, column_ids: list[UUID], user_id: UUID
    ) -> list[BoardColumn]:
        """Reorder columns"""
        if not await self._can_admin_board(board_id, user_id):
            raise PermissionError("Only owner or admin can reorder columns")

        for i, column_id in enumerate(column_ids):
            await self.db.execute(
                update(BoardColumn)
                .where(BoardColumn.id == column_id)
                .where(BoardColumn.board_id == board_id)
                .values(order_index=i)
            )

        await self.db.commit()
        return await self.get_columns(board_id)

    async def _reorder_columns(self, board_id: UUID):
        """Internal: reorder columns after deletion"""
        columns = await self.get_columns(board_id)
        for i, column in enumerate(columns):
            if column.order_index != i:
                column.order_index = i

    # =========================================================================
    # Task Management on Board
    # =========================================================================

    async def get_board_tasks(self, board_id: UUID) -> list[BoardTask]:
        """Get all tasks on a board"""
        result = await self.db.execute(
            select(BoardTask)
            .where(BoardTask.board_id == board_id)
            .order_by(BoardTask.column_id, BoardTask.order_index)
        )
        return list(result.scalars().all())

    async def get_board_task(self, board_id: UUID, task_id: UUID) -> BoardTask | None:
        """Get specific task placement on board"""
        result = await self.db.execute(
            select(BoardTask).where(
                BoardTask.board_id == board_id, BoardTask.task_id == task_id
            )
        )
        return result.scalar_one_or_none()

    async def get_column_task_count(self, column_id: UUID) -> int:
        """Get number of tasks in a column"""
        result = await self.db.execute(
            select(func.count(BoardTask.id)).where(BoardTask.column_id == column_id)
        )
        return result.scalar() or 0

    async def add_task_to_board(
        self, board_id: UUID, task_data: BoardTaskAdd, user_id: UUID
    ) -> BoardTask:
        """Add existing task to board"""
        board = await self.get_board_by_id(board_id)
        if not board:
            raise ValueError(f"Board {board_id} not found")

        if not await self._can_modify_board(board_id, user_id):
            raise PermissionError("No permission to add tasks to this board")

        # Verify task exists
        result = await self.db.execute(
            select(Task).where(Task.id == task_data.task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            raise ValueError(f"Task {task_data.task_id} not found")

        # Verify column belongs to board
        column = await self.get_column_by_id(task_data.column_id)
        if not column or column.board_id != board_id:
            raise ValueError(f"Column {task_data.column_id} not found on this board")

        # Check if task already on board
        existing = await self.get_board_task(board_id, task_data.task_id)
        if existing:
            raise ValueError("Task is already on this board")

        # Check WIP limit
        if column.wip_limit > 0:
            current_count = await self.get_column_task_count(column.id)
            if current_count >= column.wip_limit:
                raise ValueError(
                    f"Column '{column.name}' has reached WIP limit of {column.wip_limit}"
                )

        # Determine order_index
        if task_data.order_index is None:
            result = await self.db.execute(
                select(func.max(BoardTask.order_index)).where(
                    BoardTask.column_id == task_data.column_id
                )
            )
            max_order = result.scalar() or -1
            order_index = max_order + 1
        else:
            order_index = task_data.order_index

        board_task = BoardTask(
            board_id=board_id,
            task_id=task_data.task_id,
            column_id=task_data.column_id,
            order_index=order_index,
        )
        self.db.add(board_task)
        await self.db.commit()
        await self.db.refresh(board_task)
        return board_task

    async def remove_task_from_board(
        self, board_id: UUID, task_id: UUID, user_id: UUID
    ) -> bool:
        """Remove task from board"""
        if not await self._can_modify_board(board_id, user_id):
            raise PermissionError("No permission to remove tasks from this board")

        result = await self.db.execute(
            sql_delete(BoardTask).where(
                BoardTask.board_id == board_id, BoardTask.task_id == task_id
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    async def move_task(
        self, board_id: UUID, task_id: UUID, move_data: BoardTaskMove, user_id: UUID
    ) -> MoveResult:
        """
        Move task to different column and/or position.
        Handles WIP limit check and optional status sync.
        """
        if not await self._can_modify_board(board_id, user_id):
            return MoveResult(success=False, message="No permission to move tasks")

        board_task = await self.get_board_task(board_id, task_id)
        if not board_task:
            return MoveResult(success=False, message="Task not found on this board")

        board = await self.get_board_by_id(board_id)
        target_column = await self.get_column_by_id(move_data.column_id)

        if not target_column or target_column.board_id != board_id:
            return MoveResult(success=False, message="Target column not found")

        # Check WIP limit (if moving to different column)
        wip_warning = False
        if board_task.column_id != move_data.column_id:
            if target_column.wip_limit > 0:
                current_count = await self.get_column_task_count(target_column.id)
                if current_count >= target_column.wip_limit:
                    if not move_data.force:
                        return MoveResult(
                            success=False,
                            message=f"Column '{target_column.name}' has reached WIP limit of {target_column.wip_limit}",
                            wip_warning=True,
                        )
                elif current_count >= target_column.wip_limit - 1:
                    wip_warning = True  # Approaching limit

        # Determine new order_index
        if move_data.order_index is None:
            result = await self.db.execute(
                select(func.max(BoardTask.order_index)).where(
                    BoardTask.column_id == move_data.column_id
                )
            )
            max_order = result.scalar() or -1
            new_order = max_order + 1
        else:
            new_order = move_data.order_index
            # Shift tasks in target column
            await self.db.execute(
                update(BoardTask)
                .where(BoardTask.column_id == move_data.column_id)
                .where(BoardTask.order_index >= new_order)
                .where(BoardTask.id != board_task.id)
                .values(order_index=BoardTask.order_index + 1)
            )

        # Update board task
        old_column_id = board_task.column_id
        board_task.column_id = move_data.column_id
        board_task.order_index = new_order
        board_task.moved_at = datetime.utcnow()

        # Handle status sync if column has mapped_status
        status_changed = False
        new_status = None

        if (
            target_column.mapped_status
            and old_column_id != move_data.column_id
        ):
            # Get the task and update its status
            result = await self.db.execute(
                select(Task).where(Task.id == task_id)
            )
            task = result.scalar_one_or_none()

            if task and task.status != target_column.mapped_status:
                old_task_status = task.status
                task.status = target_column.mapped_status

                # Track timestamps
                if target_column.mapped_status == TaskStatus.IN_PROGRESS.value:
                    if not task.started_at:
                        task.started_at = datetime.utcnow()
                elif target_column.mapped_status == TaskStatus.DONE.value:
                    if not task.completed_at:
                        task.completed_at = datetime.utcnow()

                status_changed = True
                new_status = target_column.mapped_status

        await self.db.commit()
        await self.db.refresh(board_task)

        return MoveResult(
            success=True,
            task=board_task,
            status_changed=status_changed,
            new_status=new_status,
            wip_warning=wip_warning,
        )

    async def reorder_tasks_in_column(
        self, column_id: UUID, task_ids: list[UUID], user_id: UUID
    ) -> list[BoardTask]:
        """Reorder tasks within a column"""
        column = await self.get_column_by_id(column_id)
        if not column:
            raise ValueError("Column not found")

        if not await self._can_modify_board(column.board_id, user_id):
            raise PermissionError("No permission to reorder tasks")

        for i, task_id in enumerate(task_ids):
            await self.db.execute(
                update(BoardTask)
                .where(BoardTask.column_id == column_id)
                .where(BoardTask.task_id == task_id)
                .values(order_index=i)
            )

        await self.db.commit()

        result = await self.db.execute(
            select(BoardTask)
            .where(BoardTask.column_id == column_id)
            .order_by(BoardTask.order_index)
        )
        return list(result.scalars().all())

    # =========================================================================
    # Member Management
    # =========================================================================

    async def get_members(self, board_id: UUID) -> list[BoardMember]:
        """Get all members of a board"""
        result = await self.db.execute(
            select(BoardMember)
            .where(BoardMember.board_id == board_id)
            .order_by(BoardMember.added_at)
        )
        return list(result.scalars().all())

    async def get_member(self, board_id: UUID, user_id: UUID) -> BoardMember | None:
        """Get specific member"""
        result = await self.db.execute(
            select(BoardMember).where(
                BoardMember.board_id == board_id, BoardMember.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def add_member(
        self, board_id: UUID, member_data: BoardMemberAdd, added_by_user_id: UUID
    ) -> BoardMember:
        """Add member to board"""
        board = await self.get_board_by_id(board_id)
        if not board:
            raise ValueError(f"Board {board_id} not found")

        if not await self._can_admin_board(board_id, added_by_user_id):
            raise PermissionError("Only owner or admin can add members")

        # Check if already member
        existing = await self.get_member(board_id, member_data.user_id)
        if existing:
            raise ValueError("User is already a member of this board")

        member = BoardMember(
            board_id=board_id,
            user_id=member_data.user_id,
            role=member_data.role.value,
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def update_member_role(
        self,
        board_id: UUID,
        user_id: UUID,
        new_role: BoardMemberRole,
        updated_by_user_id: UUID,
    ) -> BoardMember | None:
        """Update member role"""
        board = await self.get_board_by_id(board_id)
        if not board:
            return None

        if not await self._can_admin_board(board_id, updated_by_user_id):
            raise PermissionError("Only owner or admin can update member roles")

        # Can't change owner's role
        if user_id == board.owner_id:
            raise ValueError("Cannot change owner's role")

        member = await self.get_member(board_id, user_id)
        if not member:
            return None

        member.role = new_role.value
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def remove_member(
        self, board_id: UUID, user_id: UUID, removed_by_user_id: UUID
    ) -> bool:
        """Remove member from board"""
        board = await self.get_board_by_id(board_id)
        if not board:
            return False

        # Can remove yourself
        if user_id != removed_by_user_id:
            if not await self._can_admin_board(board_id, removed_by_user_id):
                raise PermissionError("Only owner or admin can remove members")

        # Can't remove owner
        if user_id == board.owner_id:
            raise ValueError("Cannot remove board owner")

        result = await self.db.execute(
            sql_delete(BoardMember).where(
                BoardMember.board_id == board_id, BoardMember.user_id == user_id
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    # =========================================================================
    # Permission Helpers
    # =========================================================================

    async def _can_admin_board(self, board_id: UUID, user_id: UUID) -> bool:
        """Check if user can admin the board (owner or admin member)"""
        board = await self.get_board_by_id(board_id)
        if not board:
            return False

        if board.owner_id == user_id:
            return True

        member = await self.get_member(board_id, user_id)
        return member is not None and member.role == BoardMemberRole.ADMIN.value

    async def _can_modify_board(self, board_id: UUID, user_id: UUID) -> bool:
        """Check if user can modify board (owner, admin, or member)"""
        board = await self.get_board_by_id(board_id)
        if not board:
            return False

        if board.owner_id == user_id:
            return True

        member = await self.get_member(board_id, user_id)
        if not member:
            return not board.is_private  # Public boards allow non-members to view only

        return member.role in [BoardMemberRole.ADMIN.value, BoardMemberRole.MEMBER.value]

    async def _can_view_board(self, board_id: UUID, user_id: UUID) -> bool:
        """Check if user can view board"""
        board = await self.get_board_by_id(board_id)
        if not board:
            return False

        if not board.is_private:
            return True

        if board.owner_id == user_id:
            return True

        member = await self.get_member(board_id, user_id)
        return member is not None

    # =========================================================================
    # Statistics
    # =========================================================================

    async def get_board_stats(self, board_id: UUID) -> dict:
        """Get board statistics"""
        # Column count
        column_count = await self.db.execute(
            select(func.count(BoardColumn.id)).where(BoardColumn.board_id == board_id)
        )

        # Task count
        task_count = await self.db.execute(
            select(func.count(BoardTask.id)).where(BoardTask.board_id == board_id)
        )

        # Member count
        member_count = await self.db.execute(
            select(func.count(BoardMember.id)).where(BoardMember.board_id == board_id)
        )

        return {
            "column_count": column_count.scalar() or 0,
            "task_count": task_count.scalar() or 0,
            "member_count": member_count.scalar() or 0,
        }
