from datetime import datetime
from pydantic import BaseModel, Field
from app.models.order import OrderStatus, CargoSize


# ── Order create ──────────────────────────────────────────

class OrderCreate(BaseModel):
    drom_url: str | None = Field(None, max_length=2048)
    description: str | None = Field(None, max_length=5000)
    car_brand: str | None = Field(None, max_length=100)
    car_model: str | None = Field(None, max_length=100)
    car_year: int | None = Field(None, ge=1900, le=2100)
    body_type: str | None = Field(None, max_length=100)
    part_name: str | None = Field(None, max_length=200)
    part_number: str | None = Field(None, max_length=100)

    seller_address: str | None = Field(None, max_length=500)
    seller_lat: float | None = None
    seller_lng: float | None = None

    delivery_address: str = Field(..., min_length=1, max_length=500)
    delivery_lat: float | None = None
    delivery_lng: float | None = None

    part_price: float | None = Field(None, ge=0)
    cargo_size: CargoSize = CargoSize.SMALL
    comment: str | None = Field(None, max_length=2000)


# ── Photo ─────────────────────────────────────────────────

class PhotoResponse(BaseModel):
    id: int
    file_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Review ────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    courier_rating: int = Field(..., ge=1, le=5)
    service_rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)


class ReviewResponse(BaseModel):
    id: int
    order_id: int
    client_id: int
    courier_rating: int
    service_rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Order responses ───────────────────────────────────────

class OrderResponse(BaseModel):
    id: int
    client_id: int
    courier_id: int | None
    carrier_id: int | None

    description: str | None
    drom_url: str | None
    car_brand: str | None
    car_model: str | None
    car_year: int | None
    body_type: str | None
    part_name: str | None
    part_number: str | None

    seller_address: str | None
    delivery_address: str | None

    part_price: float | None
    service_fee: float | None
    delivery_fee: float | None
    total_price: float | None
    cargo_size: CargoSize
    comment: str | None

    status: OrderStatus
    photos: list[PhotoResponse] = []
    review: ReviewResponse | None = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListItem(BaseModel):
    id: int
    status: OrderStatus
    part_name: str | None = None
    drom_url: str | None = None
    total_price: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
