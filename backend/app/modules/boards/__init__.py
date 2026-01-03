"""
SmartTask360 — Boards module (Kanban boards)
"""

from app.modules.boards.models import Board, BoardColumn, BoardTask, BoardMember
from app.modules.boards.router import router
from app.modules.boards.service import BoardService

__all__ = [
    "Board",
    "BoardColumn",
    "BoardTask",
    "BoardMember",
    "BoardService",
    "router",
]
