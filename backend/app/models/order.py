from datetime import datetime, timezone
from sqlalchemy import (
    String, Text, Numeric, DateTime, Enum, ForeignKey, Integer, SmallInteger,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class OrderStatus(str, enum.Enum):
    """Maps 1-to-1 with the 8-stage sequence diagram."""
    WAITING_COURIER = "waiting_courier"
    COURIER_ASSIGNED = "courier_assigned"
    PHOTO_UPLOADED = "photo_uploaded"
    CONFIRMED = "confirmed"
    PICKED_UP = "picked_up"
    HANDED_TO_CARRIER = "handed_to_carrier"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CargoSize(str, enum.Enum):
    SMALL = "small"
    LARGE = "large"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Participants
    client_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    courier_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    carrier_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )

    # Part details (one part per order — matches the diagram flow)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    drom_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    car_brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    car_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    car_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    body_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    part_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    part_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Seller location
    seller_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    seller_lat: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    seller_lng: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)

    # Delivery destination
    delivery_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    delivery_lat: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    delivery_lng: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)

    # Pricing
    part_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    service_fee: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    delivery_fee: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    total_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    cargo_size: Mapped[CargoSize] = mapped_column(
        Enum(CargoSize, values_callable=lambda x: [e.value for e in x]),
        default=CargoSize.SMALL, nullable=False,
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, values_callable=lambda x: [e.value for e in x]),
        default=OrderStatus.WAITING_COURIER, nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False,
    )

    client = relationship("User", foreign_keys=[client_id], lazy="selectin")
    courier = relationship("User", foreign_keys=[courier_id], lazy="selectin")
    carrier = relationship("User", foreign_keys=[carrier_id], lazy="selectin")
    photos: Mapped[list["OrderPhoto"]] = relationship(
        back_populates="order", lazy="selectin", cascade="all, delete-orphan",
    )
    review: Mapped["Review | None"] = relationship(
        back_populates="order", uselist=False, lazy="selectin",
    )


class OrderPhoto(Base):
    __tablename__ = "order_photos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    file_key: Mapped[str] = mapped_column(String(512), nullable=False)
    file_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    uploaded_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False,
    )

    order: Mapped["Order"] = relationship(back_populates="photos")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False,
    )
    client_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    courier_rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    service_rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False,
    )

    order: Mapped["Order"] = relationship(back_populates="review")
    client = relationship("User", lazy="selectin")
