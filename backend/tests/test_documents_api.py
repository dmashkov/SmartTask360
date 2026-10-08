"""
Test Documents API endpoints (upload, download, metadata, stats, delete).
Requires MinIO; tests are skipped when it is not reachable.
"""

import io

import pytest
from minio import Minio

from app.core.config import settings

MISSING_ID = "00000000-0000-0000-0000-000000000000"


@pytest.fixture(scope="module", autouse=True)
def _require_minio():
    client = Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )
    try:
        client.list_buckets()
    except Exception as e:
        pytest.skip(f"MinIO is not reachable at {settings.MINIO_ENDPOINT}: {e}")


@pytest.fixture
async def task(make_task):
    return await make_task(title="Product launch presentation", priority="high")


@pytest.fixture
async def upload(client, auth_headers, task):
    async def _upload(filename: str, content: bytes, mime: str, **form) -> dict:
        response = await client.post(
            "/documents/upload",
            files={"file": (filename, io.BytesIO(content), mime)},
            data={"task_id": task["id"], **form},
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _upload


async def test_upload_document(upload):
    content = b"fastapi>=0.104.0\nsqlalchemy>=2.0.0"
    doc = await upload("requirements.txt", content, "text/plain", description="Dependencies")
    assert doc["original_filename"] == "requirements.txt"
    assert doc["file_size"] == len(content)
    assert doc["mime_type"] == "text/plain"
    assert doc["description"] == "Dependencies"


async def test_upload_requires_auth(client, task):
    response = await client.post(
        "/documents/upload",
        files={"file": ("a.txt", io.BytesIO(b"x"), "text/plain")},
        data={"task_id": task["id"]},
    )
    assert response.status_code in (401, 403)


async def test_list_and_stats(client, auth_headers, task, upload):
    await upload("a.txt", b"aaa", "text/plain")
    await upload("b.json", b'{"v": 1}', "application/json")

    response = await client.get(f"/documents/tasks/{task['id']}/documents", headers=auth_headers)
    assert response.status_code == 200
    assert {d["original_filename"] for d in response.json()} == {"a.txt", "b.json"}

    stats = await client.get(f"/documents/tasks/{task['id']}/stats", headers=auth_headers)
    assert stats.status_code == 200
    assert stats.json()["total_count"] == 2
    assert stats.json()["total_size"] == 3 + len(b'{"v": 1}')


async def test_get_metadata(client, auth_headers, upload):
    doc = await upload("README.md", b"# SmartTask360", "text/markdown")
    response = await client.get(f"/documents/{doc['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["original_filename"] == "README.md"


async def test_download_returns_original_content(client, auth_headers, upload):
    content = b"fastapi>=0.104.0\nalembic>=1.12.0"
    doc = await upload("requirements.txt", content, "text/plain")
    response = await client.get(f"/documents/{doc['id']}/download", headers=auth_headers)
    assert response.status_code == 200
    assert response.content == content


async def test_download_non_ascii_filename(client, auth_headers, upload):
    doc = await upload("Отчёт по проекту.txt", "содержимое".encode(), "text/plain")
    response = await client.get(f"/documents/{doc['id']}/download", headers=auth_headers)
    assert response.status_code == 200
    disposition = response.headers["content-disposition"]
    assert "filename*=UTF-8''" in disposition


async def test_update_description(client, auth_headers, upload):
    doc = await upload("a.txt", b"a", "text/plain")
    response = await client.patch(
        f"/documents/{doc['id']}", json={"description": "Updated"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["description"] == "Updated"


async def test_delete_document(client, auth_headers, task, upload):
    doc = await upload("a.txt", b"a", "text/plain")
    assert (await client.delete(f"/documents/{doc['id']}", headers=auth_headers)).status_code == 204
    remaining = (
        await client.get(f"/documents/tasks/{task['id']}/documents", headers=auth_headers)
    ).json()
    assert doc["id"] not in [d["id"] for d in remaining]


async def test_missing_document_returns_404(client, auth_headers):
    assert (await client.get(f"/documents/{MISSING_ID}", headers=auth_headers)).status_code == 404
    assert (
        await client.get(f"/documents/{MISSING_ID}/download", headers=auth_headers)
    ).status_code == 404
