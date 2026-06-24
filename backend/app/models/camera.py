from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.enterprise import Enterprise
    from app.models.user import User


class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    internal_id: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )  # 系统自动生成，如 "CAM-000001"
    sn: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )  # BR-CAM-001 全局唯一
    model: Mapped[str] = mapped_column(String(100), nullable=False)  # 型号
    intrinsics: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False
    )  # 内参 (BR-CAM-002)
    extrinsics: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False
    )  # 外参 (BR-CAM-002)
    status: Mapped[str] = mapped_column(
        String(50), default="in_stock"
    )  # in_stock, used, shipped, returned
    enterprise_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("enterprises.id"), nullable=True
    )  # 当前持有企业
    synced_by: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    enterprise: Mapped[Optional["Enterprise"]] = relationship()
