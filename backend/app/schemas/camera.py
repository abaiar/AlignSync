from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class CameraStatus(str, Enum):
    IN_STOCK = "在库"
    SHIPPED = "已发货"
    USED = "已使用"
    RETURNED = "已退货"
    REPAIRED = "返修中"


class CameraCreate(BaseModel):
    sn: str = Field(..., description="相机序列号，全局唯一", min_length=1, max_length=64)
    model: str = Field(..., description="相机型号", min_length=1, max_length=64)
    intrinsic_params: dict = Field(..., description="相机内参标定数据")
    extrinsic_params: dict = Field(..., description="相机外参标定数据")
    calibration_date: datetime = Field(..., description="标定日期")


class CameraUpdate(BaseModel):
    model: str | None = Field(None, description="相机型号", max_length=64)
    intrinsic_params: dict | None = Field(None, description="相机内参标定数据")
    extrinsic_params: dict | None = Field(None, description="相机外参标定数据")
    status: CameraStatus | None = Field(None, description="相机状态")


class CameraResponse(BaseModel):
    id: int = Field(..., description="相机内部ID")
    sn: str = Field(..., description="相机序列号")
    model: str = Field(..., description="相机型号")
    intrinsic_params: dict = Field(..., description="相机内参标定数据")
    extrinsic_params: dict = Field(..., description="相机外参标定数据")
    calibration_date: datetime = Field(..., description="标定日期")
    status: CameraStatus = Field(..., description="相机状态")
    created_at: datetime = Field(..., description="入库时间")
    updated_at: datetime | None = Field(None, description="更新时间")

    model_config = {"from_attributes": True}


class CameraListResponse(BaseModel):
    total: int = Field(..., description="总数")
    items: list[CameraResponse] = Field(..., description="相机列表")
