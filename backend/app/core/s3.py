import boto3
from botocore.config import Config
from app.core.config import settings

s3_client = boto3.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    verify=False,
    config=Config(signature_version="s3v4"),
)

BUCKET = settings.S3_BUCKET


def ensure_bucket():
    try:
        s3_client.head_bucket(Bucket=BUCKET)
    except Exception:
        s3_client.create_bucket(Bucket=BUCKET)


def upload_fileobj(file_obj, key: str, content_type: str) -> str:
    s3_client.upload_fileobj(
        file_obj,
        BUCKET,
        key,
        ExtraArgs={"ContentType": content_type},
    )
    return f"{settings.S3_ENDPOINT}/{BUCKET}/{key}"
