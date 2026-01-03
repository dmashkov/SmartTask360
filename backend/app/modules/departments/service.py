"""
SmartTask360 — Department service (business logic)
"""

from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.departments.models import Department
from app.modules.departments.schemas import DepartmentCreate, DepartmentUpdate


class DepartmentService:
    """Service for department operations with hierarchy support"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, department_id: UUID) -> Department | None:
        """Get department by ID"""
        result = await self.db.execute(
            select(Department).where(Department.id == department_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[Department]:
        """Get all departments ordered by path (hierarchical order)"""
        result = await self.db.execute(
            select(Department).order_by(Department.path).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_root_departments(self) -> list[Department]:
        """Get all root-level departments (depth = 0)"""
        result = await self.db.execute(
            select(Department).where(Department.depth == 0).order_by(Department.name)
        )
        return list(result.scalars().all())

    async def get_children(self, department_id: UUID) -> list[Department]:
        """Get direct children of a department"""
        result = await self.db.execute(
            select(Department)
            .where(Department.parent_id == department_id)
            .order_by(Department.name)
        )
        return list(result.scalars().all())

    async def get_descendants(self, department_id: UUID) -> list[Department]:
        """Get all descendants of a department (entire subtree)"""
        parent_dept = await self.get_by_id(department_id)
        if not parent_dept:
            return []

        # Use ltree descendant operator (<@) to get all nodes under this path
        result = await self.db.execute(
            select(Department)
            .where(text(f"path <@ '{parent_dept.path}'"))
            .where(Department.id != department_id)  # Exclude self
            .order_by(Department.path)
        )
        return list(result.scalars().all())

    async def get_ancestors(self, department_id: UUID) -> list[Department]:
        """Get all ancestors of a department (path to root)"""
        dept = await self.get_by_id(department_id)
        if not dept:
            return []

        # Use ltree ancestor operator (@>) to get all nodes above this path
        result = await self.db.execute(
            select(Department)
            .where(text(f"path @> '{dept.path}'"))
            .where(Department.id != department_id)  # Exclude self
            .order_by(Department.path)
        )
        return list(result.scalars().all())

    async def create(self, department_data: DepartmentCreate) -> Department:
        """Create new department"""
        # Calculate path and depth
        if department_data.parent_id:
            parent = await self.get_by_id(department_data.parent_id)
            if not parent:
                raise ValueError(f"Parent department {department_data.parent_id} not found")

            # Create department instance first to get its ID
            dept = Department(
                name=department_data.name,
                description=department_data.description,
                parent_id=department_data.parent_id,
                path="",  # Temporary, will update below
                depth=parent.depth + 1,
            )
            self.db.add(dept)
            await self.db.flush()  # Get the ID without committing

            # Update path: parent.path + dept.id (replace dashes for ltree compatibility)
            dept.path = f"{parent.path}.{str(dept.id).replace('-', '_')}"
        else:
            # Root department
            dept = Department(
                name=department_data.name,
                description=department_data.description,
                parent_id=None,
                path="",  # Temporary
                depth=0,
            )
            self.db.add(dept)
            await self.db.flush()  # Get the ID

            # Update path: just the ID
            dept.path = str(dept.id).replace("-", "_")

        await self.db.commit()
        await self.db.refresh(dept)
        return dept

    async def update(
        self, department_id: UUID, department_data: DepartmentUpdate
    ) -> Department | None:
        """Update department"""
        dept = await self.get_by_id(department_id)
        if not dept:
            return None

        # Update basic fields
        update_data = department_data.model_dump(exclude_unset=True, exclude={"parent_id"})
        for field, value in update_data.items():
            setattr(dept, field, value)

        # Handle parent change (move in hierarchy)
        if "parent_id" in department_data.model_dump(exclude_unset=True):
            new_parent_id = department_data.parent_id

            # Prevent moving department under itself or its descendants
            if new_parent_id:
                descendants = await self.get_descendants(department_id)
                descendant_ids = {d.id for d in descendants}
                if new_parent_id in descendant_ids or new_parent_id == department_id:
                    raise ValueError("Cannot move department under itself or its descendants")

                new_parent = await self.get_by_id(new_parent_id)
                if not new_parent:
                    raise ValueError(f"Parent department {new_parent_id} not found")

                old_path = dept.path
                new_path = f"{new_parent.path}.{str(dept.id).replace('-', '_')}"
                dept.parent_id = new_parent_id
                dept.depth = new_parent.depth + 1
                dept.path = new_path

                # Update paths of all descendants
                await self._update_descendant_paths(dept, old_path)
            else:
                # Move to root
                old_path = dept.path
                new_path = str(dept.id).replace("-", "_")
                dept.parent_id = None
                dept.depth = 0
                dept.path = new_path

                # Update paths of all descendants
                await self._update_descendant_paths(dept, old_path)

        await self.db.commit()
        await self.db.refresh(dept)
        return dept

    async def _update_descendant_paths(self, dept: Department, old_path: str):
        """Update paths of all descendants after parent change"""
        descendants = await self.db.execute(
            select(Department)
            .where(text(f"path <@ '{old_path}'"))
            .where(Department.id != dept.id)
        )
        for descendant in descendants.scalars():
            # Replace old path prefix with new path
            relative_path = descendant.path[len(old_path) :]
            descendant.path = dept.path + relative_path
            descendant.depth = descendant.path.count(".") if "." in descendant.path else 0

    async def delete(self, department_id: UUID) -> bool:
        """
        Delete department (cascade: delete all descendants).
        WARNING: This is a hard delete, not soft delete.
        """
        dept = await self.get_by_id(department_id)
        if not dept:
            return False

        # Get all descendants
        descendants = await self.get_descendants(department_id)

        # Delete descendants first (bottom-up)
        for descendant in reversed(descendants):
            await self.db.delete(descendant)

        # Delete the department itself
        await self.db.delete(dept)
        await self.db.commit()
        return True
