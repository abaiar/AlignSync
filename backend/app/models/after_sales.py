from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AfterSalesTicket(Base):
    __tablename__ = "after_sales_tickets"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ticket_no: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )  # AS + yyyyMMdd + 4位流水号
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "camera_repair", "camera_replace", "camera_return", "software_upgrade", "software_reactivate", "software_replace", "software_return"
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "camera" | "software"
    item_sn: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # 相机SN 或 软件锁ID
    camera_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("cameras.id"), nullable=True
    )
    software_lock_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("software_locks.id"), nullable=True
    )
    device_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("wheel_aligners.id"), nullable=True
    )
    enterprise_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("enterprises.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="pending"
    )  # pending, processing, resolved, closed, rejected
    handler_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=True
    )
    handled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
