import boto3
from botocore.config import Config
from app.core.config import settings

_addressing_style = settings.S3_ADDRESSING_STYLE.lower()
if _addressing_style not in {"virtual", "path", "auto"}:
    _addressing_style = "virtual"

s3_client = boto3.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    region_name=settings.S3_REGION,
    verify=settings.S3_VERIFY_SSL,
    config=Config(signature_version="s3v4", s3={"addressing_style": _addressing_style}),
)

BUCKET = settings.S3_BUCKET


def ensure_bucket():
    try:
        s3_client.head_bucket(Bucket=BUCKET)
    except Exception:
        s3_client.create_bucket(Bucket=BUCKET)


def upload_fileobj(file_obj, key: str, content_type: str) -> str:
    extra_args = {"ContentType": content_type}
    if settings.S3_UPLOAD_ACL:
        extra_args["ACL"] = settings.S3_UPLOAD_ACL

    s3_client.upload_fileobj(
        file_obj,
        BUCKET,
        key,
        ExtraArgs=extra_args,
    )

    public_base = (settings.S3_PUBLIC_BASE_URL or "").rstrip("/")
    normalized_key = key.lstrip("/")
    if public_base:
        return f"{public_base}/{normalized_key}"

    endpoint = settings.S3_ENDPOINT.rstrip("/")
    if _addressing_style == "path":
        return f"{endpoint}/{BUCKET}/{normalized_key}"
    bucket_prefix = f"://{BUCKET}."
    if bucket_prefix in endpoint:
        return f"{endpoint}/{normalized_key}"
    return f"{endpoint.replace('://', bucket_prefix, 1)}/{normalized_key}"
