from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_user_permissions, get_user_role_names
from app.core.security import create_access_token, verify_password
from app.db.base import get_db
from app.models.enterprise import Enterprise
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserInfo

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已禁用")

    ent_result = await db.execute(
        select(Enterprise).where(Enterprise.id == user.enterprise_id)
    )
    enterprise = ent_result.scalar_one_or_none()

    roles = await get_user_role_names(db, user.id)
    perms = await get_user_permissions(db, user.id)

    token = create_access_token(user.username)
    return TokenResponse(
        access_token=token,
        user=UserInfo(
            id=user.id,
            username=user.username,
            real_name=user.real_name,
            enterprise_id=user.enterprise_id,
            enterprise_name=enterprise.name if enterprise else None,
            enterprise_type=enterprise.type if enterprise else None,
            roles=roles,
            permissions=perms,
        ),
    )


@router.get("/me", response_model=UserInfo)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ent_result = await db.execute(
        select(Enterprise).where(Enterprise.id == current_user.enterprise_id)
    )
    enterprise = ent_result.scalar_one_or_none()
    roles = await get_user_role_names(db, current_user.id)
    perms = await get_user_permissions(db, current_user.id)
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        real_name=current_user.real_name,
        enterprise_id=current_user.enterprise_id,
        enterprise_name=enterprise.name if enterprise else None,
        enterprise_type=enterprise.type if enterprise else None,
        roles=roles,
        permissions=perms,
    )
