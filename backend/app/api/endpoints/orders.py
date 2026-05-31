from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderListResponse,
    OrderConfirmRequest,
    OrderPayRequest,
    OrderPaymentConfirmRequest,
    OrderShipRequest,
    OrderReceiveRequest,
)
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(order_in: OrderCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await order_service.create_order(db, order_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=OrderListResponse)
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    tenant_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.get_orders(db, skip=skip, limit=limit, status=status, tenant_id=tenant_id)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await order_service.get_order(db, order_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"订单 ID={order_id} 不存在")
    return result


@router.post("/{order_id}/confirm", response_model=OrderResponse)
async def confirm_order(order_id: int, data: OrderConfirmRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await order_service.confirm_order(db, order_id, data)
        if result is None:
            raise HTTPException(status_code=404, detail=f"订单 ID={order_id} 不存在")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/pay", response_model=OrderResponse)
async def pay_order(order_id: int, data: OrderPayRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await order_service.pay_order(db, order_id, data)
        if result is None:
            raise HTTPException(status_code=404, detail=f"订单 ID={order_id} 不存在")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/confirm-payment", response_model=OrderResponse)
async def confirm_payment(order_id: int, data: OrderPaymentConfirmRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await order_service.confirm_payment(db, order_id, data)
        if result is None:
            raise HTTPException(status_code=404, detail=f"订单 ID={order_id} 不存在")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/ship", response_model=OrderResponse)
async def ship_order(order_id: int, data: OrderShipRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await order_service.ship_order(db, order_id, data)
        if result is None:
            raise HTTPException(status_code=404, detail=f"订单 ID={order_id} 不存在")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/receive", response_model=OrderResponse)
async def receive_order(order_id: int, data: OrderReceiveRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await order_service.receive_order(db, order_id, data)
        if result is None:
            raise HTTPException(status_code=404, detail=f"订单 ID={order_id} 不存在")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
