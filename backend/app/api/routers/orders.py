from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.db.base import get_db
from app.models.user import User
from app.schemas.order import (
    OrderConfirmRequest,
    OrderCreate,
    OrderListResponse,
    OrderRejectRequest,
    OrderResponse,
    ProductListResponse,
)
from app.services import order_service

router = APIRouter(prefix="/api", tags=["orders"])


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await order_service.list_products(db, skip, limit, category)


@router.post("/purchase-orders", response_model=OrderResponse)
async def create_order(
    req: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("purchase_order:create")),
):
    return await order_service.create_order(db, req, user)


@router.get("/purchase-orders", response_model=OrderListResponse)
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await order_service.list_orders(db, skip, limit, status, user)


@router.get("/purchase-orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await order_service.get_order(db, order_id, user)


@router.post("/purchase-orders/{order_id}/submit", response_model=OrderResponse)
async def submit_draft(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("purchase_order:create")),
):
    return await order_service.submit_draft(db, order_id, user)


@router.patch("/purchase-orders/{order_id}/confirm", response_model=OrderResponse)
async def confirm_order(
    order_id: int,
    req: OrderConfirmRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("purchase_order:confirm")),
):
    return await order_service.confirm_order(db, order_id, req, user)


@router.patch("/purchase-orders/{order_id}/reject", response_model=OrderResponse)
async def reject_order(
    order_id: int,
    req: OrderRejectRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("purchase_order:confirm")),
):
    return await order_service.reject_order(db, order_id, req, user)
