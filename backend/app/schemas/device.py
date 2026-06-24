from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DeviceCameraItem(BaseModel):
    camera_id: int
    position_label: str  # e.g. "left", "right"


class DeviceCreate(BaseModel):
    device_sn: str
    device_name: str
    model: str
    software_lock_id: int
    cameras: List[DeviceCameraItem]
    remark: Optional[str] = None


class DeviceBomResponse(BaseModel):
    id: int
    item_type: str
    camera_id: Optional[int] = None
    software_lock_id: Optional[int] = None
    position_label: Optional[str] = None


class DeviceResponse(BaseModel):
    id: int
    device_sn: str
    device_name: str
    model: str
    enterprise_id: int
    software_lock_id: int
    status: str
    assembled_by: int
    assembled_at: Optional[datetime] = None
    remark: Optional[str] = None
    bom_items: List[DeviceBomResponse] = []
    created_at: Optional[datetime] = None


class DeviceListResponse(BaseModel):
    items: List[DeviceResponse]
    total: int
