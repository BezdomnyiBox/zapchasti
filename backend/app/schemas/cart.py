from datetime import datetime

from pydantic import BaseModel, Field


class CartAddRequest(BaseModel):
    part_id: int
    quantity: int = Field(default=1, ge=1)


class CartUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: int
    part_id: int
    part_name: str
    article: str
    part_brand: str
    category: str
    quantity: int
    unit_price: float
    subtotal: float
    created_at: datetime
    updated_at: datetime


class CartSummaryResponse(BaseModel):
    items: list[CartItemResponse]
    total: float
