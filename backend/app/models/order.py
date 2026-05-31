from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Numeric, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .tenant import Tenant


class OrderStatus(str, Enum):
    PENDING = "待确认"
    CONFIRMED = "已确认"
    AWAITING_PAYMENT = "待收款"
    PAID = "已收款"
    SHIPPED = "已发货"
    COMPLETED = "已完成"
    CANCELLED = "已取消"


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    po_number: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
        comment="采购订单编号",
    )
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=False,
        comment="租户ID（生产厂）",
    )
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus),
        default=OrderStatus.PENDING,
        nullable=False,
        comment="订单状态",
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
        comment="订单总额",
    )
    remark: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="备注",
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )
    shipments: Mapped[list["OrderShipment"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )

    def calculate_total(self) -> Decimal:
        self.total_amount = sum(
            item.quantity * item.unit_price for item in self.items
        )
        return self.total_amount


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False,
    )
    product_model: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="产品型号",
    )
    quantity: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
        comment="数量",
    )
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="单价",
    )

    order: Mapped["Order"] = relationship(back_populates="items")


class OrderShipment(Base, TimestampMixin):
    __tablename__ = "order_shipments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False,
    )
    camera_sn: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="发货相机SN",
    )
    dongle_id: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="发货软件锁ID",
    )
    tracking_number: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="物流单号",
    )
    carrier: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="物流公司",
    )

    order: Mapped["Order"] = relationship(back_populates="shipments")
