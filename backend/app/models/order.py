from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_no: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )  # PO + yyyyMMdd + 4位流水号 (BR-PO-001)
    order_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "camera" | "software"
    enterprise_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("enterprises.id"), nullable=False
    )  # 采购的生产厂
    status: Mapped[str] = mapped_column(
        String(50), default="draft"
    )  # draft, pending, confirmed, rejected, awaiting_payment, paid, shipped, completed
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confirmed_by: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=True
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rejected_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("purchase_orders.id"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id"), nullable=False
    )
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)  # 冗余
    product_model: Mapped[str] = mapped_column(String(100), nullable=False)  # 冗余
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    function_version: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # 软件采购必填 (BR-PO-002)
    confirmed_quantity: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # 部分确认时的可发货数量
    shipped_quantity: Mapped[int] = mapped_column(Integer, default=0)
    received_quantity: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    order: Mapped["PurchaseOrder"] = relationship(back_populates="items")
