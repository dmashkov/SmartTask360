"""
SmartTask360 — MinIO Storage Service
"""

import io
from typing import BinaryIO

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class StorageService:
    """MinIO storage service for file uploads"""

    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if not"""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as e:
            print(f"Error checking/creating bucket: {e}")

    def upload_file(
        self, file_data: BinaryIO, object_name: str, content_type: str, file_size: int
    ) -> str:
        """
        Upload file to MinIO

        Args:
            file_data: File-like object to upload
            object_name: Name/path of the object in bucket
            content_type: MIME type of the file
            file_size: Size of the file in bytes

        Returns:
            str: Path of uploaded object
        """
        try:
            self.client.put_object(
                self.bucket,
                object_name,
                file_data,
                length=file_size,
                content_type=content_type,
            )
            return object_name
        except S3Error as e:
            raise Exception(f"Failed to upload file to MinIO: {e}")

    def download_file(self, object_name: str) -> bytes:
        """
        Download file from MinIO

        Args:
            object_name: Name/path of the object in bucket

        Returns:
            bytes: File content
        """
        try:
            response = self.client.get_object(self.bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            raise Exception(f"Failed to download file from MinIO: {e}")

    def delete_file(self, object_name: str) -> bool:
        """
        Delete file from MinIO

        Args:
            object_name: Name/path of the object in bucket

        Returns:
            bool: True if deleted successfully
        """
        try:
            self.client.remove_object(self.bucket, object_name)
            return True
        except S3Error as e:
            print(f"Error deleting file from MinIO: {e}")
            return False

    def get_presigned_url(self, object_name: str, expires_seconds: int = 3600) -> str:
        """
        Get presigned URL for downloading file

        Args:
            object_name: Name/path of the object in bucket
            expires_seconds: URL expiration time in seconds (default 1 hour)

        Returns:
            str: Presigned URL
        """
        try:
            from datetime import timedelta

            url = self.client.presigned_get_object(
                self.bucket, object_name, expires=timedelta(seconds=expires_seconds)
            )
            return url
        except S3Error as e:
            raise Exception(f"Failed to generate presigned URL: {e}")


# Singleton instance
storage_service = StorageService()
