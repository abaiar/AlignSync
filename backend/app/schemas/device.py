from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class DeviceStatus(str, Enum):
    ASSEMBLED = "已组装"
    ACTIVATED = "已激活"
    IN_SERVICE = "使用中"
    DECOMMISSIONED = "已退役"


class CameraBinding(BaseModel):
    camera_sn: str = Field(..., description="相机SN", min_length=1, max_length=64)
    position: str = Field(..., description="安装位置（如：左、右）", min_length=1, max_length=32)


class DeviceAssembleRequest(BaseModel):
    device_sn: str = Field(..., description="整机SN", min_length=1, max_length=64)
    dongle_sn: str = Field(..., description="绑定的软件锁SN", min_length=1, max_length=64)
    cameras: list[CameraBinding] = Field(..., description="绑定的相机列表", min_length=2)


class DeviceResponse(BaseModel):
    id: int = Field(..., description="设备内部ID")
    device_sn: str = Field(..., description="整机SN")
    dongle_sn: str = Field(..., description="绑定的软件锁SN")
    cameras: list[CameraBinding] = Field(..., description="绑定的相机列表")
    authorization_code: str | None = Field(None, description="基于相机内参生成的授权号")
    status: DeviceStatus = Field(..., description="设备状态")
    created_at: datetime = Field(..., description="登记时间")
    updated_at: datetime | None = Field(None, description="更新时间")

    model_config = {"from_attributes": True}


class DeviceListResponse(BaseModel):
    total: int = Field(..., description="总数")
    items: list[DeviceResponse] = Field(..., description="设备列表")


class DeviceTraceResponse(BaseModel):
    device_sn: str = Field(..., description="整机SN")
    dongle_sn: str = Field(..., description="软件锁SN")
    dongle_version: str | None = Field(None, description="软件锁版本")
    cameras: list[dict] = Field(..., description="相机详情（含标定参数）")
    purchase_date: datetime | None = Field(None, description="采购日期")
    assembler: str | None = Field(None, description="组装人员")
    authorization_code: str | None = Field(None, description="授权号")
    created_at: datetime = Field(..., description="登记时间")
