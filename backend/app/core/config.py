from pathlib import Path

from pydantic_settings import BaseSettings

# backend/app/core/config.py -> backend/ = 3 уровня вверх; корень проекта = родитель backend/
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ROOT_DIR = _BACKEND_DIR.parent
# Приоритет: .env в корне проекта, иначе backend/.env, иначе текущая директория (для Docker)
_ENV_FILE = _ROOT_DIR / ".env" if (_ROOT_DIR / ".env").exists() else _BACKEND_DIR / ".env"
if not _ENV_FILE.exists():
    _ENV_FILE = Path(".env")


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
        env_file = str(_ENV_FILE)
        extra = "ignore"

settings = Settings()