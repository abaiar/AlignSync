from datetime import datetime
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camera import Camera
from app.models.enterprise import Enterprise
from app.models.notification import Notification
from app.models.order import OrderItem, PurchaseOrder
from app.models.shipment import Shipment, ShipmentItem
from app.models.software_lock import SoftwareLock
from app.models.user import User
from app.schemas.receive import ReceiveConfirmRequest, ReceiveDiffRequest
from app.schemas.shipment import ShipmentResponse


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


async def confirm_receive(
    db: AsyncSession, req: ReceiveConfirmRequest, user: User
) -> ShipmentResponse:
    # Validate user is manufacturer (the buyer)
    ent_type = await _get_enterprise_type(db, user)
    if ent_type != "manufacturer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅生产厂可确认收货",
        )

    # Shipment must exist, target_enterprise_id == user.enterprise_id, status == "shipped"
    result = await db.execute(
        select(Shipment)
        .options(selectinload(Shipment.items))
        .where(Shipment.id == req.shipment_id)
    )
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="发货单不存在"
        )
    if shipment.target_enterprise_id != user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权确认此发货单",
        )
    if shipment.status != "shipped":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅已发货状态发货单可确认收货",
        )

    # Pre-fetch order items for this shipment
    order_item_ids = {si.order_item_id for si in shipment.items}
    result = await db.execute(
        select(OrderItem).where(OrderItem.id.in_(order_item_ids))
    )
    order_items_map = {oi.id: oi for oi in result.scalars().all()}

    # Pre-fetch cameras and software locks
    camera_ids = [si.camera_id for si in shipment.items if si.camera_id]
    lock_ids = [si.software_lock_id for si in shipment.items if si.software_lock_id]

    cameras_map: dict = {}
    if camera_ids:
        result = await db.execute(
            select(Camera).where(Camera.id.in_(camera_ids))
        )
        cameras_map = {c.id: c for c in result.scalars().all()}

    locks_map: dict = {}
    if lock_ids:
        result = await db.execute(
            select(SoftwareLock).where(SoftwareLock.id.in_(lock_ids))
        )
        locks_map = {l.id: l for l in result.scalars().all()}

    # Determine received items and quantities
    if req.received_items is None:
        # All received: use each ShipmentItem's quantity
        received_qty_map: dict = {
            si.order_item_id: si.quantity for si in shipment.items
        }
    else:
        received_qty_map = {
            item["order_item_id"]: item["received_quantity"]
            for item in req.received_items
        }

    # Update order_items received_quantity and camera/software_lock status
    for si in shipment.items:
        if si.order_item_id not in received_qty_map:
            continue
        received_qty = received_qty_map.get(si.order_item_id, 0)
        if received_qty <= 0:
            continue

        order_item = order_items_map.get(si.order_item_id)
        if order_item:
            order_item.received_quantity += received_qty

        # Update camera/software_lock status (received into manufacturer inventory)
        if si.item_type == "camera" and si.camera_id:
            camera = cameras_map.get(si.camera_id)
            if camera:
                camera.status = "in_stock"
                camera.enterprise_id = user.enterprise_id
        elif si.item_type == "software_lock" and si.software_lock_id:
            lock = locks_map.get(si.software_lock_id)
            if lock:
                lock.status = "bound"
                lock.bound_enterprise_id = user.enterprise_id

    # Update shipment status to "received", record received_at (BR-RCV-001)
    shipment.status = "received"
    shipment.received_at = datetime.utcnow()
    if req.remark is not None:
        shipment.remark = req.remark

    # If all shipments of order are received, update order status to "completed"
    result = await db.execute(
        select(Shipment).where(Shipment.order_id == shipment.order_id)
    )
    order_shipments: List[Shipment] = result.scalars().all()
    if all(s.status == "received" for s in order_shipments):
        result = await db.execute(
            select(PurchaseOrder).where(PurchaseOrder.id == shipment.order_id)
        )
        order = result.scalar_one_or_none()
        if order:
            order.status = "completed"

    # Create notification to core_tech
    result = await db.execute(
        select(Enterprise).where(Enterprise.type == "core_tech")
    )
    core_tech = result.scalar_one_or_none()
    if core_tech:
        notification = Notification(
            enterprise_id=core_tech.id,
            title="收货确认通知",
            content=f"发货单 {shipment.id} 已被生产厂确认收货",
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


async def report_diff(
    db: AsyncSession, req: ReceiveDiffRequest, user: User
) -> dict:
    # Validate user is manufacturer
    ent_type = await _get_enterprise_type(db, user)
    if ent_type != "manufacturer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅生产厂可上报差异",
        )

    # Shipment must be "shipped" or "received"
    result = await db.execute(
        select(Shipment).where(Shipment.id == req.shipment_id)
    )
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="发货单不存在"
        )
    if shipment.status not in ("shipped", "received"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅已发货或已收货状态发货单可上报差异",
        )

    if req.diff_type not in ("missing", "damaged", "wrong"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="diff_type 必须为 missing、damaged 或 wrong",
        )

    # Create notification to core_tech with diff details
    result = await db.execute(
        select(Enterprise).where(Enterprise.type == "core_tech")
    )
    core_tech = result.scalar_one_or_none()
    if core_tech:
        diff_type_map = {
            "missing": "缺失",
            "damaged": "损坏",
            "wrong": "错发",
        }
        notification = Notification(
            enterprise_id=core_tech.id,
            title="收货差异上报",
            content=(
                f"发货单 {shipment.id} 明细 {req.order_item_id} "
                f"存在差异（{diff_type_map.get(req.diff_type, req.diff_type)}）："
                f"{req.diff_description}"
            ),
            type="shipment",
            related_type="shipment",
            related_id=shipment.id,
        )
        db.add(notification)

    await db.commit()
    return {"status": "reported", "message": "差异已上报，技术企业将处理"}
