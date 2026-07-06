import os
import shutil
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.enterprise import Enterprise
from app.models.notification import Notification
from app.models.order import PurchaseOrder
from app.models.payment import Payment
from app.models.user import Role, User, UserRole
from app.schemas.payment import (
    BankAccountInfo,
    PaymentConfirmRequest,
    PaymentCreate,
    PaymentListResponse,
    PaymentMarkAbnormalRequest,
    PaymentResponse,
)


async def _get_user_role_names(db: AsyncSession, user_id: int) -> List[str]:
    stmt = (
        select(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
    )
    result = await db.execute(stmt)
    return [r[0] for r in result.fetchall()]


async def _require_core_tech_finance(db: AsyncSession, user: User) -> None:
    result = await db.execute(
        select(Enterprise.type).where(Enterprise.id == user.enterprise_id)
    )
    ent_type = result.scalar_one_or_none()
    if ent_type != "core_tech":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅核心技术方财务人员可操作付款",
        )
    role_names = await _get_user_role_names(db, user.id)
    if "finance_staff" not in role_names:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅核心技术方财务人员可操作付款",
        )


async def _get_enterprise_type(db: AsyncSession, user: User) -> str:
    result = await db.execute(
        select(Enterprise.type).where(Enterprise.id == user.enterprise_id)
    )
    ent_type = result.scalar_one_or_none()
    if not ent_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户所属企业不存在",
        )
    return ent_type


async def create_payment(
    db: AsyncSession, req: PaymentCreate, voucher_file: UploadFile, user: User
) -> PaymentResponse:
    # Validate order exists and status == "confirmed"
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == req.order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在"
        )
    if order.status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅已确认状态订单可发起付款",
        )

    # Data isolation: manufacturer can only pay for own orders
    ent_type = await _get_enterprise_type(db, user)
    if ent_type == "manufacturer" and order.enterprise_id != user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权为此订单发起付款",
        )

    # BR-FIN-001: amount must equal order.total_amount
    if abs(float(req.amount) - float(order.total_amount)) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="付款金额必须等于订单总额",
        )

    # BR-FIN-002: voucher_file must be provided
    if not voucher_file or not voucher_file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="必须上传付款凭证",
        )

    # Save voucher file to UPLOAD_DIR/payments/{order_id}_{timestamp}_{filename}
    upload_dir = os.path.join(settings.UPLOAD_DIR, "payments")
    os.makedirs(upload_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{req.order_id}_{timestamp}_{voucher_file.filename}"
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(voucher_file.file, f)
    voucher_path = f"payments/{filename}"

    # Create payment record, status="awaiting_confirm"
    payment = Payment(
        order_id=req.order_id,
        amount=req.amount,
        payment_method=req.payment_method,
        payment_account=req.payment_account,
        payment_date=req.payment_date,
        voucher_path=voucher_path,
        status="awaiting_confirm",
        remark=req.remark,
        created_by=user.id,
    )
    db.add(payment)

    # Update order status to "awaiting_payment"
    order.status = "awaiting_payment"

    # Create notification to core_tech finance
    result = await db.execute(
        select(Enterprise).where(Enterprise.type == "core_tech")
    )
    core_tech = result.scalar_one_or_none()
    if core_tech:
        notification = Notification(
            enterprise_id=core_tech.id,
            title="收到新付款凭证",
            content=f"订单 {order.order_no} 的付款凭证已上传，待确认",
            type="payment",
            related_type="payment",
            related_id=payment.id,
        )
        db.add(notification)

    await db.commit()
    await db.refresh(payment)
    return PaymentResponse.model_validate(payment)


async def list_payments(
    db: AsyncSession,
    skip: int,
    limit: int,
    status_filter: Optional[str],
    user: User,
) -> PaymentListResponse:
    ent_type = await _get_enterprise_type(db, user)

    stmt = select(Payment)
    count_stmt = select(func.count(Payment.id))

    # Data isolation: manufacturer sees own orders' payments; core_tech sees all
    if ent_type == "manufacturer":
        stmt = stmt.join(
            PurchaseOrder, Payment.order_id == PurchaseOrder.id
        ).where(PurchaseOrder.enterprise_id == user.enterprise_id)
        count_stmt = count_stmt.join(
            PurchaseOrder, Payment.order_id == PurchaseOrder.id
        ).where(PurchaseOrder.enterprise_id == user.enterprise_id)

    if status_filter:
        stmt = stmt.where(Payment.status == status_filter)
        count_stmt = count_stmt.where(Payment.status == status_filter)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    stmt = stmt.order_by(Payment.id.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    payments = result.scalars().all()

    return PaymentListResponse(
        items=[PaymentResponse.model_validate(p) for p in payments],
        total=total,
    )


async def get_payment(
    db: AsyncSession, payment_id: int, user: User
) -> PaymentResponse:
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="付款记录不存在"
        )

    # Data isolation
    ent_type = await _get_enterprise_type(db, user)
    if ent_type == "manufacturer":
        result = await db.execute(
            select(PurchaseOrder).where(PurchaseOrder.id == payment.order_id)
        )
        order = result.scalar_one_or_none()
        if not order or order.enterprise_id != user.enterprise_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权查看此付款记录",
            )

    return PaymentResponse.model_validate(payment)


async def get_bank_account_info(
    db: AsyncSession, user: User
) -> BankAccountInfo:
    # Return core_tech enterprise's bank info for offline transfer
    result = await db.execute(
        select(Enterprise).where(Enterprise.type == "core_tech")
    )
    core_tech = result.scalar_one_or_none()
    if not core_tech:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="核心技术方企业不存在",
        )
    return BankAccountInfo(
        bank_name=core_tech.bank_name,
        bank_account=core_tech.bank_account,
        enterprise_name=core_tech.name,
    )


async def confirm_payment(
    db: AsyncSession, payment_id: int, req: PaymentConfirmRequest, user: User
) -> Payment:
    await _require_core_tech_finance(db, user)

    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="付款记录不存在"
        )

    # BR-FIN-003: confirmation cannot be revoked (once confirmed, no revert)
    if payment.status == "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="付款已确认，不可撤销",
        )
    if payment.status != "awaiting_confirm":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅待确认状态付款可确认",
        )

    payment.status = "confirmed"
    payment.confirmed_by = user.id
    payment.confirmed_at = datetime.utcnow()
    if req.remark is not None:
        payment.remark = req.remark

    # Update order status to "paid"
    order_result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == payment.order_id)
    )
    order = order_result.scalar_one_or_none()
    if order:
        order.status = "paid"

    # Create notification to core_tech business staff (to ship)
    notification = Notification(
        enterprise_id=user.enterprise_id,
        title="付款已确认，请安排发货",
        content=f"订单 {order.order_no if order else payment.order_id} 的付款已确认，请安排发货",
        type="payment",
        related_type="payment",
        related_id=payment.id,
    )
    db.add(notification)

    await db.commit()
    await db.refresh(payment)
    return payment


async def mark_payment_abnormal(
    db: AsyncSession, payment_id: int, req: PaymentMarkAbnormalRequest, user: User
) -> Payment:
    await _require_core_tech_finance(db, user)

    if req.status not in ("pending_verify", "amount_abnormal"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status 必须为 pending_verify 或 amount_abnormal",
        )

    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="付款记录不存在"
        )

    if payment.status != "awaiting_confirm":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅待确认状态付款可标记异常",
        )

    payment.status = req.status
    payment.remark = req.remark

    await db.commit()
    await db.refresh(payment)
    return payment
