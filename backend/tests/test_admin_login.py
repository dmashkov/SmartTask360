"""
Test admin login
"""

import asyncio

from sqlalchemy import select

from app.core.database import async_session_maker
from app.core.security import create_access_token, create_refresh_token, verify_password
from app.modules.users.models import User


async def test_login():
    """Test admin login flow"""
    print("=" * 60)
    print("Testing Admin Login Flow")
    print("=" * 60)

    email = "admin@smarttask360.com"
    password = "Admin123!"

    async with async_session_maker() as session:
        # Step 1: Find user by email
        print(f"\n1️⃣  Looking up user: {email}")
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            print(f"❌ User not found!")
            return

        print(f"✅ User found: {user.name} ({user.role})")

        # Step 2: Verify password
        print(f"\n2️⃣  Verifying password...")
        is_valid = verify_password(password, user.password_hash)

        if not is_valid:
            print(f"❌ Invalid password!")
            return

        print(f"✅ Password valid!")

        # Step 3: Generate tokens
        print(f"\n3️⃣  Generating JWT tokens...")
        access_token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        print(f"✅ Tokens generated successfully!")
        print(f"\n📋 Authentication Result:")
        print(f"   User ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.name}")
        print(f"   Role: {user.role}")
        print(f"\n🔑 Access Token (первые 50 символов):")
        print(f"   {access_token[:50]}...")
        print(f"\n🔄 Refresh Token (первые 50 символов):")
        print(f"   {refresh_token[:50]}...")

        print(f"\n✅ Login successful! User authenticated.")


if __name__ == "__main__":
    asyncio.run(test_login())
