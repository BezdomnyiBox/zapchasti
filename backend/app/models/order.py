from datetime import datetime, timezone
from sqlalchemy import (
    String, Text, Numeric, Boolean, DateTime, Enum, ForeignKey, Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class OrderStatus(str, enum.Enum):
    NEW = "new"
    SELECTION = "selection"
    PICKUP = "pickup"
    DELIVERY = "delivery"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    WAITING_CLIENT = "waiting_client"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    drom_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    prepaid_to_seller: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.NEW, nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False,
    )

    client = relationship("User", backref="orders", lazy="selectin")
    selection_task = relationship("SelectionTask", back_populates="order", uselist=False, lazy="selectin")
    pickup_task = relationship("PickupTask", back_populates="order", uselist=False, lazy="selectin")
    delivery_task = relationship("DeliveryTask", back_populates="order", uselist=False, lazy="selectin")
    photos = relationship("OrderPhoto", back_populates="order", lazy="selectin")


class SelectionTask(Base):
    __tablename__ = "selection_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False,
    )
    picker_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False,
    )

    order = relationship("Order", back_populates="selection_task")
    picker = relationship("User", lazy="selectin")
    photos = relationship("OrderPhoto", back_populates="selection_task", lazy="selectin")


class PickupTask(Base):
    __tablename__ = "pickup_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False,
    )
    picker_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    seller_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    seller_lat: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    seller_lng: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    needs_inspection: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False,
    )

    order = relationship("Order", back_populates="pickup_task")
    picker = relationship("User", lazy="selectin")
    photos = relationship("OrderPhoto", back_populates="pickup_task", lazy="selectin")


class DeliveryTask(Base):
    __tablename__ = "delivery_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False,
    )
    picker_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    delivery_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_third_party_carrier: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False,
    )

    order = relationship("Order", back_populates="delivery_task")
    picker = relationship("User", lazy="selectin")


class OrderPhoto(Base):
    __tablename__ = "order_photos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    selection_task_id: Mapped[int | None] = mapped_column(
        ForeignKey("selection_tasks.id", ondelete="SET NULL"), nullable=True,
    )
    pickup_task_id: Mapped[int | None] = mapped_column(
        ForeignKey("pickup_tasks.id", ondelete="SET NULL"), nullable=True,
    )
    file_key: Mapped[str] = mapped_column(String(512), nullable=False)
    file_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    uploaded_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False,
    )

    order = relationship("Order", back_populates="photos")
    selection_task = relationship("SelectionTask", back_populates="photos")
    pickup_task = relationship("PickupTask", back_populates="photos")
