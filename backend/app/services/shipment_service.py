from datetime import datetime
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camera import Camera
from app.models.enterprise import Enterprise
from app.models.notification import Notification
from app.models.order import OrderItem, PurchaseOrder
from app.models.shipment import Shipment, ShipmentItem
from app.models.software_lock import SoftwareLock
from app.models.user import User
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentListResponse,
    ShipmentResponse,
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


async def create_shipment(
    db: AsyncSession, req: ShipmentCreate, user: User
) -> ShipmentResponse:
    # Validate user is core_tech business staff
    ent_type = await _get_enterprise_type(db, user)
    if ent_type != "core_tech":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅核心科技业务人员可发货",
        )

    # BR-SHIP-002: tracking_no must not be empty
    if not req.tracking_no or not req.tracking_no.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="物流单号不能为空",
        )

    # Order must be "paid" status
    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == req.order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在"
        )
    if order.status != "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅已付款订单可发货",
        )

    # BR-SHIP-001: target_enterprise_id = order.enterprise_id (the manufacturer who ordered)
    target_enterprise_id = order.enterprise_id

    if not req.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="发货单必须包含至少一个商品",
        )

    # Pre-fetch order items by id
    order_item_ids = {item.order_item_id for item in req.items}
    result = await db.execute(
        select(OrderItem).where(OrderItem.id.in_(order_item_ids))
    )
    order_items_map = {oi.id: oi for oi in result.scalars().all()}

    # Pre-fetch cameras by SN and software locks by lock_id
    camera_sns = [
        item.item_sn for item in req.items if item.item_type == "camera"
    ]
    lock_ids = [
        item.item_sn for item in req.items if item.item_type == "software_lock"
    ]

    cameras_map: dict = {}
    if camera_sns:
        result = await db.execute(
            select(Camera).where(Camera.sn.in_(camera_sns))
        )
        cameras_map = {c.sn: c for c in result.scalars().all()}

    locks_map: dict = {}
    if lock_ids:
        result = await db.execute(
            select(SoftwareLock).where(SoftwareLock.lock_id.in_(lock_ids))
        )
        locks_map = {l.lock_id: l for l in result.scalars().all()}

    shipment_items: List[ShipmentItem] = []
    for req_item in req.items:
        order_item = order_items_map.get(req_item.order_item_id)
        if not order_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"订单明细 {req_item.order_item_id} 不存在",
            )
        if order_item.order_id != order.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"订单明细 {req_item.order_item_id} 不属于该订单",
            )

        if req_item.item_type == "camera":
            camera = cameras_map.get(req_item.item_sn)
            if not camera:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"相机SN {req_item.item_sn} 不存在",
                )
            # Update camera status to "shipped"
            camera.status = "shipped"
            shipment_items.append(
                ShipmentItem(
                    order_item_id=req_item.order_item_id,
                    item_type="camera",
                    item_sn=req_item.item_sn,
                    camera_id=camera.id,
                    quantity=req_item.quantity,
                )
            )
        elif req_item.item_type == "software_lock":
            lock = locks_map.get(req_item.item_sn)
            if not lock:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"软件锁 {req_item.item_sn} 不存在",
                )
            # BR-SHIP-001: validate bound_enterprise_id == target_enterprise_id
            if lock.bound_enterprise_id != target_enterprise_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"软件锁 {req_item.item_sn} 未绑定至目标生产厂",
                )
            shipment_items.append(
                ShipmentItem(
                    order_item_id=req_item.order_item_id,
                    item_type="software_lock",
                    item_sn=req_item.item_sn,
                    software_lock_id=lock.id,
                    quantity=req_item.quantity,
                )
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的商品类型 {req_item.item_type}",
            )

        # Update order_item.shipped_quantity
        order_item.shipped_quantity += req_item.quantity

    # Create shipment + shipment_items
    shipment = Shipment(
        order_id=order.id,
        logistics_company=req.logistics_company,
        tracking_no=req.tracking_no,
        target_enterprise_id=target_enterprise_id,
        shipped_by=user.id,
        shipped_at=datetime.utcnow(),
        status="shipped",
        remark=req.remark,
    )
    shipment.items = shipment_items
    db.add(shipment)
    await db.flush()  # to get shipment.id for notification

    # If all items fully shipped, set order status="shipped"
    all_fully_shipped = True
    for oi in order.items:
        target_qty = (
            oi.confirmed_quantity
            if oi.confirmed_quantity is not None
            else oi.quantity
        )
        if oi.shipped_quantity < target_qty:
            all_fully_shipped = False
            break
    if all_fully_shipped:
        order.status = "shipped"

    # Create notification to manufacturer
    notification = Notification(
        enterprise_id=target_enterprise_id,
        title="发货通知",
        content=f"您的订单 {order.order_no} 已发货，物流单号：{req.tracking_no}",
        type="shipment",
        related_type="shipment",
        related_id=shipment.id,
    )
    db.add(notification)

    await db.commit()
    await db.refresh(shipment)

    # Reload with items
    result = await db.execute(
        select(Shipment)
        .options(selectinload(Shipment.items))
        .where(Shipment.id == shipment.id)
    )
    shipment = result.scalar_one()
    return ShipmentResponse.model_validate(shipment)


async def list_shipments(
    db: AsyncSession, skip: int, limit: int, user: User
) -> ShipmentListResponse:
    ent_type = await _get_enterprise_type(db, user)

    stmt = select(Shipment).options(selectinload(Shipment.items))
    count_stmt = select(func.count(Shipment.id))

    # Data isolation: manufacturer only sees shipments targeted to them
    if ent_type == "manufacturer":
        stmt = stmt.where(Shipment.target_enterprise_id == user.enterprise_id)
        count_stmt = count_stmt.where(
            Shipment.target_enterprise_id == user.enterprise_id
        )

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    stmt = stmt.order_by(Shipment.id.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    shipments = result.scalars().all()

    return ShipmentListResponse(
        items=[ShipmentResponse.model_validate(s) for s in shipments],
        total=total,
    )


async def get_shipment(
    db: AsyncSession, shipment_id: int, user: User
) -> ShipmentResponse:
    ent_type = await _get_enterprise_type(db, user)

    result = await db.execute(
        select(Shipment)
        .options(selectinload(Shipment.items))
        .where(Shipment.id == shipment_id)
    )
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="发货单不存在"
        )

    # Data isolation
    if (
        ent_type == "manufacturer"
        and shipment.target_enterprise_id != user.enterprise_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看此发货单",
        )

    return ShipmentResponse.model_validate(shipment)
