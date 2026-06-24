from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict


class SoftwareLockSyncRequest(BaseModel):
    lock_id: str
    overwrite: bool = False
    bound_enterprise_id: Optional[int] = None


class SoftwareLockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lock_id: str
    software_version: str
    function_version: str
    function_list: List[Any]
    expire_date: datetime
    status: str
    bound_enterprise_id: Optional[int] = None
    created_at: Optional[datetime] = None


class SoftwareLockListResponse(BaseModel):
    items: List[SoftwareLockResponse]
    total: int
