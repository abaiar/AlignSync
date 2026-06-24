from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    payment_method: str  # "bank_transfer", "alipay", "wechat"
    payment_account: Optional[str] = None
    payment_date: datetime
    remark: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: float
    payment_method: str
    payment_account: Optional[str]
    payment_date: datetime
    voucher_path: str
    status: str
    confirmed_by: Optional[int]
    confirmed_at: Optional[datetime]
    remark: Optional[str]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int


class BankAccountInfo(BaseModel):
    bank_name: Optional[str]
    bank_account: Optional[str]
    enterprise_name: Optional[str]


class PaymentConfirmRequest(BaseModel):
    remark: Optional[str] = None


class PaymentMarkAbnormalRequest(BaseModel):
    status: str  # "pending_verify" or "amount_abnormal"
    remark: str
