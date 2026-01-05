"""
SmartTask360 — User Views Module

Saved filter views for quick access to common task filters.
"""

from app.modules.views.models import UserView
from app.modules.views.router import router
from app.modules.views.schemas import (
    UserViewCreate,
    UserViewResponse,
    UserViewUpdate,
)
from app.modules.views.service import ViewService

__all__ = [
    "UserView",
    "ViewService",
    "UserViewCreate",
    "UserViewUpdate",
    "UserViewResponse",
    "router",
]
