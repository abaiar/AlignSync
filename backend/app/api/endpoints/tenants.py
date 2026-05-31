from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.tenant import TenantCreate, TenantResponse, TenantListResponse
from app.services import tenant_service

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(tenant_in: TenantCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await tenant_service.create_tenant(db, tenant_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=TenantListResponse)
async def get_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await tenant_service.get_tenants(db, skip=skip, limit=limit)


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: int, db: AsyncSession = Depends(get_db)):
    result = await tenant_service.get_tenant(db, tenant_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"租户 ID={tenant_id} 不存在")
    return result
