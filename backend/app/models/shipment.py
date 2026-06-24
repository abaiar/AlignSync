from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("purchase_orders.id"), nullable=False
    )
    logistics_company: Mapped[str] = mapped_column(String(200), nullable=False)
    tracking_no: Mapped[str] = mapped_column(
        String(200), nullable=False
    )  # 必填 (BR-SHIP-002)
    target_enterprise_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("enterprises.id"), nullable=False
    )  # 目标生产厂 (BR-SHIP-001)
    shipped_by: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False
    )
    shipped_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    received_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )  # BR-RCV-001: 收货时间，用于7天退货窗口
    status: Mapped[str] = mapped_column(
        String(50), default="shipped"
    )  # shipped, received
    remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    items: Mapped[list["ShipmentItem"]] = relationship(back_populates="shipment")


class ShipmentItem(Base):
    __tablename__ = "shipment_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    shipment_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("shipments.id"), nullable=False
    )
    order_item_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("order_items.id"), nullable=False
    )
    item_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "camera" | "software_lock"
    item_sn: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # 相机SN 或 软件锁ID
    camera_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("cameras.id"), nullable=True
    )
    software_lock_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("software_locks.id"), nullable=True
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    shipment: Mapped["Shipment"] = relationship(back_populates="items")
