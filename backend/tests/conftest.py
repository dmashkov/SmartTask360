"""
SmartTask360 — shared test fixtures.

Tests run against an isolated database (`<dev db name>_test`) that is created from
scratch with Alembic migrations at the start of the session. The development
database is never touched. The FastAPI app is called in-process through
ASGITransport, so no running server is needed.

Every test runs inside an outer transaction that is rolled back afterwards; the
app's `commit()` calls only release SAVEPOINTs, so tests do not see each other's data.
"""

import asyncio
import os
from urllib.parse import urlsplit, urlunsplit

# --- Point the app at the test database BEFORE any app module is imported -------------
_base_url = os.environ.get(
    "DATABASE_URL", "postgresql+asyncpg://smarttask:smarttask@localhost:5432/smarttask360"
)
_parts = urlsplit(_base_url)
_dev_db = _parts.path.lstrip("/")
TEST_DB_NAME = os.environ.get("TEST_DB_NAME", f"{_dev_db.removesuffix('_test')}_test")
TEST_DATABASE_URL = urlunsplit(_parts._replace(path=f"/{TEST_DB_NAME}"))

if not TEST_DB_NAME.endswith("_test"):
    raise RuntimeError(f"Refusing to run tests against non-test database {TEST_DB_NAME!r}")

os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["MINIO_BUCKET"] = "documents-test"
os.environ["ANTHROPIC_API_KEY"] = ""  # AI calls must be mocked in tests

import asyncpg  # noqa: E402
import httpx  # noqa: E402
import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: E402

from app.core import database as database_module  # noqa: E402
from app.core import dependencies as dependencies_module  # noqa: E402
from app.core.database import engine  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.core.types import UserRole  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.users.models import User  # noqa: E402

API_PREFIX = "/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"
_ADMIN_HASH = get_password_hash(ADMIN_PASSWORD)  # bcrypt is slow: hash once per session


def _asyncpg_dsn(db_name: str) -> str:
    return urlunsplit(_parts._replace(scheme="postgresql", path=f"/{db_name}"))


async def _recreate_test_database() -> None:
    conn = await asyncpg.connect(_asyncpg_dsn("postgres"))
    try:
        await conn.execute(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1",
            TEST_DB_NAME,
        )
        await conn.execute(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"')
        await conn.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        await conn.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _test_database():
    """Create the test database and apply all migrations once per session."""
    await _recreate_test_database()

    cfg = Config("alembic.ini")
    # alembic's env.py calls asyncio.run(), so it must run outside the event loop
    await asyncio.to_thread(command.upgrade, cfg, "head")

    yield

    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def db_session(_test_database):
    """Per-test session inside a rolled-back transaction, with the admin user seeded."""
    async with engine.connect() as conn:
        outer = await conn.begin()
        session = AsyncSession(
            bind=conn, join_transaction_mode="create_savepoint", expire_on_commit=False
        )

        async def _override_get_db():
            yield session

        app.dependency_overrides[dependencies_module.get_db] = _override_get_db
        app.dependency_overrides[database_module.get_db] = _override_get_db

        session.add(
            User(
                email=ADMIN_EMAIL,
                password_hash=_ADMIN_HASH,
                name="Системный администратор",
                role=UserRole.ADMIN,
                is_active=True,
            )
        )
        await session.commit()

        yield session

        app.dependency_overrides.clear()
        await session.close()
        await outer.rollback()


@pytest_asyncio.fixture
async def client():
    """Unauthenticated HTTP client bound to the in-process app."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url=f"http://test{API_PREFIX}", timeout=30.0
    ) as c:
        yield c


@pytest_asyncio.fixture
async def admin_tokens(client: httpx.AsyncClient) -> dict:
    response = await client.post(
        "/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()


@pytest.fixture
def auth_headers(admin_tokens: dict) -> dict:
    return {"Authorization": f"Bearer {admin_tokens['access_token']}"}


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    return (
        await db_session.execute(select(User).where(User.email == ADMIN_EMAIL))
    ).scalar_one()


@pytest_asyncio.fixture
async def make_task(client: httpx.AsyncClient, auth_headers: dict):
    """Factory: create a task through the API and return its JSON."""
    counter = 0

    async def _make(**overrides) -> dict:
        nonlocal counter
        counter += 1
        payload = {"title": f"Test task {counter}", "priority": "medium"}
        payload.update(overrides)
        response = await client.post("/tasks/", json=payload, headers=auth_headers)
        assert response.status_code == 201, f"Create task failed: {response.text}"
        return response.json()

    return _make


class FakeAI:
    """Replaces the Anthropic-backed AIClient. Queue canned replies with `.reply(...)`."""

    def __init__(self) -> None:
        self._queue: list[str | Exception] = []
        self.default = "OK"
        self.calls: list[dict] = []

    def reply(self, content: "str | dict | Exception") -> "FakeAI":
        """Queue the next reply. dicts are serialised to JSON; an Exception is raised."""
        import json

        self._queue.append(json.dumps(content) if isinstance(content, dict) else content)
        return self

    async def send_message(self, messages, model=None, temperature=0.5, max_tokens=4096, system=None):
        self.calls.append({"messages": messages, "system": system, "temperature": temperature})
        item = self._queue.pop(0) if self._queue else self.default
        if isinstance(item, Exception):
            raise item
        return {
            "content": item,
            "model": "fake-model",
            "stop_reason": "end_turn",
            "usage": {"input_tokens": 10, "output_tokens": 20},
        }

    async def validate_smart(self, task_title, task_description, context=None, custom_prompt=None, language="ru"):
        return await self.send_message([{"role": "user", "content": task_title}], temperature=0.3)


@pytest.fixture
def fake_ai(monkeypatch) -> FakeAI:
    from app.modules.ai.client import AIClient

    fake = FakeAI()

    async def send_message(self, *args, **kwargs):
        return await fake.send_message(*args, **kwargs)

    async def validate_smart(self, *args, **kwargs):
        return await fake.validate_smart(*args, **kwargs)

    monkeypatch.setattr(AIClient, "send_message", send_message)
    monkeypatch.setattr(AIClient, "validate_smart", validate_smart)
    return fake


GOOD_SMART_RESULT = {
    "overall_score": 0.82,
    "is_valid": True,
    "criteria": [
        {"name": n, "score": 0.8, "explanation": f"{n} is fine", "suggestions": []}
        for n in "SMART"
    ],
    "summary": "Well defined task",
    "recommended_changes": ["Add a deadline"],
    "acceptance_criteria": [{"description": "Login works", "verification": "Manual test"}],
}
