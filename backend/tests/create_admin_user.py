"""
Create first admin user
"""

import asyncio
from uuid import uuid4

from app.core.database import async_session_maker
from app.core.security import get_password_hash
from app.core.types import UserRole
from app.modules.users.models import User


async def create_admin():
    """Create first admin user"""
    print("Creating first admin user...")

    async with async_session_maker() as session:
        # Check if admin already exists
        from sqlalchemy import select

        result = await session.execute(select(User).where(User.email == "admin@smarttask360.com"))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"❌ Admin user already exists: {existing.email}")
            return

        # Create admin user
        admin = User(
            id=uuid4(),
            email="admin@smarttask360.com",
            password_hash=get_password_hash("Admin123!"),
            name="Системный администратор",
            role=UserRole.ADMIN,
            is_active=True,
        )

        session.add(admin)
        await session.commit()
        await session.refresh(admin)

        print(f"✅ Admin user created successfully!")
        print(f"   Email: {admin.email}")
        print(f"   Name: {admin.name}")
        print(f"   Role: {admin.role}")
        print(f"   ID: {admin.id}")
        print(f"\n📝 Login credentials:")
        print(f"   Email: admin@smarttask360.com")
        print(f"   Password: Admin123!")


if __name__ == "__main__":
    asyncio.run(create_admin())
