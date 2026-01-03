"""
Test MinIO connection and create bucket
"""

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


def test_minio():
    """Test MinIO connection and create bucket."""
    print("Testing MinIO connection...")

    # Initialize MinIO client
    client = Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )

    try:
        # Test connection by listing buckets
        buckets = client.list_buckets()
        print(f"✅ MinIO connection successful")
        print(f"Existing buckets: {[bucket.name for bucket in buckets]}")

        # Create bucket if it doesn't exist
        bucket_name = settings.MINIO_BUCKET
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            print(f"✅ Bucket '{bucket_name}' created successfully")
        else:
            print(f"✅ Bucket '{bucket_name}' already exists")

        # Verify bucket exists
        buckets = client.list_buckets()
        print(f"All buckets after creation: {[bucket.name for bucket in buckets]}")

    except S3Error as e:
        print(f"❌ MinIO error: {e}")
        raise


if __name__ == "__main__":
    test_minio()
