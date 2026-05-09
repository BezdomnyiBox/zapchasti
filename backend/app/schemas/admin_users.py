from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


class AdminUserCreateRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.CLIENT
    phone: str | None = Field(None, max_length=20)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace("_", "").isalnum():
            raise ValueError("username может содержать только буквы, цифры и _")
        return v


class AdminUserRoleUpdateRequest(BaseModel):
    role: UserRole


class AdminUserResponse(BaseModel):
    id: int
    email: str
    username: str
    phone: str | None
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


class AdminUsersListResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int
    limit: int
    offset: int
