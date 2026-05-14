from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dongle import DongleCreate, DongleResponse, DongleListResponse, DongleUpdate


async def sync_dongle(db: AsyncSession, dongle_in: DongleCreate) -> DongleResponse:
    """同步软件锁授权信息到系统。

    Args:
        db: 异步数据库会话
        dongle_in: 软件锁创建数据（ID、版本、功能列表、到期日等）

    Returns:
        DongleResponse: 同步后的软件锁信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def get_dongles(
    db: AsyncSession, skip: int = 0, limit: int = 20, status: str | None = None
) -> DongleListResponse:
    """获取软件锁列表。

    Args:
        db: 异步数据库会话
        skip: 分页偏移量
        limit: 每页数量
        status: 按状态筛选

    Returns:
        DongleListResponse: 软件锁列表及总数

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def get_dongle_by_sn(db: AsyncSession, dongle_id: str) -> DongleResponse | None:
    """根据ID获取软件锁信息。

    Args:
        db: 异步数据库会话
        dongle_id: 软件锁ID

    Returns:
        DongleResponse | None: 软件锁信息，不存在则返回None

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")


async def update_dongle(db: AsyncSession, dongle_id: str, dongle_in: DongleUpdate) -> DongleResponse | None:
    """更新软件锁信息。

    Args:
        db: 异步数据库会话
        dongle_id: 软件锁ID
        dongle_in: 更新数据

    Returns:
        DongleResponse | None: 更新后的软件锁信息

    Raises:
        NotImplementedError: 数据库逻辑待人工编写
    """
    raise NotImplementedError("TODO: 由人类开发者手写 SQLAlchemy/SQL 逻辑")
