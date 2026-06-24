from datetime import datetime
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.after_sales import AfterSalesTicket
from app.models.camera import Camera
from app.models.device import WheelAligner
from app.models.enterprise import Enterprise
from app.models.order import OrderItem, PurchaseOrder
from app.models.shipment import Shipment
from app.models.software_lock import SoftwareLock
from app.models.user import User
from app.schemas.statistics import StatisticsSummary

# 采购订单有效状态：排除草稿与驳回
_PURCHASE_VALID = PurchaseOrder.status.notin_(["draft", "rejected"])
# 售后退货类型：type 包含 "return"
_RETURN_TYPE = AfterSalesTicket.type.like("%return%")


async def _get_enterprise_type(db: AsyncSession, user: User) -> str:
    result = await db.execute(
        select(Enterprise.type).where(Enterprise.id == user.enterprise_id)
    )
    return result.scalar_one_or_none() or ""


def _parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    return datetime.fromisoformat(s)


async def _month_group(
    db: AsyncSession, date_col, count_col, where_clauses: List
) -> dict:
    """按年月分组计数，返回 {month: count}"""
    month_expr = func.date_format(date_col, "%Y-%m")
    stmt = select(month_expr.label("month"), func.count(count_col))
    for clause in where_clauses:
        stmt = stmt.where(clause)
    stmt = stmt.group_by(month_expr)
    result = await db.execute(stmt)
    return {row[0]: int(row[1] or 0) for row in result.all()}


def _empty_month(m: str) -> dict:
    return {"month": m, "purchase": 0, "production": 0, "shipment": 0, "return": 0}


async def _by_month(
    db: AsyncSession,
    start_dt: Optional[datetime],
    end_dt: Optional[datetime],
    enterprise_id: Optional[int],
) -> List[dict]:
    months: dict = {}

    def ensure(m: str) -> dict:
        return months.setdefault(m, _empty_month(m))

    # 采购：按 created_at
    w: List = [_PURCHASE_VALID]
    if enterprise_id is not None:
        w.append(PurchaseOrder.enterprise_id == enterprise_id)
    if start_dt is not None:
        w.append(PurchaseOrder.created_at >= start_dt)
    if end_dt is not None:
        w.append(PurchaseOrder.created_at <= end_dt)
    for m, c in (
        await _month_group(db, PurchaseOrder.created_at, PurchaseOrder.id, w)
    ).items():
        ensure(m)["purchase"] = c

    # 生产：按 assembled_at
    w = []
    if enterprise_id is not None:
        w.append(WheelAligner.enterprise_id == enterprise_id)
    if start_dt is not None:
        w.append(WheelAligner.assembled_at >= start_dt)
    if end_dt is not None:
        w.append(WheelAligner.assembled_at <= end_dt)
    for m, c in (
        await _month_group(db, WheelAligner.assembled_at, WheelAligner.id, w)
    ).items():
        ensure(m)["production"] = c

    # 发货：按 shipped_at
    w = []
    if enterprise_id is not None:
        w.append(Shipment.target_enterprise_id == enterprise_id)
    if start_dt is not None:
        w.append(Shipment.shipped_at >= start_dt)
    if end_dt is not None:
        w.append(Shipment.shipped_at <= end_dt)
    for m, c in (
        await _month_group(db, Shipment.shipped_at, Shipment.id, w)
    ).items():
        ensure(m)["shipment"] = c

    # 退货：按 created_at
    w = [_RETURN_TYPE]
    if enterprise_id is not None:
        w.append(AfterSalesTicket.enterprise_id == enterprise_id)
    if start_dt is not None:
        w.append(AfterSalesTicket.created_at >= start_dt)
    if end_dt is not None:
        w.append(AfterSalesTicket.created_at <= end_dt)
    for m, c in (
        await _month_group(db, AfterSalesTicket.created_at, AfterSalesTicket.id, w)
    ).items():
        ensure(m)["return"] = c

    return sorted(months.values(), key=lambda x: x["month"])


