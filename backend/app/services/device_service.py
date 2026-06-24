from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camera import Camera
from app.models.device import DeviceBom, WheelAligner
from app.models.enterprise import Enterprise
from app.models.software_lock import SoftwareLock
from app.models.user import User
from app.schemas.device import (
    DeviceBomResponse,
    DeviceCreate,
    DeviceListResponse,
    DeviceResponse,
)


async def _device_to_response(device: WheelAligner) -> DeviceResponse:
    return DeviceResponse(
        id=device.id,
        device_sn=device.device_sn,
        device_name=device.device_name,
        model=device.model,
        enterprise_id=device.enterprise_id,
        software_lock_id=device.software_lock_id,
        status=device.status,
        assembled_by=device.assembled_by,
        assembled_at=device.assembled_at,
        remark=device.remark,
        bom_items=[
            DeviceBomResponse(
                id=b.id,
                item_type=b.item_type,
                camera_id=b.camera_id,
                software_lock_id=b.software_lock_id,
                position_label=b.position_label,
            )
            for b in device.bom_items
        ],
        created_at=device.created_at,
    )


async def register_device(
    db: AsyncSession, req: DeviceCreate, user: User
) -> DeviceResponse:
    # Validate user's enterprise is manufacturer
    ent_result = await db.execute(
        select(Enterprise).where(Enterprise.id == user.enterprise_id)
    )
    enterprise = ent_result.scalar_one_or_none()
    if not enterprise or enterprise.type != "manufacturer":
        raise HTTPException(status_code=403, detail="仅生产厂可注册定位仪")

    # BR-ASM-002: device_sn unique
    existing = await db.execute(
        select(WheelAligner).where(WheelAligner.device_sn == req.device_sn)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="设备SN已存在")

    # BR-ASM-001: at least 2 cameras
    if len(req.cameras) < 2:
        raise HTTPException(status_code=400, detail="一台定位仪至少使用2个相机")

    # Fetch software_lock
    sl_result = await db.execute(
        select(SoftwareLock).where(SoftwareLock.id == req.software_lock_id)
    )
    software_lock = sl_result.scalar_one_or_none()
    if not software_lock:
        raise HTTPException(status_code=404, detail="软件锁不存在")

    # Check authorization expiry
    if software_lock.expire_date < datetime.utcnow():
        raise HTTPException(
            status_code=400, detail="软件锁已过期，需联系采购更新授权"
        )

    # BR-ASM-003: one lock per device
    if software_lock.bound_device_id is not None:
        raise HTTPException(
            status_code=400, detail="一个软件锁只能绑定一台定位仪"
        )

    # Check software_lock belongs to user's enterprise
    if software_lock.bound_enterprise_id != user.enterprise_id:
        raise HTTPException(status_code=403, detail="软件锁不属于当前企业")

    # Validate all cameras
    cameras_to_update = []
    for cam_item in req.cameras:
        cam_result = await db.execute(
            select(Camera).where(Camera.id == cam_item.camera_id)
        )
        camera = cam_result.scalar_one_or_none()
        if not camera:
            raise HTTPException(
                status_code=404, detail=f"相机不存在: {cam_item.camera_id}"
            )
        if camera.enterprise_id != user.enterprise_id:
            raise HTTPException(
                status_code=403, detail=f"相机不属于当前企业: {camera.sn}"
            )
        if camera.status == "used":
            raise HTTPException(
                status_code=400,
                detail=f"相机{camera.sn}已标记使用，需人工核实",
            )
        if camera.status != "in_stock":
            raise HTTPException(
                status_code=400,
                detail=f"相机{camera.sn}当前状态不可用: {camera.status}",
            )
        cameras_to_update.append(camera)

    # Create WheelAligner
    device = WheelAligner(
        device_sn=req.device_sn,
        device_name=req.device_name,
        model=req.model,
        enterprise_id=user.enterprise_id,
        software_lock_id=req.software_lock_id,
        status="assembled",
        assembled_by=user.id,
        remark=req.remark,
    )
    db.add(device)
    await db.flush()

    # Create DeviceBom for software_lock
    db.add(
        DeviceBom(
            device_id=device.id,
            item_type="software_lock",
            software_lock_id=req.software_lock_id,
        )
    )
    # Create DeviceBom per camera
    for cam_item in req.cameras:
        db.add(
            DeviceBom(
                device_id=device.id,
                item_type="camera",
                camera_id=cam_item.camera_id,
                position_label=cam_item.position_label,
            )
        )

    # Update software_lock
    software_lock.bound_device_id = device.id
    software_lock.status = "bound"

    # Update cameras
    for camera in cameras_to_update:
        camera.status = "used"

    await db.commit()

    # Re-fetch with bom_items loaded
    result = await db.execute(
        select(WheelAligner)
        .options(selectinload(WheelAligner.bom_items))
        .where(WheelAligner.id == device.id)
    )
    device = result.scalar_one()
    return await _device_to_response(device)


async def list_devices(
    db: AsyncSession, skip: int, limit: int, user: User
) -> DeviceListResponse:
    total_result = await db.execute(
        select(func.count())
        .select_from(WheelAligner)
        .where(WheelAligner.enterprise_id == user.enterprise_id)
    )
    total = total_result.scalar_one()

    result = await db.execute(
        select(WheelAligner)
        .options(selectinload(WheelAligner.bom_items))
        .where(WheelAligner.enterprise_id == user.enterprise_id)
        .order_by(WheelAligner.id)
        .offset(skip)
        .limit(limit)
    )
    devices = result.scalars().all()
    items = [await _device_to_response(d) for d in devices]
    return DeviceListResponse(items=items, total=total)


async def get_device(
    db: AsyncSession, device_id: int, user: User
) -> DeviceResponse:
    result = await db.execute(
        select(WheelAligner)
        .options(selectinload(WheelAligner.bom_items))
        .where(WheelAligner.id == device_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    if device.enterprise_id != user.enterprise_id:
        raise HTTPException(status_code=403, detail="无权访问该设备")
    return await _device_to_response(device)
