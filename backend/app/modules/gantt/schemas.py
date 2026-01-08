"""
SmartTask360 — Gantt Chart Schemas

Pydantic schemas for task dependencies, baselines, and Gantt data.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DependencyType(str, Enum):
    """Task dependency types"""

    FS = "FS"  # Finish-to-Start (most common)
    SS = "SS"  # Start-to-Start
    FF = "FF"  # Finish-to-Finish
    SF = "SF"  # Start-to-Finish (rare)


# ============== Task Dependency Schemas ==============


class TaskDependencyCreate(BaseModel):
    """Schema for creating a task dependency"""

    predecessor_id: UUID
    successor_id: UUID
    dependency_type: DependencyType = DependencyType.FS
    lag_days: int = Field(default=0, ge=-365, le=365)

    @field_validator("successor_id")
    @classmethod
    def validate_not_self_reference(cls, v: UUID, info) -> UUID:
        predecessor = info.data.get("predecessor_id")
        if predecessor and v == predecessor:
            raise ValueError("Task cannot depend on itself")
        return v


class TaskDependencyResponse(BaseModel):
    """Schema for task dependency response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    predecessor_id: UUID
    successor_id: UUID
    dependency_type: str
    lag_days: int
    created_at: datetime
    created_by: UUID | None


class TaskDependencyBrief(BaseModel):
    """Brief dependency info for Gantt data"""

    predecessor_id: UUID
    dependency_type: str
    lag_days: int


# ============== Task Baseline Schemas ==============


class TaskBaselineCreate(BaseModel):
    """Schema for creating a task baseline"""

    task_id: UUID
    baseline_name: str | None = Field(None, max_length=100)


class TaskBaselineResponse(BaseModel):
    """Schema for task baseline response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    baseline_number: int
    baseline_name: str | None
    planned_start_date: datetime | None
    planned_end_date: datetime | None
    estimated_hours: Decimal | None
    created_at: datetime
    created_by: UUID | None


# ============== Gantt Data Schemas ==============


class GanttTaskData(BaseModel):
    """Task data formatted for Gantt chart display"""

    id: UUID
    title: str
    status: str
    priority: str

    # Effective dates for Gantt display
    start_date: datetime | None  # Calculated from planned_start_date or started_at
    end_date: datetime | None  # Calculated from planned_end_date or due_date

    # Original fields for reference
    planned_start_date: datetime | None
    planned_end_date: datetime | None
    due_date: datetime | None
    started_at: datetime | None
    completed_at: datetime | None

    # Task properties
    is_milestone: bool
    estimated_hours: Decimal | None
    progress: int = Field(default=0, ge=0, le=100)  # 0-100%

    # Hierarchy
    parent_id: UUID | None
    depth: int

    # Dependencies (predecessors)
    dependencies: list[TaskDependencyBrief] = []

    # Critical path flag
    is_critical: bool = False

    # Assignee info
    assignee_id: UUID | None
    assignee_name: str | None = None


class GanttResponse(BaseModel):
    """Full Gantt chart data response"""

    tasks: list[GanttTaskData]
    project_id: UUID
    project_name: str | None = None

    # Date range for the chart
    min_date: datetime | None
    max_date: datetime | None

    # Critical path task IDs
    critical_path: list[UUID] = []


class BulkDependencyCreate(BaseModel):
    """Schema for creating multiple dependencies at once"""

    dependencies: list[TaskDependencyCreate]


class BulkBaselineCreate(BaseModel):
    """Schema for creating baselines for multiple tasks"""

    task_ids: list[UUID]
    baseline_name: str | None = Field(None, max_length=100)


class GanttDateUpdate(BaseModel):
    """Schema for updating task dates from Gantt drag/resize"""

    planned_start_date: datetime | None = None
    planned_end_date: datetime | None = None


class CriticalPathResponse(BaseModel):
    """Response with critical path calculation"""

    critical_path: list[UUID]  # Task IDs in order
    total_duration_days: int
    tasks: list[GanttTaskData]
