from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from app.models.order import OrderStatus, TaskStatus


class OrderCreate(BaseModel):
    drom_url: str | None = Field(None, max_length=2048)
    description: str | None = Field(None, max_length=5000)
    target_price: float | None = Field(None, ge=0)
    comment: str | None = Field(None, max_length=2000)
    prepaid_to_seller: bool = False

    @model_validator(mode="after")
    def require_drom_or_description(self):
        if not self.drom_url and not self.description:
            raise ValueError("Укажите ссылку Drom или описание детали")
        return self


class OrderUpdate(BaseModel):
    status: OrderStatus | None = None
    comment: str | None = None


class PhotoResponse(BaseModel):
    id: int
    file_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskBrief(BaseModel):
    id: int
    status: TaskStatus

    model_config = {"from_attributes": True}


class SelectionTaskResponse(BaseModel):
    id: int
    order_id: int
    picker_id: int | None
    status: TaskStatus
    note: str | None
    photos: list[PhotoResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PickupTaskResponse(BaseModel):
    id: int
    order_id: int
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
    order_id: int
    picker_id: int | None
    delivery_address: str | None
    is_third_party_carrier: bool
    status: TaskStatus
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    client_id: int
    drom_url: str | None
    description: str | None
    target_price: float | None
    comment: str | None
    prepaid_to_seller: bool
    status: OrderStatus
    selection_task: SelectionTaskResponse | None = None
    pickup_task: PickupTaskResponse | None = None
    delivery_task: DeliveryTaskResponse | None = None
    photos: list[PhotoResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListItem(BaseModel):
    id: int
    drom_url: str | None
    description: str | None
    status: OrderStatus
    created_at: datetime

    model_config = {"from_attributes": True}


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
