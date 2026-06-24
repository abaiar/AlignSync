from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.db.base import get_db
from app.models.user import User
from app.schemas.payment import (
    BankAccountInfo,
    PaymentConfirmRequest,
    PaymentCreate,
    PaymentListResponse,
    PaymentMarkAbnormalRequest,
    PaymentResponse,
)
from app.services import payment_service

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("", response_model=PaymentResponse)
async def create_payment(
    order_id: int = Form(...),
    amount: float = Form(...),
    payment_method: str = Form(...),
    payment_account: Optional[str] = Form(None),
    payment_date: str = Form(...),  # ISO string
    remark: Optional[str] = Form(None),
    voucher: UploadFile = File(...),  # BR-FIN-002 required
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("payment:create")),
):
    req = PaymentCreate(
        order_id=order_id,
        amount=amount,
        payment_method=payment_method,
        payment_account=payment_account,
        payment_date=datetime.fromisoformat(payment_date),
        remark=remark,
    )
    return await payment_service.create_payment(db, req, voucher, user)


@router.get("", response_model=PaymentListResponse)
async def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await payment_service.list_payments(db, skip, limit, status, user)


@router.get("/bank-info", response_model=BankAccountInfo)
async def get_bank_info(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await payment_service.get_bank_account_info(db, user)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await payment_service.get_payment(db, payment_id, user)


@router.patch("/{payment_id}/confirm", response_model=PaymentResponse)
async def confirm_payment(
    payment_id: int,
    req: PaymentConfirmRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("payment:confirm")),
):
    return await payment_service.confirm_payment(db, payment_id, req, user)


@router.patch("/{payment_id}/mark-abnormal", response_model=PaymentResponse)
async def mark_abnormal(
    payment_id: int,
    req: PaymentMarkAbnormalRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("payment:confirm")),
):
    return await payment_service.mark_payment_abnormal(db, payment_id, req, user)
