from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.user import UserRole


class UserCreate(BaseModel):
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
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    phone: str | None = None
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    phone: str | None = Field(None, max_length=20)


class CourierProfileResponse(BaseModel):
    pickup_price: float | None = None
    inspection_price: float | None = None
    delivery_price: float | None = None

    model_config = {"from_attributes": True}


class CourierProfileUpdate(BaseModel):
    pickup_price: float | None = Field(None, ge=0)
    inspection_price: float | None = Field(None, ge=0)
    delivery_price: float | None = Field(None, ge=0)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: int
    role: str
    type: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str
