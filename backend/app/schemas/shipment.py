from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ShipmentItemCreate(BaseModel):
    order_item_id: int
    item_type: str  # "camera" | "software_lock"
    item_sn: str  # camera SN or software lock ID
    quantity: int = 1


class ShipmentCreate(BaseModel):
    order_id: int
    logistics_company: str
    tracking_no: str  # BR-SHIP-002 required
    items: List[ShipmentItemCreate]
    remark: Optional[str] = None
    partial: bool = False  # True=partial shipment


class ShipmentItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    order_item_id: int
    item_type: str
    item_sn: str
    camera_id: Optional[int] = None
    software_lock_id: Optional[int] = None
    quantity: int


class ShipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    logistics_company: str
    tracking_no: str
    target_enterprise_id: int
    shipped_by: int
    shipped_at: datetime
    status: str
    remark: Optional[str] = None
    items: List[ShipmentItemResponse] = []
    created_at: datetime


class ShipmentListResponse(BaseModel):
    items: List[ShipmentResponse]
    total: int
