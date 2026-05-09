"""Add mock payment fields to orders.

Revision ID: 005
Revises: 004
Create Date: 2026-05-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, Sequence[str], None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


payment_status_enum = sa.Enum(
    "pending",
    "paid",
    "failed",
    "refunded",
    name="paymentstatus",
)


def upgrade() -> None:
    payment_status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "orders",
        sa.Column(
            "payment_status",
            payment_status_enum,
            nullable=False,
            server_default="pending",
        ),
    )
    op.add_column(
        "orders",
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("payment_provider", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("payment_id", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "payment_id")
    op.drop_column("orders", "payment_provider")
    op.drop_column("orders", "paid_at")
    op.drop_column("orders", "payment_status")
    payment_status_enum.drop(op.get_bind(), checkfirst=True)
