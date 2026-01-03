"""
SmartTask360 — Pagination Utilities

Minimal pagination helpers for query results.
"""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Standard pagination parameters"""

    skip: int = 0
    limit: int = 20

    @property
    def offset(self) -> int:
        """Alias for skip (for clarity)"""
        return self.skip

    @property
    def page(self) -> int:
        """Convert skip/limit to page number (1-indexed)"""
        if self.limit == 0:
            return 1
        return (self.skip // self.limit) + 1


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper"""

    items: list[T]
    total: int
    skip: int
    limit: int

    @property
    def page(self) -> int:
        """Current page number (1-indexed)"""
        if self.limit == 0:
            return 1
        return (self.skip // self.limit) + 1

    @property
    def pages(self) -> int:
        """Total number of pages"""
        if self.limit == 0:
            return 1
        return (self.total + self.limit - 1) // self.limit

    @property
    def has_next(self) -> bool:
        """Check if there are more pages"""
        return self.skip + self.limit < self.total

    @property
    def has_prev(self) -> bool:
        """Check if there are previous pages"""
        return self.skip > 0
