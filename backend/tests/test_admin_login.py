"""
Test admin login flow at the service level (DB lookup, password check, token generation)
"""

from sqlalchemy import select

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.modules.users.models import User
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD


async def test_admin_login_flow(db_session):
    user = (await db_session.execute(select(User).where(User.email == ADMIN_EMAIL))).scalar_one()

    assert verify_password(ADMIN_PASSWORD, user.password_hash)
    assert not verify_password("wrong", user.password_hash)

    access = decode_token(
        create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    )
    refresh = decode_token(create_refresh_token({"sub": str(user.id)}))

    assert access["sub"] == str(user.id)
    assert refresh["type"] == "refresh"
