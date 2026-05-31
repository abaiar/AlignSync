from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .dongle import Dongle


class DeviceStatus(str, Enum):
    ASSEMBLED = "已组装"
    ACTIVATED = "已激活"
    IN_SERVICE = "使用中"
    DECOMMISSIONED = "已退役"


class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_sn: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        comment="整机SN",
    )
    dongle_id: Mapped[str] = mapped_column(
        ForeignKey("dongles.dongle_id"),
        nullable=False,
        comment="绑定的软件锁ID",
    )
    authorization_code: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        comment="基于相机内参生成的授权号",
    )
    status: Mapped[DeviceStatus] = mapped_column(
        default=DeviceStatus.ASSEMBLED,
        nullable=False,
        comment="设备状态",
    )

    dongle: Mapped["Dongle"] = relationship()
    cameras: Mapped[list["DeviceCamera"]] = relationship(
        back_populates="device",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("device_sn", name="uq_devices_device_sn"),
    )


class DeviceCamera(Base):
    __tablename__ = "device_cameras"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[int] = mapped_column(
        ForeignKey("devices.id"),
        nullable=False,
    )
    camera_sn: Mapped[str] = mapped_column(
        ForeignKey("cameras.sn"),
        nullable=False,
        comment="相机SN",
    )
    position: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        comment="安装位置（左/右/前/后）",
    )

    device: Mapped["Device"] = relationship(back_populates="cameras")

    __table_args__ = (
        UniqueConstraint("device_id", "position", name="uq_device_camera_position"),
        UniqueConstraint("device_id", "camera_sn", name="uq_device_camera_sn"),
    )
