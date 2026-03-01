from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str  # postgresql://...
    REDIS_URL: str

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """URL для async движка (asyncpg)."""
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.DATABASE_URL
    SECRET_KEY: str
    S3_ENDPOINT: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()