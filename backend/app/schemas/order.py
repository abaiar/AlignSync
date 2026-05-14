from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    PENDING = "待确认"
    CONFIRMED = "已确认"
    AWAITING_PAYMENT = "待收款"
    PAID = "已收款"
    SHIPPED = "已发货"
    COMPLETED = "已完成"
    CANCELLED = "已取消"


class OrderItemCreate(BaseModel):
    product_model: str = Field(..., description="产品型号", min_length=1, max_length=64)
    quantity: int = Field(..., description="数量", ge=1)
    unit_price: float = Field(..., description="单价", ge=0)


class OrderItemResponse(BaseModel):
    id: int = Field(..., description="明细ID")
    product_model: str = Field(..., description="产品型号")
    quantity: int = Field(..., description="数量")
    unit_price: float = Field(..., description="单价")
    subtotal: float = Field(..., description="小计")

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    tenant_id: int = Field(..., description="租户ID（生产厂）")
    items: list[OrderItemCreate] = Field(..., description="订单明细", min_length=1)
    remark: str | None = Field(None, description="备注", max_length=512)


class OrderConfirmRequest(BaseModel):
    opinion: str | None = Field(None, description="确认意见", max_length=512)


class OrderPayRequest(BaseModel):
    payment_amount: float = Field(..., description="付款金额", ge=0)
    payment_voucher: str | None = Field(None, description="付款凭证（URL或描述）", max_length=512)
    payment_method: str | None = Field(None, description="付款方式", max_length=32)
    payment_remark: str | None = Field(None, description="付款备注", max_length=256)


class OrderPaymentConfirmRequest(BaseModel):
    confirmed: bool = Field(True, description="是否确认收款")
    remark: str | None = Field(None, description="备注", max_length=256)


class CameraShipmentItem(BaseModel):
    camera_sn: str = Field(..., description="相机SN", min_length=1, max_length=64)


class OrderShipRequest(BaseModel):
    camera_items: list[CameraShipmentItem] = Field(..., description="发货相机列表", min_length=1)
    dongle_ids: list[str] = Field(default_factory=list, description="发货软件锁ID列表")
    tracking_number: str = Field(..., description="物流单号", min_length=1, max_length=64)
    carrier: str | None = Field(None, description="物流公司", max_length=64)


class OrderReceiveRequest(BaseModel):
    received: bool = Field(True, description="是否确认收货")
    remark: str | None = Field(None, description="收货备注", max_length=256)


class OrderResponse(BaseModel):
    id: int = Field(..., description="订单ID")
    po_number: str = Field(..., description="采购订单编号")
    tenant_id: int = Field(..., description="租户ID")
    status: OrderStatus = Field(..., description="订单状态")
    total_amount: float = Field(..., description="订单总额")
    items: list[OrderItemResponse] = Field(..., description="订单明细")
    remark: str | None = Field(None, description="备注")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime | None = Field(None, description="更新时间")

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    total: int = Field(..., description="总数")
    items: list[OrderResponse] = Field(..., description="订单列表")
