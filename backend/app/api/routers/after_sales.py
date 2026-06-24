from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.db.base import get_db
from app.models.user import User
from app.schemas.after_sales import (
    AfterSalesCreate,
    AfterSalesHandleRequest,
    AfterSalesListResponse,
    AfterSalesResponse,
)
from app.services import after_sales_service

router = APIRouter(prefix="/api/after-sales", tags=["after-sales"])


@router.post("", response_model=AfterSalesResponse)
async def create_ticket(
    req: AfterSalesCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("after_sales:create")),
):
    return await after_sales_service.create_ticket(db, req, user)


@router.get("", response_model=AfterSalesListResponse)
async def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await after_sales_service.list_tickets(
        db, skip, limit, status, category, user
    )


@router.get("/{ticket_id}", response_model=AfterSalesResponse)
async def get_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await after_sales_service.get_ticket(db, ticket_id, user)


@router.patch("/{ticket_id}/handle", response_model=AfterSalesResponse)
async def handle_ticket(
    ticket_id: int,
    req: AfterSalesHandleRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("after_sales:handle")),
):
    return await after_sales_service.handle_ticket(db, ticket_id, req, user)
