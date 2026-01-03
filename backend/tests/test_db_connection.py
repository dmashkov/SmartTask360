"""
Test database connection and ltree extension
"""

import asyncio
from sqlalchemy import text

from app.core.database import async_session_maker


async def test_connection():
    """Test database connection and ltree extension."""
    print("Testing database connection...")

    async with async_session_maker() as session:
        # Test basic connection
        result = await session.execute(text("SELECT 1"))
        print(f"✅ Database connection successful: {result.scalar()}")

        # Test ltree extension
        result = await session.execute(
            text("SELECT 'root.child.grandchild'::ltree AS path")
        )
        path = result.scalar()
        print(f"✅ ltree extension working: {path}")

        # Test pg_trgm extension
        result = await session.execute(
            text("SELECT similarity('test', 'text') AS similarity")
        )
        similarity = result.scalar()
        print(f"✅ pg_trgm extension working: similarity = {similarity}")

        # Get database version
        result = await session.execute(text("SELECT version()"))
        version = result.scalar()
        print(f"✅ PostgreSQL version: {version.split(',')[0]}")


if __name__ == "__main__":
    asyncio.run(test_connection())
