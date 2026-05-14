from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class DongleStatus(str, Enum):
    AUTHORIZED = "已授权"
    IN_STOCK = "在库"
    SHIPPED = "已发货"
    USED = "已使用"
    RETURNED = "已退货"


class DongleSyncRequest(BaseModel):
    dongle_id: str = Field(..., description="软件锁ID", min_length=1, max_length=64)


class DongleCreate(BaseModel):
    dongle_id: str = Field(..., description="软件锁ID", min_length=1, max_length=64)
    version: str = Field(..., description="软件版本", min_length=1, max_length=32)
    features: list[str] = Field(default_factory=list, description="授权功能列表")
    expiry_date: datetime = Field(..., description="授权到期日")


class DongleUpdate(BaseModel):
    version: str | None = Field(None, description="软件版本", max_length=32)
    features: list[str] | None = Field(None, description="授权功能列表")
    expiry_date: datetime | None = Field(None, description="授权到期日")
    status: DongleStatus | None = Field(None, description="软件锁状态")


class DongleResponse(BaseModel):
    id: int = Field(..., description="内部ID")
    dongle_id: str = Field(..., description="软件锁ID")
    version: str = Field(..., description="软件版本")
    features: list[str] = Field(..., description="授权功能列表")
    expiry_date: datetime = Field(..., description="授权到期日")
    status: DongleStatus = Field(..., description="软件锁状态")
    created_at: datetime = Field(..., description="入库时间")
    updated_at: datetime | None = Field(None, description="更新时间")

    model_config = {"from_attributes": True}


class DongleListResponse(BaseModel):
    total: int = Field(..., description="总数")
    items: list[DongleResponse] = Field(..., description="软件锁列表")
