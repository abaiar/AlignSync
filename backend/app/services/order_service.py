import json
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from app.models import Order, OrderItem, OrderShipment, OrderStatus, Camera, Dongle, CameraStatus, DongleStatus
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


async def create_order(db: AsyncSession, order_in: OrderCreate) -> OrderResponse:
    today = datetime.now().strftime("%Y%m%d")
    stmt = select(func.count()).select_from(Order)
    result = await db.execute(stmt)
    count = result.scalar() or 0
    po_number = f"PO-{today}-{count + 1:04d}"

    order = Order(
        po_number=po_number,
        tenant_id=order_in.tenant_id,
        status=OrderStatus.PENDING,
        remark=order_in.remark,
    )
    db.add(order)
    await db.flush()

    total = Decimal("0.00")
    for item_in in order_in.items:
        item = OrderItem(
            order_id=order.id,
            product_model=item_in.product_model,
            quantity=item_in.quantity,
            unit_price=Decimal(str(item_in.unit_price)),
        )
        db.add(item)
        total += Decimal(str(item_in.quantity)) * Decimal(str(item_in.unit_price))

    order.total_amount = total
    await db.commit()
    await db.refresh(order)

    return await _order_to_response(db, order)


async def get_orders(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
    tenant_id: int | None = None,
) -> OrderListResponse:
    stmt = select(Order)

    if status:
        try:
            status_enum = OrderStatus(status)
            stmt = stmt.where(Order.status == status_enum)
        except ValueError:
            pass

    if tenant_id:
        stmt = stmt.where(Order.tenant_id == tenant_id)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()

    stmt = stmt.offset(skip).limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    orders = result.scalars().all()

    items_list = []
    for o in orders:
        items_list.append(await _order_to_response(db, o))

    return OrderListResponse(
        total=total,
        items=items_list,
    )


async def get_order(db: AsyncSession, order_id: int) -> OrderResponse | None:
    order = await _get_order_with_items(db, order_id)
    if not order:
        return None
    return await _order_to_response(db, order)


async def confirm_order(
    db: AsyncSession, order_id: int, data: OrderConfirmRequest
) -> OrderResponse | None:
    order = await _get_order_with_items(db, order_id)
    if not order:
        return None

    if order.status != OrderStatus.PENDING:
        raise ValueError(f"订单状态为 {order.status.value}，无法确认")

    order.status = OrderStatus.CONFIRMED
    if data.opinion:
        order.remark = (order.remark or "") + f"\n[确认意见] {data.opinion}"

    await db.commit()
    await db.refresh(order)

    return await _order_to_response(db, order)


async def pay_order(
    db: AsyncSession, order_id: int, data: OrderPayRequest
) -> OrderResponse | None:
    order = await _get_order_with_items(db, order_id)
    if not order:
        return None

    if order.status not in (OrderStatus.CONFIRMED, OrderStatus.AWAITING_PAYMENT):
        raise ValueError(f"订单状态为 {order.status.value}，无法付款")

    order.status = OrderStatus.AWAITING_PAYMENT
    remark_parts = []
    if data.payment_method:
        remark_parts.append(f"付款方式: {data.payment_method}")
    if data.payment_voucher:
        remark_parts.append(f"付款凭证: {data.payment_voucher}")
    if data.payment_remark:
        remark_parts.append(f"付款备注: {data.payment_remark}")
    if remark_parts:
        order.remark = (order.remark or "") + "\n[付款] " + "; ".join(remark_parts)

    await db.commit()
    await db.refresh(order)

    return await _order_to_response(db, order)


async def confirm_payment(
    db: AsyncSession, order_id: int, data: OrderPaymentConfirmRequest
) -> OrderResponse | None:
    order = await _get_order_with_items(db, order_id)
    if not order:
        return None

    if order.status != OrderStatus.AWAITING_PAYMENT:
        raise ValueError(f"订单状态为 {order.status.value}，无法确认收款")

    if data.confirmed:
        order.status = OrderStatus.PAID
        if data.remark:
            order.remark = (order.remark or "") + f"\n[收款确认] {data.remark}"
    else:
        order.status = OrderStatus.CONFIRMED
        if data.remark:
            order.remark = (order.remark or "") + f"\n[收款退回] {data.remark}"

    await db.commit()
    await db.refresh(order)

    return await _order_to_response(db, order)


