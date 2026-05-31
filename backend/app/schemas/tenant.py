from datetime import datetime
from pydantic import BaseModel, Field


class TenantCreate(BaseModel):
    name: str = Field(..., description="租户名称", min_length=1, max_length=128)
    contact: str | None = Field(None, description="联系人", max_length=64)
    phone: str | None = Field(None, description="联系电话", max_length=32)
    address: str | None = Field(None, description="地址", max_length=512)


class TenantResponse(BaseModel):
    id: int = Field(..., description="租户ID")
    name: str = Field(..., description="租户名称")
    contact: str | None = Field(None, description="联系人")
    phone: str | None = Field(None, description="联系电话")
    address: str | None = Field(None, description="地址")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime | None = Field(None, description="更新时间")

    model_config = {"from_attributes": True}


class TenantListResponse(BaseModel):
    total: int = Field(..., description="总数")
    items: list[TenantResponse] = Field(..., description="租户列表")
