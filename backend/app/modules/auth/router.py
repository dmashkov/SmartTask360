"""
SmartTask360 — Auth API endpoints
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.schemas import LoginRequest, RefreshTokenRequest, TokenResponse
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Login endpoint.

    Authenticates user with email and password, returns JWT tokens.
    """
    service = AuthService(db)
    tokens = await service.login(credentials.email, credentials.password)
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh token endpoint.

    Accepts refresh token and returns new access token.
    """
    service = AuthService(db)
    tokens = await service.refresh_access_token(request.refresh_token)
    return tokens
