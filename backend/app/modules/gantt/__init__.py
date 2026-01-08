"""
SmartTask360 — Gantt Chart Module

Provides task dependencies, baselines, and Gantt visualization support.
"""

from app.modules.gantt.models import TaskBaseline, TaskDependency
from app.modules.gantt.router import router

__all__ = ["TaskDependency", "TaskBaseline", "router"]