async def ship_order(
    db: AsyncSession, order_id: int, data: OrderShipRequest
) -> OrderResponse | None:
    order = await _get_order_with_items(db, order_id)
    if not order:
        return None

    if order.status != OrderStatus.PAID:
        raise ValueError(f"订单状态为 {order.status.value}，无法发货")

    for cam_item in data.camera_items:
        stmt = select(Camera).where(Camera.sn == cam_item.camera_sn)
        result = await db.execute(stmt)
        camera = result.scalar_one_or_none()
        if not camera:
            raise ValueError(f"相机 SN={cam_item.camera_sn} 不存在")
        if camera.status != CameraStatus.IN_STOCK:
            raise ValueError(f"相机 SN={cam_item.camera_sn} 状态非在库")

    for dongle_id in data.dongle_ids:
        stmt = select(Dongle).where(Dongle.dongle_id == dongle_id)
        result = await db.execute(stmt)
        dongle = result.scalar_one_or_none()
        if not dongle:
            raise ValueError(f"软件锁 ID={dongle_id} 不存在")
        if dongle.status not in (DongleStatus.AUTHORIZED, DongleStatus.IN_STOCK):
            raise ValueError(f"软件锁 ID={dongle_id} 状态不可发货")

    for cam_item in data.camera_items:
        shipment = OrderShipment(
            order_id=order.id,
            camera_sn=cam_item.camera_sn,
            tracking_number=data.tracking_number,
            carrier=data.carrier,
        )
        db.add(shipment)

        stmt = (
            update(Camera)
            .where(Camera.sn == cam_item.camera_sn)
            .values(status=CameraStatus.SHIPPED, tenant_id=order.tenant_id)
        )
        await db.execute(stmt)

    for dongle_id in data.dongle_ids:
        shipment = OrderShipment(
            order_id=order.id,
            dongle_id=dongle_id,
            tracking_number=data.tracking_number,
            carrier=data.carrier,
        )
        db.add(shipment)

        stmt = (
            update(Dongle)
            .where(Dongle.dongle_id == dongle_id)
            .values(status=DongleStatus.SHIPPED)
        )
        await db.execute(stmt)

    order.status = OrderStatus.SHIPPED
    await db.commit()
    await db.refresh(order)

    return await _order_to_response(db, order)


async def receive_order(
    db: AsyncSession, order_id: int, data: OrderReceiveRequest
) -> OrderResponse | None:
    order = await _get_order_with_items(db, order_id)
    if not order:
        return None

    if order.status != OrderStatus.SHIPPED:
        raise ValueError(f"订单状态为 {order.status.value}，无法确认收货")

    if data.received:
        order.status = OrderStatus.COMPLETED

        stmt = select(OrderShipment).where(OrderShipment.order_id == order.id)
        result = await db.execute(stmt)
        shipments = result.scalars().all()

        for shipment in shipments:
            if shipment.camera_sn:
                stmt = (
                    update(Camera)
                    .where(Camera.sn == shipment.camera_sn)
                    .values(status=CameraStatus.IN_STOCK)
                )
                await db.execute(stmt)
            if shipment.dongle_id:
                stmt = (
                    update(Dongle)
                    .where(Dongle.dongle_id == shipment.dongle_id)
                    .values(status=DongleStatus.IN_STOCK)
                )
                await db.execute(stmt)

        if data.remark:
            order.remark = (order.remark or "") + f"\n[收货确认] {data.remark}"

    await db.commit()
    await db.refresh(order)

    return await _order_to_response(db, order)


async def _get_order_with_items(db: AsyncSession, order_id: int) -> Order | None:
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _order_to_response(db: AsyncSession, order: Order) -> OrderResponse:
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one()

    return OrderResponse(
        id=order.id,
        po_number=order.po_number,
        tenant_id=order.tenant_id,
        status=order.status,
        total_amount=float(order.total_amount),
        items=[
            {
                "id": item.id,
                "product_model": item.product_model,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "subtotal": float(item.quantity * item.unit_price),
            }
            for item in order.items
        ],
        remark=order.remark,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )
