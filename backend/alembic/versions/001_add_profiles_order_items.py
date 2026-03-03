"""Add profiles, order items, restructure tasks

Revision ID: 001
Revises: None
Create Date: 2026-03-04

Destructive migration: drops old task/photo/order tables and recreates them
with the new structure. Suitable for MVP pre-production only.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- 1. Drop old tables that reference orders (in dependency order) ---
    op.drop_table("order_photos")
    op.drop_table("delivery_tasks")
    op.drop_table("pickup_tasks")
    op.drop_table("selection_tasks")
    op.drop_table("orders")

    # --- 2. Alter users: add phone ---
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))

    # --- 3. Create picker_profiles ---
    op.create_table(
        "picker_profiles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"),
                  unique=True, nullable=False),
        sa.Column("selection_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("inspection_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("purchase_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("delivery_small_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("delivery_large_price", sa.Numeric(10, 2), nullable=True),
    )

    # --- 4. Recreate orders (simplified) ---
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("client_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("status", sa.Enum(
            "new", "selection", "pickup", "delivery", "closed", "cancelled",
            name="orderstatus",
            create_type=False,
        ), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )

    # --- 5. Create order_items ---
    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer, sa.ForeignKey("orders.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("drom_url", sa.String(2048), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("car_brand", sa.String(100), nullable=True),
        sa.Column("car_model", sa.String(100), nullable=True),
        sa.Column("car_year", sa.Integer, nullable=True),
        sa.Column("body_type", sa.String(100), nullable=True),
        sa.Column("part_name", sa.String(200), nullable=True),
        sa.Column("part_number", sa.String(100), nullable=True),
        sa.Column("target_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("prepaid_to_seller", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("cargo_size", sa.Enum("small", "large", name="cargosize"),
                  nullable=False, server_default="small"),
        sa.Column("status", sa.Enum(
            "new", "selection", "pickup", "delivery", "closed", "cancelled",
            name="order_item_status",
        ), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )

    # --- 6. Recreate tasks pointing to order_items ---
    op.create_table(
        "selection_tasks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("order_item_id", sa.Integer,
                  sa.ForeignKey("order_items.id", ondelete="CASCADE"),
                  unique=True, nullable=False),
        sa.Column("picker_id", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="SET NULL"),
                  nullable=True, index=True),
        sa.Column("status", sa.Enum(
            "pending", "in_progress", "waiting_client", "approved",
            "rejected", "completed", "cancelled",
            name="taskstatus", create_type=False,
        ), nullable=False, server_default="pending"),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )

    op.create_table(
        "pickup_tasks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("order_item_id", sa.Integer,
                  sa.ForeignKey("order_items.id", ondelete="CASCADE"),
                  unique=True, nullable=False),
        sa.Column("picker_id", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="SET NULL"),
                  nullable=True, index=True),
        sa.Column("seller_address", sa.String(500), nullable=True),
        sa.Column("seller_lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("seller_lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("needs_inspection", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("status", sa.Enum(
            "pending", "in_progress", "waiting_client", "approved",
            "rejected", "completed", "cancelled",
            name="taskstatus", create_type=False,
        ), nullable=False, server_default="pending"),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )

    op.create_table(
        "delivery_tasks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("order_item_id", sa.Integer,
                  sa.ForeignKey("order_items.id", ondelete="CASCADE"),
                  unique=True, nullable=False),
        sa.Column("picker_id", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="SET NULL"),
                  nullable=True, index=True),
        sa.Column("delivery_address", sa.String(500), nullable=True),
        sa.Column("is_third_party_carrier", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("status", sa.Enum(
            "pending", "in_progress", "waiting_client", "approved",
            "rejected", "completed", "cancelled",
            name="taskstatus", create_type=False,
        ), nullable=False, server_default="pending"),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )

    # --- 7. Recreate order_photos pointing to order_items ---
    op.create_table(
        "order_photos",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("order_item_id", sa.Integer,
                  sa.ForeignKey("order_items.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("selection_task_id", sa.Integer,
                  sa.ForeignKey("selection_tasks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pickup_task_id", sa.Integer,
                  sa.ForeignKey("pickup_tasks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("file_key", sa.String(512), nullable=False),
        sa.Column("file_url", sa.String(2048), nullable=False),
        sa.Column("uploaded_by", sa.Integer,
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("order_photos")
    op.drop_table("delivery_tasks")
    op.drop_table("pickup_tasks")
    op.drop_table("selection_tasks")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("picker_profiles")
    op.drop_column("users", "phone")
    op.execute("DROP TYPE IF EXISTS cargosize")
    op.execute("DROP TYPE IF EXISTS order_item_status")
