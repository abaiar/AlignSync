from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class WheelAligner(Base):
    """定位仪设备"""

    __tablename__ = "wheel_aligners"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    device_sn: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )  # BR-ASM-002
    device_name: Mapped[str] = mapped_column(String(200), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    enterprise_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("enterprises.id"), nullable=False
    )  # 组装的生产厂
    software_lock_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("software_locks.id"), nullable=False
    )  # 绑定的软件锁 (BR-ASM-003)
    status: Mapped[str] = mapped_column(
        String(50), default="assembled"
    )  # assembled, sold, returned
    assembled_by: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False
    )
    assembled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    bom_items: Mapped[list["DeviceBom"]] = relationship(back_populates="device")


class DeviceBom(Base):
    """设备BOM（部件清单）"""

    __tablename__ = "device_bom"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    device_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("wheel_aligners.id"), nullable=False
    )
    item_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "software_lock" | "camera"
    camera_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("cameras.id"), nullable=True
    )
    software_lock_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("software_locks.id"), nullable=True
    )
    position_label: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # 位置编号，如 "left", "right"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    device: Mapped["WheelAligner"] = relationship(back_populates="bom_items")
