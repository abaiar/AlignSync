from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("purchase_orders.id"), nullable=False
    )
    amount: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )  # 必须等于订单总额 (BR-FIN-001)
    payment_method: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "bank_transfer", "alipay", "wechat"
    payment_account: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True
    )  # 付款账号
    payment_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    voucher_path: Mapped[str] = mapped_column(
        String(500), nullable=False
    )  # 凭证文件路径 (BR-FIN-002)
    status: Mapped[str] = mapped_column(
        String(50), default="awaiting_confirm"
    )  # awaiting_confirm, confirmed, pending_verify, amount_abnormal
    confirmed_by: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=True
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
