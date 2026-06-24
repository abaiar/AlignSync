from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.db.base import get_db
from app.models.user import User
from app.schemas.device import DeviceCreate, DeviceListResponse, DeviceResponse
from app.services import device_service

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.post("", response_model=DeviceResponse, status_code=201)
async def register_device(
    req: DeviceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("device:register")),
):
    return await device_service.register_device(db, req, user)


@router.get("", response_model=DeviceListResponse)
async def list_devices(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await device_service.list_devices(db, skip, limit, user)


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await device_service.get_device(db, device_id, user)
