import hashlib
import json
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.models import Device, DeviceCamera, Camera, Dongle, CameraStatus, DongleStatus, DeviceStatus
from app.schemas.device import DeviceAssembleRequest, DeviceResponse, DeviceListResponse, DeviceTraceResponse, CameraBinding


async def assemble_device(
    db: AsyncSession,
    data: DeviceAssembleRequest,
) -> DeviceResponse:
    stmt = select(Device).where(Device.device_sn == data.device_sn)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise ValueError(f"设备 SN={data.device_sn} 已存在")

    stmt = select(Dongle).where(Dongle.dongle_id == data.dongle_sn)
    result = await db.execute(stmt)
    dongle = result.scalar_one_or_none()
    if not dongle:
        raise ValueError(f"软件锁 ID={data.dongle_sn} 不存在")
    if dongle.status != DongleStatus.IN_STOCK:
        raise ValueError(f"软件锁 ID={data.dongle_sn} 状态为 {dongle.status.value}，无法绑定")

    camera_sns = [c.camera_sn for c in data.cameras]
    stmt = select(Camera).where(Camera.sn.in_(camera_sns))
    result = await db.execute(stmt)
    cameras = {c.sn: c for c in result.scalars().all()}

    for cam_binding in data.cameras:
        if cam_binding.camera_sn not in cameras:
            raise ValueError(f"相机 SN={cam_binding.camera_sn} 不存在")
        if cameras[cam_binding.camera_sn].status != CameraStatus.IN_STOCK:
            raise ValueError(f"相机 SN={cam_binding.camera_sn} 状态非在库，无法绑定")

    positions = [c.position for c in data.cameras]
    if len(positions) != len(set(positions)):
        raise ValueError("相机安装位置不可重复")

    intrinsic_data = "".join(
        json.dumps(json.loads(cameras[c.camera_sn].intrinsic_params), sort_keys=True)
        for c in sorted(data.cameras, key=lambda x: x.camera_sn)
    )
    auth_code = hashlib.sha256(
        f"{data.device_sn}:{data.dongle_sn}:{intrinsic_data}".encode()
    ).hexdigest()[:32]

    device = Device(
        device_sn=data.device_sn,
        dongle_id=data.dongle_sn,
        authorization_code=auth_code,
        status=DeviceStatus.ASSEMBLED,
    )
    db.add(device)
    await db.flush()

    for cam_binding in data.cameras:
        device_camera = DeviceCamera(
            device_id=device.id,
            camera_sn=cam_binding.camera_sn,
            position=cam_binding.position,
        )
        db.add(device_camera)
        cameras[cam_binding.camera_sn].status = CameraStatus.USED

    dongle.status = DongleStatus.USED

    try:
        await db.commit()
        await db.refresh(device)
    except IntegrityError as e:
        await db.rollback()
        raise ValueError(f"设备登记失败：{str(e)}")

    stmt = (
        select(Device)
        .options(selectinload(Device.cameras))
        .where(Device.id == device.id)
    )
    result = await db.execute(stmt)
    device = result.scalar_one()

    return _to_response(device)


async def get_devices(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
) -> DeviceListResponse:
    stmt = select(Device).options(selectinload(Device.cameras))

    if status:
        try:
            status_enum = DeviceStatus(status)
            stmt = stmt.where(Device.status == status_enum)
        except ValueError:
            pass

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    stmt = stmt.offset(skip).limit(limit).order_by(Device.created_at.desc())
    result = await db.execute(stmt)
    devices = result.scalars().all()

    return DeviceListResponse(
        total=total,
        items=[_to_response(d) for d in devices],
    )


async def get_device_by_sn(db: AsyncSession, device_sn: str) -> DeviceResponse | None:
    stmt = (
        select(Device)
        .options(selectinload(Device.cameras))
        .where(Device.device_sn == device_sn)
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()

    if device is None:
        return None

    return _to_response(device)


async def trace_device(db: AsyncSession, device_sn: str) -> DeviceTraceResponse | None:
    stmt = (
        select(Device)
        .options(selectinload(Device.cameras))
        .where(Device.device_sn == device_sn)
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()

    if device is None:
        return None

    dongle_version = None
    stmt_dongle = select(Dongle).where(Dongle.dongle_id == device.dongle_id)
    result_dongle = await db.execute(stmt_dongle)
    dongle = result_dongle.scalar_one_or_none()
    if dongle:
        dongle_version = dongle.version

    camera_details = []
    for dc in device.cameras:
        stmt_cam = select(Camera).where(Camera.sn == dc.camera_sn)
        result_cam = await db.execute(stmt_cam)
        cam = result_cam.scalar_one_or_none()
        if cam:
            camera_details.append({
                "camera_sn": cam.sn,
                "model": cam.model,
                "position": dc.position,
                "intrinsic_params": json.loads(cam.intrinsic_params) if isinstance(cam.intrinsic_params, str) else cam.intrinsic_params,
                "extrinsic_params": json.loads(cam.extrinsic_params) if isinstance(cam.extrinsic_params, str) else cam.extrinsic_params,
                "calibration_date": cam.calibration_date.isoformat() if cam.calibration_date else None,
            })

    purchase_date = device.created_at

    return DeviceTraceResponse(
        device_sn=device.device_sn,
        dongle_sn=device.dongle_id,
        dongle_version=dongle_version,
        cameras=camera_details,
        purchase_date=purchase_date,
        assembler=None,
        authorization_code=device.authorization_code,
        created_at=device.created_at,
    )


def _to_response(device: Device) -> DeviceResponse:
    return DeviceResponse(
        id=device.id,
        device_sn=device.device_sn,
        dongle_sn=device.dongle_id,
        cameras=[
            CameraBinding(camera_sn=dc.camera_sn, position=dc.position)
            for dc in device.cameras
        ],
        authorization_code=device.authorization_code,
        status=device.status,
        created_at=device.created_at,
        updated_at=device.updated_at,
    )
