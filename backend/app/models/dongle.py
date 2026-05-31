from datetime import datetime
from enum import Enum

from sqlalchemy import String, JSON
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class DongleStatus(str, Enum):
    AUTHORIZED = "已授权"
    IN_STOCK = "在库"
    SHIPPED = "已发货"
    USED = "已使用"
    RETURNED = "已退货"


class Dongle(Base, TimestampMixin):
    __tablename__ = "dongles"

    id: Mapped[int] = mapped_column(primary_key=True)
    dongle_id: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        comment="软件锁ID",
    )
    version: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        comment="软件版本",
    )
    features: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        comment="授权功能列表",
    )
    expiry_date: Mapped[datetime] = mapped_column(
        nullable=False,
        comment="授权到期日",
    )
    status: Mapped[DongleStatus] = mapped_column(
        default=DongleStatus.AUTHORIZED,
        nullable=False,
        comment="软件锁状态",
    )

    def __repr__(self) -> str:
        return f"Dongle(id={self.id}, dongle_id={self.dongle_id})"
