from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CameraSyncRequest(BaseModel):
    sn: str
    model: str
    intrinsics: Dict[str, Any]
    extrinsics: Dict[str, Any]
    overwrite: bool = False


class CameraBatchSyncRequest(BaseModel):
    cameras: List[CameraSyncRequest] = Field(..., max_length=100)


class CameraBatchSyncItem(BaseModel):
    sn: str
    success: bool
    message: str


class CameraBatchSyncResponse(BaseModel):
    total: int
    success_count: int
    fail_count: int
    results: List[CameraBatchSyncItem]


class CameraResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    internal_id: str
    sn: str
    model: str
    intrinsics: Dict[str, Any]
    extrinsics: Dict[str, Any]
    status: str
    enterprise_id: Optional[int] = None
    created_at: Optional[datetime] = None


class CameraListResponse(BaseModel):
    items: List[CameraResponse]
    total: int
