from datetime import datetime

from pydantic import BaseModel, Field

from app.models.order import OrderStatus, PaymentStatus
from app.schemas.order import OrderResponse


class AdminOrderClientResponse(BaseModel):
    id: int
    username: str
    email: str
    phone: str | None


class AdminOrderListItemResponse(BaseModel):
    id: int
    status: OrderStatus
    payment_status: PaymentStatus
    total_price: float | None
    created_at: datetime
    client: AdminOrderClientResponse


class AdminOrderListResponse(BaseModel):
    items: list[AdminOrderListItemResponse]
    total: int
    limit: int
    offset: int


class AdminOrderDetailResponse(BaseModel):
    order: OrderResponse
    client: AdminOrderClientResponse


class AdminOrderStatusUpdateRequest(BaseModel):
    status: OrderStatus = Field(...)
