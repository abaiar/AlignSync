from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.enterprise import Enterprise
    from app.models.user import User


class SoftwareLock(Base):
    __tablename__ = "software_locks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    lock_id: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )  # 软件锁ID
    software_version: Mapped[str] = mapped_column(String(100), nullable=False)
    function_version: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # 功能版本 (BR-SW-002)
    function_list: Mapped[list[Any]] = mapped_column(
        JSON, nullable=False
    )  # 功能列表
    expire_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # 到期日
    status: Mapped[str] = mapped_column(
        String(50), default="authorized"
    )  # authorized, bound, expired, returned
    bound_enterprise_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("enterprises.id"), nullable=True
    )  # 绑定的生产厂 (BR-SW-001)
    bound_device_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("wheel_aligners.id"), nullable=True
    )  # 绑定的定位仪 (BR-ASM-003)
    synced_by: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    bound_enterprise: Mapped[Optional["Enterprise"]] = relationship()
