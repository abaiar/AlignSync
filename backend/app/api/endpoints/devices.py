from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.device import DeviceAssembleRequest, DeviceResponse, DeviceListResponse, DeviceTraceResponse
from app.services import device_service

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/assemble", response_model=DeviceResponse, status_code=201)
async def assemble_device(data: DeviceAssembleRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await device_service.assemble_device(db, data)
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="该功能的数据库逻辑尚未实现，待人工编写 SQLAlchemy/SQL 逻辑",
        )


@router.get("", response_model=DeviceListResponse)
async def get_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await device_service.get_devices(db, skip=skip, limit=limit, status=status)
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="该功能的数据库逻辑尚未实现，待人工编写 SQLAlchemy/SQL 逻辑",
        )


@router.get("/{device_sn}", response_model=DeviceResponse)
async def get_device_by_sn(device_sn: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await device_service.get_device_by_sn(db, device_sn)
        if result is None:
            raise HTTPException(status_code=404, detail=f"设备 SN={device_sn} 不存在")
        return result
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="该功能的数据库逻辑尚未实现，待人工编写 SQLAlchemy/SQL 逻辑",
        )


@router.get("/{device_sn}/trace", response_model=DeviceTraceResponse)
async def trace_device(device_sn: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await device_service.trace_device(db, device_sn)
        if result is None:
            raise HTTPException(status_code=404, detail=f"设备 SN={device_sn} 不存在")
        return result
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="该功能的数据库逻辑尚未实现，待人工编写 SQLAlchemy/SQL 逻辑",
        )