async def _by_enterprise(
    db: AsyncSession,
    start_dt: Optional[datetime],
    end_dt: Optional[datetime],
    enterprise_id: Optional[int],
) -> List[dict]:
    counts: dict = {}
    ent_ids: set = set()

    def ensure(eid: int) -> dict:
        ent_ids.add(eid)
        return counts.setdefault(
            eid,
            {
                "enterprise_id": eid,
                "name": "",
                "purchase": 0,
                "production": 0,
                "shipment": 0,
            },
        )

    # 采购：按 enterprise_id
    stmt = select(
        PurchaseOrder.enterprise_id, func.count(PurchaseOrder.id)
    ).where(_PURCHASE_VALID)
    if enterprise_id is not None:
        stmt = stmt.where(PurchaseOrder.enterprise_id == enterprise_id)
    if start_dt is not None:
        stmt = stmt.where(PurchaseOrder.created_at >= start_dt)
    if end_dt is not None:
        stmt = stmt.where(PurchaseOrder.created_at <= end_dt)
    stmt = stmt.group_by(PurchaseOrder.enterprise_id)
    result = await db.execute(stmt)
    for eid, cnt in result.all():
        ensure(eid)["purchase"] = int(cnt or 0)

    # 生产：按 enterprise_id
    stmt = select(WheelAligner.enterprise_id, func.count(WheelAligner.id))
    if enterprise_id is not None:
        stmt = stmt.where(WheelAligner.enterprise_id == enterprise_id)
    if start_dt is not None:
        stmt = stmt.where(WheelAligner.assembled_at >= start_dt)
    if end_dt is not None:
        stmt = stmt.where(WheelAligner.assembled_at <= end_dt)
    stmt = stmt.group_by(WheelAligner.enterprise_id)
    result = await db.execute(stmt)
    for eid, cnt in result.all():
        ensure(eid)["production"] = int(cnt or 0)

    # 发货：按 target_enterprise_id
    stmt = select(Shipment.target_enterprise_id, func.count(Shipment.id))
    if enterprise_id is not None:
        stmt = stmt.where(Shipment.target_enterprise_id == enterprise_id)
    if start_dt is not None:
        stmt = stmt.where(Shipment.shipped_at >= start_dt)
    if end_dt is not None:
        stmt = stmt.where(Shipment.shipped_at <= end_dt)
    stmt = stmt.group_by(Shipment.target_enterprise_id)
    result = await db.execute(stmt)
    for eid, cnt in result.all():
        ensure(eid)["shipment"] = int(cnt or 0)

    # 企业名称
    if ent_ids:
        result = await db.execute(
            select(Enterprise.id, Enterprise.name).where(
                Enterprise.id.in_(ent_ids)
            )
        )
        for eid, name in result.all():
            if eid in counts:
                counts[eid]["name"] = name

    return list(counts.values())


async def _by_product(
    db: AsyncSession,
    start_dt: Optional[datetime],
    end_dt: Optional[datetime],
    enterprise_id: Optional[int],
    product_model: Optional[str],
) -> List[dict]:
    stmt = (
        select(
            OrderItem.product_model,
            func.coalesce(func.sum(OrderItem.quantity), 0),
            func.coalesce(
                func.sum(OrderItem.quantity * OrderItem.unit_price), 0
            ),
        )
        .join(PurchaseOrder, OrderItem.order_id == PurchaseOrder.id)
        .where(_PURCHASE_VALID)
    )
    if enterprise_id is not None:
        stmt = stmt.where(PurchaseOrder.enterprise_id == enterprise_id)
    if product_model:
        stmt = stmt.where(OrderItem.product_model == product_model)
    if start_dt is not None:
        stmt = stmt.where(PurchaseOrder.created_at >= start_dt)
    if end_dt is not None:
        stmt = stmt.where(PurchaseOrder.created_at <= end_dt)
    stmt = stmt.group_by(OrderItem.product_model)
    result = await db.execute(stmt)
    return [
        {
            "product_model": pm,
            "quantity": int(q or 0),
            "amount": float(a or 0),
        }
        for pm, q, a in result.all()
    ]


