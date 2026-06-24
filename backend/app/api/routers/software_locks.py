from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.db.base import get_db
from app.models.user import User
from app.schemas.software_lock import (
    SoftwareLockListResponse,
    SoftwareLockResponse,
    SoftwareLockSyncRequest,
)
from app.services.software_lock_service import software_lock_service

router = APIRouter(prefix="/api/software-locks", tags=["software-locks"])


@router.post("/sync", response_model=SoftwareLockResponse)
async def sync_lock(
    req: SoftwareLockSyncRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("software_lock:sync")),
):
    return await software_lock_service.sync_software_lock(db, req, user)


@router.get("", response_model=SoftwareLockListResponse)
async def list_locks(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await software_lock_service.list_software_locks(
        db, skip, limit, status, user
    )


@router.get("/{lock_pk}", response_model=SoftwareLockResponse)
async def get_lock(
    lock_pk: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await software_lock_service.get_software_lock(db, lock_pk)
