from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.camera import CameraCreate, CameraResponse, CameraListResponse, CameraUpdate
from app.services import camera_service

router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.post("/sync", response_model=CameraResponse, status_code=201)
async def sync_camera(camera_in: CameraCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await camera_service.sync_camera(db, camera_in)
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="该功能的数据库逻辑尚未实现，待人工编写 SQLAlchemy/SQL 逻辑",
        )


@router.get("", response_model=CameraListResponse)
async def get_cameras(
    skip: int = Query(0, ge=0, description="分页偏移量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    status: str | None = Query(None, description="按状态筛选"),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await camera_service.get_cameras(db, skip=skip, limit=limit, status=status)
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="该功能的数据库逻辑尚未实现，待人工编写 SQLAlchemy/SQL 逻辑",
        )


@router.get("/{sn}", response_model=CameraResponse)
async def get_camera_by_sn(sn: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await camera_service.get_camera_by_sn(db, sn)
        if result is None:
            raise HTTPException(status_code=404, detail=f"相机 SN={sn} 不存在")
        return result
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="该功能的数据库逻辑尚未实现，待人工编写 SQLAlchemy/SQL 逻辑",
        )


@router.patch("/{sn}", response_model=CameraResponse)
async def update_camera(sn: str, camera_in: CameraUpdate, db: AsyncSession = Depends(get_db)):
    try:
        result = await camera_service.update_camera(db, sn, camera_in)
        if result is None:
            raise HTTPException(status_code=404, detail=f"相机 SN={sn} 不存在")
        return result
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="该功能的数据库逻辑尚未实现，待人工编写 SQLAlchemy/SQL 逻辑",
        )
