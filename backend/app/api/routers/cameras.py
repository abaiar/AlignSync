from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.db.base import get_db
from app.models.user import User
from app.schemas.camera import (
    CameraBatchSyncResponse,
    CameraListResponse,
    CameraResponse,
    CameraSyncRequest,
    CameraBatchSyncRequest,
)
from app.services import camera_service

router = APIRouter(prefix="/api/cameras", tags=["cameras"])


@router.post("/sync", response_model=CameraResponse)
async def sync_single(
    req: CameraSyncRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("camera:sync")),
):
    return await camera_service.sync_camera(db, req, user)


@router.post("/batch-sync", response_model=CameraBatchSyncResponse)
async def sync_batch(
    req: CameraBatchSyncRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("camera:sync")),
):
    return await camera_service.batch_sync(db, req, user)


@router.get("", response_model=CameraListResponse)
async def list_cameras(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    sn: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await camera_service.list_cameras(db, skip, limit, status, sn, user)


@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    camera_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await camera_service.get_camera(db, camera_id)
