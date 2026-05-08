"""Initial schema from current ORM models.

Revision ID: 001
Revises: None
Create Date: 2026-05-08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


userrole = sa.Enum("client", "courier", "carrier", "admin", name="userrole")
orderstatus = sa.Enum(
    "waiting_courier",
    "courier_assigned",
    "photo_uploaded",
    "confirmed",
    "picked_up",
    "handed_to_carrier",
    "completed",
    "cancelled",
    name="orderstatus",
)
cargosize = sa.Enum("small", "large", name="cargosize")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("role", userrole, server_default="client", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "courier_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("pickup_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("inspection_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("delivery_price", sa.Numeric(10, 2), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("courier_id", sa.Integer(), nullable=True),
        sa.Column("carrier_id", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("drom_url", sa.String(length=2048), nullable=True),
        sa.Column("car_brand", sa.String(length=100), nullable=True),
        sa.Column("car_model", sa.String(length=100), nullable=True),
        sa.Column("car_year", sa.Integer(), nullable=True),
        sa.Column("body_type", sa.String(length=100), nullable=True),
        sa.Column("part_name", sa.String(length=200), nullable=True),
        sa.Column("part_number", sa.String(length=100), nullable=True),
        sa.Column("seller_address", sa.String(length=500), nullable=True),
        sa.Column("seller_lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("seller_lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("delivery_address", sa.String(length=500), nullable=True),
        sa.Column("delivery_lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("delivery_lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("part_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("service_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("delivery_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("total_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("cargo_size", cargosize, server_default="small", nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("status", orderstatus, server_default="waiting_courier", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["carrier_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["client_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["courier_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_orders_carrier_id"), "orders", ["carrier_id"], unique=False)
    op.create_index(op.f("ix_orders_client_id"), "orders", ["client_id"], unique=False)
    op.create_index(op.f("ix_orders_courier_id"), "orders", ["courier_id"], unique=False)

    op.create_table(
        "order_photos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("file_key", sa.String(length=512), nullable=False),
        sa.Column("file_url", sa.String(length=2048), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_photos_order_id"), "order_photos", ["order_id"], unique=False)

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("courier_rating", sa.SmallInteger(), nullable=False),
        sa.Column("service_rating", sa.SmallInteger(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id"),
    )
    op.create_index(op.f("ix_reviews_client_id"), "reviews", ["client_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_reviews_client_id"), table_name="reviews")
    op.drop_table("reviews")
    op.drop_index(op.f("ix_order_photos_order_id"), table_name="order_photos")
    op.drop_table("order_photos")
    op.drop_index(op.f("ix_orders_courier_id"), table_name="orders")
    op.drop_index(op.f("ix_orders_client_id"), table_name="orders")
    op.drop_index(op.f("ix_orders_carrier_id"), table_name="orders")
    op.drop_table("orders")
    op.drop_table("courier_profiles")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    cargosize.drop(op.get_bind(), checkfirst=True)
    orderstatus.drop(op.get_bind(), checkfirst=True)
    userrole.drop(op.get_bind(), checkfirst=True)
