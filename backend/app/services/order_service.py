from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enterprise import Enterprise
from app.models.notification import Notification
from app.models.order import OrderItem, PurchaseOrder
from app.models.product import Product
from app.models.user import User
from app.schemas.order import (
    OrderConfirmRequest,
    OrderCreate,
    OrderListResponse,
    OrderRejectRequest,
    OrderResponse,
    ProductListResponse,
    ProductResponse,
)


async def _get_enterprise_type(db: AsyncSession, user: User) -> str:
    result = await db.execute(
        select(Enterprise.type).where(Enterprise.id == user.enterprise_id)
    )
    ent_type = result.scalar_one_or_none()
    if not ent_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户所属企业不存在",
        )
    return ent_type


async def generate_order_no(db: AsyncSession) -> str:
    """BR-PO-001: PO + yyyyMMdd + 4位流水号"""
    prefix = "PO" + datetime.now().strftime("%Y%m%d")
    result = await db.execute(
        select(func.max(PurchaseOrder.order_no)).where(
            PurchaseOrder.order_no.like(prefix + "%")
        )
    )
    max_no = result.scalar_one_or_none()
    if max_no:
        try:
            seq = int(max_no[-4:]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


async def create_order(db: AsyncSession, req: OrderCreate, user: User) -> OrderResponse:
    ent_type = await _get_enterprise_type(db, user)
    if ent_type != "manufacturer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅生产厂可发起采购",
        )

    if req.order_type not in ("camera", "software"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="order_type 必须为 camera 或 software",
        )

    if not req.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单必须包含至少一个商品",
        )

    # 预取所有商品
    product_ids = [item.product_id for item in req.items]
    result = await db.execute(
        select(Product).where(Product.id.in_(product_ids))
    )
    products = {p.id: p for p in result.scalars().all()}

    order_items: List[OrderItem] = []
    total_amount = 0.0
    for req_item in req.items:
        product = products.get(req_item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"商品 {req_item.product_id} 不存在",
            )
        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"商品 {product.name} 已下架",
            )

        # BR-PO-002: 软件采购必须指定功能版本
        if req.order_type == "software" and not req_item.function_version:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="软件采购时必须指定具体功能版本",
            )

        unit_price = float(product.price)
        line_total = unit_price * req_item.quantity
        total_amount += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                product_model=product.model,
                quantity=req_item.quantity,
                unit_price=unit_price,
                function_version=req_item.function_version,
            )
        )

    order_no = await generate_order_no(db)
    order = PurchaseOrder(
        order_no=order_no,
        order_type=req.order_type,
        enterprise_id=user.enterprise_id,
        status="pending" if req.submit else "draft",
        total_amount=total_amount,
        remark=req.remark,
        created_by=user.id,
    )
    order.items = order_items
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # 重新加载以获得 items
    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == order.id)
    )
    order = result.scalar_one()
    return OrderResponse.model_validate(order)


async def submit_draft(db: AsyncSession, order_id: int, user: User) -> OrderResponse:
    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    ent_type = await _get_enterprise_type(db, user)
    if ent_type == "manufacturer" and order.enterprise_id != user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权操作此订单",
        )

    if order.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅草稿状态订单可提交",
        )

    if not order.order_no:
        order.order_no = await generate_order_no(db)
    order.status = "pending"
    await db.commit()
    await db.refresh(order)

    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == order.id)
    )
    order = result.scalar_one()
    return OrderResponse.model_validate(order)


async def list_orders(
    db: AsyncSession,
    skip: int,
    limit: int,
    status_filter: Optional[str],
    user: User,
) -> OrderListResponse:
    ent_type = await _get_enterprise_type(db, user)

    stmt = select(PurchaseOrder).options(selectinload(PurchaseOrder.items))
    count_stmt = select(func.count(PurchaseOrder.id))

    if ent_type == "manufacturer":
        stmt = stmt.where(PurchaseOrder.enterprise_id == user.enterprise_id)
        count_stmt = count_stmt.where(
            PurchaseOrder.enterprise_id == user.enterprise_id
        )

    if status_filter:
        stmt = stmt.where(PurchaseOrder.status == status_filter)
        count_stmt = count_stmt.where(PurchaseOrder.status == status_filter)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    stmt = stmt.order_by(PurchaseOrder.id.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    orders = result.scalars().all()

    return OrderListResponse(
        items=[OrderResponse.model_validate(o) for o in orders],
        total=total,
    )


async def get_order(
    db: AsyncSession, order_id: int, user: User
) -> OrderResponse:
    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    ent_type = await _get_enterprise_type(db, user)
    if ent_type == "manufacturer" and order.enterprise_id != user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看此订单",
        )

    return OrderResponse.model_validate(order)


async def list_products(
    db: AsyncSession,
    skip: int,
    limit: int,
    category: Optional[str],
) -> ProductListResponse:
    stmt = select(Product).where(Product.is_active.is_(True))
    count_stmt = select(func.count(Product.id)).where(Product.is_active.is_(True))

    if category:
        stmt = stmt.where(Product.category == category)
        count_stmt = count_stmt.where(Product.category == category)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    stmt = stmt.order_by(Product.id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    products = result.scalars().all()

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
    )


async def confirm_order(
    db: AsyncSession, order_id: int, req: OrderConfirmRequest, user: User
) -> OrderResponse:
    # 仅核心技术方可确认订单
    ent_type = await _get_enterprise_type(db, user)
    if ent_type != "core_tech":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅核心技术方可确认订单",
        )

    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅待确认状态订单可确认",
        )

    # BR-PO-003: 确认后不可修改，仅可补充
    if req.partial:
        if not req.confirmed_quantities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="部分确认时必须提供确认数量",
            )
        item_map = {item.id: item for item in order.items}
        for item_id, qty in req.confirmed_quantities.items():
            item = item_map.get(item_id)
            if not item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"订单明细 {item_id} 不存在",
                )
            if qty <= 0 or qty > item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"订单明细 {item_id} 确认数量无效",
                )
            item.confirmed_quantity = qty
    else:
        # 全部确认：confirmed_quantity = quantity
        for item in order.items:
            item.confirmed_quantity = item.quantity

    order.status = "confirmed"
    order.confirmed_by = user.id
    order.confirmed_at = datetime.utcnow()
    if req.remark is not None:
        order.remark = req.remark

    # 通知生产厂
    notification = Notification(
        enterprise_id=order.enterprise_id,
        title="采购订单已确认",
        content=f"您的采购订单 {order.order_no} 已被确认",
        type="order",
        related_type="purchase_order",
        related_id=order.id,
    )
    db.add(notification)

    await db.commit()
    await db.refresh(order)

    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == order.id)
    )
    order = result.scalar_one()
    return OrderResponse.model_validate(order)


async def reject_order(
    db: AsyncSession, order_id: int, req: OrderRejectRequest, user: User
) -> OrderResponse:
    # 仅核心技术方可驳回订单
    ent_type = await _get_enterprise_type(db, user)
    if ent_type != "core_tech":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅核心技术方可驳回订单",
        )

    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅待确认状态订单可驳回",
        )

    order.status = "rejected"
    order.rejected_reason = req.reason
    await db.commit()
    await db.refresh(order)

    result = await db.execute(
        select(PurchaseOrder)
        .options(selectinload(PurchaseOrder.items))
        .where(PurchaseOrder.id == order.id)
    )
    order = result.scalar_one()
    return OrderResponse.model_validate(order)
