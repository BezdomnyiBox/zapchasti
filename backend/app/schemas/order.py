from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from app.models.order import OrderStatus, TaskStatus, CargoSize


# ── Order Item ────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    drom_url: str | None = Field(None, max_length=2048)
    description: str | None = Field(None, max_length=5000)
    car_brand: str | None = Field(None, max_length=100)
    car_model: str | None = Field(None, max_length=100)
    car_year: int | None = Field(None, ge=1900, le=2100)
    body_type: str | None = Field(None, max_length=100)
    part_name: str | None = Field(None, max_length=200)
    part_number: str | None = Field(None, max_length=100)
    target_price: float | None = Field(None, ge=0)
    comment: str | None = Field(None, max_length=2000)
    prepaid_to_seller: bool = False
    cargo_size: CargoSize = CargoSize.SMALL

    @model_validator(mode="after")
    def require_drom_or_description(self):
        if not self.drom_url and not self.description:
            raise ValueError("Укажите ссылку Drom или описание детали")
        return self


# ── Order ─────────────────────────────────────────────────

class OrderCreate(BaseModel):
    comment: str | None = Field(None, max_length=2000)
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderUpdate(BaseModel):
    status: OrderStatus | None = None
    comment: str | None = None


# ── Photo ─────────────────────────────────────────────────

class PhotoResponse(BaseModel):
    id: int
    file_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Task schemas ──────────────────────────────────────────

class TaskBrief(BaseModel):
    id: int
    status: TaskStatus

    model_config = {"from_attributes": True}


class SelectionTaskResponse(BaseModel):
    id: int
    order_item_id: int
    picker_id: int | None
    status: TaskStatus
    note: str | None
    photos: list[PhotoResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PickupTaskResponse(BaseModel):
    id: int
    order_item_id: int
    picker_id: int | None
    seller_address: str | None
    seller_lat: float | None
    seller_lng: float | None
    needs_inspection: bool
    status: TaskStatus
    note: str | None
    photos: list[PhotoResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeliveryTaskResponse(BaseModel):
    id: int
    order_item_id: int
    picker_id: int | None
    delivery_address: str | None
    is_third_party_carrier: bool
    status: TaskStatus
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Item response ─────────────────────────────────────────

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    drom_url: str | None
    description: str | None
    car_brand: str | None
    car_model: str | None
    car_year: int | None
    body_type: str | None
    part_name: str | None
    part_number: str | None
    target_price: float | None
    comment: str | None
    prepaid_to_seller: bool
    cargo_size: CargoSize
    status: OrderStatus
    selection_task: SelectionTaskResponse | None = None
    pickup_task: PickupTaskResponse | None = None
    delivery_task: DeliveryTaskResponse | None = None
    photos: list[PhotoResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Order response ────────────────────────────────────────

class OrderResponse(BaseModel):
    id: int
    client_id: int
    comment: str | None
    status: OrderStatus
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListItem(BaseModel):
    id: int
    status: OrderStatus
    items_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Task updates ──────────────────────────────────────────

class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    note: str | None = None


class PickupTaskUpdate(TaskUpdate):
    seller_address: str | None = None
    seller_lat: float | None = None
    seller_lng: float | None = None


class DeliveryTaskUpdate(TaskUpdate):
    delivery_address: str | None = None
    is_third_party_carrier: bool | None = None
