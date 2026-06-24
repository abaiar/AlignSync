from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class TraceabilityCameraInfo(BaseModel):
    camera_id: int
    internal_id: str
    sn: str
    model: str
    intrinsics: Any
    extrinsics: Any
    status: str
    position_label: Optional[str]


class TraceabilitySoftwareLockInfo(BaseModel):
    lock_id: int
    lock_sn: str
    software_version: str
    function_version: str
    function_list: Any
    expire_date: datetime
    status: str


class TraceabilityOrderInfo(BaseModel):
    order_id: int
    order_no: str
    order_type: str
    status: str
    total_amount: float
    created_at: datetime


class TraceabilityResponse(BaseModel):
    device_id: int
    device_sn: str
    device_name: str
    model: str
    enterprise_id: int
    assembled_by: Optional[str]  # username
    assembled_at: datetime
    software_lock: Optional[TraceabilitySoftwareLockInfo]
    cameras: List[TraceabilityCameraInfo]
    purchase_orders: List[TraceabilityOrderInfo]
