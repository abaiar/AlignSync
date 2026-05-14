from sqlalchemy.ext.asyncio import AsyncSession

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
    """创建采购订单。

    Args:
        db: 异步数据库会话
        order_in: 订单创建数据（租户ID、明细列表等）

    Returns:
        OrderResponse: 创建后的订单信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def get_orders(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
    tenant_id: int | None = None,
) -> OrderListResponse:
    """获取订单列表。

    Args:
        db: 异步数据库会话
        skip: 分页偏移量
        limit: 每页数量
        status: 按状态筛选
        tenant_id: 按租户筛选

    Returns:
        OrderListResponse: 订单列表及总数

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def get_order(db: AsyncSession, order_id: int) -> OrderResponse | None:
    """获取单个订单详情。

    Args:
        db: 异步数据库会话
        order_id: 订单ID

    Returns:
        OrderResponse | None: 订单详情

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def confirm_order(
    db: AsyncSession, order_id: int, data: OrderConfirmRequest
) -> OrderResponse | None:
    """确认采购订单（状态：待确认 -> 已确认/待收款）。

    Args:
        db: 异步数据库会话
        order_id: 订单ID
        data: 确认请求数据

    Returns:
        OrderResponse | None: 更新后的订单信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def pay_order(
    db: AsyncSession, order_id: int, data: OrderPayRequest
) -> OrderResponse | None:
    """订单付款（状态：已确认/待收款 -> 待收款确认）。

    Args:
        db: 异步数据库会话
        order_id: 订单ID
        data: 付款请求数据

    Returns:
        OrderResponse | None: 更新后的订单信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def confirm_payment(
    db: AsyncSession, order_id: int, data: OrderPaymentConfirmRequest
) -> OrderResponse | None:
    """确认收款（状态：待收款 -> 已收款）。

    Args:
        db: 异步数据库会话
        order_id: 订单ID
        data: 收款确认数据

    Returns:
        OrderResponse | None: 更新后的订单信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def ship_order(
    db: AsyncSession, order_id: int, data: OrderShipRequest
) -> OrderResponse | None:
    """订单发货（状态：已收款 -> 已发货）。

    Args:
        db: 异步数据库会话
        order_id: 订单ID
        data: 发货请求数据（含相机SN、软件锁ID、物流单号）

    Returns:
        OrderResponse | None: 更新后的订单信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def receive_order(
    db: AsyncSession, order_id: int, data: OrderReceiveRequest
) -> OrderResponse | None:
    """确认收货（状态：已发货 -> 已完成）。

    Args:
        db: 异步数据库会话
        order_id: 订单ID
        data: 收货确认数据

    Returns:
        OrderResponse | None: 更新后的订单信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")
