from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base  # noqa: F401


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    USER = "user"
    PICKER = "picker"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.USER, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    picker_profile: Mapped["PickerProfile | None"] = relationship(
        back_populates="user", uselist=False, lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username})>"


class PickerProfile(Base):
    __tablename__ = "picker_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False,
    )
    selection_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    inspection_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    purchase_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    delivery_small_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    delivery_large_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    user: Mapped["User"] = relationship(back_populates="picker_profile")
