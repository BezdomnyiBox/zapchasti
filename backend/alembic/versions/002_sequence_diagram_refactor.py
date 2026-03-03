"""Refactor to match 8-stage sequence diagram

Revision ID: 002
Revises: 001
Create Date: 2026-03-04

Destructive migration: drops old task/item tables, recreates orders
with flat structure, adds reviews. MVP pre-production only.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, Sequence[str], None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- 1. Drop old tables ---
    op.execute("DROP TABLE IF EXISTS order_photos CASCADE")
    op.execute("DROP TABLE IF EXISTS delivery_tasks CASCADE")
    op.execute("DROP TABLE IF EXISTS pickup_tasks CASCADE")
    op.execute("DROP TABLE IF EXISTS selection_tasks CASCADE")
    op.execute("DROP TABLE IF EXISTS order_items CASCADE")
    op.execute("DROP TABLE IF EXISTS orders CASCADE")
    op.execute("DROP TABLE IF EXISTS picker_profiles CASCADE")
    op.execute("DROP TABLE IF EXISTS reviews CASCADE")

    # --- 2. Drop orphaned enum types ---
    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute("DROP TYPE IF EXISTS taskstatus")
    op.execute("DROP TYPE IF EXISTS cargosize")
    op.execute("DROP TYPE IF EXISTS order_item_status")

    # --- 3. Update user role enum ---
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("CREATE TYPE userrole AS ENUM ('client', 'courier', 'carrier', 'admin')")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING 'client'::userrole")
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'client'")

    # --- 4. Create courier_profiles ---
    op.create_table(
        "courier_profiles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"),
                  unique=True, nullable=False),
        sa.Column("pickup_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("inspection_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("delivery_price", sa.Numeric(10, 2), nullable=True),
    )

    # --- 5. Create new orders (flat, 8-stage statuses) ---
    _orderstatus = sa.Enum(
        "waiting_courier", "courier_assigned", "photo_uploaded",
        "confirmed", "picked_up", "handed_to_carrier",
        "completed", "cancelled",
        name="orderstatus",
    )
    _cargosize = sa.Enum("small", "large", name="cargosize")

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        # Participants
        sa.Column("client_id", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("courier_id", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="SET NULL"),
                  nullable=True, index=True),
        sa.Column("carrier_id", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="SET NULL"),
                  nullable=True, index=True),
        # Part details
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("drom_url", sa.String(2048), nullable=True),
        sa.Column("car_brand", sa.String(100), nullable=True),
        sa.Column("car_model", sa.String(100), nullable=True),
        sa.Column("car_year", sa.Integer, nullable=True),
        sa.Column("body_type", sa.String(100), nullable=True),
        sa.Column("part_name", sa.String(200), nullable=True),
        sa.Column("part_number", sa.String(100), nullable=True),
        # Seller location
        sa.Column("seller_address", sa.String(500), nullable=True),
        sa.Column("seller_lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("seller_lng", sa.Numeric(10, 7), nullable=True),
        # Delivery destination
        sa.Column("delivery_address", sa.String(500), nullable=True),
        sa.Column("delivery_lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("delivery_lng", sa.Numeric(10, 7), nullable=True),
        # Pricing
        sa.Column("part_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("service_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("delivery_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("total_price", sa.Numeric(12, 2), nullable=True),
        # Meta
        sa.Column("cargo_size", _cargosize, nullable=False, server_default="small"),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("status", _orderstatus, nullable=False, server_default="waiting_courier"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )

    # --- 6. Create order_photos (simplified, references order directly) ---
    op.create_table(
        "order_photos",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer,
                  sa.ForeignKey("orders.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("file_key", sa.String(512), nullable=False),
        sa.Column("file_url", sa.String(2048), nullable=False),
        sa.Column("uploaded_by", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )

    # --- 7. Create reviews ---
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer,
                  sa.ForeignKey("orders.id", ondelete="CASCADE"),
                  unique=True, nullable=False),
        sa.Column("client_id", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("courier_rating", sa.SmallInteger, nullable=False),
        sa.Column("service_rating", sa.SmallInteger, nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("reviews")
    op.drop_table("order_photos")
    op.drop_table("orders")
    op.drop_table("courier_profiles")

    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute("DROP TYPE IF EXISTS cargosize")

    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("CREATE TYPE userrole AS ENUM ('USER', 'PICKER', 'ADMIN')")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING 'USER'::userrole")
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER'")
