from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.db.base import get_db
from app.models.user import User
from app.schemas.receive import ReceiveConfirmRequest, ReceiveDiffRequest
from app.services import receive_service

router = APIRouter(prefix="/api/receive", tags=["receive"])


@router.post("/confirm")
async def confirm_receive(
    req: ReceiveConfirmRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("receive:confirm")),
):
    return await receive_service.confirm_receive(db, req, user)


@router.post("/report-diff")
async def report_diff(
    req: ReceiveDiffRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("receive:confirm")),
):
    return await receive_service.report_diff(db, req, user)
