from pathlib import Path

import boto3

from app.core.config import settings

_client = None

# Must match backend-core's S3Service.LOCAL_PREFIX — that's what a key
# looks like when a report was uploaded without real AWS credentials
# configured (S3Service falls back to a local disk directory shared with
# this container via a Docker volume, instead of failing the upload).
LOCAL_PREFIX = "local:"


def _get_client():
    global _client
    if _client is None:
        kwargs = {"region_name": settings.AWS_REGION}
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        _client = boto3.client("s3", **kwargs)
    return _client


def download_bytes(key: str) -> bytes:
    if key.startswith(LOCAL_PREFIX):
        path = Path(settings.LOCAL_STORAGE_PATH) / key[len(LOCAL_PREFIX):]
        return path.read_bytes()

    response = _get_client().get_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
    return response["Body"].read()