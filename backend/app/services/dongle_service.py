from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models import Dongle, DongleStatus
from app.schemas.dongle import DongleCreate, DongleResponse, DongleListResponse, DongleUpdate


async def sync_dongle(db: AsyncSession, dongle_in: DongleCreate) -> DongleResponse:
    stmt = select(Dongle).where(Dongle.dongle_id == dongle_in.dongle_id)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        raise ValueError(f"软件锁 ID={dongle_in.dongle_id} 已存在")

    dongle = Dongle(
        dongle_id=dongle_in.dongle_id,
        version=dongle_in.version,
        features=dongle_in.features,
        expiry_date=dongle_in.expiry_date,
        status=DongleStatus.AUTHORIZED,
    )

    db.add(dongle)
    try:
        await db.commit()
        await db.refresh(dongle)
    except IntegrityError:
        await db.rollback()
        raise ValueError(f"软件锁 ID={dongle_in.dongle_id} 已存在")

    return _to_response(dongle)


async def get_dongles(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
) -> DongleListResponse:
    stmt = select(Dongle)

    if status:
        try:
            status_enum = DongleStatus(status)
            stmt = stmt.where(Dongle.status == status_enum)
        except ValueError:
            pass

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    stmt = stmt.offset(skip).limit(limit).order_by(Dongle.created_at.desc())
    result = await db.execute(stmt)
    dongles = result.scalars().all()

    return DongleListResponse(
        total=total,
        items=[_to_response(d) for d in dongles],
    )


async def get_dongle_by_sn(db: AsyncSession, dongle_id: str) -> DongleResponse | None:
    stmt = select(Dongle).where(Dongle.dongle_id == dongle_id)
    result = await db.execute(stmt)
    dongle = result.scalar_one_or_none()

    if dongle is None:
        return None

    return _to_response(dongle)


async def update_dongle(db: AsyncSession, dongle_id: str, dongle_in: DongleUpdate) -> DongleResponse | None:
    stmt = select(Dongle).where(Dongle.dongle_id == dongle_id)
    result = await db.execute(stmt)
    dongle = result.scalar_one_or_none()

    if dongle is None:
        return None

    update_data = dongle_in.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(dongle, key, value)

    await db.commit()
    await db.refresh(dongle)

    return _to_response(dongle)


def _to_response(dongle: Dongle) -> DongleResponse:
    return DongleResponse(
        id=dongle.id,
        dongle_id=dongle.dongle_id,
        version=dongle.version,
        features=dongle.features if dongle.features else [],
        expiry_date=dongle.expiry_date,
        status=dongle.status,
        created_at=dongle.created_at,
        updated_at=dongle.updated_at,
    )
