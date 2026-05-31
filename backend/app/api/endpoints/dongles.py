from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.dongle import DongleCreate, DongleResponse, DongleListResponse, DongleUpdate
from app.services import dongle_service

router = APIRouter(prefix="/dongles", tags=["dongles"])


@router.post("/sync", response_model=DongleResponse, status_code=201)
async def sync_dongle(dongle_in: DongleCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await dongle_service.sync_dongle(db, dongle_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=DongleListResponse)
async def get_dongles(
    skip: int = Query(0, ge=0, description="分页偏移量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    status: str | None = Query(None, description="按状态筛选"),
    db: AsyncSession = Depends(get_db),
):
    return await dongle_service.get_dongles(db, skip=skip, limit=limit, status=status)


@router.get("/{dongle_id}", response_model=DongleResponse)
async def get_dongle_by_sn(dongle_id: str, db: AsyncSession = Depends(get_db)):
    result = await dongle_service.get_dongle_by_sn(db, dongle_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"软件锁 ID={dongle_id} 不存在")
    return result


@router.patch("/{dongle_id}", response_model=DongleResponse)
async def update_dongle(dongle_id: str, dongle_in: DongleUpdate, db: AsyncSession = Depends(get_db)):
    try:
        result = await dongle_service.update_dongle(db, dongle_id, dongle_in)
        if result is None:
            raise HTTPException(status_code=404, detail=f"软件锁 ID={dongle_id} 不存在")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
