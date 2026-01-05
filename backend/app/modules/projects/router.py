"""
SmartTask360 — Project router
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.types import ProjectMemberRole, ProjectStatus, UserRole
from app.modules.projects.schemas import (
    ProjectCreate,
    ProjectFilters,
    ProjectListResponse,
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectMemberUpdate,
    ProjectResponse,
    ProjectUpdate,
    ProjectWithStats,
)
from app.modules.projects.service import ProjectService
from app.modules.users.models import User

router = APIRouter(prefix="/projects", tags=["projects"])


# ============================================================
# Project CRUD
# ============================================================


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project"""
    service = ProjectService(db)

    # Check if code already exists
    existing = await service.get_by_code(data.code)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Project with code '{data.code}' already exists",
        )

    project = await service.create(data, current_user.id)
    return ProjectResponse.model_validate(project)


@router.get("", response_model=list[ProjectListResponse])
async def list_projects(
    status: ProjectStatus | None = None,
    owner_id: UUID | None = None,
    department_id: UUID | None = None,
    search: str | None = None,
    include_archived: bool = False,
    my_projects: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List projects with filters.
    By default, only returns projects where current user is a member.
    Set my_projects=false to see all projects (for admins).
    """
    service = ProjectService(db)

    filters = ProjectFilters(
        status=status,
        owner_id=owner_id,
        department_id=department_id,
        search=search,
        include_archived=include_archived,
    )

    user_id = current_user.id if my_projects else None
    projects, total = await service.get_all(filters, user_id, skip, limit)

    result = []
    for project in projects:
        # Get quick stats
        stats = await service.get_stats(project.id)
        result.append(
            ProjectListResponse(
                id=project.id,
                name=project.name,
                code=project.code,
                status=project.status,
                owner_id=project.owner_id,
                due_date=project.due_date,
                created_at=project.created_at,
                task_count=stats.total_tasks,
                member_count=stats.total_members,
            )
        )

    return result


@router.get("/{project_id}", response_model=ProjectWithStats)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project by ID with statistics"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stats = await service.get_stats(project_id)

    return ProjectWithStats(
        **ProjectResponse.model_validate(project).model_dump(),
        stats=stats,
    )


@router.get("/by-code/{code}", response_model=ProjectWithStats)
async def get_project_by_code(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project by code with statistics"""
    service = ProjectService(db)

    project = await service.get_by_code(code)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stats = await service.get_stats(project.id)

    return ProjectWithStats(
        **ProjectResponse.model_validate(project).model_dump(),
        stats=stats,
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a project"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check permission: system admin, project owner, or project admin
    is_system_admin = str(current_user.role) == UserRole.ADMIN.value
    has_project_permission = await service.has_role(
        project_id, current_user.id, [ProjectMemberRole.OWNER, ProjectMemberRole.ADMIN]
    )
    if not is_system_admin and not has_project_permission and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this project")

    # Check code uniqueness if changing
    if data.code and data.code.upper() != project.code:
        existing = await service.get_by_code(data.code)
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Project with code '{data.code}' already exists",
            )

    updated = await service.update(project_id, data)
    return ProjectResponse.model_validate(updated)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project (soft delete)"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only owner or system admin can delete
    is_system_admin = str(current_user.role) == UserRole.ADMIN.value
    if not is_system_admin and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete the project")

    await service.delete(project_id)
    return None


# ============================================================
# Project Members
# ============================================================


@router.get("/{project_id}/members", response_model=list[ProjectMemberResponse])
async def get_project_members(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all members of a project"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    members = await service.get_members(project_id)
    return [ProjectMemberResponse.model_validate(m) for m in members]


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=201)
async def add_project_member(
    project_id: UUID,
    data: ProjectMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a member to a project"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check permission: system admin, project owner, or project admin
    is_system_admin = str(current_user.role) == UserRole.ADMIN.value
    has_project_permission = await service.has_role(
        project_id, current_user.id, [ProjectMemberRole.OWNER, ProjectMemberRole.ADMIN]
    )
    if not is_system_admin and not has_project_permission:
        raise HTTPException(status_code=403, detail="Not authorized to add members")

    # Cannot add another owner
    if data.role == ProjectMemberRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot add another owner")

    member = await service.add_member(project_id, data)
    return ProjectMemberResponse.model_validate(member)


@router.patch("/{project_id}/members/{user_id}", response_model=ProjectMemberResponse)
async def update_project_member(
    project_id: UUID,
    user_id: UUID,
    data: ProjectMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a member's role"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check permission: system admin, project owner, or project admin
    is_system_admin = str(current_user.role) == UserRole.ADMIN.value
    has_project_permission = await service.has_role(
        project_id, current_user.id, [ProjectMemberRole.OWNER, ProjectMemberRole.ADMIN]
    )
    if not is_system_admin and not has_project_permission:
        raise HTTPException(status_code=403, detail="Not authorized to update members")

    # Cannot change owner role
    member = await service.get_member(project_id, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.role == ProjectMemberRole.OWNER.value:
        raise HTTPException(status_code=400, detail="Cannot change owner role")

    if data.role == ProjectMemberRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot promote to owner")

    updated = await service.update_member_role(project_id, user_id, data.role)
    return ProjectMemberResponse.model_validate(updated)


@router.delete("/{project_id}/members/{user_id}", status_code=204)
async def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a member from a project"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check permission: system admin, project owner, or project admin (or self-remove)
    is_system_admin = str(current_user.role) == UserRole.ADMIN.value
    has_project_permission = await service.has_role(
        project_id, current_user.id, [ProjectMemberRole.OWNER, ProjectMemberRole.ADMIN]
    )
    if not is_system_admin and not has_project_permission and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to remove members")

    # Cannot remove owner
    member = await service.get_member(project_id, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.role == ProjectMemberRole.OWNER.value:
        raise HTTPException(status_code=400, detail="Cannot remove owner from project")

    await service.remove_member(project_id, user_id)
    return None


# ============================================================
# Project Tasks & Boards
# ============================================================


@router.get("/{project_id}/tasks")
async def get_project_tasks(
    project_id: UUID,
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks for a project"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks, total = await service.get_project_tasks(project_id, status, skip, limit)

    return {
        "items": tasks,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{project_id}/boards")
async def get_project_boards(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all boards for a project"""
    service = ProjectService(db)

    project = await service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    boards = await service.get_project_boards(project_id)
    return boards