async def get_summary(
    db: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_model: Optional[str] = None,
    enterprise_id: Optional[int] = None,
    user: Optional[User] = None,
) -> StatisticsSummary:
    # 数据隔离：生产厂只能查看本企业
    if user is not None:
        ent_type = await _get_enterprise_type(db, user)
        if ent_type == "manufacturer":
            enterprise_id = user.enterprise_id

    start_dt = _parse_date(start_date)
    end_dt = _parse_date(end_date)

    # 采购订单计数与金额
    purchase_stmt = select(
        func.count(PurchaseOrder.id),
        func.coalesce(func.sum(PurchaseOrder.total_amount), 0),
    ).where(_PURCHASE_VALID)
    if enterprise_id is not None:
        purchase_stmt = purchase_stmt.where(
            PurchaseOrder.enterprise_id == enterprise_id
        )
    if start_dt is not None:
        purchase_stmt = purchase_stmt.where(PurchaseOrder.created_at >= start_dt)
    if end_dt is not None:
        purchase_stmt = purchase_stmt.where(PurchaseOrder.created_at <= end_dt)
    result = await db.execute(purchase_stmt)
    row = result.one()
    purchase_count = int(row[0] or 0)
    purchase_amount = float(row[1] or 0)

    # 生产（定位仪）计数
    prod_stmt = select(func.count(WheelAligner.id))
    if enterprise_id is not None:
        prod_stmt = prod_stmt.where(WheelAligner.enterprise_id == enterprise_id)
    if start_dt is not None:
        prod_stmt = prod_stmt.where(WheelAligner.assembled_at >= start_dt)
    if end_dt is not None:
        prod_stmt = prod_stmt.where(WheelAligner.assembled_at <= end_dt)
    result = await db.execute(prod_stmt)
    production_count = int(result.scalar_one() or 0)

    # 发货计数
    ship_stmt = select(func.count(Shipment.id))
    if enterprise_id is not None:
        ship_stmt = ship_stmt.where(
            Shipment.target_enterprise_id == enterprise_id
        )
    if start_dt is not None:
        ship_stmt = ship_stmt.where(Shipment.shipped_at >= start_dt)
    if end_dt is not None:
        ship_stmt = ship_stmt.where(Shipment.shipped_at <= end_dt)
    result = await db.execute(ship_stmt)
    shipment_count = int(result.scalar_one() or 0)

    # 退货计数
    return_stmt = select(func.count(AfterSalesTicket.id)).where(_RETURN_TYPE)
    if enterprise_id is not None:
        return_stmt = return_stmt.where(
            AfterSalesTicket.enterprise_id == enterprise_id
        )
    if start_dt is not None:
        return_stmt = return_stmt.where(AfterSalesTicket.created_at >= start_dt)
    if end_dt is not None:
        return_stmt = return_stmt.where(AfterSalesTicket.created_at <= end_dt)
    result = await db.execute(return_stmt)
    return_count = int(result.scalar_one() or 0)

    # 相机计数
    cam_stmt = select(func.count(Camera.id))
    if enterprise_id is not None:
        cam_stmt = cam_stmt.where(Camera.enterprise_id == enterprise_id)
    result = await db.execute(cam_stmt)
    camera_count = int(result.scalar_one() or 0)

    # 软件锁计数
    lock_stmt = select(func.count(SoftwareLock.id))
    if enterprise_id is not None:
        lock_stmt = lock_stmt.where(
            SoftwareLock.bound_enterprise_id == enterprise_id
        )
    result = await db.execute(lock_stmt)
    software_lock_count = int(result.scalar_one() or 0)

    by_month = await _by_month(db, start_dt, end_dt, enterprise_id)
    by_enterprise = await _by_enterprise(db, start_dt, end_dt, enterprise_id)
    by_product = await _by_product(
        db, start_dt, end_dt, enterprise_id, product_model
    )

    return StatisticsSummary(
        purchase_count=purchase_count,
        purchase_amount=purchase_amount,
        production_count=production_count,
        shipment_count=shipment_count,
        return_count=return_count,
        camera_count=camera_count,
        software_lock_count=software_lock_count,
        by_month=by_month,
        by_enterprise=by_enterprise,
        by_product=by_product,
    )
