from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.after_sales import AfterSalesTicket
from app.models.camera import Camera
from app.models.enterprise import Enterprise
from app.models.software_lock import SoftwareLock
from app.models.user import User
from app.schemas.after_sales import (
    AfterSalesCreate,
    AfterSalesHandleRequest,
    AfterSalesListResponse,
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


async def _generate_ticket_no(db: AsyncSession) -> str:
    """AS + yyyyMMdd + 4位流水号"""
    prefix = "AS" + datetime.now().strftime("%Y%m%d")
    result = await db.execute(
        select(func.max(AfterSalesTicket.ticket_no)).where(
            AfterSalesTicket.ticket_no.like(prefix + "%")
        )
    )
    max_no = result.scalar_one_or_none()
    if max_no:
        try:
            seq = int(max_no[-4:]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


async def create_ticket(
    db: AsyncSession, req: AfterSalesCreate, user: User
) -> AfterSalesTicket:
    ent_type = await _get_enterprise_type(db, user)
    if ent_type != "manufacturer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅生产厂可创建售后工单",
        )

    if req.category not in ("camera", "software"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="category 必须为 camera 或 software",
        )

    camera_id: Optional[int] = None
    software_lock_id: Optional[int] = None

    if req.category == "camera":
        result = await db.execute(select(Camera).where(Camera.sn == req.item_sn))
        camera = result.scalar_one_or_none()
        if not camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"相机SN {req.item_sn} 不存在",
            )
        camera_id = camera.id
    else:
        result = await db.execute(
            select(SoftwareLock).where(SoftwareLock.lock_id == req.item_sn)
        )
        lock = result.scalar_one_or_none()
        if not lock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"软件锁 {req.item_sn} 不存在",
            )
        software_lock_id = lock.id

    ticket_no = await _generate_ticket_no(db)
    ticket = AfterSalesTicket(
        ticket_no=ticket_no,
        type=req.type,
        category=req.category,
        item_sn=req.item_sn,
        camera_id=camera_id,
        software_lock_id=software_lock_id,
        device_id=req.device_id,
        enterprise_id=user.enterprise_id,
        title=req.title,
        description=req.description,
        status="pending",
        created_by=user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def handle_ticket(
    db: AsyncSession,
    ticket_id: int,
    req: AfterSalesHandleRequest,
    user: User,
) -> AfterSalesTicket:
    ent_type = await _get_enterprise_type(db, user)
    if ent_type != "core_tech":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅核心技术方可处理售后工单",
        )

    result = await db.execute(
        select(AfterSalesTicket).where(AfterSalesTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="售后工单不存在"
        )

    if req.status not in ("processing", "resolved", "closed", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status 必须为 processing/resolved/closed/rejected",
        )

    ticket.status = req.status
    ticket.handler_id = user.id
    ticket.handled_at = datetime.utcnow()
    ticket.resolution = req.resolution
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def list_tickets(
    db: AsyncSession,
    skip: int,
    limit: int,
    status_filter: Optional[str],
    category_filter: Optional[str],
    user: User,
) -> AfterSalesListResponse:
    ent_type = await _get_enterprise_type(db, user)

    stmt = select(AfterSalesTicket)
    count_stmt = select(func.count(AfterSalesTicket.id))

    # 数据隔离：生产厂仅可见本企业工单，核心技术方可见全部
    if ent_type == "manufacturer":
        stmt = stmt.where(AfterSalesTicket.enterprise_id == user.enterprise_id)
        count_stmt = count_stmt.where(
            AfterSalesTicket.enterprise_id == user.enterprise_id
        )

    if status_filter:
        stmt = stmt.where(AfterSalesTicket.status == status_filter)
        count_stmt = count_stmt.where(AfterSalesTicket.status == status_filter)

    if category_filter:
        stmt = stmt.where(AfterSalesTicket.category == category_filter)
        count_stmt = count_stmt.where(
            AfterSalesTicket.category == category_filter
        )

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    stmt = stmt.order_by(AfterSalesTicket.id.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    tickets = list(result.scalars().all())

    return AfterSalesListResponse(items=tickets, total=total)


async def get_ticket(
    db: AsyncSession, ticket_id: int, user: User
) -> AfterSalesTicket:
    ent_type = await _get_enterprise_type(db, user)

    result = await db.execute(
        select(AfterSalesTicket).where(AfterSalesTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="售后工单不存在"
        )

    # 数据隔离
    if ent_type == "manufacturer" and ticket.enterprise_id != user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看此售后工单",
        )

    return ticket
