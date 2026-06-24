from datetime import datetime
from typing import Any, Optional

from sqlalchemy import BigInteger, Boolean, DateTime, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    """产品目录"""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # 产品编码
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "camera" | "software"
    model: Mapped[str] = mapped_column(String(100), nullable=False)  # 型号
    spec: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 规格
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)  # 单价
    function_versions: Mapped[Optional[list[Any]]] = mapped_column(
        JSON, nullable=True
    )  # 软件支持的功能版本列表
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
