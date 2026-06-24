from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.camera import Camera
from app.models.enterprise import Enterprise
from app.models.user import User
from app.schemas.camera import (
    CameraBatchSyncItem,
    CameraBatchSyncRequest,
    CameraBatchSyncResponse,
    CameraListResponse,
    CameraSyncRequest,
)


async def _generate_internal_id(db: AsyncSession) -> str:
    result = await db.execute(select(func.max(Camera.id)))
    max_id = result.scalar_one_or_none() or 0
    return f"CAM-{max_id + 1:06d}"


async def _validate_calibration(req: CameraSyncRequest) -> None:
    if not req.intrinsics or not isinstance(req.intrinsics, dict):
        raise HTTPException(status_code=400, detail="标定数据不完整")
    if not req.extrinsics or not isinstance(req.extrinsics, dict):
        raise HTTPException(status_code=400, detail="标定数据不完整")


async def sync_camera(db: AsyncSession, req: CameraSyncRequest, user: User) -> Camera:
    # BR-CAM-002: validate calibration data completeness
    await _validate_calibration(req)

    # BR-CAM-001: check SN uniqueness
    result = await db.execute(select(Camera).where(Camera.sn == req.sn))
    existing = result.scalar_one_or_none()

    if existing:
        if not req.overwrite:
            raise HTTPException(status_code=409, detail="相机SN已存在，请检查")
        existing.model = req.model
        existing.intrinsics = req.intrinsics
        existing.extrinsics = req.extrinsics
        await db.commit()
        await db.refresh(existing)
        return existing

    internal_id = await _generate_internal_id(db)
    camera = Camera(
        internal_id=internal_id,
        sn=req.sn,
        model=req.model,
        intrinsics=req.intrinsics,
        extrinsics=req.extrinsics,
        status="in_stock",
        enterprise_id=user.enterprise_id,
        synced_by=user.id,
    )
    db.add(camera)
    await db.commit()
    await db.refresh(camera)
    return camera


async def batch_sync(
    db: AsyncSession, req: CameraBatchSyncRequest, user: User
) -> CameraBatchSyncResponse:
    if len(req.cameras) > 100:
        raise HTTPException(status_code=400, detail="批量同步一次最多100个相机")

    results: List[CameraBatchSyncItem] = []
    success_count = 0
    fail_count = 0

    for item in req.cameras:
        try:
            await sync_camera(db, item, user)
            results.append(
                CameraBatchSyncItem(sn=item.sn, success=True, message="同步成功")
            )
            success_count += 1
        except HTTPException as e:
            await db.rollback()
            results.append(
                CameraBatchSyncItem(sn=item.sn, success=False, message=str(e.detail))
            )
            fail_count += 1
        except Exception as e:
            await db.rollback()
            results.append(
                CameraBatchSyncItem(sn=item.sn, success=False, message=str(e))
            )
            fail_count += 1

    return CameraBatchSyncResponse(
        total=len(req.cameras),
        success_count=success_count,
        fail_count=fail_count,
        results=results,
    )


async def list_cameras(
    db: AsyncSession,
    skip: int,
    limit: int,
    status_filter: Optional[str],
    sn_filter: Optional[str],
    user: User,
) -> CameraListResponse:
    query = select(Camera)
    count_query = select(func.count(Camera.id))

    # Enterprise-based access control
    ent_result = await db.execute(
        select(Enterprise.type).where(Enterprise.id == user.enterprise_id)
    )
    ent_type = ent_result.scalar_one_or_none()
    if ent_type == "manufacturer":
        query = query.where(Camera.enterprise_id == user.enterprise_id)
        count_query = count_query.where(Camera.enterprise_id == user.enterprise_id)

    if status_filter:
        query = query.where(Camera.status == status_filter)
        count_query = count_query.where(Camera.status == status_filter)

    if sn_filter:
        query = query.where(Camera.sn.like(f"%{sn_filter}%"))
        count_query = count_query.where(Camera.sn.like(f"%{sn_filter}%"))

    query = query.offset(skip).limit(limit).order_by(Camera.id.desc())

    result = await db.execute(query)
    items = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    return CameraListResponse(items=items, total=total)


async def get_camera(db: AsyncSession, camera_id: int) -> Camera:
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="相机不存在")
    return camera
