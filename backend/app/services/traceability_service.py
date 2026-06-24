from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camera import Camera
from app.models.device import DeviceBom, WheelAligner
from app.models.order import OrderItem, PurchaseOrder
from app.models.shipment import ShipmentItem
from app.models.software_lock import SoftwareLock
from app.models.user import User
from app.schemas.traceability import (
    TraceabilityCameraInfo,
    TraceabilityOrderInfo,
    TraceabilityResponse,
    TraceabilitySoftwareLockInfo,
)


async def _find_device(
    db: AsyncSession,
    device_sn: Optional[str],
    camera_sn: Optional[str],
    software_lock_id_str: Optional[str],
) -> WheelAligner:
    """Locate the device by one of the three identifiers."""
    if device_sn:
        result = await db.execute(
            select(WheelAligner)
            .options(selectinload(WheelAligner.bom_items))
            .where(WheelAligner.device_sn == device_sn)
        )
        device = result.scalar_one_or_none()
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"设备不存在: {device_sn}",
            )
        return device

    if camera_sn:
        cam_result = await db.execute(
            select(Camera.id).where(Camera.sn == camera_sn)
        )
        camera_id = cam_result.scalar_one_or_none()
        if not camera_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"相机不存在: {camera_sn}",
            )
        bom_result = await db.execute(
            select(DeviceBom.device_id).where(
                and_(
                    DeviceBom.item_type == "camera",
                    DeviceBom.camera_id == camera_id,
                )
            )
        )
        device_id = bom_result.scalar_one_or_none()
        if not device_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"相机 {camera_sn} 未绑定至任何设备",
            )
        result = await db.execute(
            select(WheelAligner)
            .options(selectinload(WheelAligner.bom_items))
            .where(WheelAligner.id == device_id)
        )
        device = result.scalar_one_or_none()
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="设备不存在"
            )
        return device

    if software_lock_id_str:
        lock_result = await db.execute(
            select(SoftwareLock.id).where(
                SoftwareLock.lock_id == software_lock_id_str
            )
        )
        lock_pk = lock_result.scalar_one_or_none()
        if not lock_pk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"软件锁不存在: {software_lock_id_str}",
            )
        bom_result = await db.execute(
            select(DeviceBom.device_id).where(
                and_(
                    DeviceBom.item_type == "software_lock",
                    DeviceBom.software_lock_id == lock_pk,
                )
            )
        )
        device_id = bom_result.scalar_one_or_none()
        if not device_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"软件锁 {software_lock_id_str} 未绑定至任何设备",
            )
        result = await db.execute(
            select(WheelAligner)
            .options(selectinload(WheelAligner.bom_items))
            .where(WheelAligner.id == device_id)
        )
        device = result.scalar_one_or_none()
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="设备不存在"
            )
        return device

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="必须提供 device_sn、camera_sn 或 software_lock_id 之一",
    )


async def query_traceability(
    db: AsyncSession,
    device_sn: Optional[str] = None,
    camera_sn: Optional[str] = None,
    software_lock_id_str: Optional[str] = None,
) -> TraceabilityResponse:
    device = await _find_device(db, device_sn, camera_sn, software_lock_id_str)

    # Assembled_by username
    assembled_by_name: Optional[str] = None
    if device.assembled_by:
        user_result = await db.execute(
            select(User.username).where(User.id == device.assembled_by)
        )
        assembled_by_name = user_result.scalar_one_or_none()

    # Software lock details (from device.software_lock_id)
    software_lock_info: Optional[TraceabilitySoftwareLockInfo] = None
    if device.software_lock_id:
        sl_result = await db.execute(
            select(SoftwareLock).where(SoftwareLock.id == device.software_lock_id)
        )
        lock = sl_result.scalar_one_or_none()
        if lock:
            software_lock_info = TraceabilitySoftwareLockInfo(
                lock_id=lock.id,
                lock_sn=lock.lock_id,
                software_version=lock.software_version,
                function_version=lock.function_version,
                function_list=lock.function_list,
                expire_date=lock.expire_date,
                status=lock.status,
            )

    # Camera list from BOM
    camera_boms = [
        b for b in device.bom_items if b.item_type == "camera" and b.camera_id
    ]
    camera_ids = [b.camera_id for b in camera_boms]
    cameras_info: List[TraceabilityCameraInfo] = []
    if camera_ids:
        cam_result = await db.execute(
            select(Camera).where(Camera.id.in_(camera_ids))
        )
        cameras_map = {c.id: c for c in cam_result.scalars().all()}
        for b in camera_boms:
            cam = cameras_map.get(b.camera_id)
            if not cam:
                continue
            cameras_info.append(
                TraceabilityCameraInfo(
                    camera_id=cam.id,
                    internal_id=cam.internal_id,
                    sn=cam.sn,
                    model=cam.model,
                    intrinsics=cam.intrinsics,
                    extrinsics=cam.extrinsics,
                    status=cam.status,
                    position_label=b.position_label,
                )
            )

    # Purchase orders: through shipment_items -> order_items -> purchase_orders
    lock_pk_for_shipment = device.software_lock_id
    shipment_filter_clauses = []
    if camera_ids:
        shipment_filter_clauses.append(ShipmentItem.camera_id.in_(camera_ids))
    if lock_pk_for_shipment:
        shipment_filter_clauses.append(
            ShipmentItem.software_lock_id == lock_pk_for_shipment
        )

    purchase_orders_info: List[TraceabilityOrderInfo] = []
    if shipment_filter_clauses:
        stmt = (
            select(PurchaseOrder)
            .join(OrderItem, OrderItem.order_id == PurchaseOrder.id)
            .join(ShipmentItem, ShipmentItem.order_item_id == OrderItem.id)
            .where(or_(*shipment_filter_clauses))
            .distinct()
        )
        po_result = await db.execute(stmt)
        for po in po_result.scalars().all():
            purchase_orders_info.append(
                TraceabilityOrderInfo(
                    order_id=po.id,
                    order_no=po.order_no,
                    order_type=po.order_type,
                    status=po.status,
                    total_amount=float(po.total_amount),
                    created_at=po.created_at,
                )
            )

    return TraceabilityResponse(
        device_id=device.id,
        device_sn=device.device_sn,
        device_name=device.device_name,
        model=device.model,
        enterprise_id=device.enterprise_id,
        assembled_by=assembled_by_name,
        assembled_at=device.assembled_at,
        software_lock=software_lock_info,
        cameras=cameras_info,
        purchase_orders=purchase_orders_info,
    )


async def export_traceability_report(
    db: AsyncSession,
    device_sn: Optional[str] = None,
    camera_sn: Optional[str] = None,
    software_lock_id_str: Optional[str] = None,
) -> dict:
    data = await query_traceability(
        db, device_sn, camera_sn, software_lock_id_str
    )
    filename = f"traceability_{data.device_sn}.json"
    return {
        "filename": filename,
        "content": data.model_dump(mode="json"),
        "format": "json",
    }
