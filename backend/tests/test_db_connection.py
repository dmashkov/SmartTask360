"""
Test database connection and PostgreSQL extensions
"""

from sqlalchemy import text



async def test_connection_uses_test_database(db_session):
    assert (await db_session.execute(text("SELECT 1"))).scalar() == 1
    db_name = (await db_session.execute(text("SELECT current_database()"))).scalar()
    assert db_name.endswith("_test")


async def test_ltree_extension(db_session):
    path = (await db_session.execute(text("SELECT 'root.child.grandchild'::ltree"))).scalar()
    assert str(path) == "root.child.grandchild"


async def test_pg_trgm_extension(db_session):
    similarity = (await db_session.execute(text("SELECT similarity('test', 'text')"))).scalar()
    assert 0 < similarity <= 1
