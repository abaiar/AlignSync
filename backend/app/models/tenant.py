from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .camera import Camera
    from .order import Order


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        comment="租户名称",
    )
    contact: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        comment="联系人",
    )
    phone: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        comment="联系电话",
    )
    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="地址",
    )

    cameras: Mapped[list["Camera"]] = relationship(back_populates="tenant")
    orders: Mapped[list["Order"]] = relationship(back_populates="tenant")

    def __repr__(self) -> str:
        return f"Tenant(id={self.id}, name={self.name})"
