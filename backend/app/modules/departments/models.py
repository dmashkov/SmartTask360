"""
SmartTask360 — Department model
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import UserDefinedType

from app.core.database import Base


class LTREE(UserDefinedType):
    """Custom SQLAlchemy type for PostgreSQL ltree"""

    cache_ok = True

    def get_col_spec(self, **kw):
        return "LTREE"

    def bind_processor(self, dialect):
        def process(value):
            return value

        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            return value

        return process


class Department(Base):
    """
    Department model - represents organizational hierarchy.

    Uses PostgreSQL ltree for efficient hierarchical queries.
    Path format: "root_id.parent_id.dept_id"
    """

    __tablename__ = "departments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Hierarchy fields
    parent_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)
    path: Mapped[str] = mapped_column(LTREE, nullable=False, index=True)
    depth: Mapped[int] = mapped_column(nullable=False, default=0)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<Department {self.name} (depth={self.depth})>"
