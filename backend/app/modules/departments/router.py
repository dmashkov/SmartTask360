"""
SmartTask360 — Departments API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.departments.schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.modules.departments.service import DepartmentService
from app.modules.users.models import User

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=list[DepartmentResponse])
async def get_departments(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all departments (hierarchical order by path)"""
    service = DepartmentService(db)
    departments = await service.get_all(skip=skip, limit=limit)
    return departments


@router.get("/roots", response_model=list[DepartmentResponse])
async def get_root_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all root-level departments"""
    service = DepartmentService(db)
    departments = await service.get_root_departments()
    return departments


@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(
    department_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get department by ID"""
    service = DepartmentService(db)
    department = await service.get_by_id(department_id)

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    return department


@router.get("/{department_id}/children", response_model=list[DepartmentResponse])
async def get_department_children(
    department_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get direct children of a department"""
    service = DepartmentService(db)

    # Verify department exists
    department = await service.get_by_id(department_id)
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    children = await service.get_children(department_id)
    return children


@router.get("/{department_id}/descendants", response_model=list[DepartmentResponse])
async def get_department_descendants(
    department_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all descendants of a department (entire subtree)"""
    service = DepartmentService(db)

    # Verify department exists
    department = await service.get_by_id(department_id)
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    descendants = await service.get_descendants(department_id)
    return descendants


@router.get("/{department_id}/ancestors", response_model=list[DepartmentResponse])
async def get_department_ancestors(
    department_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all ancestors of a department (path to root)"""
    service = DepartmentService(db)

    # Verify department exists
    department = await service.get_by_id(department_id)
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    ancestors = await service.get_ancestors(department_id)
    return ancestors


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    department_data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new department"""
    service = DepartmentService(db)

    try:
        department = await service.create(department_data)
        return department
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: UUID,
    department_data: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update department"""
    service = DepartmentService(db)

    try:
        department = await service.update(department_id, department_data)

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

        return department
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete department and all descendants (cascade delete)"""
    service = DepartmentService(db)
    success = await service.delete(department_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    return None
