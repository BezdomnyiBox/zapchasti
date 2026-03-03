from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.user import UserRole


class UserCreate(BaseModel):
    """Регистрация пользователя."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace("_", "").isalnum():
            raise ValueError("username может содержать только буквы, цифры и _")
        return v


class UserLogin(BaseModel):
    """Логин (по username или email)."""
    username: str
    password: str


class UserResponse(BaseModel):
    """Публичные данные пользователя в ответах."""
    id: int
    email: str
    username: str
    phone: str | None = None
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    """Обновление профиля (телефон)."""
    phone: str | None = Field(None, max_length=20)


class PickerProfileResponse(BaseModel):
    """Наценки подборщика."""
    selection_price: float | None = None
    inspection_price: float | None = None
    purchase_price: float | None = None
    delivery_small_price: float | None = None
    delivery_large_price: float | None = None

    model_config = {"from_attributes": True}


class PickerProfileUpdate(BaseModel):
    """Обновление наценок подборщика."""
    selection_price: float | None = Field(None, ge=0)
    inspection_price: float | None = Field(None, ge=0)
    purchase_price: float | None = Field(None, ge=0)
    delivery_small_price: float | None = Field(None, ge=0)
    delivery_large_price: float | None = Field(None, ge=0)


class TokenPair(BaseModel):
    """Пара access + refresh токенов."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Полезная нагрузка JWT (sub, role и т.д.)."""
    sub: int
    role: str
    type: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str
