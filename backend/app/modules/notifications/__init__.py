"""
SmartTask360 — Notifications module
"""

from app.modules.notifications.models import Notification, NotificationSettings
from app.modules.notifications.router import router
from app.modules.notifications.service import NotificationService

__all__ = [
    "Notification",
    "NotificationSettings",
    "NotificationService",
    "router",
]
