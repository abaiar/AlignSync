from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enterprise import Enterprise
from app.models.software_lock import SoftwareLock
from app.models.user import User
from app.schemas.software_lock import SoftwareLockSyncRequest
from app.services.external.auth_client import auth_system_client


class SoftwareLockService:
    async def sync_software_lock(
        self, db: AsyncSession, req: SoftwareLockSyncRequest, user: User
    ) -> SoftwareLock:
        auth_info = await auth_system_client.fetch_authorization(req.lock_id)
        if not auth_info:
            raise HTTPException(
                status_code=400, detail="授权信息不完整，缺少: lock_id"
            )

        missing: List[str] = []
        for field in (
            "software_version",
            "function_version",
            "function_list",
            "expire_date",
        ):
            if not auth_info.get(field):
                missing.append(field)
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"授权信息不完整，缺少: {', '.join(missing)}",
            )

        # BR-SW-002: function_version must be a non-empty string
        function_version = auth_info["function_version"]
        if not isinstance(function_version, str) or not function_version.strip():
            raise HTTPException(status_code=400, detail="功能版本不能为空")

        expire_date = auth_info["expire_date"]
        if isinstance(expire_date, str):
            expire_date = datetime.fromisoformat(expire_date)

        result = await db.execute(
            select(SoftwareLock).where(SoftwareLock.lock_id == req.lock_id)
        )
        existing = result.scalar_one_or_none()

        if existing and not req.overwrite:
            raise HTTPException(
                status_code=409, detail="该软件锁已有授权记录"
            )

        # BR-SW-001: one lock can only be authorized to one manufacturer at a time
        if (
            req.bound_enterprise_id is not None
            and existing is not None
            and existing.bound_enterprise_id is not None
            and existing.bound_enterprise_id != req.bound_enterprise_id
        ):
            raise HTTPException(
                status_code=400,
                detail="一个软件锁同一时间只能授权给一个生产厂",
            )

        if existing and req.overwrite:
            existing.software_version = auth_info["software_version"]
            existing.function_version = function_version
            existing.function_list = auth_info["function_list"]
            existing.expire_date = expire_date
            existing.status = "authorized"
            existing.synced_by = user.id
            if req.bound_enterprise_id is not None:
                existing.bound_enterprise_id = req.bound_enterprise_id
            await db.commit()
            await db.refresh(existing)
            return existing

        lock = SoftwareLock(
            lock_id=req.lock_id,
            software_version=auth_info["software_version"],
            function_version=function_version,
            function_list=auth_info["function_list"],
            expire_date=expire_date,
            status="authorized",
            bound_enterprise_id=req.bound_enterprise_id,
            synced_by=user.id,
        )
        db.add(lock)
        await db.commit()
        await db.refresh(lock)
        return lock

    async def list_software_locks(
        self,
        db: AsyncSession,
        skip: int,
        limit: int,
        status_filter: Optional[str],
        user: User,
    ) -> dict:
        ent_result = await db.execute(
            select(Enterprise).where(Enterprise.id == user.enterprise_id)
        )
        enterprise = ent_result.scalar_one_or_none()
        enterprise_type = enterprise.type if enterprise else None

        stmt = select(SoftwareLock)
        count_stmt = select(func.count(SoftwareLock.id))
        if enterprise_type == "manufacturer":
            stmt = stmt.where(
                SoftwareLock.bound_enterprise_id == user.enterprise_id
            )
            count_stmt = count_stmt.where(
                SoftwareLock.bound_enterprise_id == user.enterprise_id
            )
        if status_filter:
            stmt = stmt.where(SoftwareLock.status == status_filter)
            count_stmt = count_stmt.where(SoftwareLock.status == status_filter)

        stmt = stmt.offset(skip).limit(limit).order_by(SoftwareLock.id.desc())
        result = await db.execute(stmt)
        locks = result.scalars().all()

        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0

        return {"items": list(locks), "total": total}

    async def get_software_lock(
        self, db: AsyncSession, lock_id_pk: int
    ) -> SoftwareLock:
        result = await db.execute(
            select(SoftwareLock).where(SoftwareLock.id == lock_id_pk)
        )
        lock = result.scalar_one_or_none()
        if not lock:
            raise HTTPException(status_code=404, detail="软件锁不存在")
        return lock


software_lock_service = SoftwareLockService()
