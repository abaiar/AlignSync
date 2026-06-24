from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=True
    )  # 目标用户，null表示广播
    enterprise_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("enterprises.id"), nullable=True
    )  # 目标企业
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "order", "payment", "shipment", "system"
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    related_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # 关联对象类型
    related_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)  # 关联对象ID
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
