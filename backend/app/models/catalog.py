from sqlalchemy import CheckConstraint, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CarBrand(Base):
    __tablename__ = "car_brands"
    __table_args__ = (
        UniqueConstraint("name", name="uq_car_brands_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    models: Mapped[list["CarModel"]] = relationship(
        back_populates="car_brand", cascade="all, delete-orphan",
    )


class CarModel(Base):
    __tablename__ = "car_models"
    __table_args__ = (
        UniqueConstraint("car_brand_id", "name", name="uq_car_models_brand_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    car_brand_id: Mapped[int] = mapped_column(
        ForeignKey("car_brands.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    car_brand: Mapped["CarBrand"] = relationship(back_populates="models")
    bodies: Mapped[list["CarBody"]] = relationship(
        back_populates="car_model", cascade="all, delete-orphan",
    )
    engines: Mapped[list["CarEngine"]] = relationship(
        back_populates="car_model", cascade="all, delete-orphan",
    )


class CarBody(Base):
    __tablename__ = "car_bodies"
    __table_args__ = (
        UniqueConstraint("car_model_id", "code", name="uq_car_bodies_model_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    car_model_id: Mapped[int] = mapped_column(
        ForeignKey("car_models.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    code: Mapped[str] = mapped_column(String(100), nullable=False)

    car_model: Mapped["CarModel"] = relationship(back_populates="bodies")


class CarEngine(Base):
    __tablename__ = "car_engines"
    __table_args__ = (
        UniqueConstraint("car_model_id", "code", name="uq_car_engines_model_code"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    car_model_id: Mapped[int] = mapped_column(
        ForeignKey("car_models.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    code: Mapped[str] = mapped_column(String(100), nullable=False)

    car_model: Mapped["CarModel"] = relationship(back_populates="engines")


class PartBrand(Base):
    __tablename__ = "part_brands"
    __table_args__ = (
        UniqueConstraint("name", name="uq_part_brands_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    parts: Mapped[list["Part"]] = relationship(back_populates="part_brand")
    categories: Mapped[list["PartBrandCategory"]] = relationship(
        back_populates="part_brand", cascade="all, delete-orphan",
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    parent: Mapped["Category | None"] = relationship(
        remote_side=[id], back_populates="children",
    )
    children: Mapped[list["Category"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan",
    )
    parts: Mapped[list["Part"]] = relationship(back_populates="category")
    part_brands: Mapped[list["PartBrandCategory"]] = relationship(
        back_populates="category", cascade="all, delete-orphan",
    )


class Part(Base):
    __tablename__ = "parts"
    __table_args__ = (
        UniqueConstraint("part_brand_id", "article", name="uq_parts_brand_article"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    part_brand_id: Mapped[int] = mapped_column(
        ForeignKey("part_brands.id", ondelete="RESTRICT"), nullable=False, index=True,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True,
    )
    article: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)

    part_brand: Mapped["PartBrand"] = relationship(back_populates="parts")
    category: Mapped["Category"] = relationship(back_populates="parts")
    applicability: Mapped[list["PartApplicability"]] = relationship(
        back_populates="part", cascade="all, delete-orphan",
    )


class PartApplicability(Base):
    __tablename__ = "part_applicability"
    __table_args__ = (
        CheckConstraint(
            "car_body_id IS NULL OR car_model_id IS NOT NULL",
            name="ck_part_applicability_body_requires_model",
        ),
        CheckConstraint(
            "car_engine_id IS NULL OR car_model_id IS NOT NULL",
            name="ck_part_applicability_engine_requires_model",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    part_id: Mapped[int] = mapped_column(
        ForeignKey("parts.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    car_brand_id: Mapped[int] = mapped_column(
        ForeignKey("car_brands.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    car_model_id: Mapped[int | None] = mapped_column(
        ForeignKey("car_models.id", ondelete="CASCADE"), nullable=True, index=True,
    )
    car_body_id: Mapped[int | None] = mapped_column(
        ForeignKey("car_bodies.id", ondelete="CASCADE"), nullable=True, index=True,
    )
    car_engine_id: Mapped[int | None] = mapped_column(
        ForeignKey("car_engines.id", ondelete="CASCADE"), nullable=True, index=True,
    )

    part: Mapped["Part"] = relationship(back_populates="applicability")
    car_brand: Mapped["CarBrand"] = relationship()
    car_model: Mapped["CarModel | None"] = relationship()
    car_body: Mapped["CarBody | None"] = relationship()
    car_engine: Mapped["CarEngine | None"] = relationship()


class PartAnalog(Base):
    __tablename__ = "part_analogs"
    __table_args__ = (
        UniqueConstraint("part_id", "analog_part_id", name="uq_part_analogs_pair"),
        CheckConstraint("part_id < analog_part_id", name="ck_part_analogs_canonical_order"),
        CheckConstraint("part_id <> analog_part_id", name="ck_part_analogs_not_self"),
    )

    part_id: Mapped[int] = mapped_column(
        ForeignKey("parts.id", ondelete="CASCADE"), primary_key=True,
    )
    analog_part_id: Mapped[int] = mapped_column(
        ForeignKey("parts.id", ondelete="CASCADE"), primary_key=True,
    )


class PartBrandCategory(Base):
    __tablename__ = "part_brand_categories"
    __table_args__ = (
        UniqueConstraint(
            "part_brand_id", "category_id", name="uq_part_brand_categories_pair",
        ),
    )

    part_brand_id: Mapped[int] = mapped_column(
        ForeignKey("part_brands.id", ondelete="CASCADE"), primary_key=True,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True,
    )

    part_brand: Mapped["PartBrand"] = relationship(back_populates="categories")
    category: Mapped["Category"] = relationship(back_populates="part_brands")


Index(
    "uq_categories_root_name",
    Category.name,
    unique=True,
    postgresql_where=Category.parent_id.is_(None),
)
Index(
    "uq_categories_parent_name",
    Category.parent_id,
    Category.name,
    unique=True,
    postgresql_where=Category.parent_id.is_not(None),
)
Index(
    "uq_part_applicability_scope",
    PartApplicability.part_id,
    PartApplicability.car_brand_id,
    func.coalesce(PartApplicability.car_model_id, 0),
    func.coalesce(PartApplicability.car_body_id, 0),
    func.coalesce(PartApplicability.car_engine_id, 0),
    unique=True,
)
