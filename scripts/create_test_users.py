#!/usr/bin/env python3
"""
Create test users for SmartTask360
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from uuid import uuid4
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.modules.users.models import User
from app.core.types import UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_test_users():
    """Create director and secretary test users"""

    test_users = [
        {
            "email": "director@smarttask360.com",
            "password": "dir",
            "name": "Director",
            "role": UserRole.ADMIN,
        },
        {
            "email": "secretary@smarttask360.com",
            "password": "sec",
            "name": "Secretary",
            "role": UserRole.MEMBER,
        },
    ]

    async with async_session() as db:
        for user_data in test_users:
            # Check if user already exists
            result = await db.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"User {user_data['email']} already exists (id: {existing.id})")
                continue

            # Create new user
            user = User(
                id=uuid4(),
                email=user_data["email"],
                password_hash=pwd_context.hash(user_data["password"]),
                name=user_data["name"],
                role=user_data["role"],
                is_active=True,
            )
            db.add(user)
            await db.commit()
            print(f"Created user {user_data['email']} (id: {user.id})")


if __name__ == "__main__":
    asyncio.run(create_test_users())
