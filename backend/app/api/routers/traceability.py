from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.traceability import TraceabilityResponse
from app.services import traceability_service

router = APIRouter(prefix="/api/traceability", tags=["traceability"])


@router.get("", response_model=TraceabilityResponse)
async def query(
    device_sn: Optional[str] = None,
    camera_sn: Optional[str] = None,
    software_lock_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await traceability_service.query_traceability(
        db, device_sn, camera_sn, software_lock_id
    )


@router.get("/export")
async def export_report(
    device_sn: Optional[str] = None,
    camera_sn: Optional[str] = None,
    software_lock_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await traceability_service.export_traceability_report(
        db, device_sn, camera_sn, software_lock_id
    )
