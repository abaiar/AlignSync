import json
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import Camera, CameraStatus
from app.schemas.camera import CameraCreate, CameraResponse, CameraListResponse, CameraUpdate


async def sync_camera(db: AsyncSession, camera_in: CameraCreate) -> CameraResponse:
    stmt = select(Camera).where(Camera.sn == camera_in.sn)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        raise ValueError(f"相机 SN={camera_in.sn} 已存在")

    camera = Camera(
        sn=camera_in.sn,
        model=camera_in.model,
        intrinsic_params=json.dumps(camera_in.intrinsic_params, ensure_ascii=False),
        extrinsic_params=json.dumps(camera_in.extrinsic_params, ensure_ascii=False),
        calibration_date=camera_in.calibration_date,
        status=CameraStatus.IN_STOCK,
    )

    db.add(camera)
    try:
        await db.commit()
        await db.refresh(camera)
    except IntegrityError:
        await db.rollback()
        raise ValueError(f"相机 SN={camera_in.sn} 已存在")

    return _to_response(camera)


async def get_cameras(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
) -> CameraListResponse:
    stmt = select(Camera)

    if status:
        try:
            status_enum = CameraStatus(status)
            stmt = stmt.where(Camera.status == status_enum)
        except ValueError:
            pass

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    stmt = stmt.offset(skip).limit(limit).order_by(Camera.created_at.desc())
    result = await db.execute(stmt)
    cameras = result.scalars().all()

    return CameraListResponse(
        total=total,
        items=[_to_response(c) for c in cameras],
    )


async def get_camera_by_sn(db: AsyncSession, sn: str) -> CameraResponse | None:
    stmt = select(Camera).where(Camera.sn == sn)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()

    if camera is None:
        return None

    return _to_response(camera)


async def update_camera(db: AsyncSession, sn: str, camera_in: CameraUpdate) -> CameraResponse | None:
    stmt = select(Camera).where(Camera.sn == sn)
    result = await db.execute(stmt)
    camera = result.scalar_one_or_none()

    if camera is None:
        return None

    update_data = camera_in.model_dump(exclude_unset=True)

    if "intrinsic_params" in update_data:
        camera.intrinsic_params = json.dumps(update_data["intrinsic_params"], ensure_ascii=False)
        del update_data["intrinsic_params"]

    if "extrinsic_params" in update_data:
        camera.extrinsic_params = json.dumps(update_data["extrinsic_params"], ensure_ascii=False)
        del update_data["extrinsic_params"]

    for key, value in update_data.items():
        setattr(camera, key, value)

    await db.commit()
    await db.refresh(camera)

    return _to_response(camera)


def _to_response(camera: Camera) -> CameraResponse:
    return CameraResponse(
        id=camera.id,
        sn=camera.sn,
        model=camera.model,
        intrinsic_params=json.loads(camera.intrinsic_params) if isinstance(camera.intrinsic_params, str) else camera.intrinsic_params,
        extrinsic_params=json.loads(camera.extrinsic_params) if isinstance(camera.extrinsic_params, str) else camera.extrinsic_params,
        calibration_date=camera.calibration_date,
        status=camera.status,
        created_at=camera.created_at,
        updated_at=camera.updated_at,
    )
