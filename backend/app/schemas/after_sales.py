from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class AfterSalesCreate(BaseModel):
    type: str  # "camera_repair" | "camera_replace" | "camera_return" | "software_upgrade" | "software_reactivate" | "software_replace" | "software_return"
    category: str  # "camera" | "software"
    item_sn: str  # 相机SN 或 软件锁ID
    device_id: Optional[int] = None
    title: str
    description: str


class AfterSalesHandleRequest(BaseModel):
    status: str  # "processing" | "resolved" | "closed" | "rejected"
    resolution: Optional[str] = None


class AfterSalesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_no: str
    type: str
    category: str
    item_sn: str
    camera_id: Optional[int] = None
    software_lock_id: Optional[int] = None
    device_id: Optional[int] = None
    enterprise_id: int
    title: str
    description: str
    status: str
    handler_id: Optional[int] = None
    handled_at: Optional[datetime] = None
    resolution: Optional[str] = None
    created_by: int
    created_at: datetime


class AfterSalesListResponse(BaseModel):
    items: List[AfterSalesResponse]
    total: int
