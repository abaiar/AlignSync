from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    function_version: Optional[str] = None


class OrderCreate(BaseModel):
    order_type: str  # "camera" | "software"
    items: List[OrderItemCreate]
    remark: Optional[str] = None
    submit: bool = False  # False=save draft, True=submit


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    product_id: int
    product_name: str
    product_model: str
    quantity: int
    unit_price: float
    function_version: Optional[str] = None
    confirmed_quantity: Optional[int] = None
    shipped_quantity: int = 0
    received_quantity: int = 0


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_no: str
    order_type: str
    enterprise_id: int
    status: str
    total_amount: float
    remark: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_by: int
    created_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    category: str
    model: str
    spec: Optional[str] = None
    price: float
    function_versions: Optional[List[Any]] = None
    is_active: bool


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int


class OrderConfirmRequest(BaseModel):
    confirmed_quantities: Optional[Dict[int, int]] = None  # {order_item_id: confirmed_qty}, None=full confirm
    remark: Optional[str] = None
    partial: bool = False  # True=partial confirm


class OrderRejectRequest(BaseModel):
    reason: str
