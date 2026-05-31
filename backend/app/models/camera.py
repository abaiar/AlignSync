from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .tenant import Tenant


class CameraStatus(str, Enum):
    IN_STOCK = "在库"
    SHIPPED = "已发货"
    USED = "已使用"
    RETURNED = "已退货"
    REPAIRED = "返修中"


class Camera(Base, TimestampMixin):
    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(primary_key=True)
    sn: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        comment="相机序列号，全局唯一",
    )
    model: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="相机型号",
    )
    intrinsic_params: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="相机内参标定数据（JSON格式）",
    )
    extrinsic_params: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="相机外参标定数据（JSON格式）",
    )
    calibration_date: Mapped[datetime] = mapped_column(
        nullable=False,
        comment="标定日期",
    )
    status: Mapped[CameraStatus] = mapped_column(
        SQLEnum(CameraStatus),
        default=CameraStatus.IN_STOCK,
        nullable=False,
        comment="相机状态",
    )
    tenant_id: Mapped[int | None] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=True,
        comment="所属租户ID（发货后分配）",
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="cameras")

    def __repr__(self) -> str:
        return f"Camera(id={self.id}, sn={self.sn}, status={self.status})"
