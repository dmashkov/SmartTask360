"""
SmartTask360 — Users API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate
from app.modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user's profile"""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current authenticated user's profile"""
    service = UserService(db)

    # Check if email is being changed and already exists
    if user_data.email and user_data.email != current_user.email:
        existing = await service.get_by_email(user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

    user = await service.update(current_user.id, user_data)
    return user


@router.get("/", response_model=list[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all users with pagination (requires authentication)"""
    service = UserService(db)
    users = await service.get_all(skip=skip, limit=limit)
    return users


@router.get("/search", response_model=list[UserResponse])
async def search_users(
    q: str,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search users by name or email for @mention autocomplete.
    Returns up to `limit` matching users.
    """
    service = UserService(db)
    users = await service.search(query=q, limit=min(limit, 20))
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user by ID (requires authentication)"""
    service = UserService(db)
    user = await service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create new user"""
    service = UserService(db)

    # Check if email already exists
    existing = await service.get_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = await service.create(user_data)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user (requires authentication)"""
    service = UserService(db)

    # Check if email is being changed and already exists
    if user_data.email:
        existing = await service.get_by_email(user_data.email)
        if existing and existing.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

    user = await service.update(user_id, user_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete user (requires authentication, admin only in future)"""
    service = UserService(db)
    success = await service.delete(user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return None
