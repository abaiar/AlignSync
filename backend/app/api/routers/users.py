from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_user_role_names, require_permission
from app.core.security import hash_password
from app.db.base import get_db
from app.models.user import Permission, Role, User, UserRole
from app.schemas.user import (
    PermissionResponse,
    RoleResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter(tags=["users"])


async def _user_to_response(db: AsyncSession, user: User) -> UserResponse:
    roles = await get_user_role_names(db, user.id)
    return UserResponse(
        id=user.id,
        username=user.username,
        real_name=user.real_name,
        phone=user.phone,
        email=user.email,
        enterprise_id=user.enterprise_id,
        is_active=user.is_active,
        roles=roles,
        created_at=user.created_at,
    )


async def _replace_user_roles(db: AsyncSession, user_id: int, role_ids: List[int]) -> None:
    await db.execute(UserRole.__table__.delete().where(UserRole.user_id == user_id))
    for rid in role_ids:
        await db.execute(UserRole.__table__.insert().values(user_id=user_id, role_id=rid))


@router.post("/api/users", response_model=UserResponse, status_code=201)
async def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名已存在")
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        real_name=payload.real_name,
        phone=payload.phone,
        email=payload.email,
        enterprise_id=payload.enterprise_id,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    if payload.role_ids:
        await _replace_user_roles(db, user.id, payload.role_ids)
    await db.commit()
    await db.refresh(user)
    return await _user_to_response(db, user)


@router.get("/api/users", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.id))
    users = result.scalars().all()
    return [await _user_to_response(db, u) for u in users]


@router.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return await _user_to_response(db, user)


@router.patch("/api/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if payload.real_name is not None:
        user.real_name = payload.real_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.email is not None:
        user.email = payload.email
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role_ids is not None:
        await _replace_user_roles(db, user.id, payload.role_ids)
    await db.commit()
    await db.refresh(user)
    return await _user_to_response(db, user)


@router.get("/api/roles", response_model=List[RoleResponse])
async def list_roles(
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Role).order_by(Role.id))
    return result.scalars().all()


@router.get("/api/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Permission).order_by(Permission.id))
    return result.scalars().all()
