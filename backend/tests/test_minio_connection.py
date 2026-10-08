"""
Test MinIO connection and bucket creation
"""

import pytest
from minio import Minio
from minio.error import S3Error

from app.core.config import settings


def test_minio_bucket():
    client = Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )

    try:
        client.list_buckets()
    except Exception as e:  # connection refused, DNS, etc.
        pytest.skip(f"MinIO is not reachable at {settings.MINIO_ENDPOINT}: {e}")

    assert settings.MINIO_BUCKET.endswith("-test"), "tests must not use the dev bucket"
    try:
        if not client.bucket_exists(settings.MINIO_BUCKET):
            client.make_bucket(settings.MINIO_BUCKET)
    except S3Error as e:
        pytest.fail(f"MinIO error: {e}")

    assert client.bucket_exists(settings.MINIO_BUCKET)
