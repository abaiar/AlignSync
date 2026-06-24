from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.statistics import StatisticsSummary
from app.services import statistics_service

router = APIRouter(prefix="/api/statistics", tags=["statistics"])


@router.get("/summary", response_model=StatisticsSummary)
async def get_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_model: Optional[str] = None,
    enterprise_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await statistics_service.get_summary(
        db, start_date, end_date, product_model, enterprise_id, user
    )
