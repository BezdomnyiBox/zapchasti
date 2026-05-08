"""Add catalog schema.

Revision ID: 002
Revises: 001
Create Date: 2026-05-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, Sequence[str], None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "car_brands",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_car_brands_name"),
    )

    op.create_table(
        "part_brands",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_part_brands_name"),
    )

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.ForeignKeyConstraint(["parent_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_categories_parent_id"), "categories", ["parent_id"], unique=False)
    op.create_index(
        "uq_categories_root_name",
        "categories",
        ["name"],
        unique=True,
        postgresql_where=sa.text("parent_id IS NULL"),
    )
    op.create_index(
        "uq_categories_parent_name",
        "categories",
        ["parent_id", "name"],
        unique=True,
        postgresql_where=sa.text("parent_id IS NOT NULL"),
    )

    op.create_table(
        "car_models",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("car_brand_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["car_brand_id"], ["car_brands.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("car_brand_id", "name", name="uq_car_models_brand_name"),
    )
    op.create_index(op.f("ix_car_models_car_brand_id"), "car_models", ["car_brand_id"], unique=False)

    op.create_table(
        "parts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("part_brand_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("article", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["part_brand_id"], ["part_brands.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("part_brand_id", "article", name="uq_parts_brand_article"),
    )
    op.create_index(op.f("ix_parts_article"), "parts", ["article"], unique=False)
    op.create_index(op.f("ix_parts_category_id"), "parts", ["category_id"], unique=False)
    op.create_index(op.f("ix_parts_name"), "parts", ["name"], unique=False)
    op.create_index(op.f("ix_parts_part_brand_id"), "parts", ["part_brand_id"], unique=False)

    op.create_table(
        "part_brand_categories",
        sa.Column("part_brand_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["part_brand_id"], ["part_brands.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("part_brand_id", "category_id"),
        sa.UniqueConstraint(
            "part_brand_id", "category_id", name="uq_part_brand_categories_pair",
        ),
    )

    op.create_table(
        "car_bodies",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("car_model_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["car_model_id"], ["car_models.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("car_model_id", "code", name="uq_car_bodies_model_code"),
    )
    op.create_index(op.f("ix_car_bodies_car_model_id"), "car_bodies", ["car_model_id"], unique=False)

    op.create_table(
        "car_engines",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("car_model_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["car_model_id"], ["car_models.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("car_model_id", "code", name="uq_car_engines_model_code"),
    )
    op.create_index(op.f("ix_car_engines_car_model_id"), "car_engines", ["car_model_id"], unique=False)

    op.create_table(
        "part_analogs",
        sa.Column("part_id", sa.Integer(), nullable=False),
        sa.Column("analog_part_id", sa.Integer(), nullable=False),
        sa.CheckConstraint("part_id < analog_part_id", name="ck_part_analogs_canonical_order"),
        sa.CheckConstraint("part_id <> analog_part_id", name="ck_part_analogs_not_self"),
        sa.ForeignKeyConstraint(["analog_part_id"], ["parts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["part_id"], ["parts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("part_id", "analog_part_id"),
        sa.UniqueConstraint("part_id", "analog_part_id", name="uq_part_analogs_pair"),
    )

    op.create_table(
        "part_applicability",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("part_id", sa.Integer(), nullable=False),
        sa.Column("car_brand_id", sa.Integer(), nullable=False),
        sa.Column("car_model_id", sa.Integer(), nullable=True),
        sa.Column("car_body_id", sa.Integer(), nullable=True),
        sa.Column("car_engine_id", sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "car_body_id IS NULL OR car_model_id IS NOT NULL",
            name="ck_part_applicability_body_requires_model",
        ),
        sa.CheckConstraint(
            "car_engine_id IS NULL OR car_model_id IS NOT NULL",
            name="ck_part_applicability_engine_requires_model",
        ),
        sa.ForeignKeyConstraint(["car_body_id"], ["car_bodies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["car_brand_id"], ["car_brands.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["car_engine_id"], ["car_engines.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["car_model_id"], ["car_models.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["part_id"], ["parts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_part_applicability_car_body_id"), "part_applicability", ["car_body_id"], unique=False)
    op.create_index(op.f("ix_part_applicability_car_brand_id"), "part_applicability", ["car_brand_id"], unique=False)
    op.create_index(op.f("ix_part_applicability_car_engine_id"), "part_applicability", ["car_engine_id"], unique=False)
    op.create_index(op.f("ix_part_applicability_car_model_id"), "part_applicability", ["car_model_id"], unique=False)
    op.create_index(op.f("ix_part_applicability_part_id"), "part_applicability", ["part_id"], unique=False)
    op.create_index(
        "uq_part_applicability_scope",
        "part_applicability",
        [
            "part_id",
            "car_brand_id",
            sa.text("COALESCE(car_model_id, 0)"),
            sa.text("COALESCE(car_body_id, 0)"),
            sa.text("COALESCE(car_engine_id, 0)"),
        ],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_part_applicability_scope", table_name="part_applicability")
    op.drop_index(op.f("ix_part_applicability_part_id"), table_name="part_applicability")
    op.drop_index(op.f("ix_part_applicability_car_model_id"), table_name="part_applicability")
    op.drop_index(op.f("ix_part_applicability_car_engine_id"), table_name="part_applicability")
    op.drop_index(op.f("ix_part_applicability_car_brand_id"), table_name="part_applicability")
    op.drop_index(op.f("ix_part_applicability_car_body_id"), table_name="part_applicability")
    op.drop_table("part_applicability")
    op.drop_table("part_analogs")
    op.drop_index(op.f("ix_car_engines_car_model_id"), table_name="car_engines")
    op.drop_table("car_engines")
    op.drop_index(op.f("ix_car_bodies_car_model_id"), table_name="car_bodies")
    op.drop_table("car_bodies")
    op.drop_table("part_brand_categories")
    op.drop_index(op.f("ix_parts_part_brand_id"), table_name="parts")
    op.drop_index(op.f("ix_parts_name"), table_name="parts")
    op.drop_index(op.f("ix_parts_category_id"), table_name="parts")
    op.drop_index(op.f("ix_parts_article"), table_name="parts")
    op.drop_table("parts")
    op.drop_index(op.f("ix_car_models_car_brand_id"), table_name="car_models")
    op.drop_table("car_models")
    op.drop_index("uq_categories_parent_name", table_name="categories")
    op.drop_index("uq_categories_root_name", table_name="categories")
    op.drop_index(op.f("ix_categories_parent_id"), table_name="categories")
    op.drop_table("categories")
    op.drop_table("part_brands")
    op.drop_table("car_brands")
