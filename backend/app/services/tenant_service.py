from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import Tenant
from app.schemas.tenant import TenantCreate, TenantResponse, TenantListResponse


async def create_tenant(db: AsyncSession, tenant_in: TenantCreate) -> TenantResponse:
    stmt = select(Tenant).where(Tenant.name == tenant_in.name)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        raise ValueError(f"租户名称 {tenant_in.name} 已存在")

    tenant = Tenant(
        name=tenant_in.name,
        contact=tenant_in.contact,
        phone=tenant_in.phone,
        address=tenant_in.address,
    )

    db.add(tenant)
    try:
        await db.commit()
        await db.refresh(tenant)
    except IntegrityError:
        await db.rollback()
        raise ValueError(f"租户名称 {tenant_in.name} 已存在")

    return _to_response(tenant)


async def get_tenants(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
) -> TenantListResponse:
    stmt = select(Tenant)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    stmt = stmt.offset(skip).limit(limit).order_by(Tenant.created_at.desc())
    result = await db.execute(stmt)
    tenants = result.scalars().all()

    return TenantListResponse(
        total=total,
        items=[_to_response(t) for t in tenants],
    )


async def get_tenant(db: AsyncSession, tenant_id: int) -> TenantResponse | None:
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if tenant is None:
        return None

    return _to_response(tenant)


def _to_response(tenant: Tenant) -> TenantResponse:
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        contact=tenant.contact,
        phone=tenant.phone,
        address=tenant.address,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at,
    )
